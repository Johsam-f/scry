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

  test('should detect GitHub token with minimum length (36 chars)', async () => {
    const content = `const token = 'ghp_123456789012345678901234567890123456';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('GitHub Token');
  });

  test('should detect GitHub token with longer length', async () => {
    const content = `const token = 'ghp_${'a'.repeat(100)}';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('GitHub Token');
  });

  test('should detect legacy GitHub token (40 hex chars)', async () => {
    const content = `const token = '1234567890abcdef1234567890abcdef12345678';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('GitHub Token');
  });

  test('should NOT detect short hex strings', async () => {
    const content = `const hash = 'abc123';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect Git commit SHA', async () => {
    const content = `const commit = '1234567890abcdef1234567890abcdef12345678'; // git commit sha`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect commit references', async () => {
    const content = `const revision = 'abcdef1234567890abcdef1234567890abcdef12';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
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
      /* const TOKEN = 'ghp_123456789012345678901234567890123456'; */
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

  // Additional tests for improved false positive handling
  
  test('should NOT detect file checksums', async () => {
    const content = `const fileChecksum = '1234567890abcdef1234567890abcdef12345678';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect content hash', async () => {
    const content = `const contentHash = 'abcdef1234567890abcdef1234567890abcdef12';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect database record ID', async () => {
    const content = `const recordId = 'fedcba9876543210fedcba9876543210fedcba98';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect MongoDB ObjectId', async () => {
    const content = `const objectId = '1234567890abcdef1234567890abcdef12345678';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect build artifact hash', async () => {
    const content = `const build = { artifact: 'abc123def456abc123def456abc123def456abc1' };`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect git sha with word boundary', async () => {
    const content = `const sha = 'def456abc123def456abc123def456abc123def456';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect repeated character patterns', async () => {
    const content = `const test = '0000000000000000000000000000000000000000';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should detect actual token with token variable name', async () => {
    const content = `const githubToken = '1234567890abcdef1234567890abcdef12345678';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('GitHub Token');
  });

  test('should detect actual token with secret variable name', async () => {
    const content = `const apiSecret = 'fedcba9876543210fedcba9876543210fedcba98';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('GitHub Token');
  });

  test('should detect token in config object', async () => {
    const content = `const config = { secret: '9876543210fedcba9876543210fedcba98765432' };`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('GitHub Token');
  });

  test('should NOT detect git log output', async () => {
    const content = `console.log('commit 1234567890abcdef1234567890abcdef12345678');`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect GitHub URL with commit', async () => {
    const content = `const url = 'https://github.com/user/repo/commit/abc123def456abc123def456abc123def456abc1';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect revision property', async () => {
    const content = `const build = { revision: 'def456abc123def456abc123def456abc123def456' };`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect MD5 hash context', async () => {
    const content = `const md5 = '1234567890abcdef1234567890abcdef12345678';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT detect SHA256 context', async () => {
    const content = `// SHA256: fedcba9876543210fedcba9876543210fedcba98`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });
});
