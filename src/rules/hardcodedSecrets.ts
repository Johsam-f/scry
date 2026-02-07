/**
 * Hardcoded Secrets Rule
 * Detects hardcoded API keys, tokens, and credentials
 */

import { BaseRule } from './base';
import type { Finding } from '../types';

export class HardcodedSecretsRule extends BaseRule {
  override id = 'hardcoded-secrets';
  override name = 'Hardcoded Secrets';
  override description = 'Detects hardcoded secrets, API keys, and credentials';
  override severity: 'high' = 'high';
  override tags = ['security', 'secrets'];

  private patterns = [
    {
      name: 'AWS Access Key',
      pattern: /AKIA[0-9A-Z]{16}/g,
      severity: 'high'
    },
    {
      name: 'Generic API Key',
      pattern:
        /['"](api[_-]?key|apikey)['"]\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
      severity: 'high'
    },
    {
      name: 'GitHub Token',
      // GitHub PATs: ghp_ prefix + 36-255 alphanumeric characters
      // Based on GitHub's token format specification
      pattern: /ghp_[a-zA-Z0-9]{36,255}/g,
      severity: 'high'
    },
    {
      name: 'GitHub Token (Legacy)',
      pattern: /\b[a-f0-9]{40}\b/g,
      severity: 'high'
    },
    {
      name: 'Private Key',
      pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
      severity: 'high'
    },
    {
      name: 'Generic Password',
      pattern:
        /(password|passwd|pwd)\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
      severity: 'medium'
    }
  ];

  override async check(content: string, filePath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    for (const patternConfig of this.patterns) {
      // Create a fresh regex instance to avoid state issues
      const pattern = this.createRegex(patternConfig.pattern);
      let match;

      while ((match = pattern.exec(content)) !== null) {
        // Skip if in comment
        const lineStart = content.lastIndexOf('\n', match.index) + 1;
        const lineContent = content.substring(lineStart, match.index);

        if (lineContent.includes('//') || lineContent.includes('/*')) {
          continue;
        }

        // Skip legacy GitHub tokens that might be Git commit SHAs
        // Look for context indicators that suggest it's a commit SHA
        if (patternConfig.name === 'GitHub Token (Legacy)') {
          const beforeMatch = content.substring(Math.max(0, match.index - 50), match.index);
          const afterMatch = content.substring(match.index, Math.min(content.length, match.index + 100));
          const context = beforeMatch + afterMatch;
          
          // Skip if it looks like a git commit reference
          if (
            /commit|sha|hash|revision|ref/i.test(context) ||
            /git|github\.com.*commit/i.test(context)
          ) {
            continue;
          }
        }

        const lineNumber = this.getLineNumber(content, match.index);

        findings.push(
          this.createFinding(
            `Hardcoded ${patternConfig.name} detected`,
            content,
            filePath,
            lineNumber,
            `Hardcoded secrets can be leaked via source control, logs, or decompiled code. This poses a significant security risk. These credentials can grant unauthorized access to your systems and data.`,
            `Move secrets to environment variables:
            1. Add to .env file (ensure .env is in .gitignore)
            2. Access via process.env.SECRET_NAME
            3. Use a secrets manager for production (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, etc.)

            Example:
            // [BAD] Before
            const API_KEY = "sk_live_1234567890abcdef";

            // [GOOD] After
            const API_KEY = process.env.API_KEY;`
          )
        );
      }
    }

    return findings;
  }
}
