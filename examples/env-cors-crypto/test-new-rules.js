// Test file for weak crypto and env exposure detection
const crypto = require('crypto');

// Weak crypto examples
const md5Hash = crypto.createHash('md5').update('password').digest('hex');
const sha1Hash = crypto.createHash('sha1').update('data').digest('hex');

// DES encryption
const desCipher = crypto.createCipher('des', 'password');
const tripleDesCipher = crypto.createCipher('des-ede3', 'password');

// ECB mode
const ecbCipher = crypto.createCipheriv('aes-256-ecb', key, null);

// Math.random for security
const token = Math.random().toString(36).substring(7);
const sessionId = Math.random();

// Unsalted password hashing
const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

// Low bcrypt rounds
const bcrypt = require('bcrypt');
const hash1 = bcrypt.hash(password, 8);

// Low PBKDF2 iterations
const hash2 = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256');

// Hardcoded IV
const iv = '1234567890abcdef1234567890abcdef';
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

// .env exposure examples
const express = require('express');
const app = express();

// Serving .env as static
app.use(express.static('./'));
app.use(express.static(__dirname));

// .env in public directory
const envPath = 'public/.env';
const config = require('./dist/.env');

// Fetching .env from client
fetch('.env').then(res => res.text());
axios.get('.env');
