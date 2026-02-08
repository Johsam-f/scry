// VULNERABLE - Wildcard CORS
app.use(cors({ origin: '*' }));

// VULNERABLE - Reflecting origin
res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

// VULNERABLE - null origin allowed
app.use(cors({ origin: 'null' }));

// CRITICAL - Wildcard with credentials
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// VULNERABLE - Always allowing in function
app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
  })
);
