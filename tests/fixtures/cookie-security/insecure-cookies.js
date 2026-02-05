// VULNERABLE - Missing security flags
res.cookie('sessionId', session.id);

// VULNERABLE - httpOnly: false
res.cookie('token', token, { httpOnly: false, secure: true });

// VULNERABLE - Set-Cookie header without flags
res.setHeader('Set-Cookie', 'sessionId=abc123');

// VULNERABLE - document.cookie
document.cookie = 'tracking=xyz; path=/';
