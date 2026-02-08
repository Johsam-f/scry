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
      tags: this.tags,
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

  /**
   * Robust comment detection that properly handles strings and block comments
   * @param content - Full file content
   * @param index - Position to check
   * @returns true if position is inside a comment
   */
  protected isInComment(content: string, index: number): boolean {
    let inString = false;
    let stringChar = '';
    let inBlockComment = false;

    for (let i = 0; i < index; i++) {
      const char = content[i];
      const nextChar = content[i + 1];
      const prevChar = i > 0 ? content[i - 1] : '';

      // Handle string literals (check for non-escaped quotes)
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString && !inBlockComment) {
          inString = true;
          stringChar = char;
        } else if (inString && char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }

      // Skip everything inside strings
      if (inString) {
        continue;
      }

      // Handle block comments
      if (char === '/' && nextChar === '*' && !inBlockComment) {
        inBlockComment = true;
        i++; // Skip the *
        continue;
      }

      if (char === '*' && nextChar === '/' && inBlockComment) {
        inBlockComment = false;
        i++; // Skip the /
        continue;
      }

      // Handle single-line comments
      if (char === '/' && nextChar === '/' && !inBlockComment) {
        // Check if match is on the same line
        const lineEnd = content.indexOf('\n', i);
        if (lineEnd === -1 || index < lineEnd) {
          return true; // Match is on the same line as //
        }
      }
    }

    // Check if we're still inside a block comment
    return inBlockComment;
  }

  /**
   * Execute regex with timeout protection to prevent ReDoS attacks
   * @param pattern - Regex pattern to execute
   * @param content - Content to search
   * @param timeoutMs - Timeout in milliseconds (default: 5000)
   * @returns Array of matches or empty array if timeout
   */
  protected execWithTimeout(
    pattern: RegExp,
    content: string,
    timeoutMs: number = 5000
  ): RegExpExecArray[] {
    const matches: RegExpExecArray[] = [];
    const startTime = Date.now();
    const maxMatches = 10000; // Safety limit
    let match;
    let iterations = 0;

    // Limit content size to prevent DoS on very large files
    const maxContentLength = 10 * 1024 * 1024; // 10MB
    if (content.length > maxContentLength) {
      console.warn(
        `File too large (${content.length} bytes), truncating to ${maxContentLength} bytes`
      );
      content = content.substring(0, maxContentLength);
    }

    try {
      while ((match = pattern.exec(content)) !== null) {
        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
          console.warn(`Regex execution timeout after ${timeoutMs}ms, partial results returned`);
          break;
        }

        // Check iteration limit
        iterations++;
        if (iterations > maxMatches) {
          console.warn(`Regex match limit reached (${maxMatches}), partial results returned`);
          break;
        }

        matches.push(match);

        // Prevent infinite loops on zero-width matches
        if (match.index === pattern.lastIndex) {
          pattern.lastIndex++;
        }
      }
    } catch (error) {
      console.warn(
        `Regex execution error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return matches;
  }
}
