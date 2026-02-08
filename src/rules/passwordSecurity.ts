import { BaseRule } from './base';
import type { Finding } from '../types';

export class PasswordSecurityRule extends BaseRule {
  override id = 'password-security';
  override name = 'Password Security';
  override description = 'Detects insecure password handling and validation practices';
  override severity: 'high' = 'high';
  override tags = ['security', 'passwords', 'authentication'];

  private patterns = [
    {
      name: 'Plaintext password storage',
      pattern:
        /(?:password|passwd|pwd)\s*[=:]\s*['"`][^'"`]+['"`]|\.password\s*=|database\.insert\s*\([^)]*password[^)]*\)/gi,
      severity: 'high' as const,
      message: 'Password appears to be stored or transmitted in plaintext',
      category: 'storage',
      needsContext: true,
    },
    {
      name: 'Password in URL',
      pattern: /(?:https?|ftp):\/\/[^:]+:([^@\s]+)@/gi,
      severity: 'high' as const,
      message: 'Password in URL (credentials should not be in URLs)',
      category: 'url',
    },
    {
      name: 'Password logging',
      pattern:
        /(?:console\.log|logger\.(?:info|debug|warn|error))\s*\([^)]*(?:password|passwd|pwd)[^)]*\)/gi,
      severity: 'high' as const,
      message: 'Password may be logged (never log passwords)',
      category: 'logging',
    },
    {
      name: 'Weak password validation',
      pattern: /password\.length\s*[<>=!]+\s*[1-7]\b/gi,
      severity: 'medium' as const,
      message: 'Password length requirement is too short (minimum 8 characters)',
      category: 'validation',
    },
    {
      name: 'No password validation',
      pattern:
        /(?:function|const|let|var)\s+(?:validate|check|verify)Password\s*[=\(][^{]*\{\s*return\s+true\s*;?\s*\}/gi,
      severity: 'high' as const,
      message: 'Password validation function always returns true',
      category: 'validation',
    },
    {
      name: 'Password in GET request',
      pattern: /(?:axios|fetch|request)\.get\s*\([^)]*[?&](?:password|passwd|pwd)=/gi,
      severity: 'high' as const,
      message: 'Password sent via GET request (use POST with body)',
      category: 'transmission',
    },
    {
      name: 'Password in query string',
      pattern: /(?:query|params|searchParams)\s*=\s*[^;]*[?&](?:password|passwd|pwd)=/gi,
      severity: 'high' as const,
      message: 'Password in query string (passwords should be in request body)',
      category: 'transmission',
    },
    {
      name: 'Password comparison without timing safety',
      pattern: /password\s*[!=]==?\s*\S+|\S+\s*[!=]==?\s*password\b/gi,
      severity: 'medium' as const,
      message: 'Direct password comparison (vulnerable to timing attacks)',
      category: 'comparison',
      needsContext: true,
    },
    {
      name: 'Missing password complexity',
      pattern: /\/\^[^$]*\$\/\.test\s*\(\s*password\s*\)/gi,
      severity: 'low' as const,
      message: 'Check if password regex enforces sufficient complexity',
      category: 'validation',
      isLowRisk: true,
    },
    {
      name: 'Password in localStorage',
      pattern: /localStorage\.(?:setItem|set)\s*\([^)]*(?:password|passwd|pwd)[^)]*\)/gi,
      severity: 'high' as const,
      message: 'Password stored in localStorage (never store passwords in browser storage)',
      category: 'storage',
    },
    {
      name: 'Password in sessionStorage',
      pattern: /sessionStorage\.(?:setItem|set)\s*\([^)]*(?:password|passwd|pwd)[^)]*\)/gi,
      severity: 'high' as const,
      message: 'Password stored in sessionStorage (never store passwords in browser storage)',
      category: 'storage',
    },
    {
      name: 'Password in cookies without secure flags',
      pattern:
        /(?:document\.cookie|res\.cookie)\s*[=\(][^;)]*(?:password|passwd|pwd)[^;)]*(?!.*httpOnly)(?!.*secure)/gi,
      severity: 'high' as const,
      message: 'Password in cookie without secure/httpOnly flags',
      category: 'storage',
    },
    {
      name: 'Hardcoded default password',
      pattern:
        /(?:default|initial|temp|temporary)(?:Password|Passwd|Pwd)\s*[=:]\s*['"`][^'"`]+['"`]/gi,
      severity: 'high' as const,
      message: 'Hardcoded default password (security risk)',
      category: 'hardcoded',
    },
    {
      name: 'Password sent over HTTP',
      pattern: /http:\/\/[^\/]+\/[^\s]*(?:login|auth|signin|password)/gi,
      severity: 'high' as const,
      message: 'Authentication endpoint uses HTTP instead of HTTPS',
      category: 'transmission',
    },
    {
      name: 'Password autocomplete enabled',
      pattern: /type=['"]password['"][^>]*autocomplete=['"](?:on|true)['"]/gi,
      severity: 'low' as const,
      message: 'Password field has autocomplete enabled explicitly',
      category: 'ui',
      isLowRisk: true,
    },
  ];

  override async check(content: string, filePath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Only check relevant file types
    if (!/\.(js|ts|jsx|tsx|vue|svelte|html|mjs|cjs)$/.test(filePath)) {
      return findings;
    }

    for (const patternConfig of this.patterns) {
      // Create a fresh regex instance to avoid state issues
      const pattern = this.createRegex(patternConfig.pattern);

      // Use timeout-protected execution for safety
      const matches = this.execWithTimeout(pattern, content);

      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index);

        // Skip if in comment using robust detection from base class
        if (this.isInComment(content, match.index)) {
          continue;
        }

        // Skip test files for some low-risk patterns
        if (patternConfig.isLowRisk && /\.(test|spec|mock)\.(js|ts|jsx|tsx)$/.test(filePath)) {
          continue;
        }

        // Context-aware checking for plaintext storage
        if (patternConfig.needsContext && patternConfig.category === 'storage') {
          // Check if password is being hashed
          const contextBefore = content.substring(Math.max(0, match.index - 200), match.index);
          const contextAfter = content.substring(
            match.index,
            Math.min(content.length, match.index + 200)
          );
          const fullContext = contextBefore + contextAfter;

          // Skip if hashing/encryption is present
          const secureKeywords = [
            'hash',
            'bcrypt',
            'scrypt',
            'argon2',
            'encrypt',
            'crypto',
            'pbkdf2',
          ];
          const hasSecureHandling = secureKeywords.some((keyword) =>
            fullContext.toLowerCase().includes(keyword)
          );

          if (hasSecureHandling) {
            continue;
          }
        }

        // Context-aware checking for password comparison
        if (patternConfig.needsContext && patternConfig.category === 'comparison') {
          const contextWindow = content.substring(
            Math.max(0, match.index - 100),
            Math.min(content.length, match.index + 100)
          );

          // Skip if using secure comparison methods
          const secureComparison = [
            'bcrypt.compare',
            'crypto.timingSafeEqual',
            'verify',
            'compareSync',
          ];
          const hasSecureComparison = secureComparison.some((method) =>
            contextWindow.includes(method)
          );

          if (hasSecureComparison) {
            continue;
          }

          // Skip if comparing hashed passwords
          if (contextWindow.includes('hash') || contextWindow.includes('Hash')) {
            continue;
          }
        }

        findings.push(
          this.createFinding(
            patternConfig.message,
            content,
            filePath,
            lineNumber,
            this.getExplanation(patternConfig.category),
            this.getFix(patternConfig.category)
          )
        );
      }
    }

    return findings;
  }

  private getExplanation(category: string): string {
    switch (category) {
      case 'storage':
        return `Storing passwords in plaintext is one of the most dangerous security vulnerabilities:

- **Data breach exposure**: If your database or storage is compromised, all passwords are immediately exposed
- **Compliance violations**: Violates GDPR, PCI-DSS, HIPAA, and most security standards
- **Cascading breaches**: Users often reuse passwords across services
- **Legal liability**: Organizations can be held liable for not protecting user credentials
- **No recovery**: Once plaintext passwords are exposed, damage cannot be undone

Passwords must ALWAYS be hashed with a secure algorithm (bcrypt, Argon2, scrypt) before storage.`;

      case 'logging':
        return `Logging passwords is extremely dangerous:

- **Log files persist**: Logs are stored, backed up, and often retained long-term
- **Wide access**: Many people have access to logs (developers, ops, security, third parties)
- **Log aggregation**: Logs are often sent to external services (Splunk, DataDog, etc.)
- **Compliance violations**: Logging passwords violates most security standards
- **Accidental exposure**: Log files are often less secured than databases

Never log passwords, even in development or debugging. Use placeholder values instead.`;

      case 'transmission':
        return `Sending passwords insecurely exposes them to interception:

- **Network sniffing**: Unencrypted traffic can be intercepted on the network
- **Proxy/gateway logs**: GET parameters are often logged by proxies and gateways
- **Browser history**: URLs with passwords appear in browser history
- **Referrer headers**: Query strings can leak via Referer headers to third parties
- **Server logs**: URLs with passwords are logged by web servers

Always use POST requests with HTTPS and send passwords in the request body, never in URLs.`;

      case 'url':
        return `Passwords in URLs are extremely insecure:

- **Browser history**: URLs are stored in browser history files
- **Referrer leakage**: URLs can leak to third-party sites via Referer header
- **Server logs**: Most web servers log full URLs including credentials
- **Bookmark sharing**: Users may share/bookmark URLs with embedded credentials
- **Shoulder surfing**: Credentials are visible in the address bar
- **Copy-paste risks**: Easy to accidentally paste credentials

Use proper authentication mechanisms (headers, cookies) instead of credentials in URLs.`;

      case 'validation':
        return `Weak password validation allows users to choose insecure passwords:

- **Brute force attacks**: Short passwords can be cracked in seconds
- **Dictionary attacks**: Simple passwords are vulnerable to dictionary attacks
- **Credential stuffing**: Weak passwords are often reused and compromised elsewhere
- **NIST guidelines**: NIST recommends minimum 8 characters, 12+ for better security
- **Complexity helps**: Requiring mixed case, numbers, and symbols increases entropy

Enforce strong password requirements: minimum length 8-12 characters, consider complexity rules.`;

      case 'comparison':
        return `Direct string comparison of passwords is vulnerable to timing attacks:

- **Timing side-channel**: Comparison stops at first different character
- **Measurable difference**: Attacker can measure response time differences
- **Character-by-character attack**: Each character can be guessed individually
- **Millisecond precision**: Modern tools can detect microsecond timing differences
- **Remote exploitation**: Timing attacks can work over networks with sufficient samples

Use constant-time comparison functions (crypto.timingSafeEqual) or password hashing libraries that include safe comparison (bcrypt.compare).`;

      case 'hardcoded':
        return `Hardcoded default passwords are a critical security vulnerability:

- **Publicly visible**: Source code is often visible (version control, decompilation, insider threats)
- **Widely exploited**: Default credentials are first thing attackers try
- **Difficult to change**: Changing hardcoded values requires code updates
- **Compliance violations**: Most security standards prohibit default passwords
- **Privilege escalation**: Default admin passwords are prime targets

Never hardcode passwords. Use environment variables, secure vaults, or generate random passwords on first run.`;

      case 'ui':
        return `Password field autocomplete can pose security risks in shared environments:

- **Shared devices**: Autocomplete stores passwords on shared computers
- **Shoulder surfing**: Autocompleted passwords can be visible when selected
- **Autofill vulnerabilities**: Some autofill implementations have had security issues
- **Context matters**: Risk depends on application type (banking vs. personal blog)

For sensitive applications, consider disabling autocomplete. For normal applications, modern browser password managers are generally secure.`;

      default:
        return 'Insecure password handling practices can lead to credential theft, data breaches, and unauthorized access to user accounts.';
    }
  }

  private getFix(category: string): string {
    switch (category) {
      case 'storage':
        return `Never store passwords in plaintext - always hash them:

// [BAD] NEVER: Plaintext password storage
const user = {
  username: 'alice',
  password: 'secret123' // NEVER DO THIS
};
await db.users.insert(user);

// [GOOD] CORRECT: Hash passwords before storage
const bcrypt = require('bcrypt');

// When creating/updating password:
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

const user = {
  username: 'alice',
  passwordHash: hashedPassword  // Store hash, not password
};
await db.users.insert(user);

// When verifying password:
const user = await db.users.findOne({ username: 'alice' });
const isValid = await bcrypt.compare(plainPassword, user.passwordHash);

if (isValid) {
  // Password is correct
}

// [GOOD] Alternative: Argon2 (even better)
const argon2 = require('argon2');

const hash = await argon2.hash(plainPassword);
const isValid = await argon2.verify(hash, plainPassword);

// [GOOD] Alternative: scrypt (built into Node.js crypto)
const crypto = require('crypto');

const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(plainPassword, salt, 64);

// Store both salt and hash
await db.users.insert({
  username: 'alice',
  passwordSalt: salt.toString('hex'),
  passwordHash: hash.toString('hex')
});`;

      case 'logging':
        return `Never log passwords - redact or omit them:

// [BAD] NEVER: Logging passwords
console.log('User login:', username, password);
logger.info({ username, password });

// [GOOD] CORRECT: Omit password from logs
console.log('User login:', username);
logger.info({ username, action: 'login' });

// [GOOD] CORRECT: Redact sensitive fields
function sanitizeForLogging(obj) {
  const sanitized = { ...obj };
  const sensitiveFields = ['password', 'passwd', 'pwd', 'token', 'secret'];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

logger.info(sanitizeForLogging(req.body));

// [GOOD] CORRECT: Use structured logging with field filtering
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format((info) => {
      // Remove password fields
      if (info.password) delete info.password;
      if (info.passwd) delete info.passwd;
      return info;
    })(),
    winston.format.json()
  )
});

// [GOOD] For debugging: Log that password was received
console.log('Password received:', password ? 'yes' : 'no');
console.log('Password length:', password?.length);`;

      case 'transmission':
        return `Always send passwords via POST with HTTPS, never in URLs or GET requests:

// [BAD] NEVER: Password in GET request
fetch(\`https://api.example.com/login?username=\${user}&password=\${pass}\`);

axios.get('/login', {
  params: { username: user, password: pass }
});

// [BAD] NEVER: Password in URL
window.location.href = \`/login?password=\${pass}\`;

// [GOOD] CORRECT: POST request with body
fetch('https://api.example.com/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: user,
    password: pass
  })
});

// [GOOD] CORRECT: Axios POST
axios.post('/login', {
  username: user,
  password: pass
});

// [GOOD] CORRECT: Fetch with FormData
const formData = new FormData();
formData.append('username', user);
formData.append('password', pass);

fetch('https://api.example.com/login', {
  method: 'POST',
  body: formData
});

// [GOOD] Server side: Ensure HTTPS is enforced
app.use((req, res, next) => {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
});`;

      case 'url':
        return `Never put credentials in URLs - use proper authentication:

// [BAD] NEVER: Credentials in URL
const url = 'https://user:password@api.example.com/data';
fetch(url);

// [GOOD] CORRECT: Use Authorization header
const auth = 'Basic ' + btoa(username + ':' + password);
fetch('https://api.example.com/data', {
  headers: {
    'Authorization': auth
  }
});

// [GOOD] BETTER: Use token-based authentication
// 1. Login to get token
const loginResponse = await fetch('https://api.example.com/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const { token } = await loginResponse.json();

// 2. Use token for subsequent requests
fetch('https://api.example.com/data', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
});

// [GOOD] BEST: OAuth 2.0 or OpenID Connect
// Use established authentication libraries:
// - passport.js (Node.js)
// - NextAuth (Next.js)
// - Auth0, Firebase Auth, AWS Cognito (managed services)

// [GOOD] For database connections: Use connection objects
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'username',
  password: process.env.DB_PASSWORD,  // From environment
  database: 'mydb'
});`;

      case 'validation':
        return `Enforce strong password requirements:

// [BAD] WEAK: Password too short
function validatePassword(password) {
  return password.length >= 6;  // Too short!
}

// [BAD] WEAK: No validation at all
function validatePassword(password) {
  return true;  // Accepts anything!
}

// [GOOD] GOOD: Minimum 8 characters
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters' };
  }
  return { valid: true };
}

// [GOOD] BETTER: Length + complexity requirements
function validatePassword(password) {
  const minLength = 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(\`Minimum \${minLength} characters required\`);
  }
  if (!hasUpperCase) {
    errors.push('Requires at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Requires at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Requires at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Requires at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// [GOOD] BEST: Check against common passwords
const commonPasswords = require('common-passwords'); // Use a library

function validatePassword(password) {
  // Length check
  if (password.length < 12) {
    return { valid: false, reason: 'Password must be at least 12 characters' };
  }

  // Common password check
  if (commonPasswords.check(password)) {
    return { valid: false, reason: 'Password is too common' };
  }

  // Complexity check
  const hasMultipleCharTypes = 
    [/[A-Z]/, /[a-z]/, /\\d/, /[^A-Za-z0-9]/]
      .filter(regex => regex.test(password))
      .length >= 3;

  if (!hasMultipleCharTypes) {
    return { 
      valid: false, 
      reason: 'Password must contain at least 3 of: uppercase, lowercase, numbers, symbols' 
    };
  }

  return { valid: true };
}

// [GOOD] Consider using a library like zxcvbn for password strength estimation
const zxcvbn = require('zxcvbn');

function validatePassword(password) {
  const result = zxcvbn(password);
  
  if (result.score < 3) {  // 0-4 scale
    return {
      valid: false,
      reason: 'Password is too weak',
      suggestions: result.feedback.suggestions
    };
  }
  
  return { valid: true };
}`;

      case 'comparison':
        return `Use timing-safe password comparison methods:

// [BAD] VULNERABLE: Direct string comparison (timing attack)
if (password === storedPassword) {
  // Comparison time varies based on where strings differ
  login();
}

// [BAD] VULNERABLE: Direct comparison of hashes
if (hash(password) === storedHash) {
  // Still vulnerable to timing attacks
  login();
}

// [GOOD] CORRECT: Use bcrypt's built-in comparison
const bcrypt = require('bcrypt');

const isValid = await bcrypt.compare(password, storedPasswordHash);
// bcrypt.compare is timing-safe

if (isValid) {
  login();
}

// [GOOD] CORRECT: Use crypto.timingSafeEqual for custom comparisons
const crypto = require('crypto');

function timingSafeCompare(a, b) {
  // Convert strings to buffers of equal length
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  
  // Ensure equal length (important for timingSafeEqual)
  if (bufA.length !== bufB.length) {
    // Still do a comparison to avoid timing leak on length
    const dummyBuf = Buffer.alloc(bufA.length);
    crypto.timingSafeEqual(bufA, dummyBuf);
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// Usage:
if (timingSafeCompare(userInputHash, storedHash)) {
  login();
}

// [GOOD] BEST: Use password hashing library (handles timing safety)
const argon2 = require('argon2');

const isValid = await argon2.verify(storedHash, password);
// argon2.verify is timing-safe

if (isValid) {
  login();
}

// Note: For JWT verification, libraries handle timing safety:
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.verify(token, secret);
  // jwt.verify uses timing-safe comparison internally
} catch (err) {
  // Invalid token
}`;

      case 'hardcoded':
        return `Never hardcode passwords - use environment variables or secure vaults:

// [BAD] NEVER: Hardcoded passwords
const defaultPassword = 'admin123';
const DB_PASSWORD = 'mySecretPassword';

// [GOOD] CORRECT: Use environment variables
const defaultPassword = process.env.DEFAULT_PASSWORD;
const DB_PASSWORD = process.env.DB_PASSWORD;

// Load from .env file (never commit .env to git!)
require('dotenv').config();

// [GOOD] CORRECT: Generate random password on first run
const crypto = require('crypto');

function generateSecurePassword(length = 16) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

// On first initialization:
if (!process.env.ADMIN_PASSWORD) {
  const newPassword = generateSecurePassword(16);
  console.log('Generated admin password:', newPassword);
  console.log('Save this to your .env file: ADMIN_PASSWORD=' + newPassword);
  process.exit(1);
}

// [GOOD] BETTER: Use secret management services
// AWS Secrets Manager
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getPassword() {
  const data = await secretsManager.getSecretValue({
    SecretId: 'myapp/database/password'
  }).promise();
  
  return JSON.parse(data.SecretString).password;
}

// Azure Key Vault
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

const credential = new DefaultAzureCredential();
const client = new SecretClient('https://myvault.vault.azure.net', credential);

async function getPassword() {
  const secret = await client.getSecret('database-password');
  return secret.value;
}

// HashiCorp Vault
const vault = require('node-vault')({
  endpoint: 'http://127.0.0.1:8200',
  token: process.env.VAULT_TOKEN
});

async function getPassword() {
  const result = await vault.read('secret/data/database');
  return result.data.data.password;
}

// [GOOD] For development: Use .env with .env.example template
// .env.example (commit this):
DB_HOST=localhost
DB_USER=myuser
DB_PASSWORD=change-me-in-real-env

// .env (DO NOT commit - add to .gitignore):
DB_HOST=localhost
DB_USER=myuser
DB_PASSWORD=actual-secure-password-here`;

      case 'ui':
        return `Control password field autocomplete appropriately:

<!-- [BAD] Explicitly enabling autocomplete (usually unnecessary) -->
<input type="password" autocomplete="on" />

<!-- [GOOD] For sensitive apps: Disable autocomplete -->
<input 
  type="password" 
  autocomplete="off"
  name="password"
/>

<!-- [GOOD] For new passwords: Use autocomplete="new-password" -->
<input 
  type="password" 
  autocomplete="new-password"
  name="new-password"
/>

<!-- [GOOD] For current passwords: Use autocomplete="current-password" -->
<input 
  type="password" 
  autocomplete="current-password"
  name="current-password"
/>

<!-- [GOOD] Full login form with proper autocomplete -->
<form method="POST" action="/login">
  <input 
    type="text" 
    name="username"
    autocomplete="username"
  />
  <input 
    type="password" 
    name="password"
    autocomplete="current-password"
  />
  <button type="submit">Login</button>
</form>

<!-- [GOOD] Password change form -->
<form method="POST" action="/change-password">
  <input 
    type="password" 
    name="current-password"
    autocomplete="current-password"
  />
  <input 
    type="password" 
    name="new-password"
    autocomplete="new-password"
  />
  <input 
    type="password" 
    name="confirm-password"
    autocomplete="new-password"
  />
  <button type="submit">Change Password</button>
</form>

/* [GOOD] React example */
function LoginForm() {
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}`;

      default:
        return 'Follow security best practices: hash passwords with bcrypt/Argon2, transmit over HTTPS in POST body, never log passwords, enforce strong password requirements, use timing-safe comparisons.';
    }
  }
}
