# Scry Configuration

Scry supports configuration via a `.scryrc.json` file to customize scanning behavior, rule settings, and output preferences.

## Configuration File Location

Scry will automatically look for a configuration file in the following order:

1. Path specified via `--config` CLI option
2. `.scryrc.json` in the current working directory
3. `.scryrc` in the current working directory

## Configuration Schema

The configuration file follows a JSON schema located at `.scryrc.schema.json`. Most modern editors will provide autocomplete and validation when the `$schema` property is set.

### Example Configuration

```json
{
  "$schema": "./.scryrc.schema.json",
  "rules": {
    "hardcoded-secrets": "error",
    "eval-usage": "error",
    "weak-crypto": "warn",
    "jwt-storage": "off"
  },
  "ignore": ["**/node_modules/**", "**/dist/**", "**/*.test.ts"],
  "extensions": [".js", ".ts", ".jsx", ".tsx"],
  "output": "table",
  "strict": false,
  "minSeverity": "low",
  "showFixes": true,
  "showExplanations": true
}
```

## Configuration Options

### `rules`

Configure individual rules. Each rule can be configured using:

**Shorthand notation:**

- `"off"` - Disable the rule
- `"warn"` - Enable with medium severity
- `"error"` - Enable with high severity

**Full configuration object:**

```json
{
  "rule-id": {
    "enabled": true,
    "severity": "high",
    "options": {
      "customOption": "value"
    }
  }
}
```

**Example:**

```json
{
  "rules": {
    "hardcoded-secrets": "error",
    "eval-usage": {
      "enabled": true,
      "severity": "high"
    },
    "weak-crypto": "off"
  }
}
```

### `ignore`

Array of glob patterns for files and directories to exclude from scanning.

**Default:**

```json
[
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
  "**/.next/**",
  "**/coverage/**"
]
```

**Example:**

```json
{
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/*.test.ts",
    "**/fixtures/**"
  ]
}
```

### `extensions`

Array of file extensions to scan.

**Default:**

```json
[".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"]
```

**Example:**

```json
{
  "extensions": [".js", ".ts", ".vue", ".svelte"]
}
```

### `output`

Output format for scan results.

**Type:** `"table" | "json" | "markdown" | "compact"`

**Default:** `"table"`

### `strict`

Exit with error code (1) if any findings are detected.

**Type:** `boolean`

**Default:** `false`

### `minSeverity`

Minimum severity level to report findings.

**Type:** `"low" | "medium" | "high"`

**Default:** `"low"`

### `showFixes`

Display fix suggestions in the output.

**Type:** `boolean`

**Default:** `true`

### `showExplanations`

Display detailed explanations for findings.

**Type:** `boolean`

**Default:** `true`

## Configuration Priority

When multiple configuration sources are present, Scry merges them with the following priority (highest to lowest):

1. **CLI Options** - Flags passed via command line
2. **Config File** - Settings from `.scryrc.json`
3. **Default Config** - Built-in defaults

### Example Priority

If you have this in `.scryrc.json`:

```json
{
  "output": "table",
  "strict": false
}
```

And run:

```bash
scry scan --output json --strict
```

The final configuration will be:

- `output`: `"json"` (from CLI)
- `strict`: `true` (from CLI)

## Usage Examples

### Using Custom Config Path

```bash
scry scan --config ./config/custom-scry.json
```

### Auto-Discovery

Place `.scryrc.json` in your project root:

```bash
scry scan
```

Scry will automatically discover and use the configuration file.

### Override Config with CLI

```bash
scry scan --output json --strict
```

CLI options override config file settings.

### Disable Specific Rules

```json
{
  "rules": {
    "eval-usage": "off",
    "hardcoded-secrets": "error"
  }
}
```

### Project-Specific Configuration

Create a `.scryrc.json` in each project with custom rules:

```json
{
  "rules": {
    "hardcoded-secrets": "error",
    "jwt-storage": "error",
    "password-security": "error"
  },
  "ignore": ["**/node_modules/**", "**/test/**", "**/*.spec.ts"],
  "strict": true,
  "minSeverity": "medium"
}
```

## Validation

The configuration file is validated when loaded. If there are any errors:

- Invalid JSON syntax → Error with details
- Missing config file (when specified via `--config`) → Error
- Invalid property values → Error with explanation
- Unknown properties → Ignored

## Editor Support

For the best experience, ensure your editor supports JSON Schema. Popular editors like VS Code will automatically provide:

- Autocomplete for configuration options
- Validation and error highlighting
- Hover documentation

Add this to your `.scryrc.json`:

```json
{
  "$schema": "./.scryrc.schema.json"
}
```

## See Also

- [Examples](/examples/.scryrc.json) - Sample configuration file
- [Rules Documentation](./rules) - Available security rules
