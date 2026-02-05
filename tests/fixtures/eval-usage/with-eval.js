// VULNERABLE - Direct eval()
const userInput = "console.log('malicious')";
eval(userInput);

// VULNERABLE - Function constructor
const code = "return 40 + 2";
const fn = new Function(code);
fn();

// VULNERABLE - setTimeout with string
setTimeout("updateUI()", 1000);

// VULNERABLE - setInterval with string
setInterval("checkStatus()", 5000);
