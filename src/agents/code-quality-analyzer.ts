import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/code-quality-analyzer.prompt.js';

export const codeQualityAnalyzer: AgentDefinition = {
  description:
    'Analyzes source code for security vulnerabilities, performance issues, and maintainability concerns. Use this agent whenever a changed file needs a code-quality review.',
  prompt: CODE_QUALITY_ANALYZER_PROMPT,
  model: 'inherit',
  tools: ['Read', 'Grep', 'Glob', 'Skill']
};