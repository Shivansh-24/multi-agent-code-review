import { query } from '@anthropic-ai/claude-agent-sdk';
import { ReviewReport, ReviewReportSchema, ReviewReportJSONSchema } from './types/index.js';
import { mcpServersConfig } from './config/mcp.config.js';
import { codeQualityAnalyzer, testCoverageAnalyzer, refactoringSuggester } from './agents/index.js';
import { buildOrchestratorPrompt } from './prompts/index.js';
import { logger } from './utils/logger.js';
import { ReviewError, ErrorCodes, withRetry, withTimeout } from './utils/error-handler.js';

export interface OrchestratorOptions {
  maxTurns?: number;
  timeoutMs?: number;
}

export class CodeReviewOrchestrator {
  private maxTurns: number;
  private timeoutMs: number;

  constructor(options: OrchestratorOptions = {}) {
    this.maxTurns = options.maxTurns ?? 40;
    this.timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
  }

  async reviewPullRequest(owner: string, repo: string, prNumber: number): Promise<ReviewReport> {
    const startedAt = Date.now();
    const prompt = buildOrchestratorPrompt(owner, repo, prNumber);

    const run = async (): Promise<ReviewReport> => {
      let structuredOutput: unknown;

      const stream = query({
        prompt,
        options: {
          mcpServers: mcpServersConfig,
          agents: {
            'code-quality-analyzer': codeQualityAnalyzer,
            'test-coverage-analyzer': testCoverageAnalyzer,
            'refactoring-suggester': refactoringSuggester
          },
          allowedTools: ['Task', 'Read', 'Grep', 'Glob', 'Skill'],
          model: process.env.ANTHROPIC_MODEL,
          maxTurns: this.maxTurns,
          permissionMode: 'bypassPermissions',
          outputFormat: {
            type: 'json_schema',
            schema: ReviewReportJSONSchema
          }
        }
      });

      for await (const message of stream as AsyncIterable<any>) {
        if (message?.type === 'result' && message.structured_output) {
          structuredOutput = message.structured_output;
        }
      }

      if (!structuredOutput) {
        throw new ReviewError(
          'The SDK never produced a structured_output for this run',
          ErrorCodes.STRUCTURED_OUTPUT_FAILED,
          { owner, repo, prNumber }
        );
      }

      const parsed = ReviewReportSchema.safeParse(structuredOutput);
      if (!parsed.success) {
        throw new ReviewError(
          `Structured output failed schema validation: ${parsed.error.message}`,
          ErrorCodes.VALIDATION_FAILED,
          { owner, repo, prNumber }
        );
      }
      return parsed.data;
    };

    const report = await withRetry(() => withTimeout(run, this.timeoutMs, 'Review timed out'), 3, 2000);
    const duration = Date.now() - startedAt;
    report.metadata = {
      ...report.metadata,
      duration,
      analyzedAt: report.metadata?.analyzedAt || new Date().toISOString()
    };
    return report;
  }
}