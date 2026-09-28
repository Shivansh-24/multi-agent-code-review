# Multi-Agent Code Review Orchestrator

A multi-agent pull request review system built with the Claude Agent SDK. An orchestrator fetches PR data from GitHub through an MCP server, dispatches three specialized subagents, and aggregates their findings into a validated report (JSON, Markdown, HTML).

## Architecture

- **Orchestrator** (`src/orchestrator.ts`): uses the SDK `query` function with the `Task` tool, registers all three subagents, and enforces structured output with a JSON schema generated from Zod. The result is validated with `safeParse`.
- **Subagents** (`src/agents/`):
  - `code-quality-analyzer`: security, performance, maintainability. Has the `Skill` tool and uses the `javascript-best-practices` skill.
  - `test-coverage-analyzer`: finds untested paths and suggests specific tests.
  - `refactoring-suggester`: extract-function, modernization, simplification, with before/after code.
- **MCP servers** (`src/config/mcp.config.ts`): GitHub (`@modelcontextprotocol/server-github`) and ESLint (`@eslint/mcp`), both over stdio via `npx`.
- **Prompts** (`src/prompts/`): one prompt per agent plus the orchestrator prompt.
- **Utilities** (`src/utils/`): `withRetry` (exponential backoff with jitter), `withTimeout` (`Promise.race`), and a sliding-window rate limiter (requests, tokens, concurrency).
- **Skill** (`.claude/skills/javascript-best-practices/`).

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
PROJECT_ROOT=/absolute/path/to/project/starter
GITHUB_TOKEN=your-github-token   # recommended, scopes: repo, read:org
```

Set `ANTHROPIC_API_KEY` in your environment (or AWS Bedrock credentials plus `AWS_REGION`). No secrets are stored in the source code.

## Usage

```bash
npm run dev -- <owner> <repo> <pr-number>
```

Example:

```bash
npm run dev -- lucaong minisearch 295
```

The CLI validates the arguments, the authentication method and `ANTHROPIC_MODEL`, then writes three files to `reports/`:
`<owner>_<repo>_<pr>.json`, `.md` and `.html`.

## Build and test

```bash
npm run build
npm test
```

## Submitted reports

Reports are in `reports/`:

| PR | Files |
|----|-------|
| shinshin86/todo-opfs-sqlite #1 | `.json`, `.md`, `.html` |
| lucaong/minisearch #295 | `.json`, `.md`, `.html` |
| lucaong/minisearch #305 | `.json`, `.md`, `.html` |

The repository named in the project guide (`airaamane/simple-todo-app`) returned a 404 from the GitHub API at submission time, so the fallback repositories listed in the guide were used instead.

## Notes

- The ESLint MCP server is configured but was not directly observed being invoked in the test runs.
- The logger records review start, completion and score, not individual tool calls.
