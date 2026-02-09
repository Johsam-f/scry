/**
 * VULNERABLE CODE EXAMPLES - FOR TESTING ONLY
 * This file contains intentional security vulnerabilities for testing scry's detection capabilities.
 * DO NOT use any of these patterns in production code!
 */

import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const app = express();

// ============================================================================
// 1. ENVIRONMENT FILE EXPOSURE
// scry should detect: env-exposure
// ============================================================================

// Serving .env files as static content
app.use(express.static('.env'));
app.get('/config/.env', (req, res) => {
  res.sendFile('.env');
});

// Fetching .env in client code
fetch('/api/.env')
  .then(res => res.text())
  .then(data => console.log(data));

// ============================================================================
// 2. INSECURE COOKIE CONFIGURATION
// scry should detect: cookie-security
// ============================================================================

app.get('/login', (req, res) => {
  const sessionToken = generateToken();
  
  // Missing HttpOnly and Secure flags
  res.cookie('session', sessionToken);
  
  // Only has Secure but missing HttpOnly
  res.cookie('auth_token', sessionToken, { secure: true });
  
  // Has HttpOnly but missing Secure
  res.cookie('user_id', '12345', { httpOnly: true });
});

// ============================================================================
// 3. JWT IN CLIENT STORAGE
// scry should detect: jwt-storage
// ============================================================================

function storeAuthToken(token: string) {
  // Storing JWT in localStorage (vulnerable to XSS)
  localStorage.setItem('jwt', token);
  localStorage.setItem('authToken', token);
  
  // Storing JWT in sessionStorage (also vulnerable)
  sessionStorage.setItem('jwt_token', token);
  sessionStorage.setItem('access_token', token);
}

// ============================================================================
// 4. CORS MISCONFIGURATION
// scry should detect: cors-config
// ============================================================================

// Wildcard CORS origin
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Reflected origin without validation
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  next();
});

// Allowing null origin
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'null');
  next();
});

// ============================================================================
// 5. eval() USAGE
// scry should detect: eval-usage
// ============================================================================

function executeUserCode(userInput: string) {
  // Direct eval usage
  eval(userInput);
  
  // Function constructor
  const fn = new Function('x', userInput);
  fn(10);
  
  // setTimeout with string
  setTimeout(userInput, 1000);
  
  // setInterval with string
  setInterval(userInput, 5000);
}

// ============================================================================
// 6. WEAK CRYPTOGRAPHY
// scry should detect: weak-crypto
// ============================================================================

function weakCrypto(data: string, password: string) {
  // MD5 hashing (broken)
  const md5Hash = crypto.createHash('md5').update(data).digest('hex');
  
  // SHA1 hashing (weak)
  const sha1Hash = crypto.createHash('sha1').update(data).digest('hex');
  
  // DES encryption (obsolete)
  const desCipher = crypto.createCipher('des', password);
  
  // ECB mode (insecure)
  const ecbCipher = crypto.createCipheriv('aes-256-ecb', Buffer.alloc(32), null);
  
  // Math.random() for security (predictable)
  const token = Math.random().toString(36);
  
  // Unsalted hash
  const unsaltedHash = crypto.createHash('sha256').update(password).digest('hex');
  
  // Low bcrypt rounds
  const bcrypt = require('bcrypt');
  bcrypt.hash(password, 4);
  
  // Hardcoded IV/salt
  const iv = Buffer.from('1234567890123456');
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.alloc(32), iv);
}

// ============================================================================
// 7. HARDCODED SECRETS
// scry should detect: hardcoded-secrets
// ============================================================================

// AWS credentials
const AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

// API keys
const API_KEY = 'sk_live_51HqJ8pKqJz0mZn3xYvH9gFk2pL7sT4nX8bQ1cR6';
const STRIPE_KEY = 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';

// GitHub token
const GITHUB_TOKEN = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz';

// Private key
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAw5vKT3H9eJK7xQY...
-----END RSA PRIVATE KEY-----`;

// Database credentials
const DB_PASSWORD = 'SuperSecret123!';
const config = {
  password: 'hardcoded_password',
  secret: 'my-secret-key-12345'
};

// ============================================================================
// 8. PASSWORD SECURITY
// scry should detect: password-security
// ============================================================================

// Plaintext password storage
function createUser(username: string, password: string) {
  const user = {
    username,
    password: password // Stored in plaintext!
  };
  database.save(user);
}

// Password in URL
function authenticateViaUrl(username: string, password: string) {
  fetch(`/api/login?username=${username}&password=${password}`);
  window.location.href = `/auth?pwd=${password}`;
}

// Password logging
function loginUser(password: string) {
  console.log('User password:', password);
  logger.info(`Login attempt with password: ${password}`);
}

// Weak password validation
function validatePassword(password: string): boolean {
  return password.length >= 4; // Too short!
}

// Unsafe password comparison (timing attack)
function checkPassword(input: string, stored: string): boolean {
  return input === stored; // Should use constant-time comparison
}

// Default password
const DEFAULT_PASSWORD = 'admin123';
const DEFAULT_ADMIN_PWD = 'password';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateToken(): string {
  return Math.random().toString(36).substring(7);
}

const database = {
  save: (data: any) => console.log('Saving:', data)
};

const logger = {
  info: (msg: string) => console.log(msg)
};

export { app };
