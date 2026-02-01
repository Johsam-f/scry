import type { Finding, Rule, Severity, ScryConfig } from '../types';
import { scanFiles, readFileContent, getFileExtension, shouldScanFile } from './fileScanner';
import ora from 'ora';

export class Scanner {
  private rules: Map<string, Rule>;
  private config: ScryConfig;

  constructor(rules: Rule[], config: ScryConfig) {
    this.rules = new Map();
    rules.forEach((rule) => {
      this.rules.set(rule.id, rule);
    });
    this.config = config;
  }

  // Scan a directory for security issues
  async scan(path: string): Promise<{ findings: Finding[]; filesScanned: number }> {
    const spinner = ora('Scanning files...').start();

    try {
      // Get files to scan
      const files = await scanFiles({ 
        path,
        ignore: this.config.ignore,
        extensions: this.config.extensions
      });

      spinner.text = `Found ${files.length} files. Scanning...`;

      // Scan all files
      const allFindings: Finding[] = [];

      for (const filePath of files) {
        try {
          const content = await readFileContent(filePath);
          const ext = getFileExtension(filePath);

          // Run enabled rules in parallel
          const rulePromises = Array.from(this.rules.values())
            .filter((rule) => rule.enabled)
            .map((rule) => rule.check(content, filePath));

          const results = await Promise.all(rulePromises);
          const findings = results.flat();

          // Filter by severity
          const filtered = findings.filter((f) => this.shouldIncludeFinding(f));
          allFindings.push(...filtered);
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }

      spinner.succeed(`Scan complete. Found ${allFindings.length} issues.`);

      return {
        findings: allFindings,
        filesScanned: files.length
      };
    } catch (error) {
      spinner.fail(`Scan failed: ${error}`);
      throw error;
    }
  }

  // Check if finding meets severity threshold
  private shouldIncludeFinding(finding: Finding): boolean {
    const severityLevels: Record<Severity, number> = {
      high: 3,
      medium: 2,
      low: 1
    };

    const minLevel = severityLevels[this.config.minSeverity];
    const findingLevel = severityLevels[finding.severity];

    return findingLevel >= minLevel;
  }

  // Get enabled rules
  getEnabledRules(): Rule[] {
    return Array.from(this.rules.values()).filter((rule) => rule.enabled);
  }

  // Enable/disable specific rule
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }
}
