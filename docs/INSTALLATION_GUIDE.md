# Installation Guide

A comprehensive guide to installing and setting up scry on your system.

---

## System Requirements

- **Node.js / Bun Runtime:** Bun 1.0.0 or higher (recommended) OR Node.js 16+
- **Operating System:** macOS, Linux, or Windows
- **Memory:** Minimum 512MB RAM
- **Disk Space:** ~200MB for installation

---

## Installation Methods

### Method 1: From npm

```bash
npm install -g @johsam-f/scry
```

locally:

```bash
npm install @johsam-f/scry
```

Or with yarn:

```bash
yarn global add @johsam-f/scry
```

### Method 2: From Source (Current)

For the latest development version:

```bash
# Clone the repository
git clone https://github.com/johsam/scry.git
cd scry

# Install dependencies
bun install

# Run directly
bun run dev scan .

# Or build for distribution
bun run build
./dist/scry scan .
```

### Method 3: Docker (Optional)

```bash
docker build -t scry .
docker run -v $(pwd):/scan scry /scan
```

---

## Quick Start

After installation, scan your project:

```bash
# Scan current directory
scry scan .

# Scan specific path
scry scan ./src

# Show only high-severity issues
scry scan . --min-severity high

# Output as JSON
scry scan . --output json
```

---

## Configuration

### Basic Configuration (.scryrc.json)

Create `.scryrc.json` in your project root:

```json
{
  "rules": {
    "hardcoded-secrets": "error",
    "jwt-storage": "error",
    "eval-usage": "error",
    "cookie-security": "warn",
    "cors-config": "warn",
    "env-exposure": "error",
    "weak-crypto": "error",
    "password-security": "error"
  },
  "ignore": [
    "**/node_modules/**",
    "**/tests/**",
    "**/fixtures/**",
    "**/mocks/**",
    "**/.git/**"
  ],
  "extensions": [".js", ".ts", ".jsx", ".tsx"],
  "strict": false,
  "minSeverity": "low",
  "showFixes": true,
  "showExplanations": true
}
```

### Configuration Options

| Option             | Type    | Default              | Description                             |
| ------------------ | ------- | -------------------- | --------------------------------------- |
| `rules`            | object  | All enabled          | Rule severity levels (error, warn, off) |
| `ignore`           | array   | See above            | Paths to ignore during scanning         |
| `extensions`       | array   | .js, .ts, .jsx, .tsx | File extensions to scan                 |
| `strict`           | boolean | false                | Exit with code 1 if issues found        |
| `minSeverity`      | string  | low                  | Minimum severity to report              |
| `showFixes`        | boolean | true                 | Display fix suggestions                 |
| `showExplanations` | boolean | true                 | Show detailed explanations              |

---

## Command-Line Options

### Basic Commands

```bash
scry scan [path]              # Scan directory or file
scry scan . --help            # Show all options
scry scan . --version         # Show version
```

### Output Options

```bash
--output <format>             # table, json, markdown, compact
--output-file <path>          # Write results to file
```

### Filtering Options

```bash
--min-severity <level>        # high, medium, low
--rule <name>                 # Run specific rule only
--ignore <pattern>            # Ignore paths (glob pattern)
```

### Execution Options

```bash
--strict                      # Exit code 1 if issues found
--no-fixes                    # Don't show fix suggestions
--no-explanations             # Don't show detailed explanations
--config <path>               # Use custom config file
```

### Performance Options

```bash
--max-file-size <bytes>       # Skip files larger than this
--max-files <number>          # Stop after scanning N files
--timeout <ms>                # Timeout per file (milliseconds)
```

---

## Verification

Verify your installation works:

```bash
# Show version
scry --version

# Run help command
scry scan --help

# Test with sample vulnerable code
scry scan ./examples
```

Expected output should show:

- Rule violations in example files
- Formatted output with severity levels
- Fix suggestions for each issue

---

## Uninstallation

### NPM Package

```bash
npm uninstall -g @johsam-f/scry
```

### Source Installation

```bash
rm -rf ~/path/to/scry
```

---

## Troubleshooting

### Issue: Command not found

**Solution:** Ensure installation completed successfully and path is configured.

```bash
# Check if installed
which scry

# Add to PATH if necessary
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Issue: Permission denied

**Solution:** Update file permissions.

```bash
chmod +x ./scry
```

### Issue: Module not found errors

**Solution:** Reinstall dependencies.

```bash
# Clear and reinstall
rm -rf node_modules bun.lock
bun install
```

### Issue: Scanning takes too long

**Solution:** Adjust ignore patterns or use file size limits.

```bash
scry scan . --ignore "**/node_modules/**" --max-file-size 1000000
```

---

## Getting Help

- [Read the main README](../README.md)
- [View security rules guide](SECURITY_RULES_GUIDE.md)
- [Check configuration guide](configuration.md)
- [Report issues on GitHub](https://github.com/johsam/scry/issues)

---

**Next Steps:**

- Configure `.scryrc.json` for your project
- Review [Security Rules Guide](SECURITY_RULES_GUIDE.md)
- Check [Configuration Guide](configuration.md) for advanced options
