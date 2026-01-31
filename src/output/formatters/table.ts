import chalk from 'chalk';
import { table } from 'table';
import logSymbols from 'log-symbols';
import type { Finding } from '../../types';

export function formatAsTable(findings: Finding[]): string {
  if (findings.length === 0) {
    return chalk.green(`${logSymbols.success} No security issues found!`);
  }

  const data = [
    [
      chalk.bold('Severity'),
      chalk.bold('Rule'),
      chalk.bold('File'),
      chalk.bold('Line'),
      chalk.bold('Message')
    ]
  ];

  for (const finding of findings) {
    const severity = formatSeverity(finding.severity);
    data.push([
      severity,
      chalk.cyan(finding.rule),
      chalk.gray(finding.file),
      chalk.yellow(finding.line.toString()),
      finding.message
    ]);
  }

  return table(data);
}

function formatSeverity(severity: string): string {
  switch (severity) {
    case 'high':
      return chalk.red(`${logSymbols.error} HIGH`);
    case 'medium':
      return chalk.yellow(`${logSymbols.warning} MEDIUM`);
    case 'low':
      return chalk.blue(`${logSymbols.info} LOW`);
    default:
      return severity;
  }
}

export function formatSummary(
  findings: Finding[],
  filesScanned: number,
  duration: number
): string {
  const high = findings.filter((f) => f.severity === 'high').length;
  const medium = findings.filter((f) => f.severity === 'medium').length;
  const low = findings.filter((f) => f.severity === 'low').length;

  const lines = [
    '',
    chalk.bold('Summary:'),
    `Files scanned: ${filesScanned}`,
    `Duration: ${duration}ms`,
    '',
    chalk.bold('Results:'),
    `${chalk.red(`${logSymbols.error} High: ${high}`)}`,
    `${chalk.yellow(`${logSymbols.warning} Medium: ${medium}`)}`,
    `${chalk.blue(`${logSymbols.info} Low: ${low}`)}`,
    `${chalk.bold('Total: ' + findings.length)}`,
    ''
  ];

  return lines.join('\n');
}
