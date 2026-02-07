import { Scanner } from '../../scanner';
import { render } from '../../output';
import type { CLIOptions, ScryConfig } from '../../types';
import { getAllRules } from '../rules';
import { loadConfig, ConfigLoader } from '../../config';
import { formatError } from '../../errors';

export async function handleScanCommand(path: string, options: CLIOptions): Promise<void> {
  // Check for verbose mode
  const verbose = process.env.VERBOSE === '1' || process.env.DEBUG === '1';

  try {
    // Load and merge configuration from file and CLI options
    const config: ScryConfig = loadConfig(options);

    // Get all rules and apply config
    let rules = getAllRules();
    
    // Apply rule configurations from config file
    if (Object.keys(config.rules).length > 0) {
      rules = ConfigLoader.applyRuleConfigs(rules, config.rules);
    }

    // Create scanner
    const scanner = new Scanner(rules, config);

    // Run scan
    const startTime = Date.now();
    const result = await scanner.scan(path);
    const duration = Date.now() - startTime;

    // Render output
    const output = render(result.findings, result.filesScanned, duration, {
      format: config.output,
      showSummary: true,
      showExplanations: config.showExplanations,
      showFixes: config.showFixes,
      filesSkipped: result.filesSkipped,
      skippedFiles: result.skippedFiles
    });

    console.log(output);

    // Exit with error code if strict mode and findings exist
    if (config.strict && result.findings.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    // Format and display error with context
    const errorOutput = formatError(error, verbose);
    console.error('\n❌ ' + errorOutput);
    
    // Show hint about verbose mode if not already enabled
    if (!verbose) {
      console.error('\n💡 Tip: Set VERBOSE=1 environment variable for detailed error information');
    }
    
    process.exit(1);
  }
}
