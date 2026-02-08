import chalk from 'chalk';
import logSymbols from 'log-symbols';
import type { Finding } from '../../types';

export function formatAsCompact(
  findings: Finding[],
  filesScanned: number,
  duration: number
): string {
  if (findings.length === 0) {
    return chalk.green(
      `${logSymbols.success} No issues found (${filesScanned} files, ${duration}ms)`
    );
  }

  const lines: string[] = [];

  // Group findings by file for compact display
  const byFile = new Map<string, Finding[]>();

  for (const finding of findings) {
    if (!byFile.has(finding.file)) {
      byFile.set(finding.file, []);
    }
    byFile.get(finding.file)!.push(finding);
  }

  // Format each file's findings
  for (const [file, fileFindings] of byFile.entries()) {
    lines.push(chalk.bold(file));

    for (const finding of fileFindings) {
      const severitySymbol = getSeveritySymbol(finding.severity);
      const severityColor = getSeverityColor(finding.severity);
      const line = `  ${severitySymbol} ${severityColor(finding.severity.toUpperCase())} ${chalk.gray(`L${finding.line}`)} ${chalk.cyan(finding.rule)} ${finding.message}`;
      lines.push(line);
    }

    lines.push(''); // Empty line between files
  }

  // Summary footer
  const high = findings.filter((f) => f.severity === 'high').length;
  const medium = findings.filter((f) => f.severity === 'medium').length;
  const low = findings.filter((f) => f.severity === 'low').length;

  lines.push(chalk.dim('─'.repeat(60)));
  lines.push(
    `${chalk.red(`${high} high`)} ${chalk.yellow(`${medium} medium`)} ${chalk.blue(`${low} low`)} ${chalk.dim(`| ${filesScanned} files | ${duration}ms`)}`
  );

  return lines.join('\n');
}

function getSeveritySymbol(severity: string): string {
  switch (severity) {
    case 'high':
      return logSymbols.error;
    case 'medium':
      return logSymbols.warning;
    case 'low':
      return logSymbols.info;
    default:
      return '•';
  }
}

function getSeverityColor(severity: string): (text: string) => string {
  switch (severity) {
    case 'high':
      return chalk.red;
    case 'medium':
      return chalk.yellow;
    case 'low':
      return chalk.blue;
    default:
      return chalk.white;
  }
}
