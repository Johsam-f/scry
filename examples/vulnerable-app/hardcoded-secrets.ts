/**
 * RULE: hardcoded-secrets
 * Demonstrates hardcoded secrets and credentials vulnerabilities
 */

// AWS credentials - VULNERABLE
const AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
const AWS_SECRET_KEY = 'AKIAJ7Z5X2Y4EXAMPLE1234567890abcdefghijk';

// API keys - VULNERABLE
const API_KEY = 'sk_live_51HqJ8pKqJz0mZn3xYvH9gFk2pL7sT4nX8bQ1cR6';
const STRIPE_SECRET_KEY = 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';
const SENDGRID_API_KEY = 'SG.1234567890abcdefghijklmnopqrstuvwxyz.ABCDEFG';

// GitHub tokens - VULNERABLE
const GITHUB_TOKEN = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz';
const GITHUB_PERSONAL_TOKEN = 'github_pat_11ABCDEFG_1234567890abcdefghijk';

// Private keys - VULNERABLE
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAw5vKT3H9eJK7xQY0z1234567890abcdefghijklmnop
qrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
-----END RSA PRIVATE KEY-----`;

const SSH_KEY = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABFwAAAAdzc2gtcn
-----END OPENSSH PRIVATE KEY-----`;

// Database credentials - VULNERABLE
const DB_PASSWORD = 'SuperSecret123!';
const DATABASE_URL = 'postgresql://user:password123@localhost:5432/mydb';
const MONGO_URI = 'mongodb://admin:secretpass@localhost:27017/database';

// Configuration with secrets - VULNERABLE
const config = {
  apiKey: 'ak_1234567890abcdefghijklmnopqrstuv',
  secret: 'my-secret-key-12345',
  password: 'hardcoded_password',
  accessToken: 'at_1234567890_abcdefghijklmnop',
  privateKey: 'pk_test_1234567890abcdefghij'
};

// JWT secret - VULNERABLE
const JWT_SECRET = 'my-super-secret-jwt-key-do-not-share';

// Encryption key - VULNERABLE
const ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';

// OAuth secrets - VULNERABLE
const OAUTH_CLIENT_SECRET = 'oauth_secret_1234567890abcdefghijk';
const GOOGLE_CLIENT_SECRET = 'GOCSPX-1234567890abcdefghijklmnop';

// Webhook secrets - VULNERABLE
const WEBHOOK_SECRET = 'whsec_1234567890abcdefghijklmnop';

// SECURE alternatives (for reference):
// Use environment variables: process.env.API_KEY
// Use secret management services (AWS Secrets Manager, HashiCorp Vault)
// Use encrypted configuration files
// Never commit secrets to version control

const SECURE_API_KEY = process.env.API_KEY;
const SECURE_DB_PASSWORD = process.env.DATABASE_PASSWORD;

export { API_KEY, AWS_ACCESS_KEY_ID, config };
