import { describe, test, expect } from 'bun:test';
import { ConfigLoader } from '../../src/config/loader';
import { ConfigError } from '../../src/errors';
import { getAllRules } from '../../src/cli/rules';
import type { RuleConfig } from '../../src/types';

describe('Config Rule Validation', () => {
  test('should accept valid rule IDs', () => {
    const rules = getAllRules();
    const ruleConfigs: Record<string, RuleConfig> = {
      'hardcoded-secrets': { enabled: false },
      'eval-usage': { enabled: true, severity: 'high' },
    };

    const result = ConfigLoader.applyRuleConfigs(rules, ruleConfigs);

    expect(result).toBeDefined();
    expect(result.length).toBe(rules.length);

    const secretsRule = result.find((r) => r.id === 'hardcoded-secrets');
    expect(secretsRule?.enabled).toBe(false);

    const evalRule = result.find((r) => r.id === 'eval-usage');
    expect(evalRule?.enabled).toBe(true);
    expect(evalRule?.severity).toBe('high');
  });

  test('should reject single invalid rule ID', () => {
    const rules = getAllRules();
    const ruleConfigs: Record<string, RuleConfig> = {
      'invalid-rule-id': { enabled: true, severity: 'high' },
    };

    expect(() => {
      ConfigLoader.applyRuleConfigs(rules, ruleConfigs);
    }).toThrow(ConfigError);

    try {
      ConfigLoader.applyRuleConfigs(rules, ruleConfigs);
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      expect((error as ConfigError).message).toContain('invalid-rule-id');
      expect((error as ConfigError).context?.invalidRuleIds).toEqual(['invalid-rule-id']);
      expect((error as ConfigError).context?.validRuleIds).toBeDefined();
    }
  });

  test('should reject multiple invalid rule IDs', () => {
    const rules = getAllRules();
    const ruleConfigs: Record<string, RuleConfig> = {
      'fake-rule-1': { enabled: true, severity: 'high' },
      'fake-rule-2': { enabled: true, severity: 'medium' },
      'another-invalid': { enabled: false },
    };

    expect(() => {
      ConfigLoader.applyRuleConfigs(rules, ruleConfigs);
    }).toThrow(ConfigError);

    try {
      ConfigLoader.applyRuleConfigs(rules, ruleConfigs);
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      const configError = error as ConfigError;
      expect(configError.message).toContain('fake-rule-1');
      expect(configError.message).toContain('fake-rule-2');
      expect(configError.message).toContain('another-invalid');
      expect(configError.context?.invalidRuleIds).toHaveLength(3);
    }
  });

  test('should reject mix of valid and invalid rule IDs', () => {
    const rules = getAllRules();
    const ruleConfigs: Record<string, RuleConfig> = {
      'hardcoded-secrets': { enabled: false },
      'invalid-rule': { enabled: true, severity: 'high' },
      'eval-usage': { enabled: true, severity: 'medium' },
    };

    expect(() => {
      ConfigLoader.applyRuleConfigs(rules, ruleConfigs);
    }).toThrow(ConfigError);

    try {
      ConfigLoader.applyRuleConfigs(rules, ruleConfigs);
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      const configError = error as ConfigError;
      expect(configError.message).toContain('invalid-rule');
      expect(configError.context?.invalidRuleIds).toEqual(['invalid-rule']);
      // Should list all valid rule IDs in context
      expect(configError.context?.validRuleIds).toContain('hardcoded-secrets');
      expect(configError.context?.validRuleIds).toContain('eval-usage');
    }
  });

  test('should preserve rule class methods when applying config', () => {
    const rules = getAllRules();
    const ruleConfigs: Record<string, RuleConfig> = {
      'eval-usage': { enabled: false },
    };

    const result = ConfigLoader.applyRuleConfigs(rules, ruleConfigs);
    const evalRule = result.find((r) => r.id === 'eval-usage');

    expect(evalRule).toBeDefined();
    expect(typeof evalRule?.check).toBe('function');
    expect(evalRule?.enabled).toBe(false);
  });

  test('should not modify rules without config', () => {
    const rules = getAllRules();
    const ruleConfigs: Record<string, RuleConfig> = {
      'eval-usage': { enabled: false },
    };

    const result = ConfigLoader.applyRuleConfigs(rules, ruleConfigs);

    // Rules not in config should remain unchanged
    const secretsRule = result.find((r) => r.id === 'hardcoded-secrets');
    expect(secretsRule?.enabled).toBe(true); // Default is enabled
  });

  test('should handle empty rule config', () => {
    const rules = getAllRules();
    const ruleConfigs: Record<string, RuleConfig> = {};

    const result = ConfigLoader.applyRuleConfigs(rules, ruleConfigs);

    expect(result).toBeDefined();
    expect(result.length).toBe(rules.length);
    // All rules should remain unchanged
    result.forEach((rule) => {
      expect(rule.enabled).toBe(true);
    });
  });

  test('should provide helpful error message with valid rule IDs', () => {
    const rules = getAllRules();
    const ruleConfigs: Record<string, RuleConfig> = {
      'non-existent-rule': { enabled: true, severity: 'high' },
    };

    try {
      ConfigLoader.applyRuleConfigs(rules, ruleConfigs);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      const configError = error as ConfigError;

      // Should include valid rule IDs in context
      const validRuleIds = configError.context?.validRuleIds as string[];
      expect(validRuleIds).toContain('hardcoded-secrets');
      expect(validRuleIds).toContain('eval-usage');
      expect(validRuleIds).toContain('jwt-storage');
      expect(validRuleIds).toContain('cookie-security');
    }
  });
});
