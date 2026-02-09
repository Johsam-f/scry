/**
 * RULE: env-exposure
 * Demonstrates environment file exposure vulnerabilities
 */

import express from 'express';

const app = express();

// Serving .env as static content - VULNERABLE
app.use(express.static('.env'));

// Exposing .env via endpoint - VULNERABLE
app.get('/config/.env', (req, res) => {
  res.sendFile('.env');
});

app.get('/api/.env', (req, res) => {
  res.sendFile(__dirname + '/.env');
});

// Fetching .env in client-side code - VULNERABLE
fetch('/.env')
  .then(res => res.text())
  .then(data => console.log(data));

fetch('/api/.env.local')
  .then(res => res.json());

export { app };
