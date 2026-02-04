# Test Quick Reference

## Running All Tests

```bash
# Run all tests
bun test

# Run with verbose output
bun test --verbose

# Run with coverage
bun test --coverage

# Watch mode (auto-rerun)
bun test --watch
```

## Running Specific Tests

```bash
# Hardcoded Secrets
bun test tests/rules/hardcodedSecrets.test.ts

# JWT Storage
bun test tests/rules/jwtStorage.test.ts

# eval() Usage
bun test tests/rules/evalUsage.test.ts

# Cookie Security
bun test tests/rules/cookieSecurity.test.ts

# CORS Config
bun test tests/rules/corsConfig.test.ts

# Weak Crypto
bun test tests/rules/weakCrypto.test.ts

# Environment Exposure
bun test tests/rules/envExposure.test.ts
```

## Test Organization

### Fixtures Location

```
tests/fixtures/
├── hardcoded-secrets/     - API keys, AWS keys, GitHub tokens, private keys
├── jwt-storage/           - localStorage/sessionStorage JWT issues
├── eval-usage/            - eval, Function constructor, setTimeout/setInterval with strings
├── cookie-security/       - Missing HttpOnly, Secure, SameSite flags
├── cors-config/           - Wildcard origins, reflected origins, null origins
├── weak-crypto/           - MD5, SHA1, DES, ECB, weak iterations
└── env-exposure/          - .env file exposure, public directory access
```

### Test Files Structure

Each test file follows this pattern:

```typescript
import { describe, test, expect } from "bun:test";
import { RuleName } from "../../src/rules/ruleName";

describe("RuleName", () => {
  const rule = new RuleName();

  test("should detect [vulnerability]", async () => {
    const content = `vulnerable code`;
    const findings = await rule.check(content, "test.ts");

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain("expected message");
  });

  test("should NOT flag [safe pattern]", async () => {
    const content = `safe code`;
    const findings = await rule.check(content, "test.ts");

    expect(findings.length).toBe(0);
  });
});
```

## Test Coverage Summary

| Rule              | Tests  | Status |
| ----------------- | ------ | ------ |
| Hardcoded Secrets | 10     | [X]    |
| JWT Storage       | 10     | [X]    |
| eval() Usage      | 12     | [X]    |
| Cookie Security   | 7      | [X]    |
| CORS Config       | 9      | [X]    |
| Weak Crypto       | 11     | [X]    |
| ENV Exposure      | 10     | [X]    |
| **TOTAL**         | **69** | [X]    |

## Key Test Patterns

### Vulnerability Detection

```typescript
// Should find the issue
const content = `const API_KEY = 'sk_live_...';`;
const findings = await rule.check(content, "test.ts");
expect(findings.length).toBeGreaterThan(0);
```

### Safe Code Validation

```typescript
// Should NOT flag safe code
const content = `const API_KEY = process.env.API_KEY;`;
const findings = await rule.check(content, "test.ts");
expect(findings.length).toBe(0);
```

### Error Messages

```typescript
// Should suggest remediation
expect(findings[0]?.remediation).toContain("process.env");
expect(findings[0]?.severity).toBe("high");
```

## Test Fixtures for Reference

### Hardcoded Secrets

- **Bad:** `AKIAIOSFODNN7EXAMPLE`, `sk_live_...`, `ghp_...`
- **Good:** `process.env.API_KEY`

### JWT Storage

- **Bad:** `localStorage.setItem('token', jwt)`
- **Good:** `res.cookie('token', jwt, { httpOnly: true })`

### eval() Usage

- **Bad:** `eval(code)`, `setTimeout("code()", 1000)`
- **Good:** `setTimeout(code, 1000)`

### Cookie Security

- **Bad:** `res.cookie('token', value)` (missing flags)
- **Good:** `res.cookie('token', value, { httpOnly: true, secure: true, sameSite: 'strict' })`

### CORS

- **Bad:** `origin: '*'`, `Access-Control-Allow-Credentials: true`
- **Good:** `origin: 'https://trusted.com'`

### Weak Crypto

- **Bad:** `crypto.createHash('md5')`, `Math.random()`
- **Good:** `bcrypt.hash()`, `crypto.randomBytes()`

### ENV Exposure

- **Bad:** `.env` file tracked in git, `fetch('.env')`
- **Good:** `require('dotenv').config()`, `.env.example` with placeholders

## Adding New Tests

1. Create fixture file in `tests/fixtures/[rule]/`
2. Add test case to `tests/rules/[rule].test.ts`
3. Run: `bun test tests/rules/[rule].test.ts`
4. Verify findings match expectations

## Debugging

```bash
# Run single test with debug output
bun test tests/rules/[rule].test.ts --verbose

# Check specific fixture
bun test -- --filter="should detect [specific pattern]"

# See all test names
bun test --list
```

## CI/CD Integration

All tests should pass before commits:

```bash
# Pre-commit check
bun test && echo "All tests passed [X]"
```
