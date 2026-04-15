import { randomUUID } from 'crypto';
import { createClient } from '@libsql/client';

const DEFAULT_FEED_LIMIT = 12;
const MAX_FEED_LIMIT = 30;
const DEFAULT_COMMENT_LIMIT = 30;
const MAX_COMMENT_LIMIT = 80;
const ALLOWED_REACTIONS = new Set(['like', 'support', 'insightful']);
const SERVER_TOPIC_AUTHOR_ID = 'sentineltruth-server';
const SERVER_TOPIC_AUTHOR_NAME = 'SentinelTruth AI';

function toNumber(value) {
  if (typeof value === 'bigint') return Number(value);
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function asText(value, maxLength = 0) {
  const text = String(value ?? '').trim();
  if (!maxLength || maxLength <= 0) return text;
  return text.slice(0, maxLength);
}

function normalizeLimit(raw, fallback, maxLimit) {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maxLimit);
}

function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(String(value || ''));
  } catch {
    return fallback;
  }
}

function toIsoString(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const asDate = new Date(raw);
  if (!Number.isFinite(asDate.getTime())) return '';
  return asDate.toISOString();
}

class SocialDb {
  constructor() {
    const url = asText(process.env.TURSO_DATABASE_URL);
    const token = asText(process.env.TURSO_AUTH_TOKEN);

    this.client = null;
    this.enabled = false;
    this.schemaReady = false;

    if (url && token) {
      this.client = createClient({
        url,
        authToken: token,
      });
      this.enabled = true;
    }
  }

  isEnabled() {
    return this.enabled && !!this.client;
  }

  _ensureConfigured() {
    if (!this.isEnabled()) {
      throw new Error('Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
    }
  }

  async _addColumnIfMissing(tableName, columnDefinition) {
    try {
      await this.client.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
    } catch (error) {
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('duplicate column name') || message.includes('already exists')) {
        return;
      }
      throw error;
    }
  }

  async _ensureSchema() {
    if (this.schemaReady) return;

    this._ensureConfigured();

    await this.client.execute('PRAGMA foreign_keys = ON');

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS social_users (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        avatar_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS social_posts (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        image_url TEXT,
        image_storage_path TEXT,
        comment_count INTEGER NOT NULL DEFAULT 0,
        reaction_count INTEGER NOT NULL DEFAULT 0,
        share_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        post_type TEXT NOT NULL DEFAULT 'user',
        source_topic_id TEXT UNIQUE,
        source_topic_payload TEXT,
        FOREIGN KEY(author_id) REFERENCES social_users(id)
      )
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS social_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
        FOREIGN KEY(author_id) REFERENCES social_users(id)
      )
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS social_reactions (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reaction_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(post_id, user_id),
        FOREIGN KEY(post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES social_users(id)
      )
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS social_shares (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES social_users(id)
      )
    `);

    await this.client.execute('CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at DESC)');
    await this.client.execute('CREATE INDEX IF NOT EXISTS idx_social_posts_author_id ON social_posts(author_id)');

    // For databases created before topic-sync fields were introduced.
    await this._addColumnIfMissing('social_posts', "post_type TEXT NOT NULL DEFAULT 'user'");
    await this._addColumnIfMissing('social_posts', 'source_topic_id TEXT');
    await this._addColumnIfMissing('social_posts', 'source_topic_payload TEXT');

    await this.client.execute('CREATE INDEX IF NOT EXISTS idx_social_posts_type ON social_posts(post_type)');
    await this.client.execute('CREATE INDEX IF NOT EXISTS idx_social_posts_source_topic_id ON social_posts(source_topic_id)');
    await this.client.execute('CREATE UNIQUE INDEX IF NOT EXISTS uq_social_posts_source_topic_id ON social_posts(source_topic_id)');
    await this.client.execute('CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON social_comments(post_id, created_at ASC)');
    await this.client.execute('CREATE INDEX IF NOT EXISTS idx_social_reactions_post_id ON social_reactions(post_id)');
    await this.client.execute('CREATE INDEX IF NOT EXISTS idx_social_shares_post_id ON social_shares(post_id)');

    this.schemaReady = true;
  }

  _normalizeActor(rawActor = {}) {
    const userId = asText(rawActor.userId || rawActor.id, 80) || `guest-${randomUUID().slice(0, 12)}`;
    const displayName = asText(rawActor.userName || rawActor.displayName, 80) || `Citizen ${userId.slice(-4).toUpperCase()}`;
    const avatarUrl = asText(rawActor.avatarUrl, 1000) || null;
    return { userId, displayName, avatarUrl };
  }

  _mapPost(row) {
    const topicPayload = safeJsonParse(row.source_topic_payload, null);
    return {
      id: row.id,
      content: row.content || '',
      imageUrl: row.image_url || '',
      imageStoragePath: row.image_storage_path || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: {
        id: row.author_id,
        name: row.author_name || 'Anonymous',
        avatarUrl: row.author_avatar || '',
      },
      counts: {
        comments: toNumber(row.comment_count),
        reactions: toNumber(row.reaction_count),
        shares: toNumber(row.share_count),
      },
      postType: row.post_type || 'user',
      sourceTopicId: row.source_topic_id || '',
      topic: topicPayload,
      viewerReaction: row.viewer_reaction || null,
    };
  }

  _mapComment(row) {
    return {
      id: row.id,
      postId: row.post_id,
      content: row.content || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: {
        id: row.author_id,
        name: row.author_name || 'Anonymous',
        avatarUrl: row.author_avatar || '',
      },
    };
  }

  async upsertUser(rawActor = {}) {
    await this._ensureSchema();

    const actor = this._normalizeActor(rawActor);
    const now = new Date().toISOString();

    await this.client.execute({
      sql: `
        INSERT INTO social_users (id, display_name, avatar_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          display_name = excluded.display_name,
          avatar_url = CASE
            WHEN excluded.avatar_url IS NULL OR excluded.avatar_url = '' THEN social_users.avatar_url
            ELSE excluded.avatar_url
          END,
          updated_at = excluded.updated_at
      `,
      args: [actor.userId, actor.displayName, actor.avatarUrl, now, now],
    });

    return actor;
  }

  async getPostById(postId, viewerUserId = '') {
    await this._ensureSchema();

    const id = asText(postId, 80);
    if (!id) return null;

    const rs = await this.client.execute({
      sql: `
        SELECT
          p.id,
          p.author_id,
          p.content,
          p.image_url,
          p.image_storage_path,
          p.comment_count,
          p.reaction_count,
          p.share_count,
          p.created_at,
          p.updated_at,
          u.display_name AS author_name,
          u.avatar_url AS author_avatar,
          (
            SELECT r.reaction_type
            FROM social_reactions r
            WHERE r.post_id = p.id AND r.user_id = ?
            LIMIT 1
          ) AS viewer_reaction
        FROM social_posts p
        LEFT JOIN social_users u ON u.id = p.author_id
        WHERE p.id = ?
        LIMIT 1
      `,
      args: [asText(viewerUserId, 80), id],
    });

    const row = rs?.rows?.[0];
    if (!row) return null;
    return this._mapPost(row);
  }

  async listFeed({ cursor = '', limit = DEFAULT_FEED_LIMIT, viewerUserId = '', onlyServerPosts = false } = {}) {
    await this._ensureSchema();

    const safeCursor = asText(cursor, 80);
    const safeLimit = normalizeLimit(limit, DEFAULT_FEED_LIMIT, MAX_FEED_LIMIT);
    const queryLimit = safeLimit + 1;

    const rs = await this.client.execute({
      sql: `
        SELECT
          p.id,
          p.author_id,
          p.content,
          p.image_url,
          p.image_storage_path,
          p.comment_count,
          p.reaction_count,
          p.share_count,
          p.created_at,
          p.updated_at,
          p.post_type,
          p.source_topic_id,
          p.source_topic_payload,
          u.display_name AS author_name,
          u.avatar_url AS author_avatar,
          (
            SELECT r.reaction_type
            FROM social_reactions r
            WHERE r.post_id = p.id AND r.user_id = ?
            LIMIT 1
          ) AS viewer_reaction
        FROM social_posts p
        LEFT JOIN social_users u ON u.id = p.author_id
        WHERE (? = '' OR p.created_at < ?)
          AND (? = 0 OR p.post_type = 'topic')
        ORDER BY p.created_at DESC
        LIMIT ?
      `,
      args: [asText(viewerUserId, 80), safeCursor, safeCursor, onlyServerPosts ? 1 : 0, queryLimit],
    });

    const rows = Array.isArray(rs?.rows) ? rs.rows : [];
    const hasMore = rows.length > safeLimit;
    const visible = hasMore ? rows.slice(0, safeLimit) : rows;
    const items = visible.map((row) => this._mapPost(row));

    return {
      items,
      nextCursor: hasMore && items.length ? items[items.length - 1].createdAt : null,
      hasMore,
    };
  }

  async createPost({ actor = {}, content = '', imageUrl = '', imageStoragePath = '', postType = 'user', sourceTopicId = '', sourceTopicPayload = null } = {}) {
    await this._ensureSchema();

    const safeContent = asText(content, 4000);
    const safeImageUrl = asText(imageUrl, 1400);
    const safeStoragePath = asText(imageStoragePath, 400);
    const safePostType = asText(postType, 24) || 'user';
    const safeSourceTopicId = asText(sourceTopicId, 120) || null;
    const safeSourcePayload = sourceTopicPayload == null
      ? null
      : asText(typeof sourceTopicPayload === 'string' ? sourceTopicPayload : JSON.stringify(sourceTopicPayload), 20000);

    if (!safeContent && !safeImageUrl) {
      throw new Error('Post content or image is required.');
    }

    const normalizedActor = await this.upsertUser(actor);
    const now = new Date().toISOString();
    const postId = randomUUID();

    await this.client.execute({
      sql: `
        INSERT INTO social_posts (
          id, author_id, content, image_url, image_storage_path,
          comment_count, reaction_count, share_count,
          created_at, updated_at,
          post_type, source_topic_id, source_topic_payload
        )
        VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?, ?)
      `,
      args: [
        postId,
        normalizedActor.userId,
        safeContent,
        safeImageUrl || null,
        safeStoragePath || null,
        now,
        now,
        safePostType,
        safeSourceTopicId,
        safeSourcePayload,
      ],
    });

    return this.getPostById(postId, normalizedActor.userId);
  }

  async listComments(postId, limit = DEFAULT_COMMENT_LIMIT) {
    await this._ensureSchema();

    const id = asText(postId, 80);
    if (!id) return [];

    const safeLimit = normalizeLimit(limit, DEFAULT_COMMENT_LIMIT, MAX_COMMENT_LIMIT);

    const rs = await this.client.execute({
      sql: `
        SELECT
          c.id,
          c.post_id,
          c.author_id,
          c.content,
          c.created_at,
          c.updated_at,
          u.display_name AS author_name,
          u.avatar_url AS author_avatar
        FROM social_comments c
        LEFT JOIN social_users u ON u.id = c.author_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
        LIMIT ?
      `,
      args: [id, safeLimit],
    });

    return (rs?.rows || []).map((row) => this._mapComment(row));
  }

  async addComment({ postId, actor = {}, content = '' } = {}) {
    await this._ensureSchema();

    const safePostId = asText(postId, 80);
    const safeContent = asText(content, 1400);

    if (!safePostId) throw new Error('Post ID is required.');
    if (!safeContent) throw new Error('Comment cannot be empty.');

    const normalizedActor = await this.upsertUser(actor);
    const existingPost = await this.getPostById(safePostId, normalizedActor.userId);
    if (!existingPost) throw new Error('Post not found.');

    const now = new Date().toISOString();
    const commentId = randomUUID();

    await this.client.execute({
      sql: `
        INSERT INTO social_comments (id, post_id, author_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [commentId, safePostId, normalizedActor.userId, safeContent, now, now],
    });

    await this.client.execute({
      sql: `
        UPDATE social_posts
        SET comment_count = comment_count + 1,
            updated_at = ?
        WHERE id = ?
      `,
      args: [now, safePostId],
    });

    const commentRow = await this.client.execute({
      sql: `
        SELECT
          c.id,
          c.post_id,
          c.author_id,
          c.content,
          c.created_at,
          c.updated_at,
          u.display_name AS author_name,
          u.avatar_url AS author_avatar
        FROM social_comments c
        LEFT JOIN social_users u ON u.id = c.author_id
        WHERE c.id = ?
        LIMIT 1
      `,
      args: [commentId],
    });

    const comment = commentRow?.rows?.[0] ? this._mapComment(commentRow.rows[0]) : null;
    const post = await this.getPostById(safePostId, normalizedActor.userId);

    return { comment, post };
  }

  async toggleReaction({ postId, actor = {}, reactionType = 'like' } = {}) {
    await this._ensureSchema();

    const safePostId = asText(postId, 80);
    if (!safePostId) throw new Error('Post ID is required.');

    const normalizedReaction = asText(reactionType, 32).toLowerCase() || 'like';
    if (!ALLOWED_REACTIONS.has(normalizedReaction)) {
      throw new Error('Unsupported reaction type.');
    }

    const normalizedActor = await this.upsertUser(actor);
    const existingPost = await this.getPostById(safePostId, normalizedActor.userId);
    if (!existingPost) throw new Error('Post not found.');

    const existingReactionRs = await this.client.execute({
      sql: `
        SELECT id, reaction_type
        FROM social_reactions
        WHERE post_id = ? AND user_id = ?
        LIMIT 1
      `,
      args: [safePostId, normalizedActor.userId],
    });

    const existingReaction = existingReactionRs?.rows?.[0] || null;
    const now = new Date().toISOString();
    let activeReaction = normalizedReaction;

    if (!existingReaction) {
      await this.client.execute({
        sql: `
          INSERT INTO social_reactions (id, post_id, user_id, reaction_type, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [randomUUID(), safePostId, normalizedActor.userId, normalizedReaction, now, now],
      });

      await this.client.execute({
        sql: `
          UPDATE social_posts
          SET reaction_count = reaction_count + 1,
              updated_at = ?
          WHERE id = ?
        `,
        args: [now, safePostId],
      });
    } else if (String(existingReaction.reaction_type || '') === normalizedReaction) {
      await this.client.execute({
        sql: 'DELETE FROM social_reactions WHERE id = ?',
        args: [existingReaction.id],
      });

      await this.client.execute({
        sql: `
          UPDATE social_posts
          SET reaction_count = CASE
                WHEN reaction_count > 0 THEN reaction_count - 1
                ELSE 0
              END,
              updated_at = ?
          WHERE id = ?
        `,
        args: [now, safePostId],
      });

      activeReaction = null;
    } else {
      await this.client.execute({
        sql: `
          UPDATE social_reactions
          SET reaction_type = ?, updated_at = ?
          WHERE id = ?
        `,
        args: [normalizedReaction, now, existingReaction.id],
      });
    }

    const post = await this.getPostById(safePostId, normalizedActor.userId);
    return { post, reaction: activeReaction };
  }

  async sharePost({ postId, actor = {} } = {}) {
    await this._ensureSchema();

    const safePostId = asText(postId, 80);
    if (!safePostId) throw new Error('Post ID is required.');

    const normalizedActor = await this.upsertUser(actor);
    const existingPost = await this.getPostById(safePostId, normalizedActor.userId);
    if (!existingPost) throw new Error('Post not found.');

    const now = new Date().toISOString();

    await this.client.execute({
      sql: `
        INSERT INTO social_shares (id, post_id, user_id, created_at)
        VALUES (?, ?, ?, ?)
      `,
      args: [randomUUID(), safePostId, normalizedActor.userId, now],
    });

    await this.client.execute({
      sql: `
        UPDATE social_posts
        SET share_count = share_count + 1,
            updated_at = ?
        WHERE id = ?
      `,
      args: [now, safePostId],
    });

    const post = await this.getPostById(safePostId, normalizedActor.userId);
    return { post };
  }

  buildTopicPostContent(topic = {}) {
    const summary = asText(topic.summary, 3000);
    const verdict = asText(topic.verdict, 48).toUpperCase();
    const party = asText(topic.party, 64);
    const category = asText(topic.category, 80);
    const sourceUrl = asText((topic.sources || []).find((src) => src?.url)?.url, 1200);

    const lines = [];
    if (summary) lines.push(summary);

    const meta = [
      party ? `Parti: ${party}` : '',
      category ? `Kategori: ${category}` : '',
      verdict ? `Verdik: ${verdict}` : '',
    ].filter(Boolean).join(' | ');

    if (meta) lines.push('', meta);
    if (sourceUrl) lines.push('', `Sumber: ${sourceUrl}`);

    return lines.join('\n').trim();
  }

  async syncTopicsAsServerPosts(topics = []) {
    await this._ensureSchema();

    const serverActor = await this.upsertUser({
      userId: SERVER_TOPIC_AUTHOR_ID,
      userName: SERVER_TOPIC_AUTHOR_NAME,
      avatarUrl: '',
    });

    let upserted = 0;
    const list = Array.isArray(topics) ? topics : [];

    for (const topic of list) {
      const topicId = asText(topic?.id, 120);
      if (!topicId) continue;

      const postId = `topic-${topicId}`;
      const now = new Date().toISOString();
      const createdAt = toIsoString(topic?.createdAt || topic?.verification?.verifiedAt || topic?.date) || now;
      const updatedAt = toIsoString(topic?.updatedAt || topic?.verification?.reverifiedAt || topic?.verification?.verifiedAt) || now;
      const imageUrl = asText(topic?.imageUrl || topic?.image, 1400) || null;
      const content = this.buildTopicPostContent(topic);

      const sourcePayload = JSON.stringify({
        id: topicId,
        title: asText(topic?.title, 500),
        summary: asText(topic?.summary, 4000),
        verdict: asText(topic?.verdict, 48),
        party: asText(topic?.party, 64),
        category: asText(topic?.category, 80),
        date: asText(topic?.date, 80),
        impact: asText(topic?.impact, 40),
        region: asText(topic?.region, 80),
        aiProvider: asText(topic?.aiProvider, 64),
      });

      await this.client.execute({
        sql: `
          INSERT INTO social_posts (
            id, author_id, content, image_url, image_storage_path,
            comment_count, reaction_count, share_count,
            created_at, updated_at,
            post_type, source_topic_id, source_topic_payload
          )
          VALUES (?, ?, ?, ?, NULL, 0, 0, 0, ?, ?, 'topic', ?, ?)
          ON CONFLICT(source_topic_id) DO UPDATE SET
            content = excluded.content,
            image_url = excluded.image_url,
            source_topic_payload = excluded.source_topic_payload,
            updated_at = excluded.updated_at
        `,
        args: [
          postId,
          serverActor.userId,
          content,
          imageUrl,
          createdAt,
          updatedAt,
          topicId,
          sourcePayload,
        ],
      });

      upserted += 1;
    }

    return { totalTopics: list.length, upserted };
  }
}

export const socialDb = new SocialDb();
