# Scry CLI Commands

This guide shows all available commands for the `scry` CLI tool.

> Install scry with `npm install -g @johsam-f/scry` or use `npx @johsam-f/scry` without installation.
>
> All examples use `scry scan` with the default path `.` or specific paths you want to scan. For development/testing commands using Bun, see [DEVELOPMENT.md](./DEVELOPMENT.md).


## Basic Commands

### Command structure:
```bash
scry scan [path] [options]
```

### Simple Directory Scan
```bash
scry scan .
scry scan ./my-project
```

### Single File Scan
```bash
scry scan ./src/index.ts
```

---

## Output Format Options

### Compact Output
```bash
scry scan . --output compact
scry scan . -o compact
```

### Markdown Output
```bash
scry scan . --output markdown
scry scan . -o markdown
```

### Table Output (Default)
```bash
scry scan . --output table
scry scan . -o table
```


### JSON Output
```bash
scry scan . --output json
scry scan . -o json
```

---

## Severity Filtering

### Scan with Minimum Severity (Low)
```bash
scry scan . --min-severity low
```

### Scan with Minimum Severity (Medium)
```bash
scry scan . --min-severity medium
```

### Scan with Minimum Severity (High)
```bash
scry scan . --min-severity high
```

---

## Strict Mode

### Enable Strict Mode (Fails on Any Finding)
```bash
scry scan . --strict
```

### Strict Mode with JSON Output
```bash
scry scan . --strict --output json
```

---

## Detailed Information Options

### Show Explanations for Findings
```bash
scry scan . --explain
```

### Show Suggested Fixes
```bash
scry scan . --fix
```

### Show Both Explanations and Fixes
```bash
scry scan . --explain --fix
```

---

## Configuration File Options

### Scan with Config File
```bash
scry scan . --config .scryrc.json
```

### Scan with Config and Output Format
```bash
scry scan . --config .scryrc.json --output json
```

### Scan with Config and Strict Mode
```bash
scry scan . --config .scryrc.json --strict
```

---

## Ignore Patterns

### Ignore Additional Patterns
```bash
scry scan . --ignore "**/*.test.ts"
```

### Ignore Multiple Patterns
```bash
scry scan . --ignore "**/*.test.ts" "**/*.spec.ts"
```

### Ignore with Output Format
```bash
scry scan . --ignore "**/*.test.ts" --output json
```

---

## Combined Single File Scan Commands

### Single File with JSON Output
```bash
scry scan ./src/index.ts --output json
```

### Single File with Explanations
```bash
scry scan ./src/index.ts --explain
```

### Single File with Fixes
```bash
scry scan ./src/index.ts --fix
```

### Single File with Explanations and Fixes
```bash
scry scan ./src/index.ts --explain --fix
```

### Single File with Strict Mode
```bash
scry scan ./src/index.ts --strict
```

### Single File with Minimum Severity Filter
```bash
scry scan ./src/index.ts --min-severity medium
```

### Single File with Config
```bash
scry scan ./src/index.ts --config .scryrc.json
```

---

## Combined Directory Scan Commands

### Directory Scan with JSON Output and Explanations
```bash
scry scan . --output json --explain
```

### Directory Scan with JSON Output and Fixes
```bash
scry scan . --output json --fix
```

### Directory Scan with JSON Output, Explanations, and Fixes
```bash
scry scan . --output json --explain --fix
```

### Directory Scan with Markdown Output and Explanations
```bash
scry scan . --output markdown --explain
```

### Directory Scan Strict Mode with High Severity Only
```bash
scry scan . --strict --min-severity high
```

### Directory Scan Medium Severity with Explanations
```bash
scry scan . --min-severity medium --explain
```

### Directory Scan with Config and JSON Output
```bash
scry scan . --config .scryrc.json --output json
```

### Directory Scan with Config, Strict Mode, and Fixes
```bash
scry scan . --config .scryrc.json --strict --fix
```

### Directory Scan with Ignore Patterns and JSON Output
```bash
scry scan . --ignore "**/*.test.ts" "**/*.spec.ts" --output json
```

### Directory Scan with All Options Combined
```bash
scry scan . --output json --strict --min-severity medium --explain --fix --ignore "**/*.test.ts"
```

---

## File-Specific Scans with All Options

### Scan Specific File with All Options
```bash
scry scan ./src/auth.ts --output json --strict --min-severity medium --explain --fix
```

### Scan File with JSON and Explanations
```bash
scry scan ./src/utils.ts --output json --explain
```

### Scan File with Markdown and Fixes
```bash
scry scan ./src/config.ts --output markdown --fix
```

### Scan File with Strict Mode
```bash
scry scan ./src/api.ts --strict --output json
```

### Scan File with High Severity Filter
```bash
scry scan ./src/crypto.ts --min-severity high --explain
```

---

## Output Redirection Examples

### Save JSON Output to File
```bash
scry scan . --output json > scan-results.json
```

### Save Markdown Output to File
```bash
scry scan . --output markdown > scan-report.md
```

### Save Table Output to File
```bash
scry scan . --output table > scan-report.txt
```

### Save with Timestamp
```bash
scry scan . --output json > scan-$(date +%Y%m%d-%H%M%S).json
```

---

## Environment Variables

### Enable Verbose Mode
```bash
VERBOSE=1 scry scan .
```

### Enable Debug Mode
```bash
DEBUG=1 scry scan .
```

### Verbose with JSON Output
```bash
VERBOSE=1 scry scan . --output json
```

---

## Advanced Combinations

### Comprehensive Security Audit
```bash
scry scan . --output json --explain --fix --min-severity low > audit.json
```

### Strict Security Review
```bash
scry scan . --strict --min-severity high --explain
```

### Quick Medium-Level Check
```bash
scry scan . --output compact --min-severity medium
```

### Generate Documentation
```bash
scry scan . --output markdown --explain > SECURITY_FINDINGS.md
```

### Automated CI/CD Check
```bash
scry scan . --strict --output json --min-severity medium
```

### Development Feedback
```bash
scry scan . --explain --fix --output table
```

---

## Help

To view help information:
```bash
scry scan --help
```

