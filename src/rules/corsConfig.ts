/**
 * CORS Configuration Rule
 * Detects overly permissive CORS configurations
 */

import { BaseRule } from './base';
import type { Finding } from '../types';

export class CORSConfigRule extends BaseRule {
  override id = 'cors-config';
  override name = 'CORS Misconfiguration';
  override description = 'Detects overly permissive CORS configurations';
  override severity: 'medium' = 'medium';
  override tags = ['security', 'cors', 'web'];

  private patterns = [
    {
      name: 'Wildcard CORS',
      pattern: /(?:Access-Control-Allow-Origin|origin)\s*[:=]\s*['"`]\*['"`]/gi,
      severity: 'high' as const,
      message: 'Wildcard (*) CORS origin allows any website to access your API'
    },
    {
      name: 'CORS with credentials and wildcard',
      pattern: /Access-Control-Allow-Credentials\s*[:=]\s*['"`]?true['"`]?/gi,
      severity: 'high' as const,
      message: 'CORS credentials enabled - check if wildcard origin is used',
      needsSecondCheck: true
    },
    {
      name: 'Reflected origin without validation',
      pattern: /(?:Access-Control-Allow-Origin|setHeader\s*\(\s*['"`]Access-Control-Allow-Origin['"`])\s*[,:]\s*(?:req\.headers?\.origin|origin)/gi,
      severity: 'high' as const,
      message: 'CORS origin reflects request origin without validation'
    },
    {
      name: 'Express CORS wildcard',
      pattern: /cors\s*\(\s*\{\s*origin\s*:\s*['"`]\*['"`]/gi,
      severity: 'high' as const,
      message: 'Express CORS configured with wildcard origin'
    },
    {
      name: 'Express CORS permissive function',
      pattern: /cors\s*\(\s*\{\s*origin\s*:\s*(?:function|=>|\([^)]*\)\s*=>)[^}]*return\s+true/gi,
      severity: 'medium' as const,
      message: 'CORS origin function always returns true'
    },
    {
      name: 'Null origin allowed',
      pattern: /(?:Access-Control-Allow-Origin|origin)\s*[:=]\s*['"`]null['"`]/gi,
      severity: 'medium' as const,
      message: 'CORS allows null origin (exploitable via sandboxed iframes)'
    }
  ];

  override async check(content: string, filePath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Only check JavaScript/TypeScript files
    if (!/\.(js|ts|jsx|tsx)$/.test(filePath)) {
      return findings;
    }

    let hasWildcardOrigin = false;
    let hasCredentialsTrue = false;
    const credentialsLocations: number[] = [];

    for (const patternConfig of this.patterns) {
      let match;
      const pattern = patternConfig.pattern;

      // Reset regex if global flag
      if (pattern.global) {
        pattern.lastIndex = 0;
      }

      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);

        // Skip if in comment
        const lineStart = content.lastIndexOf('\n', match.index) + 1;
        const lineContent = content.substring(lineStart, match.index);
        if (lineContent.includes('//') || lineContent.includes('/*')) {
          continue;
        }

        // Track wildcard and credentials for combined check
        if (patternConfig.name === 'Wildcard CORS') {
          hasWildcardOrigin = true;
        }

        if (patternConfig.name === 'CORS with credentials and wildcard') {
          hasCredentialsTrue = true;
          credentialsLocations.push(lineNumber);
          continue; // Don't report yet, check with wildcard first
        }

        findings.push(
          this.createFinding(
            patternConfig.message,
            content,
            filePath,
            lineNumber,
            this.getExplanation(patternConfig.name),
            this.getFix(patternConfig.name)
          )
        );
      }
    }

    // Check for dangerous combination: wildcard + credentials
    if (hasWildcardOrigin && hasCredentialsTrue) {
      for (const line of credentialsLocations) {
        findings.push(
          this.createFinding(
            'CRITICAL: CORS with credentials and wildcard origin (browsers will block this)',
            content,
            filePath,
            line,
            `Setting Access-Control-Allow-Credentials to true with a wildcard (*) origin is blocked by browsers as it's extremely dangerous. This combination would allow any website to make authenticated requests to your API.`,
            `Remove wildcard origin and specify exact origins:

// ❌ BLOCKED by browsers
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Credentials', 'true');

// ✅ Secure configuration
const allowedOrigins = ['https://yourdomain.com', 'https://app.yourdomain.com'];
const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}`
          )
        );
      }
    }

    return findings;
  }

  private getExplanation(patternName: string): string {
    switch (patternName) {
      case 'Wildcard CORS':
        return `Setting Access-Control-Allow-Origin to '*' allows ANY website to make requests to your API. This means:
- Any malicious website can read your API responses
- If your API relies on cookies or authentication, data can be stolen
- Attackers can bypass same-origin policy protections

This is especially dangerous for authenticated APIs or APIs containing sensitive data.`;

      case 'Reflected origin without validation':
        return `Reflecting the request Origin header without validation is equivalent to wildcard CORS. An attacker can set any origin in their request and your server will allow it.

This defeats the purpose of CORS protection entirely and allows any website to access your API.`;

      case 'Express CORS wildcard':
        return `The Express cors middleware configured with origin: '*' allows any website to access your API endpoints. This bypasses browser same-origin protections.

For authenticated APIs or sensitive data, this can lead to data theft and unauthorized access.`;

      case 'Express CORS permissive function':
        return `A CORS origin function that always returns true is equivalent to wildcard CORS. Every origin will be allowed, defeating CORS protections.

The origin validation function should implement a whitelist of allowed domains.`;

      case 'Null origin allowed':
        return `Allowing the 'null' origin is dangerous because:
- Sandboxed iframes automatically have a 'null' origin
- Attackers can craft requests with null origin
- This is often exploited in CORS attacks

The null origin should be explicitly rejected in most cases.`;

      default:
        return `Overly permissive CORS configuration can allow unauthorized websites to access your API and steal sensitive data.`;
    }
  }

  private getFix(patternName: string): string {
    switch (patternName) {
      case 'Wildcard CORS':
      case 'Reflected origin without validation':
        return `Use a whitelist of allowed origins:

// ✅ Secure: Whitelist specific origins
const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com'
];

const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
} else {
  // Optionally log rejected origins
  console.warn(\`Rejected CORS origin: \${origin}\`);
}

// Or with environment-based config:
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];`;

      case 'Express CORS wildcard':
        return `Configure Express CORS with a whitelist:

// ✅ Secure: Whitelist specific origins
const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Only if needed
}));

// Or simpler:
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));`;

      case 'Express CORS permissive function':
        return `Implement proper origin validation:

// ❌ Insecure: Always returns true
app.use(cors({
  origin: function (origin, callback) {
    return callback(null, true); // BAD
  }
}));

// ✅ Secure: Validate against whitelist
const allowedOrigins = ['https://yourdomain.com', 'https://app.yourdomain.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));`;

      case 'Null origin allowed':
        return `Reject null origins explicitly:

// ✅ Secure: Reject null origin
const allowedOrigins = ['https://yourdomain.com', 'https://app.yourdomain.com'];

const origin = req.headers.origin;
if (origin && origin !== 'null' && allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}

// For Express cors:
app.use(cors({
  origin: function (origin, callback) {
    if (origin === 'null') {
      callback(new Error('Null origin not allowed'));
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));`;

      default:
        return `Configure CORS with a specific whitelist of allowed origins instead of using wildcards or permissive patterns.`;
    }
  }
}
