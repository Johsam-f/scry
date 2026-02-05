import { describe, expect, test } from 'bun:test';
import { PasswordSecurityRule } from '../../src/rules/passwordSecurity';

describe('PasswordSecurityRule', () => {
  const rule = new PasswordSecurityRule();

  test('should detect plaintext password storage', async () => {
    const code = `
      const user = {
        username: 'alice',
        password: 'secret123'
      };
      db.insert(user);
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('plaintext'))).toBe(true);
  });

  test('should detect password in URL', async () => {
    const code = `
      const url = 'https://user:password123@api.example.com/data';
      fetch(url);
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('URL'))).toBe(true);
  });

  test('should detect password logging', async () => {
    const code = `
      console.log('User credentials:', username, password);
      logger.info({ username, password });
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('logged'))).toBe(true);
  });

  test('should detect weak password validation (too short)', async () => {
    const code = `
      function validatePassword(password) {
        return password.length >= 6;
      }
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('too short'))).toBe(true);
  });

  test('should detect no password validation', async () => {
    const code = `
      function validatePassword(password) {
        return true;
      }
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('always returns true'))).toBe(true);
  });

  test('should detect password in GET request', async () => {
    const code = `
      axios.get('/api/login?username=alice&password=secret');
      fetch('/api/auth?password=' + userPassword);
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('GET request'))).toBe(true);
  });

  test('should detect password in query string', async () => {
    const code = `
      const params = new URLSearchParams({ username: 'alice', password: 'secret' });
      const query = '?username=alice&password=secret';
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('query string'))).toBe(true);
  });

  test('should detect direct password comparison', async () => {
    const code = `
      if (password === storedPassword) {
        login();
      }
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('timing attacks'))).toBe(true);
  });

  test('should detect password in localStorage', async () => {
    const code = `
      localStorage.setItem('password', userPassword);
      localStorage.set('user', { username, password });
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('localStorage'))).toBe(true);
  });

  test('should detect password in sessionStorage', async () => {
    const code = `
      sessionStorage.setItem('password', userPassword);
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('sessionStorage'))).toBe(true);
  });

  test('should detect hardcoded default password', async () => {
    const code = `
      const defaultPassword = 'admin123';
      const tempPassword = 'changeme';
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('default password'))).toBe(true);
  });

  test('should detect password over HTTP', async () => {
    const code = `
      fetch('http://example.com/login', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('HTTP'))).toBe(true);
  });

  test('should NOT flag properly hashed passwords', async () => {
    const code = `
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash(password, 12);
      const user = {
        username: 'alice',
        passwordHash: hash
      };
      db.insert(user);
    `;
    const findings = await rule.check(code, 'test.js');
    // Should not flag the password being hashed
    expect(findings.every(f => !f.message.includes('plaintext'))).toBe(true);
  });

  test('should NOT flag bcrypt password comparison', async () => {
    const code = `
      const bcrypt = require('bcrypt');
      const isValid = await bcrypt.compare(password, storedHash);
    `;
    const findings = await rule.check(code, 'test.js');
    // Should not flag bcrypt.compare
    expect(findings.every(f => !f.message.includes('timing'))).toBe(true);
  });

  test('should skip comments', async () => {
    const code = `
      // const password = 'test';
      /* 
        password in comment
        localStorage.setItem('password', pwd);
      */
    `;
    const findings = await rule.check(code, 'test.js');
    expect(findings.length).toBe(0);
  });

  test('should only check relevant file types', async () => {
    const code = `
      const password = 'secret123';
      localStorage.setItem('password', password);
    `;
    
    const jsFindings = await rule.check(code, 'test.js');
    expect(jsFindings.length).toBeGreaterThan(0);

    const txtFindings = await rule.check(code, 'test.txt');
    expect(txtFindings.length).toBe(0);

    const mdFindings = await rule.check(code, 'readme.md');
    expect(mdFindings.length).toBe(0);
  });

  test('should have correct rule metadata', () => {
    expect(rule.id).toBe('password-security');
    expect(rule.name).toBe('Password Security');
    expect(rule.severity).toBe('high');
    expect(rule.enabled).toBe(true);
    expect(rule.tags).toContain('security');
    expect(rule.tags).toContain('passwords');
  });

  test('should provide explanation and fix for findings', async () => {
    const code = `
      const password = 'secret';
      db.insert({ username: 'alice', password });
    `;
    const findings = await rule.check(code, 'test.js');
    
    expect(findings.length).toBeGreaterThan(0);
    const finding = findings[0];
    
    expect(finding).toBeDefined();
    expect(finding?.explanation).toBeTruthy();
    expect(finding?.explanation.length).toBeGreaterThan(50);
    expect(finding?.fix).toBeTruthy();
    expect(finding?.fix.length).toBeGreaterThan(50);
  });
});
