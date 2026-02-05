// VULNERABLE - JWT in sessionStorage
function storeUserToken(token) {
  sessionStorage.setItem('authToken', token);
  sessionStorage.setItem('userToken', token);
}

function getStoredToken() {
  return sessionStorage.getItem('jwt');
}
