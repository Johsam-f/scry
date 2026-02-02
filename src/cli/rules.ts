// Rule registry and initialization

import type { Rule } from '../types';
import { HardcodedSecretsRule } from '../rules/hardcodedSecrets';
import { JWTStorageRule } from '../rules/jwtStorage';
import { EvalUsageRule } from '../rules/evalUsage';
import { CookieSecurityRule } from '../rules/cookieSecurity';

export function getAllRules(): Rule[] {
  return [
    new HardcodedSecretsRule(),
    new JWTStorageRule(),
    new EvalUsageRule(),
    new CookieSecurityRule()
  ];
}

export function getRuleById(id: string): Rule | undefined {
  return getAllRules().find((rule) => rule.id === id);
}
