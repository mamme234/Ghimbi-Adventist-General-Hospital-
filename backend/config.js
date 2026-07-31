module.exports = {
  app: {
    name: 'Hospital Management System',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'https://ghimbi-adventist-general-hospital-2.vercel.app',
  },
  server: {
    port: process.env.PORT || 5000,
    apiPrefix: '/api',
  },
  database: {
    uri: process.env.MONGO_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    expiresIn: '7d',
    refreshExpiresIn: '30d',
  },
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM,
  },
  sms: {
    provider: process.env.SMS_PROVIDER,
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET,
    sender: process.env.SMS_SENDER,
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER,
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER,
    publicKey: process.env.PAYMENT_PUBLIC_KEY,
    secretKey: process.env.PAYMENT_SECRET_KEY,
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: './logs',
  },
  backup: {
    directory: './backups',
    interval: 24 * 60 * 60 * 1000, // 24 hours
    retention: 30, // days
  },
};
