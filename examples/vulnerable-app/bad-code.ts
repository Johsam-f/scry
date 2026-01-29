// Vulnerable code for testing scry rules

// 1. Hardcoded Secret
const API_KEY = "sk_live_1234567890abcdef";
const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
const SECRET = "my-super-secret-password-123";

// 2. JWT in localStorage
function login(token) {
  localStorage.setItem('token', token);
  localStorage.setItem('jwt', token);
  sessionStorage.setItem('authToken', token);
}

// 3. eval() usage
eval(userInput);
new Function("return " + userCode)();
setTimeout("doSomething()", 1000);

// 4. CORS misconfiguration
app.use(cors({
  origin: '*',
  credentials: true
}));

// 5. Weak password check
if (password.length < 6) {
  return false;
}

// 6. Insecure cookie
res.cookie('session', sessionId);

// 7. Private key
const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2Z3qX2BTLS39R3wvUL3p...
-----END RSA PRIVATE KEY-----`;

export default { API_KEY, AWS_KEY };
