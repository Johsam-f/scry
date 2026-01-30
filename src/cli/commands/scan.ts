import { Scanner } from '../../scanner';
import { render } from '../../output';
import type { CLIOptions, ScryConfig } from '../../types';
import { defaultConfig } from '../../types';
import { getAllRules } from '../rules';

export async function handleScanCommand(path: string, options: CLIOptions): Promise<void> {
  try {
    // Merge config
    const config: ScryConfig = {
      ...defaultConfig,
      output: options.output || 'table',
      strict: options.strict || false,
      minSeverity: options.minSeverity || 'low'
    };

    // Get all rules
    const rules = getAllRules();

    // Create scanner
    const scanner = new Scanner(rules, config);

    // Run scan
    const startTime = Date.now();
    const findings = await scanner.scan(path);
    const duration = Date.now() - startTime;

    // Render output
    const output = render(findings, 0, duration, {
      format: config.output,
      showSummary: true,
      showExplanations: true,
      showFixes: true
    });

    console.log(output);

    // Exit with error code if strict mode and findings exist
    if (config.strict && findings.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during scan:', error);
    process.exit(1);
  }
}
