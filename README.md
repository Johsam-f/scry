# scry

**A security-focused CLI that reveals hidden risks in JavaScript and Node.js codebases.**

> In fantasy, _to scry_ means to reveal hidden truths. `scry` applies the same idea to code.

## What is scry?

**scry** is a command-line security scanner that detects common but dangerous security mistakes in JavaScript/TypeScript projects and provides:

✅ **Clear explanations** of why each issue is risky  
✅ **Actionable fixes** with code examples  
✅ **Educational context** to build security awareness  
✅ **Fast, focused scanning** without overwhelming noise

## Quick Start

```bash
# Install (coming soon to npm)
bun install scry

# Scan current directory
scry scan .

# Scan specific path
scry scan ./src

# Strict mode (exit code 1 if issues found)
scry scan . --strict

# Output as JSON
scry scan . --output json
```

## What scry Detects

### Security Rules

1. **Hardcoded Secrets** 🔐 - API keys, tokens, passwords, AWS credentials
2. **JWT in Client Storage** ⚠️ - JWT tokens in localStorage/sessionStorage
3. **Insecure Cookies** 🍪 - Missing httpOnly, secure, sameSite flags
4. **eval() Usage** ☠️ - Dangerous code execution
5. **CORS Misconfiguration** 🌐 - Overly permissive CORS settings
6. **.env Exposure** 📄 - Environment files in version control or public directories
7. **Weak Cryptography** 🔒 - MD5, SHA1, DES, unsalted hashing, low iterations
8. **Password Security** 🔑 - Plaintext storage, weak validation, insecure transmission

## Example Output

```
┌──────────┬────────────────────┬─────────────────┬──────┬──────────────────────┐
│ Severity │ Rule               │ File            │ Line │ Message              │
├──────────┼────────────────────┼─────────────────┼──────┼──────────────────────┤
│ ●●● HIGH │ hardcoded-secrets  │ src/config.ts   │ 14   │ Hardcoded API key    │
│ ●●● HIGH │ jwt-storage        │ src/auth.ts     │ 28   │ JWT in localStorage  │
│ ●● MEDIUM│ cors-config        │ src/server.ts   │ 45   │ Permissive CORS      │
└──────────┴────────────────────┴─────────────────┴──────┴──────────────────────┘

Summary:
Files scanned: 847
Duration: 2.3s

Results:
●●● High: 3
●● Medium: 6
● Low: 3
Total: 12
```

## Installation

```bash
# From source
git clone https://github.com/johsam/scry.git
cd scry
bun install
bun run dev scan .

# From npm (coming soon)
npm install -g scry
scry scan .
```

## Usage

### Basic Scanning

```bash
# Current directory
scry scan

# Specific path
scry scan ./src

# Multiple paths
scry scan ./src ./tests
```

### Output Formats

```bash
# Table (default) - Detailed with colors
scry scan . --output table

# Compact - Minimal, file-grouped output
scry scan . --output compact

# JSON - For CI/CD integration
scry scan . --output json > results.json

# Markdown - For reports and documentation
scry scan . --output markdown > SECURITY.md
```

**See [Output Formats Guide](./docs/output-formats.md) for detailed examples and use cases.**

### Filter by Severity

```bash
# Only show high severity issues
scry scan . --min-severity high

# Show medium and high severity issues
scry scan . --min-severity medium

# Show all issues (default)
scry scan . --min-severity low
```

**Severity levels:** `high` (critical), `medium` (significant), `low` (minor)

### Strict Mode

```bash
# Fail with exit code 1 if any issues found
scry scan . --strict
```

## Configuration

Create `.scryrc.json` in your project root:

```json
{
  "rules": {
    "hardcoded-secrets": "error",
    "eval-usage": "error",
    "jwt-storage": "error",
    "cookie-security": "warn",
    "cors-config": "warn",
    "env-exposure": "error",
    "weak-crypto": "error",
    "password-security": "error"
  },
  "ignore": ["**/tests/**", "**/fixtures/**", "**/mocks/**"],
  "extensions": [".js", ".ts", ".jsx", ".tsx"],
  "strict": false,
  "minSeverity": "low",
  "showFixes": true,
  "showExplanations": true
}
```

## Why scry?

Modern developers ship code fast, often faster than they can think about security.

While powerful tools like linters exist, many:

- Focus on rules without context
- Assume prior security knowledge
- Overwhelm with noise

**scry is different:**

- Opinionated, not exhaustive
- Educational, not noisy
- Focused on real-world security footguns

## Contributing

Contributions welcome! Areas to help:

- [ ] Add more security rules
- [ ] Framework-specific rules (React, Vue, Angular)
- [ ] VS Code extension
- [ ] CI/CD integrations
- [ ] Better regex patterns
- [ ] Documentation improvements

## License

MIT

## Built with

- **TypeScript** - Type safety
- **Bun** - Fast runtime
- **Commander.js** - CLI framework
- **Chalk** - Terminal colors
- **Glob** - File matching

---

**Built for the GitHub Copilot CLI Challenge**

Demonstrate how GitHub Copilot CLI enhanced the development process - See [docs/screenshots](docs/screenshots)
