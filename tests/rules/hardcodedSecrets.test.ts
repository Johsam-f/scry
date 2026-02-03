import { describe, test, expect } from 'bun:test';
import { HardcodedSecretsRule } from '../../src/rules/hardcodedSecrets';

describe('HardcodedSecretsRule', () => {
  const rule = new HardcodedSecretsRule();

  test('should detect AWS Access Key', async () => {
    const content = `const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('AWS');
    expect(findings[0]?.severity).toBe('high');
  });

  test('should detect API key hardcoded', async () => {
    const content = `const config = { 'api_key': 'sk_live_1234567890abcdefghij' };`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('API Key');
  });

  test('should detect GitHub token', async () => {
    const content = `const token = 'ghp_1234567890123456789012345678901234';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('GitHub Token');
  });

  test('should detect private key', async () => {
    const content = `const key = '-----BEGIN RSA PRIVATE KEY-----\\nMIIE...';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('Private Key');
  });

  test('should detect password hardcoded', async () => {
    const content = `const dbConfig = { password: 'MySecretPassword123' };`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('Password');
  });

  test('should NOT flag environment variable', async () => {
    const content = `const API_KEY = process.env.API_KEY;`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT flag config.get()', async () => {
    const content = `const secret = config.get('secret');`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT flag example values', async () => {
    const content = `const apiKey = "your_api_key_here";`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should skip comments with secrets', async () => {
    const content = `
      // const API_KEY = 'sk_live_1234567890abcdefghij';
      /* const TOKEN = 'ghp_1234567890123456789012345678901234'; */
    `;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should suggest moving to environment variables', async () => {
    const content = `const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings[0]?.fix).toContain('process.env');
    expect(findings[0]?.fix).toContain('secrets manager');
  });
});
