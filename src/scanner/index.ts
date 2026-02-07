import type { Finding, Rule, Severity, ScryConfig } from '../types';
import { scanFiles, readFileContent, getFileExtension, shouldScanFile } from './fileScanner';
import { ScanError, RuleError, wrapError } from '../errors';
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
  async scan(path: string): Promise<{ findings: Finding[]; filesScanned: number; filesSkipped: number; skippedFiles: Array<{ file: string; reason: string }> }> {
    const spinner = ora('Scanning files...').start();

    try {
      // Get files to scan
      const files = await scanFiles({ 
        path,
        ignore: this.config.ignore,
        extensions: this.config.extensions
      });

      if (files.length === 0) {
        spinner.warn(`No files found to scan in: ${path}`);
        return {
          findings: [],
          filesScanned: 0,
          filesSkipped: 0,
          skippedFiles: []
        };
      }

      spinner.text = `Found ${files.length} files. Scanning...`;

      // Scan all files
      const allFindings: Finding[] = [];
      const skippedFiles: Array<{ file: string; reason: string }> = [];
      let filesScanned = 0;

      for (const filePath of files) {
        try {
          const content = await readFileContent(filePath);
          const ext = getFileExtension(filePath);

          // Get enabled rules
          const enabledRules = Array.from(this.rules.values()).filter((rule) => rule.enabled);
          
          if (enabledRules.length === 0) {
            throw new ScanError('No rules enabled for scanning', { path, enabledRules: 0 });
          }

          // Run enabled rules in parallel
          const rulePromises = enabledRules.map((rule) => 
            rule.check(content, filePath).catch((error) => {
              // Wrap rule errors with context
              const ruleError = new RuleError(
                `Rule "${rule.id}" failed`,
                { ruleId: rule.id, ruleName: rule.name, filePath },
                error instanceof Error ? error : new Error(String(error))
              );
              throw ruleError;
            })
          );

          const results = await Promise.allSettled(rulePromises);
          
          // Collect successful results and log failures
          const findings: Finding[] = [];
          results.forEach((result, i) => {
            if (result.status === 'fulfilled') {
              findings.push(...result.value);
            } else {
              // Log rule failure but continue scanning
              const rule = enabledRules[i];
              if (!rule) return;
              const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
              spinner.warn(`Rule "${rule.id}" failed for ${filePath}: ${errorMsg}`);
              
              if (process.env.VERBOSE && result.reason instanceof Error && result.reason.stack) {
                console.error(`  Stack: ${result.reason.stack.split('\n').slice(0, 3).join('\n')}`);
              }
            }
          });

          // Filter by severity
          const filtered = findings.filter((f) => this.shouldIncludeFinding(f));
          allFindings.push(...filtered);
          filesScanned++;
        } catch (error) {
          // Log files that can't be read
          const errorMsg = error instanceof Error ? error.message : String(error);
          const shortPath = filePath.length > 50 ? '...' + filePath.slice(-47) : filePath;
          spinner.warn(`Skipped ${shortPath}: ${errorMsg}`);
          skippedFiles.push({ file: filePath, reason: errorMsg });
        }
      }

      const successMsg = filesScanned === files.length
        ? `Scan complete. Scanned ${filesScanned} files, found ${allFindings.length} issues.`
        : `Scan complete. Scanned ${filesScanned}/${files.length} files (${skippedFiles.length} skipped), found ${allFindings.length} issues.`;
      
      spinner.succeed(successMsg);

      // Log skipped files summary if any
      if (skippedFiles.length > 0 && skippedFiles.length <= 5) {
        console.log(`\nSkipped files:`);
        skippedFiles.forEach(({ file, reason }) => {
          console.log(`  • ${file}: ${reason}`);
        });
      } else if (skippedFiles.length > 5) {
        console.log(`\n${skippedFiles.length} files were skipped (use VERBOSE=1 to see details)`);
      }

      return {
        findings: allFindings,
        filesScanned,
        filesSkipped: skippedFiles.length,
        skippedFiles
      };
    } catch (error) {
      spinner.fail(`Scan failed`);
      
      // Wrap the error with scan context
      if (error instanceof ScanError) {
        throw error;
      }
      
      throw wrapError(error, 'Scan operation failed', { path, configuredRules: this.rules.size });
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
