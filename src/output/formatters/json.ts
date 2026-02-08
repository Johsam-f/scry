import type { Finding, ScanResult } from '../../types';

export function formatAsJSON(findings: Finding[], filesScanned: number, duration: number): string {
  const result: ScanResult = {
    findings,
    filesScanned,
    filesSkipped: 0,
    skippedFiles: [],
    duration,
    timestamp: new Date(),
  };

  return JSON.stringify(result, null, 2);
}

export function formatDetailedJSON(findings: Finding[]): string {
  const byRule: Record<string, Finding[]> = {};
  const bySeverity: Record<string, Finding[]> = {
    high: [],
    medium: [],
    low: [],
  };

  for (const finding of findings) {
    // Group by rule
    if (!byRule[finding.rule]) {
      byRule[finding.rule] = [];
    }
    byRule[finding.rule]!.push(finding);

    // Group by severity
    bySeverity[finding.severity]!.push(finding);
  }

  return JSON.stringify(
    {
      total: findings.length,
      byRule,
      bySeverity,
    },
    null,
    2
  );
}
