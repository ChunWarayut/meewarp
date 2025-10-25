const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: process.env.SERVER_ENV_PATH || path.resolve(__dirname, '../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const config = {
  env: nodeEnv,
  port: parseInt(process.env.PORT || process.env.SERVER_PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/meewarp',
  rateLimit: {
    enabled:
      typeof process.env.RATE_LIMIT_ENABLED === 'string'
        ? process.env.RATE_LIMIT_ENABLED === 'true'
        : isProduction,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || `${15 * 60 * 1000}`, 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  loginRateLimit: {
    enabled:
      typeof process.env.LOGIN_RATE_LIMIT_ENABLED === 'string'
        ? process.env.LOGIN_RATE_LIMIT_ENABLED === 'true'
        : isProduction,
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || `${5 * 60 * 1000}`, 10),
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10', 10),
  },
  adminCredentials: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },
  auth: {
    jwtSecret: process.env.ADMIN_JWT_SECRET || '',
    tokenExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '1h',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    successUrl: process.env.STRIPE_SUCCESS_URL || '',
    cancelUrl: process.env.STRIPE_CANCEL_URL || '',
    promptPayExpiresAfterSeconds: parseInt(process.env.STRIPE_PROMPTPAY_EXPIRES_AFTER_SECONDS || '600', 10),
  },
  cloudflareImages: {
    accountId: process.env.CLOUDFLARE_IMAGES_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_IMAGES_API_TOKEN || '',
    deliveryUrl: process.env.CLOUDFLARE_IMAGES_DELIVERY_URL || '',
    defaultVariant: process.env.CLOUDFLARE_IMAGES_DEFAULT_VARIANT || '',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 's3.mee-warp.com',
    accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minio123456',
    bucketName: process.env.MINIO_BUCKET_NAME || 'mee-warp',
    useSSL: process.env.MINIO_USE_SSL !== 'false',
    port: parseInt(process.env.MINIO_PORT || '443', 10),
  },
};

module.exports = config;
