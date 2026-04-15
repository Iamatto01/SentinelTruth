const SOCIAL_PROFILE_KEY = 'sentineltruth-social-profile-v1';
const SOCIAL_FEED_LIMIT = 12;
const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024;

const socialState = {
  initialized: false,
  renderSequence: 0,
  socialEnabled: false,
  serverPostsOnly: false,
  capabilityError: '',
  firebase: {
    enabled: false,
    ready: false,
    error: '',
    config: null,
    storage: null,
    ref: null,
    uploadBytes: null,
    getDownloadURL: null,
  },
  profile: null,
  posts: [],
  nextCursor: null,
  hasMore: true,
  loadingFeed: false,
  loadingPost: false,
  commentsCache: new Map(),
  openCommentPosts: new Set(),
  imageFile: null,
  imagePreviewUrl: '',
  observer: null,
  dom: {
    root: null,
    feed: null,
    empty: null,
    loadMore: null,
    sentinel: null,
    loadingText: null,
    composeForm: null,
    composeButton: null,
    composeContent: null,
    imageInput: null,
    imagePreview: null,
    fileLabel: null,
    profileName: null,
    profileAvatar: null,
    heroCta: null,
  },
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function avatarInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function toText(value, maxLength = 0) {
  const text = String(value ?? '').trim();
  if (!maxLength || maxLength <= 0) return text;
  return text.slice(0, maxLength);
}

function notify(message, type = 'info') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
    return;
  }
  console.log(`[social:${type}] ${message}`);
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, options);
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload || {};
}

function generateProfile() {
  const random = Math.random().toString(36).slice(2, 10);
  return {
    id: `usr-${random}`,
    name: `Warga ${random.slice(-4).toUpperCase()}`,
    avatarUrl: '',
  };
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(SOCIAL_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.name) {
        return {
          id: toText(parsed.id, 80),
          name: toText(parsed.name, 80),
          avatarUrl: toText(parsed.avatarUrl, 1000),
        };
      }
    }
  } catch {
    // Ignore malformed profile storage.
  }

  const profile = generateProfile();
  saveProfile(profile);
  return profile;
}

function saveProfile(profile = socialState.profile) {
  if (!profile) return;
  try {
    localStorage.setItem(SOCIAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore localStorage write failures.
  }
}

function socialHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-social-user-id': socialState.profile?.id || '',
    'x-social-user-name': socialState.profile?.name || '',
    'x-social-user-avatar': socialState.profile?.avatarUrl || '',
  };
}

function formatRelativeTime(isoDate) {
  const timestamp = Date.parse(isoDate || '');
  if (!Number.isFinite(timestamp)) return 'masa tidak diketahui';

  const deltaSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (deltaSec < 60) return 'baru sahaja';

  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) return `${minutes} minit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;

  return new Date(timestamp).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function clearImageSelection() {
  if (socialState.imagePreviewUrl) {
    URL.revokeObjectURL(socialState.imagePreviewUrl);
    socialState.imagePreviewUrl = '';
  }

  socialState.imageFile = null;

  if (socialState.dom.imageInput) {
    socialState.dom.imageInput.value = '';
  }

  if (socialState.dom.fileLabel) {
    socialState.dom.fileLabel.textContent = 'Tiada fail dipilih';
  }

  if (socialState.dom.imagePreview) {
    socialState.dom.imagePreview.innerHTML = '';
    socialState.dom.imagePreview.style.display = 'none';
  }
}

async function fetchCapabilities() {
  socialState.capabilityError = '';

  try {
    const config = await requestJson('/api/social/config');
    socialState.socialEnabled = Boolean(config.enabled);
    socialState.serverPostsOnly = Boolean(config.serverPostsOnly);
    socialState.firebase.enabled = Boolean(config?.firebase?.enabled);
    socialState.firebase.config = config?.firebase || null;
  } catch (error) {
    socialState.socialEnabled = false;
    socialState.serverPostsOnly = false;
    socialState.firebase.enabled = false;
    socialState.firebase.config = null;
    socialState.capabilityError = error.message;
  }
}

async function initFirebaseStorage() {
  if (!socialState.firebase.enabled || !socialState.firebase.config) {
    socialState.firebase.ready = false;
    socialState.firebase.error = '';
    return;
  }

  if (socialState.firebase.ready) return;

  try {
    const appModule = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
    const storageModule = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js');

    const firebaseConfig = {
      apiKey: toText(socialState.firebase.config.apiKey),
      authDomain: toText(socialState.firebase.config.authDomain),
      projectId: toText(socialState.firebase.config.projectId),
      storageBucket: toText(socialState.firebase.config.storageBucket),
      appId: toText(socialState.firebase.config.appId),
      messagingSenderId: toText(socialState.firebase.config.messagingSenderId),
    };

    const existingApps = appModule.getApps();
    const app = existingApps.length > 0 ? existingApps[0] : appModule.initializeApp(firebaseConfig);

    socialState.firebase.storage = storageModule.getStorage(app);
    socialState.firebase.ref = storageModule.ref;
    socialState.firebase.uploadBytes = storageModule.uploadBytes;
    socialState.firebase.getDownloadURL = storageModule.getDownloadURL;
    socialState.firebase.ready = true;
    socialState.firebase.error = '';
  } catch (error) {
    socialState.firebase.ready = false;
    socialState.firebase.error = `Firebase gagal dimulakan: ${error.message}`;
  }
}

async function bootstrapSocialState() {
  if (!socialState.profile) {
    socialState.profile = loadProfile();
  }

  await fetchCapabilities();
  await initFirebaseStorage();
  socialState.initialized = true;
}

function renderCommentsList(postId) {
  const listEl = document.getElementById(`social-comments-list-${postId}`);
  if (!listEl) return;

  const comments = socialState.commentsCache.get(postId) || [];

  if (comments.length === 0) {
    listEl.innerHTML = '<div class="social-comment-empty">Belum ada komen. Jadi yang pertama.</div>';
    return;
  }

  listEl.innerHTML = comments.map((comment) => {
    const authorName = escapeHtml(comment.author?.name || 'Anonymous');
    const avatar = escapeHtml(avatarInitials(comment.author?.name || 'Anonymous'));
    const content = escapeHtml(comment.content || '').replace(/\n/g, '<br>');
    const time = formatRelativeTime(comment.createdAt);

    return `
      <div class="social-comment-item">
        <div class="social-comment-avatar">${avatar}</div>
        <div class="social-comment-body">
          <div class="social-comment-meta">
            <span class="social-comment-author">${authorName}</span>
            <span class="social-comment-time">${time}</span>
          </div>
          <div class="social-comment-content">${content}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadComments(postId) {
  try {
    const result = await requestJson(`/api/social/posts/${encodeURIComponent(postId)}/comments?limit=60`, {
      headers: socialHeaders(),
    });

    socialState.commentsCache.set(postId, Array.isArray(result.comments) ? result.comments : []);
    renderCommentsList(postId);
  } catch (error) {
    notify(`Tidak dapat memuat komen: ${error.message}`, 'error');
  }
}

function upsertPost(post) {
  if (!post || !post.id) return;

  const index = socialState.posts.findIndex((entry) => entry.id === post.id);
  if (index >= 0) {
    socialState.posts[index] = post;
    return;
  }

  socialState.posts.unshift(post);
}

function syncOpenCommentsAfterRender() {
  for (const postId of socialState.openCommentPosts) {
    const panel = document.getElementById(`social-comments-${postId}`);
    if (!panel) continue;

    panel.removeAttribute('hidden');
    renderCommentsList(postId);

    if (!socialState.commentsCache.has(postId)) {
      loadComments(postId);
    }
  }
}

function renderPostCard(post) {
  const authorName = escapeHtml(post.author?.name || 'Anonymous');
  const avatarText = escapeHtml(avatarInitials(post.author?.name || 'Anonymous'));
  const isTopicPost = String(post.postType || 'user') === 'topic';
  const topic = post.topic || null;
  const topicTitle = escapeHtml(topic?.title || '');
  const contentHtml = escapeHtml(post.content || '').replace(/\n/g, '<br>');
  const time = formatRelativeTime(post.createdAt);
  const reactionCount = Number(post.counts?.reactions || 0);
  const commentCount = Number(post.counts?.comments || 0);
  const shareCount = Number(post.counts?.shares || 0);
  const hasReaction = Boolean(post.viewerReaction);
  const isCommentsOpen = socialState.openCommentPosts.has(post.id);
  const topicMeta = [
    topic?.party ? `Parti: ${escapeHtml(topic.party)}` : '',
    topic?.category ? `Kategori: ${escapeHtml(topic.category)}` : '',
    topic?.verdict ? `Verdik: ${escapeHtml(topic.verdict)}` : '',
  ].filter(Boolean).join(' · ');

  return `
    <article class="social-post-card" data-post-id="${post.id}">
      <header class="social-post-header">
        <div class="social-post-avatar">${avatarText}</div>
        <div class="social-post-author-wrap">
          <div class="social-post-author-row">
            <div class="social-post-author">${authorName}</div>
            ${isTopicPost ? '<span class="social-system-badge">Topik Server</span>' : ''}
          </div>
          <div class="social-post-time">${time}</div>
        </div>
      </header>

      ${isTopicPost && topicTitle ? `<h3 class="social-post-headline">${topicTitle}</h3>` : ''}
      ${contentHtml ? `<div class="social-post-content">${contentHtml}</div>` : ''}
      ${isTopicPost && topicMeta ? `<div class="social-post-topic-meta">${topicMeta}</div>` : ''}
      ${post.imageUrl ? `<div class="social-post-image-wrap"><img src="${escapeHtml(post.imageUrl)}" alt="Imej siaran" class="social-post-image" loading="lazy" /></div>` : ''}

      <div class="social-post-actions">
        <button type="button" class="social-action-btn ${hasReaction ? 'active' : ''}" data-action="react" data-post-id="${post.id}">👍 Suka <span>${reactionCount}</span></button>
        <button type="button" class="social-action-btn" data-action="toggle-comments" data-post-id="${post.id}">💬 Komen <span>${commentCount}</span></button>
        <button type="button" class="social-action-btn" data-action="share" data-post-id="${post.id}">🔁 Kongsi <span>${shareCount}</span></button>
      </div>

      <section class="social-comments-panel" id="social-comments-${post.id}" ${isCommentsOpen ? '' : 'hidden'}>
        <div class="social-comments-list" id="social-comments-list-${post.id}"></div>
        <form class="social-comment-form" data-post-id="${post.id}">
          <input type="text" name="content" maxlength="420" placeholder="Tulis komen anda..." required />
          <button type="submit">Hantar</button>
        </form>
      </section>
    </article>
  `;
}

function updateFeedControls() {
  if (socialState.dom.loadingText) {
    socialState.dom.loadingText.textContent = socialState.loadingFeed ? 'Memuat feed...' : '';
  }

  if (socialState.dom.loadMore) {
    socialState.dom.loadMore.disabled = socialState.loadingFeed || !socialState.hasMore;
    socialState.dom.loadMore.textContent = socialState.hasMore ? 'Muat Lagi' : 'Tiada Lagi Siaran';
  }
}

function renderFeed() {
  if (!socialState.dom.feed || !socialState.dom.empty) return;

  if (socialState.posts.length === 0) {
    socialState.dom.feed.innerHTML = '';
    socialState.dom.empty.style.display = 'block';
  } else {
    socialState.dom.empty.style.display = 'none';
    socialState.dom.feed.innerHTML = socialState.posts.map(renderPostCard).join('');
    syncOpenCommentsAfterRender();
  }

  updateFeedControls();
}

async function loadFeed({ reset = false } = {}) {
  if (!socialState.socialEnabled) {
    renderFeed();
    return;
  }

  if (socialState.loadingFeed) return;
  if (!reset && !socialState.hasMore) return;

  if (reset) {
    socialState.posts = [];
    socialState.nextCursor = null;
    socialState.hasMore = true;
    socialState.commentsCache.clear();
    socialState.openCommentPosts.clear();
  }

  socialState.loadingFeed = true;
  updateFeedControls();

  try {
    const params = new URLSearchParams();
    params.set('limit', String(SOCIAL_FEED_LIMIT));
    params.set('viewerId', socialState.profile?.id || '');
    if (socialState.nextCursor) params.set('cursor', socialState.nextCursor);

    const response = await requestJson(`/api/social/feed?${params.toString()}`, {
      headers: socialHeaders(),
    });

    if (typeof response.serverPostsOnly === 'boolean') {
      socialState.serverPostsOnly = response.serverPostsOnly;
    }

    const items = Array.isArray(response.items) ? response.items : [];

    if (reset) {
      socialState.posts = items;
    } else {
      const seen = new Set(socialState.posts.map((post) => post.id));
      for (const item of items) {
        if (!seen.has(item.id)) {
          socialState.posts.push(item);
          seen.add(item.id);
        }
      }
    }

    socialState.nextCursor = toText(response.nextCursor, 80) || null;
    socialState.hasMore = Boolean(response.hasMore);
    renderFeed();
  } catch (error) {
    notify(`Tidak dapat memuat feed: ${error.message}`, 'error');
  } finally {
    socialState.loadingFeed = false;
    updateFeedControls();
  }
}

function attachFeedObserver() {
  if (socialState.observer) {
    socialState.observer.disconnect();
    socialState.observer = null;
  }

  const sentinel = socialState.dom.sentinel;
  if (!sentinel || typeof IntersectionObserver === 'undefined') return;

  socialState.observer = new IntersectionObserver((entries) => {
    const shouldLoad = entries.some((entry) => entry.isIntersecting);
    if (shouldLoad) {
      loadFeed();
    }
  }, {
    root: null,
    rootMargin: '220px 0px 220px 0px',
    threshold: 0,
  });

  socialState.observer.observe(sentinel);
}

async function uploadImageIfNeeded(file) {
  if (!file) return { imageUrl: '', imageStoragePath: '' };

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Saiz gambar melebihi 6MB. Sila pilih fail yang lebih kecil.');
  }

  if (!socialState.firebase.ready) {
    throw new Error('Firebase Storage belum aktif. Gambar tidak boleh dimuat naik lagi.');
  }

  const extension = toText(file.name.split('.').pop(), 10).toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const storagePath = `social/${socialState.profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const storageRef = socialState.firebase.ref(socialState.firebase.storage, storagePath);
  await socialState.firebase.uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
  });

  const imageUrl = await socialState.firebase.getDownloadURL(storageRef);
  return { imageUrl, imageStoragePath: storagePath };
}

async function onComposeSubmit(event) {
  event.preventDefault();

  if (socialState.serverPostsOnly) {
    notify('Siaran dibuat automatik oleh server daripada topik semasa.', 'info');
    return;
  }

  if (!socialState.socialEnabled || socialState.loadingPost) {
    if (!socialState.socialEnabled) {
      notify('Feed sosial belum diaktifkan. Sila semak konfigurasi Turso.', 'warning');
    }
    return;
  }

  const content = toText(socialState.dom.composeContent?.value || '', 4000);
  const file = socialState.imageFile;

  if (!content && !file) {
    notify('Tulis sesuatu atau pilih gambar sebelum hantar.', 'warning');
    return;
  }

  socialState.loadingPost = true;
  if (socialState.dom.composeButton) {
    socialState.dom.composeButton.disabled = true;
    socialState.dom.composeButton.textContent = 'Menghantar...';
  }

  try {
    const upload = await uploadImageIfNeeded(file);

    const payload = await requestJson('/api/social/posts', {
      method: 'POST',
      headers: socialHeaders(),
      body: JSON.stringify({
        content,
        imageUrl: upload.imageUrl,
        imageStoragePath: upload.imageStoragePath,
      }),
    });

    if (payload.post) {
      upsertPost(payload.post);
      renderFeed();
    }

    if (socialState.dom.composeContent) {
      socialState.dom.composeContent.value = '';
    }

    clearImageSelection();
    notify('Siaran anda berjaya diterbitkan.', 'success');
  } catch (error) {
    notify(`Tidak dapat hantar siaran: ${error.message}`, 'error');
  } finally {
    socialState.loadingPost = false;
    if (socialState.dom.composeButton) {
      socialState.dom.composeButton.disabled = false;
      socialState.dom.composeButton.textContent = 'Terbitkan';
    }
  }
}

function onImageSelected(event) {
  const file = event.target?.files?.[0];
  clearImageSelection();

  if (!file) return;

  socialState.imageFile = file;
  socialState.imagePreviewUrl = URL.createObjectURL(file);

  if (socialState.dom.fileLabel) {
    socialState.dom.fileLabel.textContent = `${file.name} (${Math.ceil(file.size / 1024)}KB)`;
  }

  if (socialState.dom.imagePreview) {
    socialState.dom.imagePreview.innerHTML = `
      <div class="social-image-preview-card">
        <img src="${socialState.imagePreviewUrl}" alt="Pratonton gambar" />
      </div>
    `;
    socialState.dom.imagePreview.style.display = 'block';
  }
}

async function onPostAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const postId = button.dataset.postId;
  if (!action || !postId) return;

  if (!socialState.socialEnabled) {
    notify('Feed sosial belum diaktifkan.', 'warning');
    return;
  }

  if (action === 'toggle-comments') {
    const panel = document.getElementById(`social-comments-${postId}`);
    if (!panel) return;

    const currentlyHidden = panel.hasAttribute('hidden');
    if (currentlyHidden) {
      panel.removeAttribute('hidden');
      socialState.openCommentPosts.add(postId);
      if (!socialState.commentsCache.has(postId)) {
        await loadComments(postId);
      } else {
        renderCommentsList(postId);
      }
    } else {
      panel.setAttribute('hidden', 'hidden');
      socialState.openCommentPosts.delete(postId);
    }

    return;
  }

  button.disabled = true;

  try {
    if (action === 'react') {
      const result = await requestJson(`/api/social/posts/${encodeURIComponent(postId)}/reaction`, {
        method: 'POST',
        headers: socialHeaders(),
        body: JSON.stringify({ reactionType: 'like' }),
      });

      if (result.post) {
        upsertPost(result.post);
        renderFeed();
      }
      return;
    }

    if (action === 'share') {
      const result = await requestJson(`/api/social/posts/${encodeURIComponent(postId)}/share`, {
        method: 'POST',
        headers: socialHeaders(),
      });

      if (result.post) {
        upsertPost(result.post);
        renderFeed();
      }
      notify('Siaran berjaya dikongsi.', 'success');
    }
  } catch (error) {
    notify(`Tindakan gagal: ${error.message}`, 'error');
  } finally {
    button.disabled = false;
  }
}

async function onCommentSubmit(event) {
  const form = event.target.closest('.social-comment-form');
  if (!form) return;

  event.preventDefault();

  const postId = toText(form.dataset.postId, 80);
  const input = form.querySelector('input[name="content"]');
  const content = toText(input?.value || '', 420);
  if (!postId || !content) return;

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const payload = await requestJson(`/api/social/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      headers: socialHeaders(),
      body: JSON.stringify({ content }),
    });

    const comments = socialState.commentsCache.get(postId) || [];
    if (payload.comment) {
      comments.push(payload.comment);
      socialState.commentsCache.set(postId, comments);
    }

    if (payload.post) {
      upsertPost(payload.post);
    }

    socialState.openCommentPosts.add(postId);
    renderFeed();

    if (input) {
      input.value = '';
    }
  } catch (error) {
    notify(`Tidak dapat hantar komen: ${error.message}`, 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function onProfileUpdated() {
  const nextName = toText(socialState.dom.profileName?.value || '', 80);
  const nextAvatar = toText(socialState.dom.profileAvatar?.value || '', 1000);

  socialState.profile.name = nextName || socialState.profile.name;
  socialState.profile.avatarUrl = nextAvatar;
  saveProfile();

  const avatarEl = document.getElementById('social-profile-avatar');
  if (avatarEl) {
    avatarEl.textContent = avatarInitials(socialState.profile.name);
  }
}

function onHeroCtaClick() {
  const target = socialState.serverPostsOnly
    ? socialState.dom.feed
    : socialState.dom.composeContent || socialState.dom.feed;

  if (target && typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (!socialState.serverPostsOnly && socialState.dom.composeContent && typeof socialState.dom.composeContent.focus === 'function') {
    try {
      socialState.dom.composeContent.focus({ preventScroll: true });
    } catch {
      socialState.dom.composeContent.focus();
    }
  }
}

function bindDom() {
  socialState.dom.feed = document.getElementById('social-feed-list');
  socialState.dom.empty = document.getElementById('social-feed-empty');
  socialState.dom.loadMore = document.getElementById('social-load-more');
  socialState.dom.sentinel = document.getElementById('social-feed-sentinel');
  socialState.dom.loadingText = document.getElementById('social-loading-text');
  socialState.dom.composeForm = document.getElementById('social-compose-form');
  socialState.dom.composeButton = document.getElementById('social-submit-btn');
  socialState.dom.composeContent = document.getElementById('social-post-content');
  socialState.dom.imageInput = document.getElementById('social-image-input');
  socialState.dom.imagePreview = document.getElementById('social-image-preview');
  socialState.dom.fileLabel = document.getElementById('social-file-label');
  socialState.dom.profileName = document.getElementById('social-profile-name');
  socialState.dom.profileAvatar = document.getElementById('social-profile-avatar-url');
  socialState.dom.heroCta = document.getElementById('social-hero-cta');

  socialState.dom.composeForm?.addEventListener('submit', onComposeSubmit);
  socialState.dom.imageInput?.addEventListener('change', onImageSelected);
  socialState.dom.feed?.addEventListener('click', onPostAction);
  socialState.dom.feed?.addEventListener('submit', onCommentSubmit);
  socialState.dom.loadMore?.addEventListener('click', () => loadFeed());
  socialState.dom.heroCta?.addEventListener('click', onHeroCtaClick);

  socialState.dom.profileName?.addEventListener('change', onProfileUpdated);
  socialState.dom.profileAvatar?.addEventListener('change', onProfileUpdated);
}

function buildStatusLine({ bootstrapping = false } = {}) {
  if (bootstrapping) {
    return '<span class="social-capability warn">Memuat konfigurasi sosial...</span>';
  }

  const tursoStatus = socialState.socialEnabled
    ? '<span class="social-capability ok">Turso: aktif</span>'
    : '<span class="social-capability off">Turso: belum dikonfigurasi</span>';

  const firebaseStatus = socialState.firebase.ready
    ? '<span class="social-capability ok">Firebase Storage: aktif</span>'
    : socialState.firebase.enabled
      ? '<span class="social-capability warn">Firebase Storage: cuba sambung...</span>'
      : '<span class="social-capability off">Firebase Storage: belum dikonfigurasi</span>';

  return `${tursoStatus}${firebaseStatus}`;
}

function renderShell(container, { bootstrapping = false } = {}) {
  const firebaseHint = socialState.firebase.ready
    ? 'Muat naik gambar aktif. Imej akan disimpan di Firebase Storage.'
    : 'Muat naik gambar memerlukan konfigurasi Firebase Storage.';
  const heroCtaTitle = socialState.serverPostsOnly
    ? 'Teroka Perbualan Terkini'
    : 'Mulakan Perbualan Sekarang';
  const heroCtaHint = socialState.serverPostsOnly
    ? 'Terus ke feed untuk react, komen, dan kongsi isu semasa.'
    : 'Terus ke ruangan siaran untuk kongsi pendapat anda.';

  const warning = !socialState.socialEnabled && !bootstrapping
    ? '<div class="social-alert error">Feed sosial belum aktif. Tetapkan TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN pada server.</div>'
    : socialState.firebase.error
      ? `<div class="social-alert warning">${escapeHtml(socialState.firebase.error)}</div>`
      : '';

  const bootstrapInfo = bootstrapping
    ? '<div class="social-alert info">Memuat konfigurasi sosial dan sambungan storan...</div>'
    : '';

  const serverModeInfo = socialState.serverPostsOnly
    ? '<div class="social-alert info">Mod server aktif: semua topik dipaparkan sebagai siaran automatik. Pengguna boleh react, komen, dan share.</div>'
    : '';

  const composeBlock = socialState.serverPostsOnly
    ? '<div class="social-server-mode-note">Siaran baharu dijana oleh server berdasarkan topik politik yang dianalisis. Gunakan komen dan reaksi untuk interaksi.</div>'
    : `
      <form id="social-compose-form" class="social-compose-card">
        <textarea id="social-post-content" maxlength="4000" placeholder="Apa isu semasa yang anda mahu bincangkan?"></textarea>

        <div class="social-compose-row">
          <label class="social-upload-btn ${socialState.firebase.ready ? '' : 'disabled'}">
            <input id="social-image-input" type="file" accept="image/*" ${socialState.firebase.ready ? '' : 'disabled'} />
            📷 Tambah gambar
          </label>
          <span class="social-file-label" id="social-file-label">Tiada fail dipilih</span>
          <button id="social-submit-btn" type="submit" ${socialState.socialEnabled ? '' : 'disabled'}>Terbitkan</button>
        </div>

        <div class="social-compose-hint">${escapeHtml(firebaseHint)}</div>
        <div class="social-image-preview" id="social-image-preview" style="display:none;"></div>
      </form>
    `;

  container.innerHTML = `
    <div class="social-page social-glass-theme">
      <div class="social-ambient social-ambient-one" aria-hidden="true"></div>
      <div class="social-ambient social-ambient-two" aria-hidden="true"></div>

      <div class="social-header-panel">
        <div class="social-header-kicker">SOCIAL MEDIA</div>
        <h1>Feed Komuniti</h1>
        <p>Kongsi kemas kini, respons rakyat, dan bukti visual berkaitan isu politik semasa.</p>
        <div class="social-capabilities">${buildStatusLine({ bootstrapping })}</div>

        <button id="social-hero-cta" class="social-hero-cta" type="button" ${socialState.socialEnabled ? '' : 'disabled'}>
          <span>${heroCtaTitle}</span>
          <small>${heroCtaHint}</small>
        </button>
      </div>

      ${bootstrapInfo}
      ${warning}
      ${serverModeInfo}

      <div class="social-layout">
        <aside class="social-profile-card">
          <div class="social-profile-avatar" id="social-profile-avatar">${escapeHtml(avatarInitials(socialState.profile?.name || ''))}</div>
          <div class="social-profile-title">Profil Ringkas</div>
          <label>
            Nama paparan
            <input id="social-profile-name" type="text" maxlength="80" value="${escapeHtml(socialState.profile?.name || '')}" />
          </label>
          <label>
            URL avatar (opsyenal)
            <input id="social-profile-avatar-url" type="url" maxlength="1000" value="${escapeHtml(socialState.profile?.avatarUrl || '')}" placeholder="https://..." />
          </label>
          <p class="social-profile-note">Profil disimpan dalam pelayar ini supaya identiti anda kekal konsisten untuk reaksi dan komen.</p>
        </aside>

        <section class="social-feed-column">
          ${composeBlock}

          <div class="social-feed-list" id="social-feed-list"></div>
          <div class="social-feed-empty" id="social-feed-empty" style="display:none;">Belum ada siaran. Jadilah orang pertama memulakan perbualan.</div>

          <div class="social-feed-footer">
            <button id="social-load-more" type="button">Muat Lagi</button>
            <span id="social-loading-text"></span>
          </div>
          <div id="social-feed-sentinel" class="social-feed-sentinel" aria-hidden="true"></div>
        </section>
      </div>
    </div>
  `;
}

export async function renderSocialFeed(containerId = 'social-content') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const renderId = ++socialState.renderSequence;

  if (!socialState.profile) {
    socialState.profile = loadProfile();
  }

  socialState.dom.root = container;
  renderShell(container, { bootstrapping: true });
  bindDom();
  attachFeedObserver();
  if (socialState.dom.loadingText) {
    socialState.dom.loadingText.textContent = 'Memuat feed...';
  }

  await bootstrapSocialState();

  if (renderId !== socialState.renderSequence) {
    return;
  }

  socialState.dom.root = container;
  renderShell(container);
  bindDom();
  attachFeedObserver();

  if (socialState.socialEnabled) {
    await loadFeed({ reset: true });
  } else {
    socialState.posts = [];
    socialState.hasMore = false;
    renderFeed();

    if (socialState.capabilityError) {
      notify(`Konfigurasi feed sosial gagal: ${socialState.capabilityError}`, 'warning');
    }
  }
}

export async function refreshSocialFeed({ reset = true } = {}) {
  if (!socialState.initialized || !socialState.dom.root) return;
  if (!socialState.socialEnabled) return;

  await loadFeed({ reset: Boolean(reset) });
}
