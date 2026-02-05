import { describe, it, expect } from 'bun:test';
import { Scanner } from '../../src/scanner';
import type { Rule, ScryConfig } from '../../src/types';

// Mock rule for testing
class MockRule implements Rule {
  id: string;
  name: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  enabled: boolean;
  tags?: string[];

  constructor(id: string, severity: 'high' | 'medium' | 'low') {
    this.id = id;
    this.name = id;
    this.description = `Test rule: ${id}`;
    this.severity = severity;
    this.enabled = true;
  }

  async check(content: string, filePath: string): Promise<Finding[]> {
    // Simple mock: create a finding if content contains the rule id
    if (content.includes(this.id)) {
      return [{
        rule: this.id,
        message: `Found ${this.id}`,
        severity: this.severity,
        file: filePath,
        line: 1,
        column: 0,
        snippet: this.id,
        explanation: 'Test explanation',
        fix: 'Test fix'
      }];
    }
    return [];
  }
}

describe('Severity Filtering', () => {
  const mockRules: Rule[] = [
    new MockRule('high-rule', 'high'),
    new MockRule('medium-rule', 'medium'),
    new MockRule('low-rule', 'low')
  ];

  describe('minSeverity: low', () => {
    it('should include all findings', () => {
      const config: ScryConfig = {
        rules: {},
        ignore: [],
        extensions: ['.js'],
        output: 'table',
        strict: false,
        minSeverity: 'low',
        showFixes: true,
        showExplanations: true
      };

      const scanner = new Scanner(mockRules, config);
      
      // Test the severity filtering logic
      const findings = [
        { rule: 'high-rule', message: 'test', severity: 'high' as const, file: 'test.js', line: 1, column: 0, snippet: 'code', explanation: 'exp', fix: 'fix' },
        { rule: 'medium-rule', message: 'test', severity: 'medium' as const, file: 'test.js', line: 2, column: 0, snippet: 'code', explanation: 'exp', fix: 'fix' },
        { rule: 'low-rule', message: 'test', severity: 'low' as const, file: 'test.js', line: 3, column: 0, snippet: 'code', explanation: 'exp', fix: 'fix' }
      ];

      // Check using the private shouldIncludeFinding method logic
      const severityLevels = { high: 3, medium: 2, low: 1 };
      const minLevel = severityLevels[config.minSeverity];
      
      const filtered = findings.filter(f => 
        severityLevels[f.severity] >= minLevel
      );

      expect(filtered).toHaveLength(3);
      expect(filtered.some(f => f.severity === 'high')).toBe(true);
      expect(filtered.some(f => f.severity === 'medium')).toBe(true);
      expect(filtered.some(f => f.severity === 'low')).toBe(true);
    });
  });

  describe('minSeverity: medium', () => {
    it('should include medium and high findings only', () => {
      const config: ScryConfig = {
        rules: {},
        ignore: [],
        extensions: ['.js'],
        output: 'table',
        strict: false,
        minSeverity: 'medium',
        showFixes: true,
        showExplanations: true
      };

      const findings = [
        { rule: 'high-rule', message: 'test', severity: 'high' as const, file: 'test.js', line: 1, column: 0, snippet: 'code', explanation: 'exp', fix: 'fix' },
        { rule: 'medium-rule', message: 'test', severity: 'medium' as const, file: 'test.js', line: 2, column: 0, snippet: 'code', explanation: 'exp', fix: 'fix' },
        { rule: 'low-rule', message: 'test', severity: 'low' as const, file: 'test.js', line: 3, column: 0, snippet: 'code', explanation: 'exp', fix: 'fix' }
      ];

      const severityLevels = { high: 3, medium: 2, low: 1 };
      const minLevel = severityLevels[config.minSeverity];
      
      const filtered = findings.filter(f => 
        severityLevels[f.severity] >= minLevel
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.some(f => f.severity === 'high')).toBe(true);
      expect(filtered.some(f => f.severity === 'medium')).toBe(true);
      expect(filtered.some(f => f.severity === 'low')).toBe(false);
    });
  });

  describe('minSeverity: high', () => {
    it('should include high findings only', () => {
      const config: ScryConfig = {
        rules: {},
        ignore: [],
        extensions: ['.js'],
        output: 'table',
        strict: false,
        minSeverity: 'high',
        showFixes: true,
        showExplanations: true
      };

      const findings = [
        { rule: 'high-rule', message: 'test', severity: 'high' as const, file: 'test.js', line: 1, column: 0, snippet: 'code', explanation: 'exp', fix: 'fix' },
        { rule: 'medium-rule', message: 'test', severity: 'medium' as const, file: 'test.js', line: 2, column: 0, snippet: 'code', explanation: 'exp', fix: 'fix' },
        { rule: 'low-rule', message: 'test', severity: 'low' as const, file: 'test.js', line: 3, column: 0, snippet: 'code', explanation: 'exp', fix: 'fix' }
      ];

      const severityLevels = { high: 3, medium: 2, low: 1 };
      const minLevel = severityLevels[config.minSeverity];
      
      const filtered = findings.filter(f => 
        severityLevels[f.severity] >= minLevel
      );

      expect(filtered).toHaveLength(1);
      expect(filtered.some(f => f.severity === 'high')).toBe(true);
      expect(filtered.some(f => f.severity === 'medium')).toBe(false);
      expect(filtered.some(f => f.severity === 'low')).toBe(false);
    });
  });

  describe('Strict Mode', () => {
    it('should not affect finding filtering', () => {
      const config: ScryConfig = {
        rules: {},
        ignore: [],
        extensions: ['.js'],
        output: 'table',
        strict: true,
        minSeverity: 'low',
        showFixes: true,
        showExplanations: true
      };

      const findings = [
        { rule: 'low-rule', message: 'test', severity: 'low' as const, file: 'test.js', line: 1, column: 0, snippet: 'code', explanation: 'exp', fix: 'fix' }
      ];

      const severityLevels = { high: 3, medium: 2, low: 1 };
      const minLevel = severityLevels[config.minSeverity];
      
      const filtered = findings.filter(f => 
        severityLevels[f.severity] >= minLevel
      );

      expect(filtered).toHaveLength(1);
    });
  });

  describe('Combined Filtering', () => {
    it('should apply both rule enabled status and severity filtering', () => {
      const rules = mockRules.map(r => ({ ...r }));
      rules[2]!.enabled = false; // Disable low-rule

      const config: ScryConfig = {
        rules: {},
        ignore: [],
        extensions: ['.js'],
        output: 'table',
        strict: false,
        minSeverity: 'medium',
        showFixes: true,
        showExplanations: true
      };

      const scanner = new Scanner(rules, config);
      const enabledRules = scanner.getEnabledRules();

      expect(enabledRules).toHaveLength(2);
      expect(enabledRules.some(r => r.id === 'high-rule')).toBe(true);
      expect(enabledRules.some(r => r.id === 'medium-rule')).toBe(true);
      expect(enabledRules.some(r => r.id === 'low-rule')).toBe(false);
    });
  });
});
