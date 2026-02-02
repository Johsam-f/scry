import { describe, test, expect } from 'bun:test';
import { CookieSecurityRule } from '../../src/rules/cookieSecurity';

describe('CookieSecurityRule', () => {
  const rule = new CookieSecurityRule();

  test('should detect Express cookie without flags', async () => {
    const content = `res.cookie('session', sessionId);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('HttpOnly and Secure');
    expect(findings[0]?.severity).toBe('high');
  });

  test('should detect Express cookie with httpOnly: false', async () => {
    const content = `res.cookie('auth', token, { httpOnly: false, secure: false });`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('HttpOnly and Secure');
  });

  test('should NOT flag secure cookies', async () => {
    const content = `res.cookie('session', token, { httpOnly: true, secure: true, sameSite: 'strict' });`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should detect Set-Cookie header without flags', async () => {
    const content = `res.setHeader('Set-Cookie', 'sessionId=abc123');`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('HttpOnly and Secure');
  });

  test('should NOT flag Set-Cookie with flags', async () => {
    const content = `res.setHeader('Set-Cookie', 'sessionId=abc123; HttpOnly; Secure; SameSite=Strict');`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should detect document.cookie', async () => {
    const content = `document.cookie = 'tracking=xyz';`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('Secure');
    expect(findings[0]?.explanation).toContain('Client-side cookie');
  });

  test('should detect Koa cookie without flags', async () => {
    const content = `ctx.cookies.set('user', userId);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
  });

  test('should NOT flag Koa cookie with flags', async () => {
    const content = `ctx.cookies.set('user', userId, { httpOnly: true, secure: true });`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should detect missing only HttpOnly', async () => {
    const content = `res.cookie('session', token, { secure: true });`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('HttpOnly');
    expect(findings[0]?.message).not.toContain('Secure');
  });

  test('should detect missing only Secure', async () => {
    const content = `res.cookie('session', token, { httpOnly: true });`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('Secure');
    expect(findings[0]?.message).not.toContain('HttpOnly');
  });

  test('should only scan JS/TS files', async () => {
    const content = `res.cookie('session', sessionId);`;
    const findings = await rule.check(content, 'test.md');
    
    expect(findings.length).toBe(0);
  });
});
