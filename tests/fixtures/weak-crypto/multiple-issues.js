// VULNERABLE - Multiple weak crypto patterns
import crypto from 'crypto';
import md5 from 'md5';

// Weak hashing
const hash = md5(password);
const sha1Hash = crypto.createHash('sha1').update(data).digest('hex');

// Weak encryption
const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
const des = crypto.createCipher('des', password);

// Insufficient iterations
const slowHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512');

// Predictable random (for tokens)
const unsafeToken = (Math.random() * 1000000).toString();
