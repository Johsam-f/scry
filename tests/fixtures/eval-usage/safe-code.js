// SAFE - Using function reference
setTimeout(updateUI, 1000);

// SAFE - Using arrow function
setInterval(() => checkStatus(), 5000);

// SAFE - Using named function
function processData(input) {
  return JSON.parse(input);
}
