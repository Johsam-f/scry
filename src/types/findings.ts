// Finding types for security scan results

export type Severity = 'high' | 'medium' | 'low';

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
  tags?: string[];
}

export interface ScanResult {
  findings: Finding[];
  filesScanned: number;
  duration: number;
  timestamp: Date;
}

export interface FindingStats {
  total: number;
  byRule: Record<string, number>;
  bySeverity: Record<Severity, number>;
}
