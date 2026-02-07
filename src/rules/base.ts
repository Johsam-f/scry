// Base Rule class for all security rules
import type { Finding, Rule, Severity } from '../types';

export abstract class BaseRule implements Rule {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract severity: Severity;
  enabled: boolean = true;
  tags?: string[];

  // Main check method - must be implemented by each rule
  abstract check(content: string, filePath: string): Promise<Finding[]>;

  // Helper to create a finding
  protected createFinding(
    message: string,
    content: string,
    filePath: string,
    line: number,
    explanation: string,
    fix: string,
    column?: number
  ): Finding {
    const lines = content.split('\n');
    const snippet = lines[line - 1] || '';

    return {
      rule: this.id,
      severity: this.severity,
      file: filePath,
      line,
      column,
      message,
      snippet: snippet.trim(),
      explanation,
      fix,
      tags: this.tags
    };
  }

  // Helper to find line number from index
  protected getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  // Helper to get line content
  protected getLineContent(content: string, lineNumber: number): string {
    const lines = content.split('\n');
    return lines[lineNumber - 1] || '';
  }

  // Helper to create a fresh regex instance to avoid state issues
  protected createRegex(pattern: RegExp): RegExp {
    return new RegExp(pattern.source, pattern.flags);
  }
}
