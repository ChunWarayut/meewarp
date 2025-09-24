const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const warpRoutes = require('./routes/warpRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const { startTransactionPolling } = require('./jobs/transactionPolling');

const app = express();

function ensureRequiredConfig() {
  const missing = [];

  if (!config.auth.jwtSecret) {
    missing.push('ADMIN_JWT_SECRET');
  }
  if (!config.adminCredentials.email) {
    missing.push('ADMIN_EMAIL');
  }
  if (!config.adminCredentials.password) {
    missing.push('ADMIN_PASSWORD');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

ensureRequiredConfig();

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(morgan('combined'));
app.use((req, res, next) => {
  if (req.path === '/api/v1/payments/webhook') {
    return express.raw({ type: 'application/json' })(req, res, next);
  }
  return express.json()(req, res, next);
});
app.use('/api', apiLimiter);
app.use('/api/v1', warpRoutes);
app.use('/api/v1', transactionRoutes);

async function start() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    app.listen(config.port, () => {
      console.log(`Warp server listening on port ${config.port}`);
    });

    startTransactionPolling();
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
