# Development Guide

This guide is for developers working on the `scry` project itself. For end-user commands, see [commands.md](./commands.md).

## Setup

```bash
# Clone the repository
git clone https://github.com/johsam-f/scry.git
cd scry

# Install dependencies
bun install

# Run in development mode
bun run dev scan .
```

## Development Commands

All development commands use `bun scan` (which runs via the `scan` script in `package.json`) or `bun run dev scan` for direct execution.

### Testing with the Vulnerable App

The `examples/vulnerable-app` directory contains intentionally vulnerable code for testing scry's detection capabilities.

---

## Basic Development Commands

### Quick Development Scan
```bash
bun run dev scan .
bun run dev scan examples/vulnerable-app
```

### Using the Package Script
```bash
bun scan examples/vulnerable-app
bun scan examples/vulnerable-app/vulnerable-code.ts
```

---

## Testing Output Formats

### Compact Output
```bash
bun scan examples/vulnerable-app --output compact
bun scan examples/vulnerable-app -o compact
```

### Markdown Output
```bash
bun scan examples/vulnerable-app --output markdown
bun scan examples/vulnerable-app -o markdown
```

### Table Output (Default)
```bash
bun scan examples/vulnerable-app --output table
bun scan examples/vulnerable-app -o table
```

### JSON Output
```bash
bun scan examples/vulnerable-app --output json
bun scan examples/vulnerable-app -o json
```

---

## Testing Severity Filtering

### Minimum Severity: Low
```bash
bun scan examples/vulnerable-app --min-severity low
```

### Minimum Severity: Medium
```bash
bun scan examples/vulnerable-app --min-severity medium
```

### Minimum Severity: High
```bash
bun scan examples/vulnerable-app --min-severity high
```

---

## Testing Strict Mode

### Enable Strict Mode (Fails on Any Finding)
```bash
bun scan examples/vulnerable-app --strict
```

### Strict Mode with JSON Output
```bash
bun scan examples/vulnerable-app --strict --output json
```

---

## Testing Detailed Information Options

### Show Explanations for Findings
```bash
bun scan examples/vulnerable-app --explain
```

### Show Suggested Fixes
```bash
bun scan examples/vulnerable-app --fix
```

### Show Both Explanations and Fixes
```bash
bun scan examples/vulnerable-app --explain --fix
```

---

## Testing Configuration File Options

### Scan with Config File
```bash
bun scan examples/vulnerable-app --config .scryrc.json
```

### Scan with Config and Output Format
```bash
bun scan examples/vulnerable-app --config .scryrc.json --output json
```

### Scan with Config and Strict Mode
```bash
bun scan examples/vulnerable-app --config .scryrc.json --strict
```

---

## Testing Ignore Patterns

### Ignore Additional Patterns
```bash
bun scan examples/vulnerable-app --ignore "**/*.test.ts"
```

### Ignore Multiple Patterns
```bash
bun scan examples/vulnerable-app --ignore "**/*.test.ts" "**/*.spec.ts"
```

### Ignore with Output Format
```bash
bun scan examples/vulnerable-app --ignore "**/*.test.ts" --output json
```

---

## Testing Single File Scans

### Single File with JSON Output
```bash
bun scan examples/vulnerable-app/vulnerable-code.ts --output json
```

### Single File with Explanations
```bash
bun scan examples/vulnerable-app/vulnerable-code.ts --explain
```

### Single File with Fixes
```bash
bun scan examples/vulnerable-app/vulnerable-code.ts --fix
```

### Single File with Explanations and Fixes
```bash
bun scan examples/vulnerable-app/vulnerable-code.ts --explain --fix
```

### Single File with Strict Mode
```bash
bun scan examples/vulnerable-app/vulnerable-code.ts --strict
```

### Single File with Minimum Severity Filter
```bash
bun scan examples/vulnerable-app/vulnerable-code.ts --min-severity medium
```

### Single File with Config
```bash
bun scan examples/vulnerable-app/vulnerable-code.ts --config .scryrc.json
```

---

## Testing Complex Combinations

### Directory Scan with JSON Output and Explanations
```bash
bun scan examples/vulnerable-app --output json --explain
```

### Directory Scan with JSON Output and Fixes
```bash
bun scan examples/vulnerable-app --output json --fix
```

### Directory Scan with JSON Output, Explanations, and Fixes
```bash
bun scan examples/vulnerable-app --output json --explain --fix
```

### Directory Scan with Markdown Output and Explanations
```bash
bun scan examples/vulnerable-app --output markdown --explain
```

### Directory Scan Strict Mode with High Severity Only
```bash
bun scan examples/vulnerable-app --strict --min-severity high
```

### Directory Scan Medium Severity with Explanations
```bash
bun scan examples/vulnerable-app --min-severity medium --explain
```

### Directory Scan with Config and JSON Output
```bash
bun scan examples/vulnerable-app --config .scryrc.json --output json
```

### Directory Scan with Config, Strict Mode, and Fixes
```bash
bun scan examples/vulnerable-app --config .scryrc.json --strict --fix
```

### Directory Scan with Ignore Patterns and JSON Output
```bash
bun scan examples/vulnerable-app --ignore "**/*.test.ts" "**/*.spec.ts" --output json
```

### Directory Scan with All Options Combined
```bash
bun scan examples/vulnerable-app --output json --strict --min-severity medium --explain --fix --ignore "**/*.test.ts"
```

---

## Testing Specific Vulnerable Files

### Scan auth-vulnerable.ts with All Options
```bash
bun scan examples/vulnerable-app/auth-vulnerable.ts --output json --strict --min-severity medium --explain --fix
```

### Scan bad-code.ts with JSON and Explanations
```bash
bun scan examples/vulnerable-app/bad-code.ts --output json --explain
```

### Scan config-vulnerable.ts with Markdown and Fixes
```bash
bun scan examples/vulnerable-app/config-vulnerable.ts --output markdown --fix
```

### Scan cors-eval-vulnerable.ts with Strict Mode
```bash
bun scan examples/vulnerable-app/cors-eval-vulnerable.ts --strict --output json
```

### Scan crypto-vulnerable.ts with High Severity Filter
```bash
bun scan examples/vulnerable-app/crypto-vulnerable.ts --min-severity high --explain
```

---

## Output Redirection for Testing

### Save JSON Output to File
```bash
bun scan examples/vulnerable-app --output json > scan-results.json
```

### Save Markdown Output to File
```bash
bun scan examples/vulnerable-app --output markdown > scan-report.md
```

### Save Table Output to File
```bash
bun scan examples/vulnerable-app --output table > scan-report.txt
```

### Save with Timestamp
```bash
bun scan examples/vulnerable-app --output json > scan-$(date +%Y%m%d-%H%M%S).json
```

---

## Environment Variables

### Enable Verbose Mode
```bash
VERBOSE=1 bun scan examples/vulnerable-app
```

### Enable Debug Mode
```bash
DEBUG=1 bun scan examples/vulnerable-app
```

### Verbose with JSON Output
```bash
VERBOSE=1 bun scan examples/vulnerable-app --output json
```

---

## Advanced Test Scenarios

### Comprehensive Security Audit
```bash
bun scan examples/vulnerable-app --output json --explain --fix --min-severity low > audit.json
```

### Strict Security Review
```bash
bun scan examples/vulnerable-app --strict --min-severity high --explain
```

### Quick Medium-Level Check
```bash
bun scan examples/vulnerable-app --output compact --min-severity medium
```

### Generate Documentation
```bash
bun scan examples/vulnerable-app --output markdown --explain > SECURITY_FINDINGS.md
```

### Automated CI/CD Check Simulation
```bash
bun scan examples/vulnerable-app --strict --output json --min-severity medium
```

### Development Feedback Loop
```bash
bun scan examples/vulnerable-app --explain --fix --output table
```

---

## Building and Testing the Package

### Build the Package
```bash
bun run build
```

### Test the Built Package Locally
```bash
# After building, link the package globally
npm link

# Test the global installation
scry scan examples/vulnerable-app

# Unlink when done
npm unlink -g @johsam-f/scry
```

### Test with npx (Local Package)
```bash
# Pack the package
npm pack

# Install from the tarball
npm install -g johsam-f-scry-0.1.0.tgz

# Test it
scry scan examples/vulnerable-app
```

---

## Running Tests

### Run All Tests
```bash
bun test
```

### Type Check
```bash
bun run type-check
```

### Lint
```bash
bun run lint
bun run lint:fix
```

### Format
```bash
bun run format
bun run format:fix
```

### Full CI Check
```bash
bun run ci
```

---

## Help

View help information:
```bash
bun scan --help
bun run dev scan --help
```

---

## Publishing

### Before Publishing
```bash
# Ensure everything is built and tested
bun run ci

# Build the package
bun run build

# Test the build
npm link
scry scan examples/vulnerable-app
npm unlink -g @johsam-f/scry
```

### Publish to npm
```bash
npm publish --access public
```

---

## Tips for Development

1. **Use `bun run dev scan`** for quick iterations without building
2. **Test with `examples/vulnerable-app`** which contains all vulnerability types
3. **Use `--explain --fix`** to verify rule documentation is working
4. **Test output formats** to ensure all formatters work correctly
5. **Run CI checks** before committing: `bun run ci`
6. **Use strict mode** to test exit codes: `bun scan . --strict`
