/**
 * RULE: weak-crypto
 * Demonstrates weak cryptography vulnerabilities
 */

import crypto from 'crypto';

// MD5 hashing - VULNERABLE (broken)
function hashWithMD5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

// SHA1 hashing - VULNERABLE (weak)
function hashWithSHA1(data: string): string {
  return crypto.createHash('sha1').update(data).digest('hex');
}

// DES encryption - VULNERABLE (obsolete)
function encryptWithDES(data: string, key: string): string {
  const cipher = crypto.createCipher('des', key);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

// 3DES encryption - VULNERABLE (deprecated)
function encryptWith3DES(data: string, key: string): string {
  const cipher = crypto.createCipher('des3', key);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

// ECB mode - VULNERABLE (insecure)
function encryptECB(data: string, key: Buffer): string {
  const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

// Math.random() for security - VULNERABLE (predictable)
function generateToken(): string {
  return Math.random().toString(36).substring(2);
}

function generateSessionId(): string {
  return Math.random().toString(16);
}

// Unsalted password hash - VULNERABLE
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Low bcrypt rounds - VULNERABLE (too weak)
import bcrypt from 'bcrypt';

async function hashPasswordWeak(password: string): Promise<string> {
  return bcrypt.hash(password, 4); // Less than 10 rounds
}

// Low PBKDF2 iterations - VULNERABLE
function deriveKeyWeak(password: string, salt: string): Buffer {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256'); // Less than 100k
}

// Hardcoded IV - VULNERABLE
function encryptWithHardcodedIV(data: string, key: Buffer): string {
  const iv = Buffer.from('1234567890123456'); // Hardcoded!
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

// Hardcoded salt - VULNERABLE
function hashWithHardcodedSalt(password: string): string {
  const salt = 'hardcoded-salt-value'; // Hardcoded!
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// SECURE alternatives (for reference):
// Use SHA-256, SHA-384, or SHA-512
// Use AES-256-GCM or ChaCha20-Poly1305
// Use crypto.randomBytes() for tokens
// Use bcrypt/argon2 with high rounds
// Use random salts and IVs

export { 
  hashWithMD5, 
  hashWithSHA1, 
  encryptWithDES, 
  generateToken,
  hashPassword 
};
