import { describe, test, expect } from 'bun:test';
import { JWTStorageRule } from '../../src/rules/jwtStorage';

describe('JWTStorageRule', () => {
  const rule = new JWTStorageRule();

  test('should detect JWT in localStorage.setItem', async () => {
    const content = `localStorage.setItem('authToken', jwtToken);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('localStorage');
    expect(findings[0]?.severity).toBe('high');
  });

  test('should detect JWT with "token" key in localStorage', async () => {
    const content = `localStorage.setItem('token', response.data.token);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
  });

  test('should detect JWT with "jwt" key in localStorage', async () => {
    const content = `localStorage.setItem('jwt', jwtToken);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
  });

  test('should detect JWT in sessionStorage.setItem', async () => {
    const content = `sessionStorage.setItem('authToken', jwtToken);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('sessionStorage');
  });

  test('should detect localStorage.getItem for JWT', async () => {
    const content = `const token = localStorage.getItem('authToken');`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
  });

  test('should detect sessionStorage.getItem for JWT', async () => {
    const content = `const token = sessionStorage.getItem('jwt');`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
  });

  test('should NOT flag secure cookie storage', async () => {
    const content = `res.cookie('token', jwtToken, { httpOnly: true, secure: true });`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(0);
  });

  test('should NOT flag in-memory storage', async () => {
    const content = `let authToken = null; authToken = token;`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(0);
  });

  test('should only check JS/TS files', async () => {
    const content = `localStorage.setItem('token', jwtToken);`;
    const findings = await rule.check(content, 'test.md');

    expect(findings.length).toBe(0);
  });

  test('should suggest httpOnly cookies as fix', async () => {
    const content = `localStorage.setItem('token', jwtToken);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings[0]?.fix).toContain('httpOnly');
    expect(findings[0]?.fix).toContain('cookie');
  });
});
