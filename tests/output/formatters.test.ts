import { describe, it, expect } from 'bun:test';
import { render } from '../../src/output';
import type { Finding } from '../../src/types';

const mockFindings: Finding[] = [
  {
    rule: 'hardcoded-secrets',
    message: 'Hardcoded API key detected',
    severity: 'high',
    file: '/test/file.js',
    line: 10,
    column: 5,
    snippet: 'const API_KEY = "secret123";',
    explanation: 'This is dangerous because...',
    fix: 'Use environment variables instead'
  },
  {
    rule: 'eval-usage',
    message: 'Dangerous eval() usage',
    severity: 'high',
    file: '/test/file2.js',
    line: 15,
    column: 3,
    snippet: 'eval(userInput);',
    explanation: 'Code injection vulnerability',
    fix: 'Use JSON.parse instead'
  },
  {
    rule: 'weak-crypto',
    message: 'Weak cryptographic algorithm detected',
    severity: 'medium',
    file: '/test/crypto.js',
    line: 20,
    column: 1,
    snippet: 'md5(password)',
    explanation: 'MD5 is broken',
    fix: 'Use bcrypt'
  },
  {
    rule: 'cookie-security',
    message: 'Cookie without httpOnly flag',
    severity: 'low',
    file: '/test/server.js',
    line: 8,
    column: 10,
    snippet: 'res.cookie("session", id)',
    explanation: 'XSS vulnerability',
    fix: 'Add httpOnly flag'
  }
];

describe('Output Formatters', () => {
  describe('Table Format', () => {
    it('should render findings as table', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'table',
        showSummary: true
      });

      expect(output).toContain('Severity');
      expect(output).toContain('Rule');
      expect(output).toContain('File');
      expect(output).toContain('hardcoded-secrets');
      expect(output).toContain('eval-usage');
      expect(output).toContain('Summary:');
      expect(output).toContain('Files scanned: 4');
      expect(output).toContain('Duration: 100ms');
    });

    it('should show success message when no findings', () => {
      const output = render([], 10, 50, {
        format: 'table',
        showSummary: true
      });

      expect(output).toContain('No security issues found');
    });

    it('should include explanations when requested', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'table',
        showSummary: true,
        showExplanations: true
      });

      expect(output).toContain('DETAILED FINDINGS');
      expect(output).toContain('This is dangerous because');
    });

    it('should include fixes when requested', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'table',
        showSummary: true,
        showFixes: true
      });

      expect(output).toContain('DETAILED FINDINGS');
      expect(output).toContain('Use environment variables instead');
    });

    it('should count findings by severity', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'table',
        showSummary: true
      });

      expect(output).toContain('High: 2');
      expect(output).toContain('Medium: 1');
      expect(output).toContain('Low: 1');
      expect(output).toContain('Total: 4');
    });
  });

  describe('JSON Format', () => {
    it('should render findings as JSON', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'json'
      });

      const parsed = JSON.parse(output);
      expect(parsed.findings).toHaveLength(4);
      expect(parsed.filesScanned).toBe(4);
      expect(parsed.duration).toBe(100);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should include all finding details in JSON', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'json'
      });

      const parsed = JSON.parse(output);
      expect(parsed.findings[0].rule).toBe('hardcoded-secrets');
      expect(parsed.findings[0].severity).toBe('high');
      expect(parsed.findings[0].file).toBe('/test/file.js');
      expect(parsed.findings[0].line).toBe(10);
      expect(parsed.findings[0].explanation).toBe('This is dangerous because...');
      expect(parsed.findings[0].fix).toBe('Use environment variables instead');
    });

    it('should render detailed JSON when requested', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'json',
        detailed: true
      });

      const parsed = JSON.parse(output);
      expect(parsed.total).toBe(4);
      expect(parsed.byRule).toBeDefined();
      expect(parsed.bySeverity).toBeDefined();
      expect(parsed.bySeverity.high).toHaveLength(2);
      expect(parsed.bySeverity.medium).toHaveLength(1);
      expect(parsed.bySeverity.low).toHaveLength(1);
    });
  });

  describe('Markdown Format', () => {
    it('should render findings as markdown', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'markdown'
      });

      expect(output).toContain('# Scry Security Scan Report');
      expect(output).toContain('## Summary');
      expect(output).toContain('Files Scanned:** 4');
      expect(output).toContain('Duration:** 100ms');
      expect(output).toContain('Total Issues:** 4');
      expect(output).toContain('## Findings');
    });

    it('should group findings by severity in markdown', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'markdown'
      });

      expect(output).toContain('### 🔴 High Severity');
      expect(output).toContain('### 🟡 Medium Severity');
      expect(output).toContain('### 🔵 Low Severity');
    });

    it('should create markdown tables for findings', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'markdown'
      });

      expect(output).toContain('| Rule | File | Line | Message |');
      expect(output).toContain('|------|------|------|--------|');
      expect(output).toContain('`hardcoded-secrets`');
    });

    it('should render detailed markdown with explanations', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'markdown',
        showExplanations: true
      });

      expect(output).toContain('# Scry Security Scan - Detailed Report');
      expect(output).toContain('**Explanation:**');
      expect(output).toContain('This is dangerous because');
    });

    it('should show success message in markdown when no findings', () => {
      const output = render([], 10, 50, {
        format: 'markdown'
      });

      expect(output).toContain('**No security issues found!**');
    });
  });

  describe('Compact Format', () => {
    it('should render findings in compact format', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'compact'
      });

      expect(output).toContain('/test/file.js');
      expect(output).toContain('hardcoded-secrets');
      expect(output).toContain('HIGH');
      expect(output).toContain('L10');
    });

    it('should group findings by file in compact format', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'compact'
      });

      expect(output).toContain('/test/file.js');
      expect(output).toContain('/test/file2.js');
      expect(output).toContain('/test/crypto.js');
      expect(output).toContain('/test/server.js');
    });

    it('should show summary footer in compact format', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'compact'
      });

      expect(output).toContain('2 high');
      expect(output).toContain('1 medium');
      expect(output).toContain('1 low');
      expect(output).toContain('4 files');
      expect(output).toContain('100ms');
    });

    it('should show success message in compact format when no findings', () => {
      const output = render([], 10, 50, {
        format: 'compact'
      });

      expect(output).toContain('No issues found');
      expect(output).toContain('10 files');
      expect(output).toContain('50ms');
    });
  });

  describe('Format Fallback', () => {
    it('should default to table format for invalid format', () => {
      const output = render(mockFindings, 4, 100, {
        format: 'invalid' as any,
        showSummary: true
      });

      expect(output).toContain('Severity');
      expect(output).toContain('Rule');
      expect(output).toContain('Summary:');
    });
  });
});
