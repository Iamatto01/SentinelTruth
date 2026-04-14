import 'dotenv/config';
import { aiAgent } from '../services/ai-agent.js';

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function main() {
  const targetArg = process.argv[2];
  const parsedTarget = Number.parseInt(targetArg || '1000', 10);
  const targetCount = Number.isFinite(parsedTarget) ? parsedTarget : 1000;

  const includeFacebook = !hasFlag('--no-facebook');
  const includeInternet = !hasFlag('--no-internet') || includeFacebook;

  const result = await aiAgent.ingestRealArticles({
    targetCount,
    includeInternet,
    includeFacebook,
  });

  if (!result.success) {
    console.error('Ingestion failed:', result.error || 'Unknown error');
    process.exitCode = 1;
    return;
  }

  console.log('Ingestion report:');
  console.log(JSON.stringify(result.report, null, 2));
}

main();