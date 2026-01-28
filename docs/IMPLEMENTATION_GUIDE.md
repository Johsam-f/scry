# scry Implementation Guide

Complete step-by-step guide for building scry from scratch.

---

## Project Structure

```
scry/
├── src/
│   ├── cli/
│   │   ├── index.ts           # CLI entry point
│   │   ├── commands/
│   │   │   ├── scan.ts        # Scan command
│   │   │   └── explain.ts     # Explain command
│   │   └── options.ts         # CLI options parser
│   ├── scanner/
│   │   ├── index.ts           # Main scanner orchestrator
│   │   ├── fileScanner.ts     # File traversal
│   │   ├── ruleEngine.ts      # Rule execution engine
│   │   └── ignore.ts          # .gitignore handling
│   ├── rules/
│   │   ├── index.ts           # Rule registry
│   │   ├── base.ts            # Base rule interface
│   │   ├── hardcodedSecrets.ts
│   │   ├── jwtStorage.ts
│   │   ├── cookieSecurity.ts
│   │   ├── evalUsage.ts
│   │   ├── corsConfig.ts
│   │   ├── envExposure.ts
│   │   ├── weakCrypto.ts
│   │   └── passwordPatterns.ts
│   ├── output/
│   │   ├── formatters/
│   │   │   ├── table.ts       # Table output
│   │   │   ├── json.ts        # JSON output
│   │   │   └── markdown.ts    # Markdown output
│   │   └── renderer.ts        # Output renderer
│   ├── config/
│   │   ├── loader.ts          # Config file loader
│   │   └── defaults.ts        # Default configuration
│   └── types/
│       ├── findings.ts        # Finding types
│       ├── rules.ts           # Rule types
│       └── config.ts          # Config types
├── tests/
│   ├── rules/                 # Rule tests
│   ├── scanner/               # Scanner tests
│   └── fixtures/              # Test fixtures
├── examples/
│   └── vulnerable-app/        # Demo vulnerable code
├── docs/                      # Documentation
├── package.json
├── tsconfig.json
└── README.md
```

---

## Phase 1: CLI Infrastructure

### Step 1: Set up Commander.js

```typescript
// src/cli/index.ts
import { Command } from "commander";
import { scanCommand } from "./commands/scan";
import { version } from "../../package.json";

const program = new Command();

program
  .name("scry")
  .description("Security-focused CLI that reveals hidden risks in your code")
  .version(version);

program
  .command("scan")
  .description("Scan a directory for security issues")
  .argument("[path]", "Path to scan", ".")
  .option(
    "-o, --output <format>",
    "Output format (table, json, markdown)",
    "table",
  )
  .option("--strict", "Enable strict mode (fail on any finding)")
  .option(
    "--min-severity <level>",
    "Minimum severity to report (low, medium, high)",
    "low",
  )
  .option("--config <path>", "Path to config file")
  .option("--ignore <patterns...>", "Additional patterns to ignore")
  .action(scanCommand);

program.parse();
```

### Step 2: File Scanner

```typescript
// src/scanner/fileScanner.ts
import { glob } from "glob";
import { readFile } from "fs/promises";
import { join } from "path";

export interface ScanOptions {
  path: string;
  ignore?: string[];
  extensions?: string[];
}

export async function scanFiles(options: ScanOptions): Promise<string[]> {
  const {
    path,
    ignore = [],
    extensions = [".js", ".ts", ".jsx", ".tsx"],
  } = options;

  const pattern = `${path}/**/*{${extensions.join(",")}}`;

  const files = await glob(pattern, {
    ignore: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      ...ignore,
    ],
    absolute: true,
  });

  return files;
}

export async function readFileContent(filePath: string): Promise<string> {
  return readFile(filePath, "utf-8");
}
```

---

## Phase 2: Rule Engine

### Base Rule Interface

```typescript
// src/rules/base.ts
export type Severity = "high" | "medium" | "low";

export interface Finding {
  rule: string;
  severity: Severity;
  file: string;
  line: number;
  column?: number;
  message: string;
  snippet: string;
  explanation: string;
  fix: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  check(content: string, filePath: string): Promise<Finding[]>;
}
```

### Example Rule: Hardcoded Secrets

```typescript
// src/rules/hardcodedSecrets.ts
import { Rule, Finding, Severity } from "./base";

const SECRET_PATTERNS = [
  {
    name: "AWS Access Key",
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: "high" as Severity,
  },
  {
    name: "Generic API Key",
    pattern: /['"](api[_-]?key|apikey)['"]\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
    severity: "high" as Severity,
  },
  {
    name: "Private Key",
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
    severity: "high" as Severity,
  },
  {
    name: "Generic Secret",
    pattern:
      /['"](secret|password|passwd|pwd)['"]\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
    severity: "medium" as Severity,
  },
];

export const hardcodedSecretsRule: Rule = {
  id: "hardcoded-secrets",
  name: "Hardcoded Secrets",
  description: "Detects hardcoded secrets, API keys, and credentials",
  severity: "high",

  async check(content: string, filePath: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const lines = content.split("\n");

    for (const pattern of SECRET_PATTERNS) {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split("\n").length;
        const line = lines[lineNumber - 1];

        findings.push({
          rule: this.id,
          severity: pattern.severity,
          file: filePath,
          line: lineNumber,
          message: `Hardcoded ${pattern.name} detected`,
          snippet: line.trim(),
          explanation:
            "Hardcoded secrets can be exposed through source control, logs, or decompiled code. This poses a significant security risk.",
          fix:
            "Move secrets to environment variables:\n" +
            "1. Add to .env file (ensure .env is in .gitignore)\n" +
            "2. Access via process.env.SECRET_NAME\n" +
            "3. Use a secrets manager for production (AWS Secrets Manager, Azure Key Vault, etc.)",
        });
      }
    }

    return findings;
  },
};
```

---

## Phase 3: Output Formatting

### Table Formatter

```typescript
// src/output/formatters/table.ts
import chalk from "chalk";
import { table } from "table";
import { Finding } from "../../types/findings";

export function formatAsTable(findings: Finding[]): string {
  if (findings.length === 0) {
    return chalk.green("✓ No security issues found!");
  }

  const data = [["Severity", "Rule", "File", "Line", "Message"]];

  for (const finding of findings) {
    const severity = formatSeverity(finding.severity);
    data.push([
      severity,
      finding.rule,
      finding.file,
      finding.line.toString(),
      finding.message,
    ]);
  }

  return table(data);
}

function formatSeverity(severity: string): string {
  switch (severity) {
    case "high":
      return chalk.red("HIGH");
    case "medium":
      return chalk.yellow("MEDIUM");
    case "low":
      return chalk.blue("LOW");
    default:
      return severity;
  }
}
```

---

## Phase 4: Configuration Support

### Config File Format

```typescript
// .scryrc.json
{
  "rules": {
    "hardcoded-secrets": "error",
    "eval-usage": "warn",
    "jwt-storage": "error"
  },
  "ignore": [
    "**/tests/**",
    "**/mocks/**"
  ],
  "extensions": [".js", ".ts", ".jsx", ".tsx"],
  "output": "table",
  "strict": false
}
```

---

## Phase 5: Testing Strategy

### Unit Tests

```typescript
// tests/rules/hardcodedSecrets.test.ts
import { describe, test, expect } from "bun:test";
import { hardcodedSecretsRule } from "../../src/rules/hardcodedSecrets";

describe("hardcodedSecretsRule", () => {
  test("detects AWS access key", async () => {
    const code = `
      const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
    `;

    const findings = await hardcodedSecretsRule.check(code, "test.ts");

    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("high");
    expect(findings[0].message).toContain("AWS Access Key");
  });

  test("no false positives on environment variables", async () => {
    const code = `
      const apiKey = process.env.API_KEY;
    `;

    const findings = await hardcodedSecretsRule.check(code, "test.ts");

    expect(findings).toHaveLength(0);
  });
});
```

---

## Phase 6: GitHub Copilot CLI Integration

### Document Usage

For your DEV.to submission, showcase:

1. **Code Generation:**

   - "Generate regex pattern for detecting JWT tokens"
   - "Create test cases for cookie security rule"

2. **Debugging:**

   - "Why is this regex not matching multiline strings?"
   - "How to handle false positives in secret detection?"

3. **Architecture Decisions:**

   - "Best way to structure a plugin system for custom rules?"
   - "How to efficiently scan large codebases?"

4. **Documentation:**
   - "Generate JSDoc comments for this rule engine"
   - "Create usage examples for README"

---

## Key Implementation Tips

### 1. Start Simple

Build one complete rule end-to-end before adding complexity.

### 2. Handle Edge Cases

- Binary files
- Very large files (>10MB)
- Permission errors
- Symlinks

### 3. Performance

- Use streaming for large files
- Parallel rule execution
- Cache file reads

### 4. User Experience

- Clear progress indicators
- Helpful error messages
- Actionable fix suggestions
- Color-coded output

### 5. False Positives

- Allow comment-based ignoring: `// scry-ignore`
- Context-aware detection
- Configurable sensitivity

---

## Next Steps

1. ✅ Read this guide
2. Install dependencies
3. Start with CLI structure
4. Implement first rule
5. Add tests
6. Iterate and expand
