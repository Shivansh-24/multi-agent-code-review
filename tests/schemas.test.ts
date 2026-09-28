import { describe, it, expect } from 'vitest';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  ReviewReportSchema,
  ReviewReportJSONSchema
} from '../src/types/index.js';

describe('CodeQualityResultSchema', () => {
  it('accepts valid data', () => {
    expect(() =>
      CodeQualityResultSchema.parse({
        file: 'src/example.ts',
        issues: [{ line: 10, severity: 'high', category: 'security', description: 'Potential XSS', suggestion: 'Sanitize input' }],
        overallScore: 75,
        summary: 'Some issues found'
      })
    ).not.toThrow();
  });

  it('rejects invalid severity enum', () => {
    expect(() =>
      CodeQualityResultSchema.parse({
        file: 'src/example.ts',
        issues: [{ line: 10, severity: 'super-bad', category: 'security', description: 'x', suggestion: 'y' }],
        overallScore: 75,
        summary: 'x'
      })
    ).toThrow();
  });

  it('accepts empty issues array', () => {
    expect(() =>
      CodeQualityResultSchema.parse({ file: 'a.ts', issues: [], overallScore: 100, summary: 'No issues' })
    ).not.toThrow();
  });

  it('accepts boundary scores 0 and 100', () => {
    expect(() => CodeQualityResultSchema.parse({ file: 'a.ts', issues: [], overallScore: 0, summary: 's' })).not.toThrow();
    expect(() => CodeQualityResultSchema.parse({ file: 'a.ts', issues: [], overallScore: 100, summary: 's' })).not.toThrow();
  });

  it('rejects score above 100', () => {
    expect(() => CodeQualityResultSchema.parse({ file: 'a.ts', issues: [], overallScore: 101, summary: 's' })).toThrow();
  });
});

describe('TestCoverageResultSchema', () => {
  it('accepts valid data', () => {
    expect(() =>
      TestCoverageResultSchema.parse({
        file: 'src/example.ts',
        hasTests: true,
        testFiles: ['src/example.test.ts'],
        untestedPaths: [{ type: 'function', location: 'calculateTotal()', priority: 'high', reasoning: 'Payment logic', suggestedTest: 'should total correctly' }],
        coverageEstimate: 60,
        summary: 'Moderate coverage'
      })
    ).not.toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => TestCoverageResultSchema.parse({ file: 'src/example.ts' })).toThrow();
  });

  it('accepts empty untestedPaths array', () => {
    expect(() =>
      TestCoverageResultSchema.parse({ file: 'src/example.ts', hasTests: true, testFiles: [], untestedPaths: [], coverageEstimate: 100, summary: 'Fully covered' })
    ).not.toThrow();
  });
});

describe('RefactoringSuggestionSchema', () => {
  it('accepts valid data', () => {
    expect(() =>
      RefactoringSuggestionSchema.parse({
        file: 'src/example.ts',
        suggestions: [{ type: 'extract-function', location: 'lines 20-45', impact: 'medium', description: 'Extract validation', before: 'if(x){...}', after: 'function validate(){...}', benefits: 'Less duplication' }],
        summary: 'One extraction opportunity'
      })
    ).not.toThrow();
  });

  it('rejects invalid type enum', () => {
    expect(() =>
      RefactoringSuggestionSchema.parse({
        file: 'src/example.ts',
        suggestions: [{ type: 'not-a-real-type', location: 'x', impact: 'medium', description: 'x', before: 'x', after: 'x', benefits: 'x' }],
        summary: 'x'
      })
    ).toThrow();
  });
});

describe('ReviewReportSchema', () => {
  it('accepts a fully valid report', () => {
    expect(() =>
      ReviewReportSchema.parse({
        pullRequest: { owner: 'octocat', repo: 'Hello-World', number: 1 },
        fileReviews: [
          {
            file: 'src/example.ts',
            codeQuality: { file: 'src/example.ts', issues: [], overallScore: 90, summary: 'Good' },
            testCoverage: { file: 'src/example.ts', hasTests: true, testFiles: [], untestedPaths: [], coverageEstimate: 80, summary: 'Good coverage' },
            refactorings: { file: 'src/example.ts', suggestions: [], summary: 'No changes needed' }
          }
        ],
        summary: { totalFiles: 1, overallScore: 90, criticalIssues: 0, highPriorityTests: 0, refactoringOpportunities: 0 },
        recommendations: [],
        metadata: { analyzedAt: new Date().toISOString(), duration: 1000, agentVersions: { codeQuality: '1.0', testCoverage: '1.0', refactoring: '1.0' } }
      })
    ).not.toThrow();
  });

  it('rejects a report missing fileReviews', () => {
    expect(() => ReviewReportSchema.parse({ pullRequest: { owner: 'a', repo: 'b', number: 1 } })).toThrow();
  });
});

describe('JSON Schema export', () => {
  it('produces a valid JSON schema object with expected top-level properties', () => {
    expect(ReviewReportJSONSchema).toBeTypeOf('object');
    expect(ReviewReportJSONSchema).toHaveProperty('properties');
    const props = (ReviewReportJSONSchema as { properties?: Record<string, unknown> }).properties;
    expect(props).toHaveProperty('pullRequest');
    expect(props).toHaveProperty('fileReviews');
    expect(props).toHaveProperty('summary');
  });
});