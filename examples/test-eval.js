// Test file for eval() detection rule
// This file contains various eval() usage patterns

// Direct eval() call
function badExample1() {
  const result = eval("2 + 2");
  return result;
}

// eval with user input - DANGEROUS!
function badExample2(userInput) {
  return eval(userInput);
}

// Function constructor
function badExample3() {
  const fn = new Function('a', 'b', 'return a + b');
  return fn(1, 2);
}

// setTimeout with string
function badExample4() {
  setTimeout("console.log('Hello')", 1000);
}

// setInterval with string
function badExample5() {
  setInterval("console.log('Tick')", 1000);
}

// Good examples (should NOT trigger)
function goodExample1() {
  const data = JSON.parse('{"key": "value"}');
  return data;
}

function goodExample2() {
  setTimeout(() => console.log('Hello'), 1000);
}

function goodExample3() {
  const fn = (a, b) => a + b;
  return fn(1, 2);
}

// This is a comment about eval() - should NOT trigger
// eval("something")

/*
 * Multi-line comment about eval()
 * eval("test")
 */
