import { describe, test, expect } from 'bun:test';
import { WeakCryptoRule } from '../../src/rules/weakCrypto';

describe('WeakCryptoRule', () => {
  const rule = new WeakCryptoRule();

  test('should detect MD5 usage', async () => {
    const content = `const hash = crypto.createHash('md5').update(data).digest('hex');`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('MD5');
    expect(findings[0]?.severity).toBe('high');
  });

  test('should detect SHA1 usage', async () => {
    const content = `const hash = crypto.createHash('sha1').update(data).digest('hex');`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('SHA1');
  });

  test('should detect DES encryption', async () => {
    const content = `const cipher = crypto.createCipher('des', password);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('DES');
  });

  test('should detect 3DES encryption', async () => {
    const content = `const cipher = crypto.createCipheriv('des-ede3', key, iv);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
  });

  test('should detect ECB mode', async () => {
    const content = `const cipher = crypto.createCipheriv('aes-256-ecb', key, null);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('ECB');
  });

  test('should detect Math.random() in security context', async () => {
    const content = `const token = Math.random().toString(36);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('Math.random');
  });

  test('should NOT flag Math.random() in non-security context', async () => {
    const content = `const randomColor = Math.random() * 255;`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(0);
  });

  test('should detect unsalted password hash', async () => {
    const content = `const hash = crypto.createHash('sha256').update(password).digest('hex');`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('salt');
  });

  test('should detect low bcrypt rounds', async () => {
    const content = `const hash = bcrypt.hash(password, 8);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('rounds');
  });

  test('should NOT flag adequate bcrypt rounds', async () => {
    const content = `const hash = bcrypt.hash(password, 12);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(0);
  });

  test('should detect low PBKDF2 iterations', async () => {
    const content = `const key = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256');`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('iterations');
  });

  test('should NOT flag adequate PBKDF2 iterations', async () => {
    const content = `const key = crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256');`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(0);
  });

  test('should detect hardcoded IV', async () => {
    const content = `const iv = '1234567890abcdef1234567890abcdef';`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('Hardcoded IV');
  });

  test('should detect hardcoded salt', async () => {
    const content = `const salt = 'abcdef1234567890abcdef1234567890';`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('salt');
  });

  test('should NOT flag AES-256-GCM', async () => {
    const content = `const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(0);
  });

  test('should NOT flag SHA-256', async () => {
    const content = `const hash = crypto.createHash('sha256').update(data).digest('hex');`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(0);
  });

  test('should only scan JS/TS files', async () => {
    const content = `crypto.createHash('md5')`;
    const findings = await rule.check(content, 'test.md');

    expect(findings.length).toBe(0);
  });

  test('should skip comments', async () => {
    const content = `
      // const hash = crypto.createHash('md5');
      /* crypto.createHash('sha1') */
    `;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(0);
  });
});
