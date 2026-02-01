// JWT Storage Rule
// Detects JWT tokens stored in localStorage/sessionStorage

import { BaseRule } from './base';
import type { Finding } from '../types';

export class JWTStorageRule extends BaseRule {
  override id = 'jwt-storage';
  override name = 'JWT in Client Storage';
  override description = 'Detects JWT tokens stored in localStorage or sessionStorage';
  override severity: 'high' = 'high';
  override tags = ['security', 'auth', 'storage'];

  private patterns = [
    {
      name: 'localStorage',
      pattern:
        /localStorage\s*\.\s*setItem\s*\(\s*['"](\w*token\w*|jwt|auth)['"]([^)]*)\)/gi
    },
    {
      name: 'sessionStorage',
      pattern:
        /sessionStorage\s*\.\s*setItem\s*\(\s*['"](\w*token\w*|jwt|auth)['"]([^)]*)\)/gi
    },
    {
      name: 'localStorage.getItem',
      pattern:
        /localStorage\s*\.\s*getItem\s*\(\s*['"](\w*token\w*|jwt|auth)['"][^)]*\)/gi
    },
    {
      name: 'sessionStorage.getItem',
      pattern:
        /sessionStorage\s*\.\s*getItem\s*\(\s*['"](\w*token\w*|jwt|auth)['"][^)]*\)/gi
    }
  ];

  override async check(content: string, filePath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Only check JavaScript/TypeScript files
    if (!/\.(js|ts|jsx|tsx)$/.test(filePath)) {
      return findings;
    }

    for (const patternConfig of this.patterns) {
      let match;
      const pattern = patternConfig.pattern;

      // Reset regex if global flag
      if (pattern.global) {
        pattern.lastIndex = 0;
      }

      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);

        findings.push(
          this.createFinding(
            `JWT token stored in ${patternConfig.name}`,
            content,
            filePath,
            lineNumber,
            `Storing JWT tokens in localStorage or sessionStorage is vulnerable to XSS attacks. JavaScript on the page can access these values, and if an attacker injects malicious scripts, they can steal the token. This allows attackers to impersonate users and access protected resources.`,
            `Use secure, httpOnly cookies instead:

            Backend (Express example):
            res.cookie('token', jwtToken, {
              httpOnly: true,   // Prevent JavaScript access
              secure: true,     // HTTPS only
              sameSite: 'strict' // CSRF protection
            });

            Frontend (React example):
            // Don't store token in localStorage
            // Cookies are automatically sent with requests
            // Access /api/user instead of reading token

            // For in-memory storage (SPA):
            let authToken = null;
            function setToken(token) {
              authToken = token;
            }
            function getToken() {
              return authToken;
            }`
          )
        );
      }
    }

    return findings;
  }
}
