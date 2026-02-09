// Configuration types

import type { RuleConfig, Severity } from '.';

export interface ScryConfig {
  rules: Record<string, RuleConfig>;
  ignore: string[];
  extensions: string[];
  output: OutputFormat;
  strict: boolean;
  minSeverity: Severity;
  showFixes: boolean;
  showExplanations: boolean;
}

export type OutputFormat = 'table' | 'json' | 'markdown' | 'compact';

export interface CLIOptions {
  path: string;
  output?: OutputFormat;
  strict?: boolean;
  minSeverity?: Severity;
  config?: string;
  ignore?: string[];
  json?: boolean;
  explain?: boolean;
  fix?: boolean;
}

export const defaultConfig: ScryConfig = {
  rules: {},
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/.next/**',
    '**/coverage/**',
  ],
  extensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
  output: 'table',
  strict: false,
  minSeverity: 'low',
  showFixes: false,
  showExplanations: false,
};
