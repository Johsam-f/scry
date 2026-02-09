/**
 * RULE: eval-usage
 * Demonstrates dangerous code execution vulnerabilities
 */

// Direct eval usage - VULNERABLE
function executeCode(code: string) {
  eval(code);
}

// eval in different contexts - VULNERABLE
function calculateFormula(formula: string) {
  const result = eval(formula);
  return result;
}

// Function constructor - VULNERABLE
function createDynamicFunction(body: string) {
  const fn = new Function('x', 'y', body);
  return fn;
}

// setTimeout with string - VULNERABLE
function scheduleCode(code: string) {
  setTimeout(code, 1000);
}

// setInterval with string - VULNERABLE
function repeatCode(code: string) {
  setInterval(code, 5000);
}

// Real-world vulnerable example - VULNERABLE
function evaluateUserExpression(expression: string) {
  try {
    // Attempting to evaluate user input
    const result = eval(expression);
    console.log('Result:', result);
  } catch (e) {
    console.error('Invalid expression');
  }
}

// Another vulnerable pattern - VULNERABLE
const dynamicCode = new Function('return ' + userInput);

// SECURE alternatives (for reference - scry should NOT flag these):
// Use JSON.parse() for data
// Use safe expression evaluators
// Use sandboxed environments
// Use AST parsers

function safeCalculate(expression: string): number {
  // Use a proper expression parser instead of eval
  return parseAndCalculate(expression);
}

function parseAndCalculate(expr: string): number {
  // Safe implementation
  return 0;
}

declare const userInput: string;

export { executeCode, calculateFormula, evaluateUserExpression };
