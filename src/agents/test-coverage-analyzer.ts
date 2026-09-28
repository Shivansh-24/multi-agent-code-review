import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/test-coverage-analyzer.prompt.js';

export const testCoverageAnalyzer: AgentDefinition = {
  description:
    'Evaluates test completeness for a source file and suggests specific missing test cases. Use this agent whenever a changed file needs a test-coverage assessment.',
  prompt: TEST_COVERAGE_ANALYZER_PROMPT,
  model: 'inherit',
  tools: ['Read', 'Grep', 'Glob', 'Skill']
};