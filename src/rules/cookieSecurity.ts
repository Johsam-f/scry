// Cookie Security Rule
// Detects missing HttpOnly and Secure flags in Set-Cookie headers

import { BaseRule } from './base';
import type { Finding } from '../types';

interface CookieFlags {
  hasHttpOnly: boolean;
  hasSecure: boolean;
  hasSameSite: boolean;
  cookieName: string;
  isClientSide?: boolean;
}

export class CookieSecurityRule extends BaseRule {
  override id = 'cookie-security';
  override name = 'Insecure Cookie Configuration';
  override description = 'Detects cookies set without HttpOnly and Secure flags';
  override severity: 'high' = 'high';
  override tags = ['security', 'cookies', 'auth'];

  private patterns = [
    {
      // Express res.cookie() without httpOnly or secure
      name: 'Express cookie',
      pattern:
        /res\.cookie\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^,)]+)(?:\s*,\s*\{([^}]*)\})?\s*\)/gi,
      checkFlags: (match: RegExpExecArray): CookieFlags => {
        const options = match[3] || '';
        return {
          hasHttpOnly: /httpOnly\s*:\s*true/i.test(options),
          hasSecure: /secure\s*:\s*true/i.test(options),
          hasSameSite: /sameSite\s*:\s*['"`]?(strict|lax)['"`]?/i.test(options),
          cookieName: match[1] || 'unknown',
        };
      },
    },
    {
      // Set-Cookie header (string)
      name: 'Set-Cookie header',
      pattern: /(?:setHeader|set)\s*\(\s*['"`]Set-Cookie['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/gi,
      checkFlags: (match: RegExpExecArray): CookieFlags => {
        const cookieValue = match[1] || '';
        return {
          hasHttpOnly: /;\s*HttpOnly/i.test(cookieValue),
          hasSecure: /;\s*Secure/i.test(cookieValue),
          hasSameSite: /;\s*SameSite=(Strict|Lax)/i.test(cookieValue),
          cookieName: cookieValue.split('=')[0] || 'unknown',
        };
      },
    },
    {
      // document.cookie (client-side)
      name: 'document.cookie',
      pattern: /document\.cookie\s*=\s*['"`]([^'"`]+)['"`]/gi,
      checkFlags: (match: RegExpExecArray): CookieFlags => {
        const cookieValue = match[1] || '';
        return {
          hasHttpOnly: false, // document.cookie can never set httpOnly
          hasSecure: /;\s*secure/i.test(cookieValue),
          hasSameSite: /;\s*SameSite=(Strict|Lax|None)/i.test(cookieValue),
          cookieName: cookieValue.split('=')[0] || 'unknown',
          isClientSide: true,
        };
      },
    },
    {
      // Koa ctx.cookies.set
      name: 'Koa cookie',
      pattern:
        /ctx\.cookies\.set\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^,)]+)(?:\s*,\s*\{([^}]*)\})?\s*\)/gi,
      checkFlags: (match: RegExpExecArray): CookieFlags => {
        const options = match[3] || '';
        return {
          hasHttpOnly: /httpOnly\s*:\s*true/i.test(options),
          hasSecure: /secure\s*:\s*true/i.test(options),
          hasSameSite: /sameSite\s*:\s*['"`]?(strict|lax)['"`]?/i.test(options),
          cookieName: match[1] || 'unknown',
        };
      },
    },
  ];

  override async check(content: string, filePath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Only check JavaScript/TypeScript files
    if (!/\.(js|ts|jsx|tsx)$/.test(filePath)) {
      return findings;
    }

    for (const patternConfig of this.patterns) {
      // Create a fresh regex instance to avoid state issues
      const pattern = this.createRegex(patternConfig.pattern);

      // Use timeout-protected execution for safety
      const matches = this.execWithTimeout(pattern, content);

      for (const match of matches) {
        // Skip if in comment
        if (this.isInComment(content, match.index)) {
          continue;
        }

        const flags = patternConfig.checkFlags(match);
        const lineNumber = this.getLineNumber(content, match.index);
        const missingFlags: string[] = [];

        if (!flags.hasHttpOnly && !flags.isClientSide) {
          missingFlags.push('HttpOnly');
        }
        if (!flags.hasSecure) {
          missingFlags.push('Secure');
        }

        // Only report if flags are missing
        if (missingFlags.length > 0) {
          const severity = this.getSeverity(flags);

          findings.push(
            this.createFinding(
              `Cookie '${flags.cookieName}' missing ${missingFlags.join(' and ')} flag${missingFlags.length > 1 ? 's' : ''}`,
              content,
              filePath,
              lineNumber,
              this.getExplanation(flags, flags.isClientSide || false),
              this.getFix(patternConfig.name, flags)
            )
          );
        }
      }
    }

    return findings;
  }

  private getSeverity(flags: CookieFlags): 'high' | 'medium' {
    // Missing both is critical/high
    if (!flags.hasHttpOnly && !flags.hasSecure) {
      return 'high';
    }
    // Missing only HttpOnly is high (for session cookies)
    if (!flags.hasHttpOnly) {
      return 'high';
    }
    // Missing only Secure is medium
    return 'medium';
  }

  private getExplanation(flags: CookieFlags, isClientSide: boolean = false): string {
    const missing: string[] = [];

    if (!flags.hasHttpOnly && !isClientSide) {
      missing.push(
        `**HttpOnly**: Without this flag, JavaScript can access the cookie via document.cookie, making it vulnerable to XSS attacks where attackers steal session tokens.`
      );
    }

    if (!flags.hasSecure) {
      missing.push(
        `**Secure**: Without this flag, the cookie can be transmitted over unencrypted HTTP connections, allowing attackers to intercept it via man-in-the-middle attacks.`
      );
    }

    if (isClientSide) {
      missing.push(
        `**Client-side cookie**: Setting cookies via document.cookie is inherently insecure as it cannot use HttpOnly protection. Use server-side cookie setting instead.`
      );
    }

    return `${missing.join('\n\n')}\n\nBoth flags are essential for protecting sensitive data like session tokens and authentication credentials.`;
  }

  private getFix(patternName: string, flags: CookieFlags): string {
    if (patternName === 'Express cookie' || patternName === 'Koa cookie') {
      return `Set cookies with proper security flags:

// [GOOD] Secure configuration
res.cookie('${flags.cookieName}', value, {
  httpOnly: true,    // Prevent JavaScript access (XSS protection)
  secure: true,      // HTTPS only (MITM protection)
  sameSite: 'strict' // CSRF protection
  maxAge: 3600000    // 1 hour expiry
});

// For production environments, add conditional secure flag:
res.cookie('${flags.cookieName}', value, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
});`;
    }

    if (patternName === 'Set-Cookie header') {
      return `Set the Set-Cookie header with proper flags:

// [GOOD] Secure configuration
res.setHeader('Set-Cookie', 
  '${flags.cookieName}=value; HttpOnly; Secure; SameSite=Strict; Max-Age=3600'
);

// Note: HttpOnly prevents JavaScript access, Secure requires HTTPS`;
    }

    if (patternName === 'document.cookie') {
      return `[WARNING] Avoid setting cookies client-side. Use server-side cookie setting instead:

// [BAD] Insecure (client-side)
document.cookie = '${flags.cookieName}=value';

// [GOOD] Secure (server-side - Express example)
// In your API endpoint:
res.cookie('${flags.cookieName}', value, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});

If you must use client-side cookies for non-sensitive data:
document.cookie = '${flags.cookieName}=value; Secure; SameSite=Strict';`;
    }

    return 'Set cookies with httpOnly and secure flags enabled.';
  }
}
