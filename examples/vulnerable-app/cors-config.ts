/**
 * RULE: cors-config
 * Demonstrates CORS misconfiguration vulnerabilities
 */

import express from 'express';

const app = express();

// Wildcard origin with credentials - VULNERABLE
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Reflected origin without validation - VULNERABLE
app.get('/api/data', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin!);
  res.json({ data: 'sensitive info' });
});

// Allowing null origin - VULNERABLE
app.options('/api/resource', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'null');
  res.send();
});

// Using cors middleware with wildcard - VULNERABLE
const cors = require('cors');
app.use(cors({
  origin: '*',
  credentials: true
}));

// Overly permissive CORS function - VULNERABLE
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  next();
});

// SECURE alternative (for reference - scry should NOT flag this):
const allowedOrigins = ['https://example.com', 'https://app.example.com'];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  next();
});

export { app };
