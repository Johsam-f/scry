import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { ConfigLoader, loadConfig } from '../../src/config/loader';
import type { CLIOptions, Severity } from '../../src/types';

const TEST_DIR = join(__dirname, 'temp-config-test');

describe('ConfigLoader', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('loadConfig', () => {
    it('should load valid config file', () => {
      const configPath = join(TEST_DIR, '.scryrc.json');
      const configContent = {
        rules: {
          'test-rule': 'error',
          'another-rule': 'off',
        },
        output: 'json',
        strict: true,
        minSeverity: 'high',
      };

      writeFileSync(configPath, JSON.stringify(configContent));

      const cliOptions: CLIOptions = {
        path: '.',
        config: configPath,
      };

      const config = loadConfig(cliOptions);

      expect(config.output).toBe('json');
      expect(config.strict).toBe(true);
      expect(config.minSeverity).toBe('high');
      expect(config.rules['test-rule']).toEqual({
        enabled: true,
        severity: 'high',
      });
      expect(config.rules['another-rule']).toEqual({
        enabled: false,
      });
    });

    it('should handle shorthand rule configurations', () => {
      const configPath = join(TEST_DIR, '.scryrc.json');
      const configContent = {
        rules: {
          'rule-off': 'off',
          'rule-warn': 'warn',
          'rule-error': 'error',
        },
      };

      writeFileSync(configPath, JSON.stringify(configContent));

      const config = loadConfig({ path: '.', config: configPath });

      expect(config.rules['rule-off']).toEqual({ enabled: false });
      expect(config.rules['rule-warn']).toEqual({ enabled: true, severity: 'medium' });
      expect(config.rules['rule-error']).toEqual({ enabled: true, severity: 'high' });
    });

    it('should handle full rule configuration objects', () => {
      const configPath = join(TEST_DIR, '.scryrc.json');
      const configContent = {
        rules: {
          'custom-rule': {
            enabled: true,
            severity: 'low',
            options: {
              threshold: 10,
            },
          },
        },
      };

      writeFileSync(configPath, JSON.stringify(configContent));

      const config = loadConfig({ path: '.', config: configPath });

      expect(config.rules['custom-rule']).toEqual({
        enabled: true,
        severity: 'low',
        options: {
          threshold: 10,
        },
      });
    });

    it('should merge CLI options over config file', () => {
      const configPath = join(TEST_DIR, '.scryrc.json');
      const configContent = {
        output: 'table',
        strict: false,
        minSeverity: 'low',
      };

      writeFileSync(configPath, JSON.stringify(configContent));

      const cliOptions: CLIOptions = {
        path: '.',
        config: configPath,
        output: 'json',
        strict: true,
        minSeverity: 'high',
      };

      const config = loadConfig(cliOptions);

      expect(config.output).toBe('json');
      expect(config.strict).toBe(true);
      expect(config.minSeverity).toBe('high');
    });

    it('should merge ignore patterns from CLI and config', () => {
      const configPath = join(TEST_DIR, '.scryrc.json');
      const configContent = {
        ignore: ['**/config-ignore/**'],
      };

      writeFileSync(configPath, JSON.stringify(configContent));

      const cliOptions: CLIOptions = {
        path: '.',
        config: configPath,
        ignore: ['**/cli-ignore/**'],
      };

      const config = loadConfig(cliOptions);

      expect(config.ignore).toContain('**/config-ignore/**');
      expect(config.ignore).toContain('**/cli-ignore/**');
    });

    it('should use defaults when no config file exists', () => {
      const cliOptions: CLIOptions = {
        path: '.',
        config: join(TEST_DIR, 'nonexistent.json'),
      };

      expect(() => loadConfig(cliOptions)).toThrow('Config file not found');
    });

    it('should handle missing optional config gracefully', () => {
      const cliOptions: CLIOptions = {
        path: '.',
      };

      const config = loadConfig(cliOptions);

      expect(config.output).toBe('table');
      expect(config.strict).toBe(false);
      expect(config.minSeverity).toBe('low');
    });

    it('should throw error for invalid JSON', () => {
      const configPath = join(TEST_DIR, '.scryrc.json');
      writeFileSync(configPath, '{ invalid json }');

      const cliOptions: CLIOptions = {
        path: '.',
        config: configPath,
      };

      expect(() => loadConfig(cliOptions)).toThrow('Invalid JSON');
    });

    it('should throw error for invalid output format', () => {
      const configPath = join(TEST_DIR, '.scryrc.json');
      const configContent = {
        output: 'invalid-format',
      };

      writeFileSync(configPath, JSON.stringify(configContent));

      const cliOptions: CLIOptions = {
        path: '.',
        config: configPath,
      };

      expect(() => loadConfig(cliOptions)).toThrow('Invalid output format');
    });

    it('should throw error for invalid severity', () => {
      const configPath = join(TEST_DIR, '.scryrc.json');
      const configContent = {
        minSeverity: 'invalid',
      };

      writeFileSync(configPath, JSON.stringify(configContent));

      const cliOptions: CLIOptions = {
        path: '.',
        config: configPath,
      };

      expect(() => loadConfig(cliOptions)).toThrow('Invalid minSeverity');
    });

    it('should throw error for invalid rule shorthand', () => {
      const configPath = join(TEST_DIR, '.scryrc.json');
      const configContent = {
        rules: {
          'test-rule': 'invalid',
        },
      };

      writeFileSync(configPath, JSON.stringify(configContent));

      const cliOptions: CLIOptions = {
        path: '.',
        config: configPath,
      };

      expect(() => loadConfig(cliOptions)).toThrow('Invalid rule shorthand');
    });

    it('should validate ignore is an array', () => {
      const configPath = join(TEST_DIR, '.scryrc.json');
      const configContent = {
        ignore: 'not-an-array',
      };

      writeFileSync(configPath, JSON.stringify(configContent));

      const cliOptions: CLIOptions = {
        path: '.',
        config: configPath,
      };

      expect(() => loadConfig(cliOptions)).toThrow('"ignore" must be an array');
    });

    it('should validate extensions is an array', () => {
      const configPath = join(TEST_DIR, '.scryrc.json');
      const configContent = {
        extensions: 'not-an-array',
      };

      writeFileSync(configPath, JSON.stringify(configContent));

      const cliOptions: CLIOptions = {
        path: '.',
        config: configPath,
      };

      expect(() => loadConfig(cliOptions)).toThrow('"extensions" must be an array');
    });

    it('should handle json flag as output format', () => {
      const cliOptions: CLIOptions = {
        path: '.',
        json: true,
      };

      const config = loadConfig(cliOptions);

      expect(config.output).toBe('json');
    });
  });

  describe('applyRuleConfigs', () => {
    it('should apply enabled status from config', () => {
      const rules = [
        { id: 'rule-1', severity: 'high' as const, enabled: true },
        { id: 'rule-2', severity: 'medium' as const, enabled: true },
      ];

      const ruleConfigs = {
        'rule-1': { enabled: false },
        'rule-2': { enabled: true },
      };

      const result = ConfigLoader.applyRuleConfigs(rules, ruleConfigs);

      expect(result[0]?.enabled).toBe(false);
      expect(result[1]?.enabled).toBe(true);
    });

    it('should apply severity override from config', () => {
      const rules = [{ id: 'rule-1', severity: 'low' as const, enabled: true }] as const;

      const ruleConfigs = {
        'rule-1': { enabled: true, severity: 'high' as const },
      };

      const result = ConfigLoader.applyRuleConfigs(
        rules as unknown as Array<{ id: string; severity: Severity; enabled: boolean }>,
        ruleConfigs
      );

      expect(result[0]?.severity).toBe('high');
    });

    it('should not modify rules without config', () => {
      const rules = [{ id: 'rule-1', severity: 'medium' as const, enabled: true }];

      const ruleConfigs = {};

      const result = ConfigLoader.applyRuleConfigs(rules, ruleConfigs);

      expect(result[0]?.severity).toBe('medium');
      expect(result[0]?.enabled).toBe(true);
    });
  });
});
