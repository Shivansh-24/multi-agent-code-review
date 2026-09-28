import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { CodeReviewOrchestrator } from './orchestrator.js';
import { ReportGenerator } from './utils/report-generator.js';
import { logger } from './utils/logger.js';

dotenv.config();

async function main() {
  const [owner, repo, prStr] = process.argv.slice(2);

  if (!owner || !repo || !prStr) {
    console.error('Usage: npm run dev -- <owner> <repo> <pr-number>');
    process.exit(1);
  }

  const prNumber = parseInt(prStr, 10);
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    console.error(`Invalid PR number: "${prStr}". Must be a positive integer.`);
    process.exit(1);
  }

  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasBedrock = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

  if (hasBedrock) {
    if (!process.env.AWS_REGION) {
      console.error('AWS_REGION is required when using AWS Bedrock authentication.');
      process.exit(1);
    }
    console.log('🔐 Using AWS Bedrock authentication');
  } else if (hasAnthropicKey) {
    console.log('🔐 Using Anthropic API authentication');
  } else {
    console.error(
      'No authentication configured. Set either:\n' +
      '  - ANTHROPIC_API_KEY, or\n' +
      '  - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_REGION'
    );
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_MODEL) {
    console.error(
      'ANTHROPIC_MODEL environment variable is required.\n' +
      '  - Anthropic API: claude-sonnet-4-5-20250929\n' +
      '  - AWS Bedrock: us.anthropic.claude-sonnet-4-5-20250929-v1:0'
    );
    process.exit(1);
  }

  logger.info(`Starting review of ${owner}/${repo} PR #${prNumber}...`);

  try {
    const orchestrator = new CodeReviewOrchestrator();
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);

    const generator = new ReportGenerator();
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const baseName = `${owner}_${repo}_${prNumber}`;
    fs.writeFileSync(path.join(reportsDir, `${baseName}.json`), generator.generateJSONReport(report));
    fs.writeFileSync(path.join(reportsDir, `${baseName}.md`), generator.generateMarkdownReport(report));
    fs.writeFileSync(path.join(reportsDir, `${baseName}.html`), generator.generateHTMLReport(report));

    logger.info('Review complete. Reports saved:');
    logger.info(`  JSON:     reports/${baseName}.json`);
    logger.info(`  Markdown: reports/${baseName}.md`);
    logger.info(`  HTML:     reports/${baseName}.html`);
    logger.info(`  Overall score: ${report.summary.overallScore}/100`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();