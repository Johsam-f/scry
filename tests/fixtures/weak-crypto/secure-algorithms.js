// SECURE - bcrypt for password hashing
const hash1 = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hash1);

// SECURE - SHA-256 for checksums (not passwords)
const hash2 = crypto.createHash('sha256').update(data).digest('hex');

// SECURE - Argon2 for password hashing
const hash3 = await argon2.hash(password);
const valid = await argon2.verify(hash3, password);

// SECURE - PBKDF2 with proper parameters
const salt = crypto.randomBytes(16);
const hash4 = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');

// SECURE - Random.generateSecureRandom()
const secureToken = crypto.randomBytes(32).toString('hex');
