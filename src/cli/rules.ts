// Rule registry and initialization

import type { Rule } from '../types';
import { HardcodedSecretsRule } from '../rules/hardcodedSecrets';
import { JWTStorageRule } from '../rules/jwtStorage';

export function getAllRules(): Rule[] {
  return [
    new HardcodedSecretsRule(),
    new JWTStorageRule()
  ];
}

export function getRuleById(id: string): Rule | undefined {
  return getAllRules().find((rule) => rule.id === id);
}
