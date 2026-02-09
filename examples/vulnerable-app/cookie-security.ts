/**
 * RULE: cookie-security
 * Demonstrates insecure cookie configurations
 */

import express from 'express';

const app = express();

app.get('/auth/login', (req, res) => {
  const sessionToken = 'abc123token';
  
  // No security flags - VULNERABLE
  res.cookie('session', sessionToken);
  
  // Missing HttpOnly flag - VULNERABLE
  res.cookie('auth', sessionToken, { secure: true });
  
  // Missing Secure flag - VULNERABLE
  res.cookie('token', sessionToken, { httpOnly: true });
  
  // Both flags present - SECURE (scry should NOT flag this)
  res.cookie('secure_session', sessionToken, { 
    httpOnly: true, 
    secure: true 
  });
  
  res.send('Logged in');
});

app.post('/set-session', (req, res) => {
  // Insecure session cookie - VULNERABLE
  res.cookie('SESSIONID', req.body.sessionId);
  res.cookie('auth_token', req.body.token, { secure: false });
});

export { app };
