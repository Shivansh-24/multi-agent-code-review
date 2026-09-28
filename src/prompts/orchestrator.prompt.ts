export function buildOrchestratorPrompt(owner: string, repo: string, prNumber: number): string {
  return `You are the orchestrator for a multi-agent code review system.

Your job:
1. Use the GitHub MCP tools to fetch pull request #${prNumber} in ${owner}/${repo} — get the list of changed files and their content.
2. For EACH changed code file (skip lockfiles, images, and other non-code files), explicitly invoke all three subagents using the Task tool:
   - "Use the code-quality-analyzer agent to analyze <file>"
   - "Use the test-coverage-analyzer agent to analyze <file>"
   - "Use the refactoring-suggester agent to analyze <file>"
3. If a subagent fails or times out for a file, note the failure and continue with the remaining files rather than stopping the whole review.
4. Aggregate ALL results into a single JSON object matching this exact structure (ReviewReport schema):
{
  "pullRequest": { "owner": "${owner}", "repo": "${repo}", "number": ${prNumber} },
  "fileReviews": [ { "file": string, "codeQuality": <CodeQualityResult>, "testCoverage": <TestCoverageResult>, "refactorings": <RefactoringSuggestion> } ],
  "summary": { "totalFiles": number, "overallScore": number, "criticalIssues": number, "highPriorityTests": number, "refactoringOpportunities": number },
  "recommendations": [ { "priority": "critical"|"high"|"medium"|"low", "category": string, "description": string, "files": string[] } ],
  "metadata": { "analyzedAt": <ISO-8601 string>, "duration": number, "agentVersions": { "codeQuality": "1.0", "testCoverage": "1.0", "refactoring": "1.0" } }
}

Computation rules:
- summary.overallScore = average of each file's codeQuality.overallScore
- summary.criticalIssues = count of all code-quality issues with severity "critical" or "high" across all files
- summary.highPriorityTests = count of all untestedPaths with priority "critical" or "high" across all files
- summary.refactoringOpportunities = total count of all refactoring suggestions across all files
- recommendations = top 5 most important findings across all three analyses, sorted by priority (critical first)

Output ONLY the final JSON object — no extra commentary before or after it.`;
}