import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/refactoring-suggester.prompt.js';

export const refactoringSuggester: AgentDefinition = {
  description:
    'Identifies refactoring opportunities: extract-method candidates, modernization, simplification, and design-pattern improvements. Use this agent whenever a changed file needs a structural/refactoring review.',
  prompt: REFACTORING_SUGGESTER_PROMPT,
  model: 'inherit',
  tools: ['Read', 'Grep', 'Glob', 'Skill']
};