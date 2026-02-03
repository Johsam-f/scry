import { describe, test, expect } from 'bun:test';
import { EnvExposureRule } from '../../src/rules/envExposure';

describe('EnvExposureRule', () => {
  const rule = new EnvExposureRule();

  test('should detect .env file itself', async () => {
    const content = `DATABASE_URL=postgres://localhost`;
    const findings = await rule.check(content, '.env');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('.gitignore');
    expect(findings[0]?.severity).toBe('high');
  });

  test('should detect .env.local file', async () => {
    const content = `API_KEY=secret`;
    const findings = await rule.check(content, '.env.local');
    
    expect(findings.length).toBe(1);
  });

  test('should detect static .env serving', async () => {
    const content = `app.use(express.static('.env'));`;
    const findings = await rule.check(content, 'server.ts');
    
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.some(f => f.message.includes('static') || f.message.includes('.env'))).toBe(true);
  });

  test('should detect .env in public directory', async () => {
    const content = `const envPath = 'public/.env';`;
    const findings = await rule.check(content, 'config.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('public/static directory');
  });

  test('should detect .env in dist directory', async () => {
    const content = `import config from './dist/.env';`;
    const findings = await rule.check(content, 'app.ts');
    
    expect(findings.length).toBe(1);
  });

  test('should detect fetch .env from client', async () => {
    const content = `fetch('.env').then(res => res.text());`;
    const findings = await rule.check(content, 'client.ts');
    
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.message.includes('fetch'))).toBe(true);
  });

  test('should detect axios .env fetch', async () => {
    const content = `axios.get('.env');`;
    const findings = await rule.check(content, 'client.ts');
    
    expect(findings.length).toBeGreaterThan(0);
  });

  test('should NOT flag dotenv.config()', async () => {
    const content = `
      require('dotenv').config();
      dotenv.config({ path: '.env.local' });
    `;
    const findings = await rule.check(content, 'server.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should skip comments', async () => {
    const content = `
      // const envPath = 'public/.env';
      /* fetch('.env') */
    `;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should only scan JS/TS files for patterns', async () => {
    const content = `fetch('.env')`;
    const findings = await rule.check(content, 'README.md');
    
    expect(findings.length).toBe(0);
  });
});
