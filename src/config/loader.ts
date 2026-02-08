import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import type { ScryConfig, CLIOptions, RuleConfig, Severity, OutputFormat } from '../types';
import { defaultConfig } from '../types/config';
import { ConfigError } from '../errors';

export interface ScryRCConfig {
  rules?: Record<string, RuleConfig | 'off' | 'warn' | 'error'>;
  ignore?: string[];
  extensions?: string[];
  output?: OutputFormat;
  strict?: boolean;
  minSeverity?: Severity;
  showFixes?: boolean;
  showExplanations?: boolean;
}

export class ConfigLoader {
  private static readonly DEFAULT_CONFIG_NAMES = ['.scryrc.json', '.scryrc'];

  /**
   * Load and merge configuration from file and CLI options
   */
  static loadConfig(cliOptions: CLIOptions): ScryConfig {
    const fileConfig = this.loadConfigFile(cliOptions.config);
    return this.mergeConfigs(defaultConfig, fileConfig, cliOptions);
  }

  /**
   * Load configuration from file
   */
  private static loadConfigFile(configPath?: string): Partial<ScryConfig> | null {
    // If config path is explicitly provided
    let resolvedPath: string | null;
    if (configPath) {
      resolvedPath = resolve(configPath);
      if (!existsSync(resolvedPath)) {
        throw new ConfigError(`Config file not found`, { configPath: resolvedPath });
      }
    } else {
      // Auto-discover config file in current working directory
      resolvedPath = this.discoverConfigFile();
    }

    if (!resolvedPath) {
      return null;
    }

    try {
      const content = readFileSync(resolvedPath, 'utf-8');
      const rawConfig: ScryRCConfig = JSON.parse(content);

      // Validate and normalize the config
      return this.normalizeConfig(rawConfig, resolvedPath);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ConfigError(
          `Invalid JSON in config file`,
          { configPath: resolvedPath, parseError: error.message },
          error
        );
      }
      if (error instanceof ConfigError) {
        throw error;
      }
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new ConfigError(`Failed to load config file`, { configPath: resolvedPath }, cause);
    }
  }

  /**
   * Discover config file in current working directory
   */
  private static discoverConfigFile(): string | null {
    const cwd = process.cwd();

    for (const name of this.DEFAULT_CONFIG_NAMES) {
      const path = join(cwd, name);
      if (existsSync(path)) {
        return path;
      }
    }

    return null;
  }

  /**
   * Normalize and validate config from .scryrc.json
   */
  private static normalizeConfig(
    rawConfig: ScryRCConfig,
    configPath?: string
  ): Partial<ScryConfig> {
    const config: Partial<ScryConfig> = {};

    try {
      // Normalize rules configuration
      if (rawConfig.rules) {
        config.rules = {};

        for (const [ruleId, ruleConfig] of Object.entries(rawConfig.rules)) {
          if (typeof ruleConfig === 'string') {
            // Handle shorthand: "off" | "warn" | "error"
            config.rules[ruleId] = this.normalizeRuleShorthand(ruleConfig);
          } else if (typeof ruleConfig === 'object' && ruleConfig !== null) {
            // Handle full config object
            config.rules[ruleId] = ruleConfig;
          } else {
            throw new ConfigError(`Invalid rule configuration`, { ruleId, ruleConfig, configPath });
          }
        }
      }

      // Copy other config properties with validation
      if (rawConfig.ignore !== undefined) {
        if (!Array.isArray(rawConfig.ignore)) {
          throw new ConfigError('Config property "ignore" must be an array of strings', {
            ignore: rawConfig.ignore,
            configPath,
          });
        }
        config.ignore = rawConfig.ignore;
      }

      if (rawConfig.extensions !== undefined) {
        if (!Array.isArray(rawConfig.extensions)) {
          throw new ConfigError('Config property "extensions" must be an array of strings', {
            extensions: rawConfig.extensions,
            configPath,
          });
        }
        config.extensions = rawConfig.extensions;
      }

      if (rawConfig.output !== undefined) {
        if (!this.isValidOutputFormat(rawConfig.output)) {
          throw new ConfigError(
            `Invalid output format. Must be one of: table, json, markdown, compact`,
            { output: rawConfig.output, configPath }
          );
        }
        config.output = rawConfig.output;
      }

      if (rawConfig.strict !== undefined) {
        if (typeof rawConfig.strict !== 'boolean') {
          throw new ConfigError('Config property "strict" must be a boolean', {
            strict: rawConfig.strict,
            configPath,
          });
        }
        config.strict = rawConfig.strict;
      }

      if (rawConfig.minSeverity !== undefined) {
        if (!this.isValidSeverity(rawConfig.minSeverity)) {
          throw new ConfigError(`Invalid minSeverity. Must be one of: low, medium, high`, {
            minSeverity: rawConfig.minSeverity,
            configPath,
          });
        }
        config.minSeverity = rawConfig.minSeverity;
      }

      if (rawConfig.showFixes !== undefined) {
        if (typeof rawConfig.showFixes !== 'boolean') {
          throw new ConfigError('Config property "showFixes" must be a boolean', {
            showFixes: rawConfig.showFixes,
            configPath,
          });
        }
        config.showFixes = rawConfig.showFixes;
      }

      if (rawConfig.showExplanations !== undefined) {
        if (typeof rawConfig.showExplanations !== 'boolean') {
          throw new ConfigError('Config property "showExplanations" must be a boolean', {
            showExplanations: rawConfig.showExplanations,
            configPath,
          });
        }
        config.showExplanations = rawConfig.showExplanations;
      }

      return config;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      const cause = error instanceof Error ? error : new Error(String(error));
      throw new ConfigError('Failed to normalize configuration', { configPath }, cause);
    }
  }

  /**
   * Convert rule shorthand to RuleConfig
   */
  private static normalizeRuleShorthand(shorthand: string): RuleConfig {
    switch (shorthand) {
      case 'off':
        return { enabled: false };
      case 'warn':
        return { enabled: true, severity: 'medium' };
      case 'error':
        return { enabled: true, severity: 'high' };
      default:
        throw new ConfigError(`Invalid rule shorthand. Must be "off", "warn", or "error"`, {
          shorthand,
        });
    }
  }

  /**
   * Merge configurations with priority: CLI > File > Default
   */
  private static mergeConfigs(
    defaultConfig: ScryConfig,
    fileConfig: Partial<ScryConfig> | null,
    cliOptions: CLIOptions
  ): ScryConfig {
    // Start with default config
    let merged: ScryConfig = { ...defaultConfig };

    // Apply file config
    if (fileConfig) {
      merged = {
        ...merged,
        ...fileConfig,
        rules: { ...merged.rules, ...fileConfig.rules },
        ignore: fileConfig.ignore ?? merged.ignore,
        extensions: fileConfig.extensions ?? merged.extensions,
      };
    }

    // Apply CLI options (highest priority)
    if (cliOptions.output) {
      merged.output = cliOptions.output;
    }

    if (cliOptions.strict !== undefined) {
      merged.strict = cliOptions.strict;
    }

    if (cliOptions.minSeverity) {
      merged.minSeverity = cliOptions.minSeverity;
    }

    // Merge ignore patterns from CLI
    if (cliOptions.ignore && cliOptions.ignore.length > 0) {
      merged.ignore = [...merged.ignore, ...cliOptions.ignore];
    }

    // Handle --json flag as alias for --output json
    if (cliOptions.json) {
      merged.output = 'json';
    }

    return merged;
  }

  /**
   * Validate output format
   */
  private static isValidOutputFormat(format: string): format is OutputFormat {
    return ['table', 'json', 'markdown', 'compact'].includes(format);
  }

  /**
   * Validate severity level
   */
  private static isValidSeverity(severity: string): severity is Severity {
    return ['low', 'medium', 'high'].includes(severity);
  }

  /**
   * Apply rule configurations to rules array
   */
  static applyRuleConfigs<T extends { id: string; severity: Severity; enabled: boolean }>(
    rules: T[],
    ruleConfigs: Record<string, RuleConfig>
  ): T[] {
    // Validate that all configured rule IDs exist
    const validRuleIds = new Set(rules.map((rule) => rule.id));
    const invalidRuleIds = Object.keys(ruleConfigs).filter((id) => !validRuleIds.has(id));

    if (invalidRuleIds.length > 0) {
      throw new ConfigError(
        `Unknown rule ID${invalidRuleIds.length > 1 ? 's' : ''}: ${invalidRuleIds.map((id) => `"${id}"`).join(', ')}`,
        {
          invalidRuleIds,
          validRuleIds: Array.from(validRuleIds).sort(),
        }
      );
    }

    return rules.map((rule) => {
      const config = ruleConfigs[rule.id];
      if (!config) {
        return rule;
      }

      // Modify the rule in place to preserve class methods
      rule.enabled = config.enabled;
      if (config.severity) {
        rule.severity = config.severity;
      }
      return rule;
    });
  }
}

/**
 * Main export: Load and return normalized config
 */
export function loadConfig(cliOptions: CLIOptions): ScryConfig {
  return ConfigLoader.loadConfig(cliOptions);
}
