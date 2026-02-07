/**
 * Weak Cryptography Rule
 * Detects use of weak/broken cryptographic algorithms
 */

import { BaseRule } from './base';
import type { Finding } from '../types';

export class WeakCryptoRule extends BaseRule {
  override id = 'weak-crypto';
  override name = 'Weak Cryptography';
  override description = 'Detects use of weak or broken cryptographic algorithms';
  override severity: 'high' = 'high';
  override tags = ['security', 'cryptography', 'hashing'];

  private patterns = [
    {
      name: 'MD5 usage',
      pattern: /createHash\s*\(\s*['"`]md5['"`]\s*\)|\.update\(['"`]md5['"`]\)|md5\s*\(/gi,
      severity: 'high' as const,
      message: 'MD5 is cryptographically broken and should not be used',
      algorithm: 'MD5'
    },
    {
      name: 'SHA1 usage',
      pattern: /createHash\s*\(\s*['"`]sha1['"`]\s*\)|sha1\s*\(/gi,
      severity: 'high' as const,
      message: 'SHA1 is cryptographically weak and should not be used',
      algorithm: 'SHA1'
    },
    {
      name: 'DES/3DES encryption',
      pattern: /createCipher(?:iv)?\s*\(\s*['"`](?:des|des-ede|des-ede3|des3)['"`]/gi,
      severity: 'high' as const,
      message: 'DES/3DES encryption is obsolete and insecure',
      algorithm: 'DES'
    },
    {
      name: 'ECB mode',
      pattern: /createCipher(?:iv)?\s*\(\s*['"`][^'"`]*-ecb[^'"`]*['"`]/gi,
      severity: 'high' as const,
      message: 'ECB mode is insecure (leaks patterns in encrypted data)',
      algorithm: 'ECB'
    },
    {
      name: 'Weak random - Math.random()',
      pattern: /Math\.random\s*\(\s*\)/g,
      severity: 'medium' as const,
      message: 'Math.random() is not cryptographically secure',
      algorithm: 'Math.random',
      needsContext: true
    },
    {
      name: 'Unsalted hash',
      pattern: /(?:createHash|bcrypt|scrypt)\s*\([^)]*\)\.update\s*\(\s*password\s*\)\.digest/gi,
      severity: 'high' as const,
      message: 'Password hashing without salt is vulnerable to rainbow tables',
      algorithm: 'unsalted'
    },
    {
      name: 'Low bcrypt rounds',
      pattern: /bcrypt\.hash(?:Sync)?\s*\([^,]+,\s*([0-9]+)/gi,
      severity: 'medium' as const,
      message: 'Bcrypt rounds may be too low (check value)',
      algorithm: 'bcrypt',
      checkRounds: true
    },
    {
      name: 'Weak PBKDF2 iterations',
      pattern: /pbkdf2(?:Sync)?\s*\([^,]+,[^,]+,\s*([0-9]+)/gi,
      severity: 'medium' as const,
      message: 'PBKDF2 iterations may be too low (check value)',
      algorithm: 'pbkdf2',
      checkIterations: true
    },
    {
      name: 'Hardcoded IV/Salt',
      pattern: /(?:const|let|var)\s+(?:iv|salt)\s*=\s*['"`][a-fA-F0-9]{16,}['"`]/gi,
      severity: 'high' as const,
      message: 'Hardcoded IV or salt defeats encryption security',
      algorithm: 'hardcoded-iv'
    }
  ];

  override async check(content: string, filePath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Only check JavaScript/TypeScript files
    if (!/\.(js|ts|jsx|tsx|mjs|cjs)$/.test(filePath)) {
      return findings;
    }

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

        const lineNumber = this.getLineNumber(content, match.index);

        // Special handling for Math.random() - only flag in security contexts
        if (patternConfig.needsContext) {
          const contextWindow = content.substring(Math.max(0, match.index - 100), match.index + 100).toLowerCase();
          const securityKeywords = ['password', 'token', 'secret', 'key', 'salt', 'nonce', 'iv', 'crypto', 'session', 'auth'];
          const hasSecurityContext = securityKeywords.some(keyword => contextWindow.includes(keyword));
          
          if (!hasSecurityContext) {
            continue; // Skip if not in security context
          }
        }

        // Check bcrypt rounds
        if (patternConfig.checkRounds && match[1]) {
          const rounds = parseInt(match[1], 10);
          if (rounds >= 10) {
            continue; // 10+ rounds is acceptable
          }
        }

        // Check PBKDF2 iterations
        if (patternConfig.checkIterations && match[1]) {
          const iterations = parseInt(match[1], 10);
          if (iterations >= 100000) {
            continue; // 100k+ iterations is acceptable
          }
        }

        findings.push(
          this.createFinding(
            patternConfig.message,
            content,
            filePath,
            lineNumber,
            this.getExplanation(patternConfig.algorithm),
            this.getFix(patternConfig.algorithm)
          )
        );
      }
    }

    return findings;
  }

  private getExplanation(algorithm: string): string {
    switch (algorithm) {
      case 'MD5':
        return `MD5 is cryptographically broken and should never be used for security purposes:

- **Collision attacks**: Multiple different inputs can produce the same MD5 hash
- **Fast computation**: Modern hardware can compute billions of MD5 hashes per second
- **Rainbow tables**: Pre-computed tables exist for cracking MD5 hashes
- **Not suitable for passwords**: Can be cracked in seconds

MD5 was officially declared broken in 2004. Using MD5 for passwords, signatures, or any security-critical hashing is dangerous.`;

      case 'SHA1':
        return `SHA1 is cryptographically weak and deprecated:

- **Collision attacks**: Researchers demonstrated practical collision attacks in 2017
- **Deprecated by major browsers**: No longer trusted for SSL/TLS certificates
- **Not suitable for passwords**: Still too fast for password hashing
- **Weak security margin**: Only 160 bits of output

Major organizations (Google, Microsoft, Mozilla) have sunset SHA1. It should not be used for new applications.`;

      case 'DES':
        return `DES and 3DES are obsolete encryption algorithms:

- **Small key size**: DES uses 56-bit keys (can be bracked in hours)
- **3DES is deprecated**: NIST deprecated 3DES in 2023
- **Performance**: Slower than modern algorithms like AES
- **Block size**: 64-bit blocks are vulnerable to birthday attacks

Modern alternatives like AES-256 are faster, stronger, and widely supported.`;

      case 'ECB':
        return `ECB (Electronic Codebook) mode is fundamentally insecure:

- **Pattern leakage**: Identical plaintext blocks produce identical ciphertext
- **No randomization**: Same input always produces same output
- **Visual attacks**: Famous example: encrypted images still show original patterns
- **Lacks authentication**: No protection against tampering

ECB mode should never be used. Use GCM, CBC, or CTR modes instead.`;

      case 'Math.random':
        return `Math.random() is NOT cryptographically secure:

- **Predictable**: Uses a deterministic algorithm (pseudorandom)
- **No security guarantees**: Can be reverse-engineered
- **Not suitable for**: Tokens, keys, salts, IVs, session IDs, or any security-critical random values
- **Varies by browser**: Different implementations in different JavaScript engines

For security purposes, always use crypto.randomBytes() or crypto.getRandomValues().`;

      case 'unsalted':
        return `Hashing passwords without a salt is vulnerable to:

- **Rainbow tables**: Pre-computed hash tables for common passwords
- **Identical hash detection**: Same passwords produce same hashes
- **Parallel attacks**: All hashes can be attacked simultaneously
- **No per-user uniqueness**: Can't detect password reuse

Every password must have a unique, random salt. Use bcrypt, scrypt, or Argon2 which handle salting automatically.`;

      case 'bcrypt':
        return `Bcrypt rounds (cost factor) determine computational difficulty:

- **Too low (< 10)**: Fast to crack with modern hardware
- **Recommended minimum**: 12 rounds (as of 2024)
- **Optimal**: 12-15 rounds depending on your server performance
- **Doubles with each round**: Round 12 is 2048x slower than round 1

Low rounds make password cracking feasible with GPUs or cloud computing.`;

      case 'pbkdf2':
        return `PBKDF2 iterations determine brute-force resistance:

- **Too low (< 100,000)**: Vulnerable to GPU-accelerated attacks
- **OWASP recommendation**: Minimum 600,000 iterations for PBKDF2-HMAC-SHA256 (2023)
- **Increasing over time**: Should increase as hardware gets faster
- **Alternative**: Consider Argon2 or scrypt (better GPU resistance)

Low iterations allow attackers to test millions of passwords per second.`;

      case 'hardcoded-iv':
        return `Hardcoded Initialization Vectors (IVs) or salts defeat encryption:

- **No randomization**: Same input always produces same encrypted output
- **Pattern leakage**: Attacker can detect repeated encrypted values
- **Breaks semantic security**: Encryption should be non-deterministic
- **Reused across users**: Single attack vector compromises all users

IVs and salts must be randomly generated for each encryption operation.`;

      default:
        return 'Weak cryptographic algorithms can be exploited by attackers, leading to data breaches and security compromises.';
    }
  }

  private getFix(algorithm: string): string {
    switch (algorithm) {
      case 'MD5':
        return `Replace MD5 with secure alternatives:

// ❌ Insecure: MD5
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(password).digest('hex');

// ✅ For passwords: Use bcrypt, scrypt, or Argon2
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);

// ✅ For general hashing: Use SHA-256 or SHA-512
const hash = crypto.createHash('sha256').update(data).digest('hex');

// ✅ For HMACs: Use SHA-256 or SHA-512
const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex');

// ✅ For checksums only (non-security): SHA-256 is fast enough
const checksum = crypto.createHash('sha256').update(file).digest('hex');`;

      case 'SHA1':
        return `Replace SHA1 with stronger alternatives:

// ❌ Insecure: SHA1
const hash = crypto.createHash('sha1').update(data).digest('hex');

// ✅ For general hashing: Use SHA-256 or better
const hash = crypto.createHash('sha256').update(data).digest('hex');
const hash = crypto.createHash('sha512').update(data).digest('hex');

// ✅ For passwords: Use bcrypt (even better)
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);

// ✅ For digital signatures: Use SHA-256 or SHA-512
const signature = crypto.createSign('RSA-SHA256');
signature.update(data);
const sig = signature.sign(privateKey, 'hex');`;

      case 'DES':
        return `Replace DES/3DES with AES:

// ❌ Insecure: DES or 3DES
const cipher = crypto.createCipher('des', password);

// ✅ Secure: AES-256-GCM (authenticated encryption)
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const key = crypto.randomBytes(32); // 256 bits
const iv = crypto.randomBytes(16);  // 128 bits

const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update(plaintext, 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();

// Store: iv + encrypted + authTag

// ✅ For passwords: Derive key with PBKDF2
const key = crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256');`;

      case 'ECB':
        return `Never use ECB mode - use GCM, CBC, or CTR:

// ❌ Insecure: ECB mode
const cipher = crypto.createCipher('aes-256-ecb', key);

// ✅ Best: AES-GCM (authenticated encryption)
const algorithm = 'aes-256-gcm';
const iv = crypto.randomBytes(16); // Must be random for each encryption
const cipher = crypto.createCipheriv(algorithm, key, iv);

let encrypted = cipher.update(plaintext, 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();

// ✅ Alternative: AES-CBC with HMAC
const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv(algorithm, key, iv);

let encrypted = cipher.update(plaintext, 'utf8', 'hex');
encrypted += cipher.final('hex');

// Add HMAC for authentication
const hmac = crypto.createHmac('sha256', macKey).update(iv + encrypted).digest('hex');`;

      case 'Math.random':
        return `Use cryptographically secure random number generators:

// ❌ Insecure: Math.random() for security
const token = Math.random().toString(36).substring(7); // NEVER

// ✅ Node.js: Use crypto.randomBytes()
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');

// ✅ Browser: Use crypto.getRandomValues()
const array = new Uint8Array(32);
crypto.getRandomValues(array);
const token = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');

// ✅ Generate random integers securely
function getRandomInt(min, max) {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = Math.pow(256, bytesNeeded);
  const randomBytes = crypto.randomBytes(bytesNeeded);
  const randomValue = randomBytes.reduce((acc, byte, i) => acc + byte * Math.pow(256, i), 0);
  
  if (randomValue >= maxValue - (maxValue % range)) {
    return getRandomInt(min, max); // Retry to avoid bias
  }
  return min + (randomValue % range);
}

// ✅ Generate UUIDs (v4)
const { v4: uuidv4 } = require('uuid');
const id = uuidv4();`;

      case 'unsalted':
        return `Always use salted password hashing:

// ❌ Insecure: Unsalted hash
const hash = crypto.createHash('sha256').update(password).digest('hex');

// ✅ Best: Use bcrypt (salting automatic)
const bcrypt = require('bcrypt');
const saltRounds = 12;
const hash = await bcrypt.hash(password, saltRounds);
const isValid = await bcrypt.compare(password, hash);

// ✅ Alternative: scrypt (salting automatic)
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 64);
// Store: salt + hash

// ✅ Alternative: PBKDF2 with salt
const salt = crypto.randomBytes(16);
const iterations = 600000;
const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha256');
// Store: salt + hash + iterations`;

      case 'bcrypt':
        return `Increase bcrypt rounds to at least 12:

// ❌ Weak: Low rounds
const hash = await bcrypt.hash(password, 8); // Too fast

// ✅ Secure: Adequate rounds
const hash = await bcrypt.hash(password, 12); // Recommended minimum (2024)

// ✅ Best: Adaptive rounds
const saltRounds = 14; // Slower but more secure
const hash = await bcrypt.hash(password, saltRounds);

// Benchmark on your hardware:
const testRounds = async () => {
  for (let rounds = 10; rounds <= 14; rounds++) {
    const start = Date.now();
    await bcrypt.hash('test', rounds);
    const duration = Date.now() - start;
    console.log(\`Rounds \${rounds}: \${duration}ms\`);
    // Target: 250-500ms per hash
  }
};

// Note: Rounds increase exponentially (2^rounds)
// Round 12 is 4096x harder than round 1`;

      case 'pbkdf2':
        return `Increase PBKDF2 iterations to at least 600,000:

// ❌ Weak: Low iterations
const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256'); // Too fast

// ✅ Secure: OWASP recommended (2023)
const iterations = 600000; // For PBKDF2-HMAC-SHA256
const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha256');

// ✅ With SHA-512: Can use lower iterations
const iterations = 210000; // For PBKDF2-HMAC-SHA512
const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');

// Full secure example:
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const iterations = 600000;
  const keylen = 64;
  const digest = 'sha256';
  
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
  
  return {
    salt: salt.toString('hex'),
    hash: hash.toString('hex'),
    iterations
  };
}

function verifyPassword(password, stored) {
  const salt = Buffer.from(stored.salt, 'hex');
  const hash = crypto.pbkdf2Sync(password, salt, stored.iterations, 64, 'sha256');
  return hash.toString('hex') === stored.hash;
}

// ✅ Better alternative: Use Argon2 (more GPU-resistant)
const argon2 = require('argon2');
const hash = await argon2.hash(password);
const isValid = await argon2.verify(hash, password);`;

      case 'hardcoded-iv':
        return `Generate random IVs/salts for each operation:

// ❌ Insecure: Hardcoded IV
const iv = Buffer.from('1234567890abcdef');
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

// ✅ Secure: Random IV for each encryption
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';

function encrypt(plaintext, key) {
  const iv = crypto.randomBytes(16); // NEW random IV each time
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  // Return IV + encrypted + authTag (IV is not secret)
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted,
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData, key) {
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// ✅ For salts: Random per password
function hashPassword(password) {
  const salt = crypto.randomBytes(16); // NEW random salt per user
  const hash = crypto.scryptSync(password, salt, 64);
  return { salt: salt.toString('hex'), hash: hash.toString('hex') };
}`;

      default:
        return 'Use modern, secure cryptographic algorithms: AES-256-GCM for encryption, bcrypt/Argon2 for passwords, SHA-256+ for hashing, crypto.randomBytes() for random values.';
    }
  }
}
