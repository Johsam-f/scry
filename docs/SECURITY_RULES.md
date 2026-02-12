# Security Rules Reference

Complete reference for all security rules implemented in scry.

---

## Rule Categories

1. **Secrets & Credentials** - Hardcoded sensitive data
2. **Authentication & Authorization** - Session and auth issues
3. **Code Injection** - Dangerous code execution
4. **Configuration** - Insecure settings
5. **Cryptography** - Weak crypto usage

---

## 1. Hardcoded Secrets (HIGH)

**Rule ID:** `hardcoded-secrets`

### What to Detect

```javascript
//[ BAD ] - Hardcoded API key
const API_KEY = "sk_live_1234567890abcdef";

//[ BAD ] - Hardcoded password
const DB_PASSWORD = "mySecretPassword123";

//[ BAD ] - AWS credentials
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";

//[ BAD ] - Private key
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----...";
```

### Patterns to Match

- AWS Access Keys: `AKIA[0-9A-Z]{16}`
- API Keys: `api[_-]?key.*=.*['"][^'"]{20,}['"]`
- Private Keys: `-----BEGIN.*PRIVATE KEY-----`
- Generic secrets: `(secret|password|token).*=.*['"][^'"]{8,}['"]`
- GitHub tokens: `ghp_[a-zA-Z0-9]{36}`
- JWT tokens: `eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*`

### False Positive Prevention

Ignore:

- `process.env.API_KEY` (environment variables)
- `config.get('secret')` (config access)
- Example/placeholder values: `"your_api_key_here"`
- Comments explaining secrets

### Why Dangerous

Hardcoded secrets can be:

- Leaked via source control (git history)
- Exposed in logs or error messages
- Found in decompiled/bundled code
- Shared accidentally in screenshots

### How to Fix

```javascript
// GOOD - Use environment variables
const API_KEY = process.env.API_KEY;

// GOOD - Use a secrets manager
import { getSecret } from "./secrets";
const API_KEY = await getSecret("api-key");

// GOOD - Use config files (not in git)
const config = require("./config.json"); // Add to .gitignore
const API_KEY = config.apiKey;
```

---

## 2. JWT in localStorage (HIGH)

**Rule ID:** `jwt-storage`

### What to Detect

```javascript
//[ BAD ] - JWT in localStorage
localStorage.setItem("token", jwtToken);
localStorage.setItem("jwt", response.token);
localStorage.getItem("authToken");

//[ BAD ] - JWT in sessionStorage
sessionStorage.setItem("token", jwtToken);
```

### Patterns to Match

- `localStorage.setItem(['"].*token.*['"]`
- `sessionStorage.setItem(['"].*token.*['"]`
- `localStorage.setItem(['"].*jwt.*['"]`

### Why Dangerous

localStorage is vulnerable to XSS attacks:

- Accessible via JavaScript from any script
- Persists across sessions
- No httpOnly protection
- Can be stolen by malicious scripts

### How to Fix

```javascript
// GOOD - Use httpOnly cookies
// Backend sets cookie:
res.cookie("token", jwtToken, {
  httpOnly: true, // Not accessible via JavaScript
  secure: true, // Only sent over HTTPS
  sameSite: "strict", // CSRF protection
});

// GOOD - Store in memory (for SPAs)
let authToken = null; // In-memory, lost on refresh

// GOOD - Use secure session storage with encryption
import { encryptToken } from "./crypto";
const encrypted = encryptToken(token);
sessionStorage.setItem("token", encrypted);
```

---

## 3. Insecure Cookies (HIGH)

**Rule ID:** `cookie-security`

### What to Detect

```javascript
//[ BAD ] - Missing security flags
res.cookie("session", sessionId);

//[ BAD ] - No httpOnly
res.cookie("token", token, { secure: true });

//[ BAD ] - No sameSite
document.cookie = "user=john";
```

### Patterns to Match

- `res.cookie\([^)]*\)` without `httpOnly`
- `res.cookie\([^)]*\)` without `secure`
- `res.cookie\([^)]*\)` without `sameSite`
- `document.cookie =` (manual cookie setting)

### Why Dangerous

Missing flags expose cookies to:

- **No httpOnly:** XSS attacks can steal cookies
- **No secure:** Man-in-the-middle attacks on HTTP
- **No sameSite:** CSRF attacks from other sites

### How to Fix

```javascript
// GOOD - All security flags
res.cookie("session", sessionId, {
  httpOnly: true, // Prevent JavaScript access
  secure: true, // HTTPS only
  sameSite: "strict", // Prevent CSRF
  maxAge: 3600000, // 1 hour expiry
});

// GOOD - Production-ready
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  domain: ".example.com",
};
res.cookie("auth", token, cookieOptions);
```

---

## 4. eval() Usage (HIGH)

**Rule ID:** `eval-usage`

### What to Detect

```javascript
//[ BAD ] - Direct eval
eval(userInput);

//[ BAD ]  - Function constructor
new Function(code)();

//[ BAD ] - setTimeout with string
setTimeout("doSomething()", 1000);

//[ BAD ] - setInterval with string
setInterval("update()", 5000);
```

### Patterns to Match

- `eval\s*\(`
- `new\s+Function\s*\(`
- `setTimeout\s*\(\s*['"]`
- `setInterval\s*\(\s*['"]`

### Why Dangerous

`eval()` allows arbitrary code execution:

- Can execute malicious code
- Hard to audit and debug
- Performance issues
- Breaks optimizations
- Creates security vulnerabilities

### How to Fix

```javascript
// GOOD - Use JSON.parse for data
const data = JSON.parse(jsonString);

// GOOD - Use proper function references
setTimeout(doSomething, 1000);

// GOOD - Use operators/expressions
const operators = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
};
const result = operators[op](x, y);

// GOOD - Use a safe expression parser
import { parse } from "safe-expression-parser";
const result = parse(expression);
```

---

## 5. CORS Misconfiguration (MEDIUM)

**Rule ID:** `cors-config`

### What to Detect

```javascript
//[ BAD ] - Wildcard with credentials
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

//[ BAD ] - Unrestricted access
res.setHeader("Access-Control-Allow-Origin", "*");

//[ BAD ] - Reflecting origin without validation
res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
```

### Patterns to Match

- `origin:\s*['"]?\*['"]?`
- `Access-Control-Allow-Origin.*\*`
- `credentials:\s*true` with `origin:\s*\*`

### Why Dangerous

Overly permissive CORS allows:

- Unauthorized cross-origin requests
- Data theft from authenticated users
- CSRF-like attacks
- API abuse from untrusted origins

### How to Fix

```javascript
// GOOD - Specific origins
app.use(
  cors({
    origin: "https://trusted-domain.com",
    credentials: true,
  }),
);

// GOOD - Whitelist multiple origins
const allowedOrigins = ["https://app.example.com", "https://admin.example.com"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
```

---

## 6. .env File Exposure (HIGH)

**Rule ID:** `env-exposure`

### What to Detect

- `.env` file in git
- `.env` not in `.gitignore`
- Environment variables logged
- `.env` example without placeholders

```javascript
//[ BAD ] - Logging env vars
console.log(process.env);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);

//[ BAD ] - Exposing in error messages
throw new Error(`Failed with key: ${process.env.API_KEY}`);
```

### Checks to Perform

1. Check if `.env` is tracked in git: `git ls-files .env`
2. Check if `.env` is in `.gitignore`
3. Search for `console.log(process.env`
4. Look for env vars in error messages

### Why Dangerous

Exposed `.env` files leak:

- All application secrets
- Database credentials
- API keys and tokens
- Configuration details

### How to Fix

```bash
# GOOD - Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# GOOD - Remove from git history
git rm --cached .env
git commit -m "Remove .env from tracking"
```

```javascript
// GOOD - Don't log env vars
// Redact sensitive values
const sanitized = { ...process.env };
delete sanitized.DB_PASSWORD;
delete sanitized.API_KEY;
console.log(sanitized);

// GOOD - Create .env.example with placeholders
// .env.example
DB_HOST = localhost;
DB_PASSWORD = your_password_here;
API_KEY = your_api_key_here;
```

---

## 7. Weak Cryptography (MEDIUM)

**Rule ID:** `weak-crypto`

### What to Detect

```javascript
//[ BAD ] - MD5 hashing
crypto.createHash("md5");

//[ BAD ] - SHA1 hashing
crypto.createHash("sha1");

//[ BAD ] - Weak password hashing
const hash = md5(password);

//[ BAD ] - No salt
const hash = crypto.createHash("sha256").update(password).digest("hex");
```

### Patterns to Match

- `createHash\(['"]md5['"]`
- `createHash\(['"]sha1['"]`
- `md5\(`
- `sha1\(`
- Password hashing without bcrypt/argon2/scrypt

### Why Dangerous

Weak crypto algorithms:

- **MD5/SHA1:** Collision attacks, not suitable for passwords
- **No salt:** Rainbow table attacks
- **No key stretching:** Fast brute-force
- **Outdated standards:** Known vulnerabilities

### How to Fix

```javascript
// GOOD - Use bcrypt for passwords
import bcrypt from "bcrypt";
const saltRounds = 10;
const hash = await bcrypt.hash(password, saltRounds);
const isValid = await bcrypt.compare(password, hash);

// GOOD - Use SHA-256 for checksums (not passwords)
const hash = crypto.createHash("sha256").update(data).digest("hex");

// GOOD - Use argon2 (modern alternative)
import argon2 from "argon2";
const hash = await argon2.hash(password);
const isValid = await argon2.verify(hash, password);

// GOOD - Use PBKDF2 with salt
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512");
```

---

## 8. Password Patterns (MEDIUM)

**Rule ID:** `password-patterns`

### What to Detect

```javascript
//[ BAD ] - Weak password requirements
if (password.length < 6) return false;

//[ BAD ] - Storing plain text passwords
db.save({ password: password });

//[ BAD ] - Comparing passwords directly
if (password === storedPassword)
  // ...

  //[ BAD ] - Password in URL/query params
  fetch(`/login?password=${password}`);
```

### Patterns to Match

- `password.*<\s*[678]` (weak length requirements)
- `password.*===?.*password` (direct comparison)
- Password storage without hashing
- Passwords in URLs/logs

### Why Dangerous

Poor password handling leads to:

- Easy brute-force attacks
- Account takeovers
- Data breaches
- Compliance violations

### How to Fix

```javascript
// GOOD - Strong password requirements
function isPasswordStrong(password) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// GOOD - Hash before storing
import bcrypt from "bcrypt";
const hash = await bcrypt.hash(password, 10);
db.save({ passwordHash: hash });

// GOOD - Secure comparison
const isValid = await bcrypt.compare(password, user.passwordHash);

// GOOD - Send in POST body, never URL
fetch("/login", {
  method: "POST",
  body: JSON.stringify({ password }),
  headers: { "Content-Type": "application/json" },
});
```

---

## Priority Order for Implementation

1. **hardcoded-secrets** (Most critical, easiest to implement)
2. **jwt-storage** (High impact, common mistake)
3. **eval-usage** (Clear pattern, dangerous)
4. **cookie-security** (Important for auth)
5. **env-exposure** (File system check, different approach)
6. **cors-config** (API security)
7. **weak-crypto** (Common in older code)
8. **password-patterns** (Context-dependent, harder)

---

## Testing Each Rule

For each rule, create test fixtures:

```
tests/fixtures/
├── hardcoded-secrets/
│   ├── with-aws-key.js       [x] Should find
│   ├── with-env-var.js       [+] Should pass
│   └── with-comment.js       [+] Should pass
├── jwt-storage/
│   ├── localstorage-jwt.js   [x] Should find
│   ├── cookie-jwt.js         [+] Should pass
│   └── memory-jwt.js         [+] Should pass
...
```

This ensures high accuracy and low false positives!
