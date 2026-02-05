// VULNERABLE - Reflected origin without validation
const handleCors = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// VULNERABLE - Permissive origin function
const corsOptions = {
  origin: (origin, callback) => {
    // Always returns true regardless of origin
    callback(null, true);
  }
};
