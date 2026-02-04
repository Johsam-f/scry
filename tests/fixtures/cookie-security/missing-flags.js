// VULNERABLE - Missing sameSite flag
res.cookie('session', sessionId, {
  httpOnly: true,
  secure: true
});

// VULNERABLE - sameSite: 'lax' might allow CSRF
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax'
});
