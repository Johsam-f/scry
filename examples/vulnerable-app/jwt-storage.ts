/**
 * RULE: jwt-storage
 * Demonstrates JWT storage vulnerabilities in client-side storage
 */

// Storing JWT in localStorage - VULNERABLE
function storeTokenInLocalStorage(token: string) {
  localStorage.setItem('jwt', token);
  localStorage.setItem('auth_token', token);
  localStorage.setItem('access_token', token);
  localStorage.setItem('id_token', token);
}

// Storing JWT in sessionStorage - VULNERABLE
function storeTokenInSessionStorage(token: string) {
  sessionStorage.setItem('jwt', token);
  sessionStorage.setItem('jwt_token', token);
  sessionStorage.setItem('bearer_token', token);
}

// Reading from storage - VULNERABLE pattern
function getAuthToken(): string | null {
  return localStorage.getItem('jwt');
}

// Login flow storing JWT insecurely - VULNERABLE
async function login(username: string, password: string) {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  // BAD: Storing JWT in localStorage
  localStorage.setItem('authToken', data.token);
  
  return data;
}

// SECURE alternative (for reference - scry should NOT flag this):
// Store JWT in httpOnly, secure cookie on the server side
// Or use in-memory storage for SPA with refresh token pattern

export { storeTokenInLocalStorage, storeTokenInSessionStorage, getAuthToken, login };
