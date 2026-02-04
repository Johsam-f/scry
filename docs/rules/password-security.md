# Password Security Rule

## Overview

The `password-security` rule detects insecure password handling practices in JavaScript and TypeScript code. It identifies common vulnerabilities related to password storage, transmission, validation, and comparison.

## Rule ID

`password-security`

## Severity

**HIGH** - Password-related vulnerabilities can lead to credential theft, unauthorized access, and data breaches.

## What It Detects

### 1. Plaintext Password Storage

Detects passwords being stored without hashing:

```javascript
// Detected
const user = { username: "alice", password: "secret123" };
db.insert(user);
```

### 2. Password in URL

Detects credentials embedded in URLs:

```javascript
// Detected
const url = "https://user:password@api.example.com";
fetch(url);
```

### 3. Password Logging

Detects passwords being logged to console or log files:

```javascript
// Detected
console.log("Login:", username, password);
logger.info({ username, password });
```

### 4. Weak Password Validation

Detects password length requirements that are too short:

```javascript
// Detected
function validatePassword(password) {
  return password.length >= 6; // Too short!
}
```

### 5. No Password Validation

Detects validation functions that always return true:

```javascript
// Detected
function validatePassword(password) {
  return true; // Accepts anything!
}
```

### 6. Password in GET Request

Detects passwords sent via HTTP GET requests:

```javascript
// Detected
axios.get(`/login?username=${user}&password=${pass}`);
```

### 7. Password in Query String

Detects passwords added to URL query parameters:

```javascript
// Detected
const params = new URLSearchParams({ username, password });
```

### 8. Direct Password Comparison

Detects non-constant-time password comparisons vulnerable to timing attacks:

```javascript
// Detected
if (password === storedPassword) {
  login();
}
```

### 9. Password in Browser Storage

Detects passwords stored in localStorage or sessionStorage:

```javascript
// Detected
localStorage.setItem("password", userPassword);
sessionStorage.setItem("password", userPassword);
```

### 10. Password in Cookies Without Secure Flags

Detects passwords in cookies without httpOnly/secure flags:

```javascript
// Detected
res.cookie("password", pass);
document.cookie = "password=" + pass;
```

### 11. Hardcoded Default Password

Detects hardcoded default or temporary passwords:

```javascript
// Detected
const defaultPassword = "admin123";
const tempPassword = "changeme";
```

### 12. Password Over HTTP

Detects authentication endpoints using HTTP instead of HTTPS:

```javascript
// Detected
fetch("http://example.com/login", {
  method: "POST",
  body: JSON.stringify({ password }),
});
```

### 13. Password Autocomplete Enabled

Detects password fields with autocomplete explicitly enabled:

```html
<!-- Detected -->
<input type="password" autocomplete="on" />
```

## Configuration

Add to your `.scryrc.json`:

```json
{
  "rules": {
    "password-security": "error"
  }
}
```

Options:

- `"error"` - Report as error (recommended)
- `"warn"` - Report as warning
- `"off"` - Disable rule

## How to Fix

### Plaintext Storage → Hash Passwords

```javascript
// Correct
const bcrypt = require("bcrypt");
const passwordHash = await bcrypt.hash(password, 12);
await db.insert({ username, passwordHash });
```

### Password Logging → Redact Sensitive Fields

```javascript
// Correct
const sanitized = { ...data };
if (sanitized.password) sanitized.password = "[REDACTED]";
logger.info(sanitized);
```

### GET Request → POST with Body

```javascript
// Correct
fetch("https://api.example.com/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});
```

### Direct Comparison → Use Secure Methods

```javascript
// Correct
const bcrypt = require("bcrypt");
const isValid = await bcrypt.compare(password, storedHash);
```

### Weak Validation → Enforce Strong Requirements

```javascript
// Correct
function validatePassword(password) {
  if (password.length < 12) {
    return { valid: false, reason: "Minimum 12 characters" };
  }
  // Additional complexity checks...
  return { valid: true };
}
```

### Hardcoded Passwords → Environment Variables

```javascript
// Correct
const adminPassword = process.env.ADMIN_PASSWORD;
```

## Context-Aware Detection

The rule uses context-aware analysis to reduce false positives:

1. **Hashed passwords are ignored**: If bcrypt, scrypt, argon2, or similar hashing is detected near the password, it's not flagged.

2. **Secure comparison methods are ignored**: bcrypt.compare(), crypto.timingSafeEqual(), and similar secure comparison functions are not flagged.

3. **Comments are skipped**: Code in comments is not analyzed.

4. **Test files**: Low-risk patterns in test files (_.test.js, _.spec.ts) are ignored.

## File Types Checked

- `.js` - JavaScript
- `.ts` - TypeScript
- `.jsx` - React JavaScript
- `.tsx` - React TypeScript
- `.vue` - Vue.js
- `.svelte` - Svelte
- `.mjs` - ES Modules
- `.cjs` - CommonJS
- `.html` - HTML files (for inline scripts)

## Examples

### Running the Scanner

```bash
# Scan current directory
scry scan .

# Scan specific directory
scry scan ./src

# Scan with JSON output
scry scan . --output json

# Strict mode (exit 1 if issues found)
scry scan . --strict
```

### Example Output

```
┌──────────┬───────────────────┬──────────────────┬──────┬────────────────────────────────┐
│ Severity │ Rule              │ File             │ Line │ Message                        │
├──────────┼───────────────────┼──────────────────┼──────┼────────────────────────────────┤
│ ●●● HIGH │ password-security │ src/auth.js      │ 42   │ Password in localStorage       │
│ ●●● HIGH │ password-security │ src/api.js       │ 18   │ Password in URL                │
│ ●●  MED  │ password-security │ src/validate.js  │ 8    │ Password length too short      │
└──────────┴───────────────────┴──────────────────┴──────┴────────────────────────────────┘
```

## Best Practices

1. **Always hash passwords** with bcrypt (rounds ≥ 12), Argon2, or scrypt
2. **Never log passwords** - redact sensitive fields before logging
3. **Use HTTPS** for all authentication endpoints
4. **Transmit via POST** - passwords in request body, never in URLs
5. **Strong validation** - minimum 8-12 characters, complexity requirements
6. **Timing-safe comparison** - use bcrypt.compare() or crypto.timingSafeEqual()
7. **Environment variables** - never hardcode passwords
8. **Secure storage** - never store passwords in browser storage or cookies

## Related Rules

- `hardcoded-secrets` - Detects hardcoded API keys and secrets
- `weak-crypto` - Detects weak cryptographic algorithms
- `cookie-security` - Detects insecure cookie configurations

## Security Impact

Password-related vulnerabilities can lead to:

- **Credential theft** - Exposed passwords can be used to compromise accounts
- **Data breaches** - Unauthorized access to user data
- **Compliance violations** - GDPR, PCI-DSS, HIPAA violations
- **Cascading attacks** - Password reuse across services
- **Legal liability** - Organizations liable for inadequate password protection

## References

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [CWE-256: Plaintext Storage of a Password](https://cwe.mitre.org/data/definitions/256.html)
- [CWE-319: Cleartext Transmission of Sensitive Information](https://cwe.mitre.org/data/definitions/319.html)

## Tags

`security`, `passwords`, `authentication`

## Version

Added in: v0.2.0
