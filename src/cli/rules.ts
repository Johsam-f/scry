// Rule registry and initialization

import type { Rule } from '../types';
import { HardcodedSecretsRule } from '../rules/hardcodedSecrets';
import { JWTStorageRule } from '../rules/jwtStorage';
import { EvalUsageRule } from '../rules/evalUsage';
import { CookieSecurityRule } from '../rules/cookieSecurity';
import { CORSConfigRule } from '../rules/corsConfig';
import { EnvExposureRule } from '../rules/envExposure';
import { WeakCryptoRule } from '../rules/weakCrypto';

export function getAllRules(): Rule[] {
  return [
    new HardcodedSecretsRule(),
    new JWTStorageRule(),
    new EvalUsageRule(),
    new CookieSecurityRule(),
    new CORSConfigRule(),
    new EnvExposureRule(),
    new WeakCryptoRule()
  ];
}

export function getRuleById(id: string): Rule | undefined {
  return getAllRules().find((rule) => rule.id === id);
}
