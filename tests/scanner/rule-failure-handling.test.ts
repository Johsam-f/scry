import { describe, it, expect, beforeEach } from 'bun:test';
import { Scanner } from '../../src/scanner';
import { BaseRule } from '../../src/rules/base';
import type { Finding, ScryConfig } from '../../src/types';
import { defaultConfig } from '../../src/types/config';

// Create a rule that always fails
class FailingRule extends BaseRule {
  override id = 'test-failing';
  override name = 'Failing Test Rule';
  override description = 'A rule that intentionally fails';
  override severity = 'high' as const;

  override async check(_content: string, _filePath: string): Promise<Finding[]> {
    throw new Error('This rule intentionally fails for testing');
  }
}

// Create a rule that works normally
class WorkingRule extends BaseRule {
  override id = 'test-working';
  override name = 'Working Test Rule';
  override description = 'A rule that works correctly';
  override severity = 'medium' as const;

  override async check(content: string, filePath: string): Promise<Finding[]> {
    // Detect the word "secret"
    if (content.includes('secret')) {
      return [
        this.createFinding(
          'Test secret detected',
          content,
          filePath,
          1,
          'This is a test finding',
          'Remove the secret'
        ),
      ];
    }
    return [];
  }
}

describe('Rule Failure Handling', () => {
  let config: ScryConfig;

  beforeEach(() => {
    config = { ...defaultConfig };
  });

  it('should continue scanning when one rule fails', async () => {
    const failingRule = new FailingRule();
    const workingRule = new WorkingRule();

    const scanner = new Scanner([failingRule, workingRule], config);

    // Create a test file with content that should match the working rule
    const testFile = '/tmp/test-rule-failure-handling.js';
    const fs = require('fs');
    fs.writeFileSync(testFile, 'const secret = "test";');

    try {
      const result = await scanner.scan('/tmp/test-rule-failure-handling.js');

      // The scan should complete despite the failing rule
      expect(result.filesScanned).toBe(1);

      // The working rule should still produce findings
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings[0]?.rule).toBe('test-working');
    } finally {
      // Cleanup
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });

  it('should scan successfully even when all rules fail', async () => {
    const failingRule1 = new FailingRule();
    const failingRule2 = new FailingRule();
    failingRule2.id = 'test-failing-2';

    const scanner = new Scanner([failingRule1, failingRule2], config);

    // Create a test file
    const testFile = '/tmp/test-all-rules-fail.js';
    const fs = require('fs');
    fs.writeFileSync(testFile, 'const test = "value";');

    try {
      const result = await scanner.scan('/tmp/test-all-rules-fail.js');

      // The scan should complete despite all rules failing
      expect(result.filesScanned).toBe(1);

      // No findings should be produced since all rules failed
      expect(result.findings.length).toBe(0);
    } finally {
      // Cleanup
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });

  it('should handle mix of successful and failing rules', async () => {
    const workingRule1 = new WorkingRule();
    const failingRule = new FailingRule();
    const workingRule2 = new WorkingRule();
    workingRule2.id = 'test-working-2';

    const scanner = new Scanner([workingRule1, failingRule, workingRule2], config);

    // Create a test file
    const testFile = '/tmp/test-mixed-rules.js';
    const fs = require('fs');
    fs.writeFileSync(testFile, 'const secret = "test";');

    try {
      const result = await scanner.scan('/tmp/test-mixed-rules.js');

      // The scan should complete
      expect(result.filesScanned).toBe(1);

      // Both working rules should produce findings
      expect(result.findings.length).toBe(2);
      expect(result.findings.every((f) => f.rule.startsWith('test-working'))).toBe(true);
    } finally {
      // Cleanup
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });

  it('should handle rule that throws synchronously', async () => {
    class SyncFailingRule extends BaseRule {
      override id = 'test-sync-failing';
      override name = 'Sync Failing Test Rule';
      override description = 'A rule that fails synchronously';
      override severity = 'high' as const;

      override async check(_content: string, _filePath: string): Promise<Finding[]> {
        // Throw immediately without await
        throw new Error('Synchronous failure');
      }
    }

    const syncFailingRule = new SyncFailingRule();
    const workingRule = new WorkingRule();

    const scanner = new Scanner([syncFailingRule, workingRule], config);

    // Create a test file
    const testFile = '/tmp/test-sync-failure.js';
    const fs = require('fs');
    fs.writeFileSync(testFile, 'const secret = "test";');

    try {
      const result = await scanner.scan('/tmp/test-sync-failure.js');

      // The scan should complete
      expect(result.filesScanned).toBe(1);

      // Working rule should still produce findings
      expect(result.findings.length).toBeGreaterThan(0);
    } finally {
      // Cleanup
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });
});
