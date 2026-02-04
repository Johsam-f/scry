/**
 * Example file demonstrating password security vulnerabilities
 * Run scry scan on this file to see password security issues detected
 */

// ISSUE: Plaintext password storage
const user = {
  username: 'alice',
  password: 'mySecretPassword123' // Never store passwords in plaintext
};
database.insert(user);

// ISSUE: Password in URL
const apiUrl = 'https://admin:admin123@api.example.com/data';
fetch(apiUrl);

// ISSUE: Password logging
console.log('Login attempt:', username, password);
logger.info({ username, password, timestamp: Date.now() });

// ISSUE: Weak password validation (too short)
function validatePassword(password) {
  return password.length >= 6; // Too short! Minimum should be 8-12
}

// ISSUE: No password validation
function checkPassword(password) {
  return true; // Always accepts any password
}

// ISSUE: Password in GET request
axios.get(`/api/login?username=${username}&password=${password}`);
fetch('/auth?password=' + userPassword);

// ISSUE: Direct password comparison (timing attack vulnerability)
if (password === storedPassword) {
  grantAccess();
}

// ISSUE: Password in localStorage
localStorage.setItem('userPassword', password);
localStorage.setItem('credentials', JSON.stringify({ username, password }));

// ISSUE: Password in sessionStorage
sessionStorage.setItem('password', currentPassword);

// ISSUE: Hardcoded default password
const defaultPassword = 'admin123';
const tempPassword = 'changeme';

// ISSUE: Password over HTTP (not HTTPS)
fetch('http://example.com/login', {
  method: 'POST',
  body: JSON.stringify({ username, password })
});

// ISSUE: Password autocomplete explicitly enabled
const loginForm = `
  <input type="password" autocomplete="on" />
`;

// CORRECT EXAMPLES:

// Use bcrypt for password hashing
const bcrypt = require('bcrypt');
async function secureRegistration(username, plainPassword) {
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(plainPassword, saltRounds);
  
  await database.insert({
    username,
    passwordHash // Store hash, never plaintext
  });
}

// Secure password verification
async function secureLogin(username, plainPassword) {
  const user = await database.findOne({ username });
  
  if (!user) {
    return false;
  }
  
  // bcrypt.compare is timing-safe
  const isValid = await bcrypt.compare(plainPassword, user.passwordHash);
  return isValid;
}

// Strong password validation
function validatePasswordSecure(password) {
  const minLength = 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  if (password.length < minLength) {
    return { valid: false, reason: 'Password must be at least 12 characters' };
  }

  const complexity = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
    .filter(Boolean).length;

  if (complexity < 3) {
    return { 
      valid: false, 
      reason: 'Password must contain at least 3 of: uppercase, lowercase, numbers, symbols' 
    };
  }

  return { valid: true };
}

// Secure password transmission
async function securePasswordSubmit(username, password) {
  // Use POST with HTTPS
  const response = await fetch('https://api.example.com/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password // In body, not URL
    })
  });
  
  return response.json();
}

// Never log passwords - redact them
function safeLogger(data) {
  const safe = { ...data };
  if (safe.password) safe.password = '[REDACTED]';
  if (safe.passwd) safe.passwd = '[REDACTED]';
  console.log('Login attempt:', safe);
}

// Use environment variables, not hardcoded passwords
const dbPassword = process.env.DB_PASSWORD;
const adminPassword = process.env.ADMIN_PASSWORD;

// Proper password field autocomplete
const secureForm = `
  <form method="POST" action="https://example.com/login">
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
`;
