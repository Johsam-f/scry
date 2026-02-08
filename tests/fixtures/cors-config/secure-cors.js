// SECURE - Specific origin allowed
app.use(
  cors({
    origin: 'https://trusted-domain.com',
    credentials: true,
  })
);

// SECURE - Whitelist of origins
const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
