// SECURE - JWT in memory (lost on refresh)
let authToken = null;

function setAuthToken(token) {
  authToken = token;
}

function getAuthToken() {
  return authToken;
}

export { setAuthToken, getAuthToken };
