// SECURE - JWT in httpOnly cookie
function setSecureToken(response, res) {
  const jwtToken = response.data.token;
  res.cookie('authToken', jwtToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
}
