import { describe, test, expect } from 'bun:test';
import { EvalUsageRule } from '../../src/rules/evalUsage';

describe('EvalUsageRule', () => {
  const rule = new EvalUsageRule();

  test('should detect direct eval() call', async () => {
    const content = `eval(userInput);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('eval()');
    expect(findings[0]?.severity).toBe('high');
  });

  test('should detect Function constructor', async () => {
    const content = `const fn = new Function('return 40 + 2');`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('Function constructor');
  });

  test('should detect setTimeout with string', async () => {
    const content = `setTimeout('updateUI()', 1000);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('setTimeout');
  });

  test('should detect setInterval with string', async () => {
    const content = `setInterval('checkStatus()', 5000);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
    expect(findings[0]?.message).toContain('setInterval');
  });

  test('should detect setTimeout with double quotes', async () => {
    const content = `setTimeout("doSomething()", 2000);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
  });

  test('should detect setInterval with backticks', async () => {
    const content = `setInterval(\`update()\`, 3000);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(1);
  });

  test('should NOT flag setTimeout with function reference', async () => {
    const content = `setTimeout(updateUI, 1000);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT flag setTimeout with arrow function', async () => {
    const content = `setTimeout(() => updateUI(), 1000);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should NOT flag setInterval with function reference', async () => {
    const content = `setInterval(checkStatus, 5000);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should only check JS/TS files', async () => {
    const content = `eval(userInput);`;
    const findings = await rule.check(content, 'test.md');
    
    expect(findings.length).toBe(0);
  });

  test('should skip comments with eval', async () => {
    const content = `
      // eval(userInput);
      /* const fn = new Function('code'); */
    `;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings.length).toBe(0);
  });

  test('should suggest JSON.parse as alternative', async () => {
    const content = `eval(jsonString);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings[0]?.fix).toContain('JSON.parse');
  });

  test('should suggest function references instead of strings', async () => {
    const content = `setTimeout('doSomething()', 1000);`;
    const findings = await rule.check(content, 'test.ts');
    
    expect(findings[0]?.fix).toContain('reference');
  });
});
