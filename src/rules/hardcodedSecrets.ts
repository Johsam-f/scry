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
      severity: 'high',
    },
    {
      name: 'Generic API Key',
      pattern: /['"](api[_-]?key|apikey)['"]\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
      severity: 'high',
    },
    {
      name: 'GitHub Token',
      // GitHub PATs: ghp_ prefix + 36-255 alphanumeric characters
      // Based on GitHub's token format specification
      pattern: /ghp_[a-zA-Z0-9]{36,255}/g,
      severity: 'high',
    },
    {
      name: 'GitHub Token (Legacy)',
      pattern: /\b[a-f0-9]{40}\b/g,
      severity: 'high',
    },
    {
      name: 'Private Key',
      pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
      severity: 'high',
    },
    {
      name: 'Generic Password',
      pattern: /(password|passwd|pwd)\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
      severity: 'medium',
    },
  ];

  override async check(content: string, filePath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    for (const patternConfig of this.patterns) {
      // Create a fresh regex instance to avoid state issues
      const pattern = this.createRegex(patternConfig.pattern);

      // Use timeout-protected execution for safety
      const matches = this.execWithTimeout(pattern, content);

      for (const match of matches) {
        // Skip if in comment using robust detection
        if (this.isInComment(content, match.index)) {
          continue;
        }

        // Skip legacy GitHub tokens that might be Git commit SHAs or other hex values
        // Legacy GitHub tokens (40 hex chars) have high false positive rate
        if (patternConfig.name === 'GitHub Token (Legacy)') {
          const beforeMatch = content.substring(Math.max(0, match.index - 80), match.index);
          const afterMatch = content.substring(
            match.index,
            Math.min(content.length, match.index + 120)
          );
          const context = beforeMatch + afterMatch;
          const matchValue = match[0];

          // Skip if it's likely NOT a secret based on context indicators:

          // 1. Git/VCS related (must be specific to avoid false negatives)
          if (
            /\b(commit|sha|revision|ref)\b/i.test(context) ||
            /git\s+(commit|sha|log|rev-parse)/i.test(context) ||
            /github\.com\/[^\/]+\/[^\/]+\/(commit|tree)\//i.test(context) ||
            /gitlab|bitbucket.*commit/i.test(context) ||
            /submodule|checkout|branch|tag/i.test(context)
          ) {
            continue;
          }

          // 2. File/content hashes
          if (
            /\b(checksum|hash|digest|fingerprint|etag)\b/i.test(context) ||
            /\b(md5|sha1|sha256|sha512)\b/i.test(context) ||
            /(file|build|content|data).{0,10}(hash|checksum)/i.test(context)
          ) {
            continue;
          }

          // 3. Database/Record IDs
          if (
            /\b(_id|objectid|recordid|uuid|guid)\b/i.test(context) ||
            /\b(database|mongo|dynamodb).{0,20}id/i.test(context)
          ) {
            continue;
          }

          // 4. Build artifacts and version identifiers
          if (
            /\b(version|build|artifact|bundle|dist)\b.{0,10}:/i.test(context) ||
            /\.(js|css|html|map)['"]?\s*:\s*['"]?[a-f0-9]{40}/i.test(context)
          ) {
            continue;
          }

          // 5. Hex strings that are clearly just data (repeated patterns suggest test/dummy data)
          // Check for patterns like '1111...', '0000...', 'aaaa...', 'ffff...'
          if (/^(.)\1{39}$/.test(matchValue)) {
            continue;
          }

          // 6. Variable names clearly indicating non-secret usage
          // Look for specific patterns in the immediate context before the hex value
          const immediateContext = beforeMatch.slice(-40);
          if (/\b(checksum|filehash|contenthash|objectid|recordid)\b/i.test(immediateContext)) {
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
