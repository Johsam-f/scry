/**
 * RULE: password-security
 * Demonstrates password security vulnerabilities
 */

import crypto from 'crypto';

// Plaintext password storage - VULNERABLE
interface User {
  username: string;
  password: string; // Stored in plaintext!
}

function createUser(username: string, password: string): User {
  return {
    username,
    password: password // BAD: No hashing!
  };
}

function saveUserToDatabase(user: { password: string }) {
  database.users.insert({
    password: user.password // Plaintext storage
  });
}

// Password in URL - VULNERABLE
function authenticateViaUrl(username: string, password: string) {
  fetch(`/api/login?username=${username}&password=${password}`);
  
  window.location.href = `/auth?pwd=${password}`;
  
  const url = new URL(`https://api.example.com/login?pass=${password}`);
}

// Password in GET request - VULNERABLE
function loginWithGet(password: string) {
  fetch(`/login?password=${password}`, { method: 'GET' });
}

// Password logging - VULNERABLE
function loginUser(username: string, password: string) {
  console.log('User password:', password);
  console.log(`Login attempt for ${username} with pwd: ${password}`);
  
  logger.info('Password: ' + password);
  logger.debug(`User credentials: ${username}:${password}`);
}

// Weak password validation - VULNERABLE
function validatePassword(password: string): boolean {
  return password.length >= 4; // Too short!
}

function isPasswordValid(pwd: string): boolean {
  return pwd.length > 5; // Still too weak
}

// Unsafe password comparison - VULNERABLE (timing attack)
function checkPassword(input: string, stored: string): boolean {
  return input === stored; // Use constant-time comparison!
}

function verifyPassword(userInput: string, hash: string): boolean {
  const inputHash = crypto.createHash('sha256').update(userInput).digest('hex');
  return inputHash === hash; // Timing attack vulnerable
}

// Default passwords - VULNERABLE
const DEFAULT_PASSWORD = 'admin123';
const DEFAULT_ADMIN_PASSWORD = 'password';
const DEFAULT_PWD = 'changeme';
const INITIAL_PASSWORD = 'admin';

function resetPassword(userId: string) {
  database.users.update(userId, {
    password: 'password123' // Default password
  });
}

// Password in error messages - VULNERABLE
function authenticate(password: string) {
  if (password !== storedPassword) {
    throw new Error(`Authentication failed for password: ${password}`);
  }
}

// Sending password over insecure channel - VULNERABLE
function sendPasswordEmail(email: string, password: string) {
  sendEmail({
    to: email,
    subject: 'Your Password',
    body: `Your password is: ${password}` // Never send plaintext passwords!
  });
}

// SECURE alternatives (for reference):
// - Hash passwords with bcrypt, argon2, or scrypt
// - Send passwords in POST body, never in URL
// - Never log passwords
// - Enforce strong password policies (min 12 chars, complexity)
// - Use constant-time comparison for password verification
// - Never use default passwords

import bcrypt from 'bcrypt';

async function secureCreateUser(username: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  return { username, password: hashedPassword };
}

// Helpers
const database = {
  users: {
    insert: (data: any) => {},
    update: (id: string, data: any) => {}
  }
};

const logger = {
  info: (msg: string) => {},
  debug: (msg: string) => {}
};

function sendEmail(options: any) {}

const storedPassword = 'hashed_password';

export { createUser, authenticateViaUrl, loginUser, checkPassword };
