# scry

**A security-focused CLI that reveals hidden risks in JavaScript and Node.js codebases.**

> In fantasy, _to scry_ means to reveal hidden truths. `scry` applies the same idea to code.

## What is scry?

**scry** is a command-line security scanner that detects common but dangerous security mistakes in JavaScript/TypeScript projects and provides:

- **Clear explanations** of why each issue is risky  
- **Actionable fixes** with code examples  
- **Educational context** to build security awareness  
- **Fast, focused scanning** without overwhelming noise

## Quick Start

Install globally from npm:

```bash
# Install globally
npm install -g @johsam-f/scry

# Or use with npx (no installation required)
npx @johsam-f/scry scan .
```

Install locally from npm:

```bash
#install locally
npm install @johsam-f/scry

```

Basic usage:

```bash
# Scan current directory
scry scan .

# Scan specific path
scry scan ./src

# Strict mode (exit code 1 if issues found)
scry scan . --strict

# Output as JSON
scry scan . --output json

# Show explanations and fixes
scry scan . --explain --fix
```

See [commands.md](./commands.md) for a comprehensive list of all available commands and options.

## Command Reference

See [commands.md](./commands.md) for a comprehensive list of all available commands and options, including:

- Single file and directory scans
- All output formats (table, json, markdown, compact)
- Severity filtering
- Strict mode
- Explanations and fixes
- Configuration file usage
- And much more!

## What scry Detects

### Security Rules

1. **Hardcoded Secrets** - API keys, tokens, passwords, AWS credentials
2. **JWT in Client Storage** - JWT tokens in localStorage/sessionStorage
3. **Insecure Cookies** - Missing httpOnly, secure, sameSite flags
4. **eval() Usage** - Dangerous code execution
5. **CORS Misconfiguration** - Overly permissive CORS settings
6. **.env Exposure** - Environment files in version control or public directories
7. **Weak Cryptography** - MD5, SHA1, DES, unsalted hashing, low iterations
8. **Password Security** - Plaintext storage, weak validation, insecure transmission

## Example Output

Table format (default):

```
Severity | Rule               | File          | Line | Message
---------|--------------------| --------------|------|---------------------
HIGH     | hardcoded-secrets  | src/config.ts | 14   | Hardcoded API key
HIGH     | jwt-storage        | src/auth.ts   | 28   | JWT in localStorage
MEDIUM   | cors-config        | src/server.ts | 45   | Permissive CORS

Summary:
Files scanned: 847
Duration: 2.3s

Results:
HIGH:    3
MEDIUM:  6
LOW:     3
Total:   12
```

## Installation

### For End Users

```bash
# Install globally
npm install -g @johsam-f/scry

# Or use with npx (no installation required)
npx @johsam-f/scry scan .
```

### For Development

```bash
# Clone and run from source
git clone https://github.com/johsam-f/scry.git
cd scry
bun install
bun run dev scan .
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for development commands and testing instructions.

## Usage

### Basic Scanning

```bash
# Current directory
scry scan

# Specific path
scry scan ./src
```

### Output Formats

```bash
# Table (default) - Clean summary with findings table
scry scan . --output table

# Add detailed explanations for each finding
scry scan . --explain

# Add suggested fixes for each finding
scry scan . --fix

# Show both explanations and fixes
scry scan . --explain --fix

# Compact - Minimal, file-grouped output
scry scan . --output compact

# JSON - For CI/CD integration
scry scan . --output json > results.json

# Markdown - For reports and documentation
scry scan . --output markdown > SECURITY.md
```

Supported formats: `table` (default), `compact`, `json`, `markdown`

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

## Documentation

For more detailed information, see:

- [Installation Guide](docs/INSTALLATION_GUIDE.md) - Setup and configuration
- [Security Rules Guide](docs/SECURITY_RULES_GUIDE.md) - Detailed rule documentation
- [Copilot Impact](docs/COPILOT_IMPACT.md) - How GitHub Copilot CLI enhanced development
- [Configuration Reference](docs/configuration.md) - Configuration file options
- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md) - Architecture and development

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

## Built for the GitHub Copilot CLI Challenge

This project was created for the [GitHub Copilot CLI Challenge](https://dev.to/challenges/github-2026-01-21) and demonstrates how GitHub Copilot CLI can accelerate security tool development.

**Key Achievement Highlights:**

- 8 security rules implemented with Copilot-assisted pattern generation
- Comprehensive test coverage with AI-generated test cases
- Multiple output formatters for different workflows
- Full configuration file support for flexible deployments

For detailed information on how Copilot CLI enhanced the development process, see [Copilot Impact Documentation](docs/copilot%20workings).

## Technology Stack

- **Bun** - Fast JavaScript runtime
- **TypeScript** - Type-safe development
- **Commander.js** - CLI framework
- **Chalk** - Terminal colors
- **Glob** - File pattern matching

## Support

For questions or issues, please check the [documentation](docs/) or create an issue on GitHub.
