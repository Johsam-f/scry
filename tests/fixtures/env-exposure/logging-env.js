// VULNERABLE - Logging environment variables
console.log('Database config:', process.env);
console.log(`API Key: ${process.env.API_KEY}`);

// VULNERABLE - Error messages exposing secrets
throw new Error(`Failed to connect with password: ${process.env.DB_PASSWORD}`);

// VULNERABLE - Returning env vars in API response
app.get('/config', (req, res) => {
  res.json(process.env);
});
