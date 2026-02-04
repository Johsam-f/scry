// SECURE - All security flags set
res.cookie('session', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
});

// SECURE - Set-Cookie with flags
res.setHeader(
  'Set-Cookie',
  'sessionId=abc123; HttpOnly; Secure; SameSite=Strict'
);
