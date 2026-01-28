// Rule interface and types

import type { Finding, Severity } from './findings';

export interface Rule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  enabled: boolean;
  tags?: string[];
  check(content: string, filePath: string): Promise<Finding[]>;
}

export interface RuleRegistry {
  rules: Map<string, Rule>;
  register(rule: Rule): void;
  get(id: string): Rule | undefined;
  getAll(): Rule[];
  disable(id: string): void;
  enable(id: string): void;
}

export interface CheckOptions {
  content: string;
  filePath: string;
  fileExtension: string;
}

export interface RuleConfig {
  enabled: boolean;
  severity?: Severity;
  options?: Record<string, unknown>;
}
