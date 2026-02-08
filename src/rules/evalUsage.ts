import { BaseRule } from './base';
import type { Finding } from '../types';

export class EvalUsageRule extends BaseRule {
  override id = 'eval-usage';
  override name = 'eval() Usage';
  override description = 'Detects dangerous eval() and similar code execution methods';
  override severity = 'high' as const;
  override tags = ['security', 'code-injection'];

  private patterns = [
    {
      name: 'eval()',
      pattern: /\beval\s*\(/g,
      description: 'Direct eval() call',
    },
    {
      name: 'Function constructor',
      pattern: /new\s+Function\s*\(/g,
      description: 'Function constructor (similar to eval)',
    },
    {
      name: 'setTimeout with string',
      pattern: /setTimeout\s*\(\s*['"`][^'"`]+['"`]/g,
      description: 'setTimeout with string argument',
    },
    {
      name: 'setInterval with string',
      pattern: /setInterval\s*\(\s*['"`][^'"`]+['"`]/g,
      description: 'setInterval with string argument',
    },
  ];

  override async check(content: string, filePath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Only check JavaScript/TypeScript files
    if (!/\.(js|ts|jsx|tsx)$/.test(filePath)) {
      return findings;
    }

    for (const patternConfig of this.patterns) {
      // Create a fresh regex instance to avoid state issues
      const pattern = this.createRegex(patternConfig.pattern);

      // Use timeout-protected execution for safety
      const matches = this.execWithTimeout(pattern, content);

      for (const match of matches) {
        // Skip if in comment using robust detection
        if (this.isInComment(content, match.index)) {
          continue;
        }

        const lineNumber = this.getLineNumber(content, match.index);

        findings.push(
          this.createFinding(
            `Dangerous ${patternConfig.name} detected`,
            content,
            filePath,
            lineNumber,
            `Using eval() and similar functions is extremely dangerous because they execute arbitrary code at runtime. This creates a critical security vulnerability:

1. Code Injection: Attackers can inject malicious code that will be executed with full privileges
2. XSS Vulnerabilities: User input passed to eval() can execute arbitrary JavaScript
3. Data Theft: Attackers can access sensitive data in scope
4. Performance Issues: Dynamic code execution prevents optimization

${patternConfig.description} allows arbitrary code execution and should be avoided.`,
            `Replace ${patternConfig.name} with safer alternatives:

${this.getFixForPattern(patternConfig.name)}

General principles:
- Parse data as JSON instead of evaluating code
- Use object property access instead of dynamic evaluation
- Refactor to avoid the need for dynamic code execution
- If absolutely necessary, sanitize and validate all inputs`
          )
        );
      }
    }

    return findings;
  }

  private getFixForPattern(name: string): string {
    switch (name) {
      case 'eval()':
        return `// [BAD] Using eval
const result = eval(userInput);

// [GOOD] Parse JSON instead
const result = JSON.parse(userInput);

// [GOOD] Use object property access
const obj = { foo: 1, bar: 2 };
const key = 'foo';
const result = obj[key]; // Instead of eval('obj.' + key)`;

      case 'Function constructor':
        return `// [BAD] Using Function constructor
const fn = new Function('a', 'b', 'return a + b');

// [GOOD] Use regular function
const fn = (a, b) => a + b;

// [GOOD] Use predefined function map
const operations = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b
};
const fn = operations[operationType];`;

      case 'setTimeout with string':
        return `// [BAD] setTimeout with string
setTimeout("doSomething()", 1000);

// [GOOD] setTimeout with function reference
setTimeout(() => doSomething(), 1000);
setTimeout(doSomething, 1000);`;

      case 'setInterval with string':
        return `// [BAD] setInterval with string
setInterval("doSomething()", 1000);

// [GOOD] setInterval with function
setInterval(() => doSomething(), 1000);
setInterval(doSomething, 1000);`;

      default:
        return 'Replace with safer alternatives that do not execute arbitrary code.';
    }
  }
}
