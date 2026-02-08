import { Command } from 'commander';
import { handleScanCommand } from './commands/scan';
import { readFileSync } from 'fs';
import { join } from 'path';

// Get version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

const program = new Command();

program
  .name('scry')
  .description('Security-focused CLI that reveals hidden risks in JavaScript and Node.js codebases')
  .version(packageJson.version || '0.1.0');

program
  .command('scan [path]')
  .description('Scan a directory for security issues')
  .option('-o, --output <format>', 'Output format (table, compact, json, markdown)', 'table')
  .option('--strict', 'Enable strict mode (fail on any finding)')
  .option('--min-severity <level>', 'Minimum severity to report (low, medium, high)', 'low')
  .option('--config <path>', 'Path to config file')
  .option('--ignore <patterns...>', 'Additional patterns to ignore')
  .action(async (path, options) => {
    const scanPath = path || '.';
    await handleScanCommand(scanPath, {
      path: scanPath,
      ...options,
    });
  });

program.parse();
