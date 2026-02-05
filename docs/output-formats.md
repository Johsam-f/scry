# Output Formats and Filtering

Scry supports multiple output formats and powerful filtering options to customize scan results to your needs.

## Output Formats

Scry provides four output formats, each designed for different use cases:

### Table Format (Default)

The table format provides a clear, structured view of findings with detailed explanations and fixes.

```bash
scry scan --output table
```

**Features:**
- Colorized severity indicators
- Organized table layout
- Summary statistics
- Detailed explanations and fixes (when enabled)

**Example Output:**
```
╔══════════╤═════════════╤═══════════╤══════╤═════════════════════╗
║ Severity │ Rule        │ File      │ Line │ Message             ║
╟──────────┼─────────────┼───────────┼──────┼─────────────────────╢
║ ✖ HIGH   │ eval-usage  │ file.js   │ 10   │ Dangerous eval()    ║
╚══════════╧═════════════╧═══════════╧══════╧═════════════════════╝

Summary:
Files scanned: 25
Duration: 150ms

Results:
✖ High: 2
⚠ Medium: 3
ℹ Low: 1
Total: 6
```

### JSON Format

Machine-readable JSON output for integration with other tools and CI/CD pipelines.

```bash
scry scan --output json
```

**Features:**
- Structured data format
- Easy to parse programmatically
- Includes all finding metadata
- Timestamp for audit trails

**Example Output:**
```json
{
  "findings": [
    {
      "rule": "eval-usage",
      "severity": "high",
      "file": "/path/to/file.js",
      "line": 10,
      "message": "Dangerous eval() detected",
      "snippet": "eval(userInput);",
      "explanation": "...",
      "fix": "...",
      "tags": ["security", "code-injection"]
    }
  ],
  "filesScanned": 25,
  "duration": 150,
  "timestamp": "2026-02-05T03:51:33.765Z"
}
```

### Markdown Format

Generates markdown reports perfect for documentation and GitHub issues.

```bash
scry scan --output markdown
```

**Features:**
- Formatted markdown tables
- Severity-grouped findings
- Code blocks with syntax highlighting
- Ready for GitHub/GitLab/Bitbucket

**Example Output:**
```markdown
# Scry Security Scan Report

## Summary

- **Files Scanned:** 25
- **Duration:** 150ms
- **Total Issues:** 6
- **High Severity:** 2
- **Medium Severity:** 3
- **Low Severity:** 1

## Findings

### 🔴 High Severity

| Rule | File | Line | Message |
|------|------|------|---------|
| `eval-usage` | file.js | 10 | Dangerous eval() detected |
```

### Compact Format

Minimalist output for quick scans and CI/CD environments where space is limited.

```bash
scry scan --output compact
```

**Features:**
- Concise, single-line findings
- Grouped by file
- Color-coded severity
- Quick summary footer

**Example Output:**
```
/path/to/file.js
  ✖ HIGH L10 eval-usage Dangerous eval() detected
  ⚠ MEDIUM L25 weak-crypto MD5 usage detected

/path/to/another.js
  ✖ HIGH L5 hardcoded-secrets API key found

────────────────────────────────────────
2 high 1 medium 0 low | 25 files | 150ms
```

## Severity Filtering

Control which findings are reported based on their severity level.

### Minimum Severity

Filter findings to show only those at or above a certain severity level.

```bash
# Show only high severity findings
scry scan --min-severity high

# Show medium and high severity findings
scry scan --min-severity medium

# Show all findings (default)
scry scan --min-severity low
```

**Severity Levels:**
- `high` - Critical security vulnerabilities (e.g., eval, hardcoded secrets)
- `medium` - Significant security concerns (e.g., weak algorithms)
- `low` - Minor security issues and best practices

### Strict Mode

Exit with error code 1 if any findings are detected, useful for CI/CD pipelines.

```bash
scry scan --strict
```

**Use Cases:**
- Fail CI/CD builds on security findings
- Enforce zero-tolerance security policies
- Block deployments with vulnerabilities

**Example in CI:**
```yaml
# GitHub Actions
- name: Security Scan
  run: scry scan --strict --min-severity high
```

## Configuration File Integration

All output and filtering options can be configured via `.scryrc.json`:

```json
{
  "output": "compact",
  "minSeverity": "medium",
  "strict": true,
  "showFixes": true,
  "showExplanations": true
}
```

**Priority:** CLI options override config file settings.

```bash
# Config says "compact", but CLI overrides to "json"
scry scan --output json
```

## Display Options

Control what information is shown in output:

### Show Explanations

Display detailed explanations for why findings matter (default: true).

```json
{
  "showExplanations": true
}
```

In table/markdown formats, this adds detailed "Why this matters" sections.

### Show Fixes

Display suggested fixes and remediation guidance (default: true).

```json
{
  "showFixes": true
}
```

In table/markdown formats, this adds "Suggested fix" sections with code examples.

## Combining Options

Mix and match options for powerful customization:

### Security-Critical Scan
```bash
scry scan --min-severity high --strict --output json
```
- Only high severity issues
- Fail on any findings
- Machine-readable output

### Development Scan
```bash
scry scan --output compact --min-severity low
```
- All findings
- Quick overview
- Easy to scan visually

### CI/CD Scan
```bash
scry scan --strict --min-severity medium --output json > scan-results.json
```
- Medium and high severity
- Fail build on findings
- Save results for artifacts

### Documentation Scan
```bash
scry scan --output markdown > SECURITY.md
```
- Generate markdown report
- Include all findings
- Commit to repository

## Examples

### Example 1: Quick Local Scan

```bash
scry scan --output compact
```

Fast, minimal output for development.

### Example 2: Detailed Audit

```bash
scry scan --output table
```

Full details with explanations and fixes.

### Example 3: Pre-Commit Hook

```bash
scry scan --strict --min-severity high --output compact
```

Block commits with critical issues.

### Example 4: CI/CD Integration

```bash
scry scan --output json --strict --min-severity medium | tee scan-results.json
```

Generate artifact and fail on findings.

### Example 5: Generate Report

```bash
scry scan --output markdown > docs/security-audit-$(date +%Y%m%d).md
```

Create dated security audit reports.

## Format Comparison

| Format   | Human-Readable | Machine-Readable | Size | Use Case |
|----------|----------------|------------------|------|----------|
| Table    | ✅ Excellent   | ❌ No           | Large | Development, auditing |
| JSON     | ❌ Poor        | ✅ Excellent    | Medium | CI/CD, automation |
| Markdown | ✅ Good        | ⚠️ Partial      | Large | Documentation, reports |
| Compact  | ✅ Good        | ❌ No           | Small | Quick scans, terminals |

## Tips

1. **Use JSON for automation**: Parse findings programmatically in scripts
2. **Use compact for development**: Quick feedback during coding
3. **Use markdown for reports**: Share findings with team in documentation
4. **Use table for audits**: Detailed review with explanations and fixes
5. **Combine with filtering**: Focus on what matters most
6. **Configure per project**: Set defaults in `.scryrc.json`
7. **Override in CI/CD**: Use CLI flags for environment-specific needs

## See Also

- [Configuration Guide](./configuration.md) - Full configuration options
- [Rules Documentation](./rules.md) - Available security rules
- [CLI Reference](../README.md) - Complete command reference
