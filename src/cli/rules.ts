// Rule registry and initialization

import type { Rule } from '../types';
import { HardcodedSecretsRule } from '../rules/hardcodedSecrets';
import { JWTStorageRule } from '../rules/jwtStorage';
import { EvalUsageRule } from '../rules/evalUsage';

export function getAllRules(): Rule[] {
  return [
    new HardcodedSecretsRule(),
    new JWTStorageRule(),
    new EvalUsageRule()
  ];
}

export function getRuleById(id: string): Rule | undefined {
  return getAllRules().find((rule) => rule.id === id);
}
