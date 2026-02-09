# Scry CLI Commands

All commands use `bun scan` with the `examples/vulnerable-app` path for scanning the vulnerable demo app. You can replace this with any path to scan your own code.

*** Note ***: In development, you can run the CLI with `bun run dev scan ...`. The examples below use `bun scan ...`, which works because `scan` is exposed as a script in `package.json`. After building and installing the package (using the `bin` entry), you can run the installed binary directly as `scry scan ...`.


## Basic Commands

### Simple Directory Scan
```bash
bun scan examples/vulnerable-app
```

### Single File Scan
```bash
bun scan examples/vulnerable-app/vulnerable-code.ts
```

---

## Output Format Options

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

## Severity Filtering

### Scan with Minimum Severity (Low)
```bash
bun scan examples/vulnerable-app --min-severity low
```

### Scan with Minimum Severity (Medium)
```bash
bun scan examples/vulnerable-app --min-severity medium
```

### Scan with Minimum Severity (High)
```bash
bun scan examples/vulnerable-app --min-severity high
```

---

## Strict Mode

### Enable Strict Mode (Fails on Any Finding)
```bash
bun scan examples/vulnerable-app --strict
```

### Strict Mode with JSON Output
```bash
bun scan examples/vulnerable-app --strict --output json
```

---

## Detailed Information Options

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

## Configuration File Options

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

## Ignore Patterns

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

## Combined Single File Scan Commands

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

## Combined Directory Scan Commands

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

## File-Specific Scans with All Options

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

## Output Redirection Examples

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

## Advanced Combinations

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

### Automated CI/CD Check
```bash
bun scan examples/vulnerable-app --strict --output json --min-severity medium
```

### Development Feedback
```bash
bun scan examples/vulnerable-app --explain --fix --output table
```

---

## Help

To view help information:
```bash
bun scan --help
```

