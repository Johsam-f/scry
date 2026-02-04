// SECURE - Proper environment variable loading
require('dotenv').config();

// SECURE - Using environment variables
const dbPassword = process.env.DB_PASSWORD;
const apiKey = process.env.API_KEY;

// SECURE - .env.example with placeholders (safe to commit)
// DB_PASSWORD=your_password_here
// API_KEY=your_api_key_here
