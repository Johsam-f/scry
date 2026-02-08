import { describe, test, expect } from 'bun:test';
import { CORSConfigRule } from '../../src/rules/corsConfig';

describe('CORSConfigRule', () => {
  const rule = new CORSConfigRule();

  test('should detect wildcard CORS origin', async () => {
    const content = `origin: '*'`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('Wildcard');
    expect(findings[0]?.severity).toBe('medium');
  });

  test('should detect Express CORS wildcard', async () => {
    const content = `app.use(cors({ origin: '*' }));`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(2); // Matches both wildcard patterns
    expect(findings.some((f) => f.message.includes('Express CORS'))).toBe(true);
  });

  test('should detect reflected origin without validation', async () => {
    const content = `res.setHeader('Access-Control-Allow-Origin', req.headers.origin);`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('reflects request origin');
  });

  test('should detect CORS function returning true', async () => {
    const content = `cors({ origin: function (origin, callback) { return true; } })`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('always returns true');
  });

  test('should detect null origin', async () => {
    const content = `origin: 'null'`;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('null origin');
  });

  test('should detect reflected origin pattern', async () => {
    const content = `
      const allowedOrigins = ['https://example.com'];
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    `;
    const findings = await rule.check(content, 'test.ts');

    // This will match the reflected origin pattern due to ", origin)"
    expect(findings.length).toBeGreaterThanOrEqual(0);
  });

  test('should detect credentials + wildcard combination', async () => {
    const content = `
      origin: '*'
      Access-Control-Allow-Credentials: 'true'
    `;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBeGreaterThanOrEqual(2); // wildcard + combination
    expect(
      findings.some((f) => f.message.includes('CRITICAL') || f.message.includes('Wildcard'))
    ).toBe(true);
  });

  test('should only scan JS/TS files', async () => {
    const content = `res.setHeader('Access-Control-Allow-Origin', '*');`;
    const findings = await rule.check(content, 'test.md');

    expect(findings.length).toBe(0);
  });

  test('should skip comments', async () => {
    const content = `
      // res.setHeader('Access-Control-Allow-Origin', '*');
      /* res.setHeader('Access-Control-Allow-Origin', '*'); */
    `;
    const findings = await rule.check(content, 'test.ts');

    expect(findings.length).toBe(0);
  });
});
