// VULNERABLE - JWT in localStorage
function handleLoginSuccess(response) {
  const jwtToken = response.data.token;
  localStorage.setItem('authToken', jwtToken);
  localStorage.setItem('jwt', jwtToken);
}

function handleLogout() {
  localStorage.removeItem('token');
}
