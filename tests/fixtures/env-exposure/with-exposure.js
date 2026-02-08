// VULNERABLE - Serving .env statically
app.use(express.static('.env'));

// VULNERABLE - .env in public directory
const envPath = 'public/.env';
app.use(express.static(envPath));

// VULNERABLE - Fetching .env from client
fetch('.env').then((res) => res.text());

// VULNERABLE - Axios request to .env
axios.get('.env');
