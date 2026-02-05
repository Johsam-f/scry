// VULNERABLE - MD5 hash
const hash1 = crypto.createHash('md5').update(data).digest('hex');

// VULNERABLE - SHA1 hash
const hash2 = crypto.createHash('sha1').update(data).digest('hex');

// VULNERABLE - No salt on password
const hash3 = crypto.createHash('sha256').update(password).digest('hex');

// VULNERABLE - DES encryption
const cipher = crypto.createCipher('des', password);

// VULNERABLE - ECB mode
const cipher2 = crypto.createCipheriv('aes-256-ecb', key, null);

// VULNERABLE - Math.random() for security token
const securityToken = Math.random().toString(36).substring(2);

// VULNERABLE - Low bcrypt rounds
const hash4 = await bcrypt.hash(password, 6);
