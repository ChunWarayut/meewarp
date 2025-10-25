const express = require('express');
const WarpTransaction = require('../models/WarpTransaction');
const WarpProfile = require('../models/WarpProfile');
const WarpPackage = require('../models/WarpPackage');
const adminAuth = require('../middlewares/adminAuth');
const leaderboardEmitter = require('../lib/leaderboardEmitter');
const displayEmitter = require('../lib/displayEmitter');
const storeContext = require('../middlewares/storeContext');
const publicStore = require('../middlewares/publicStore');
const { getTopSupporters } = require('../services/leaderboardService');
const { appendActivity, listRecentActivities } = require('../services/activityLogger');
const { uploadImageFromBase64, deleteImageByUrl } = require('../services/minioService');
const {
  isStripeConfigured,
  createCheckoutSession,
  createPromptPayPaymentIntent,
  retrieveCheckoutSession,
  retrievePaymentIntent,
  constructStripeEvent,
} = require('../services/stripeService');
const config = require('../config/env');

const router = express.Router();

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

function emitStoreUpdates(storeId) {
  if (!storeId) {
    return;
  }
  const storeIdString = storeId.toString();
  leaderboardEmitter.emit('update', { storeId: storeIdString });
  displayEmitter.emit('update', { storeId: storeIdString });
}

function buildSuccessUrl(code, metadata = {}) {
  if (metadata.successUrl) {
    return metadata.successUrl;
  }
  if (metadata.returnUrl) {
    return metadata.returnUrl;
  }
  if (config.stripe.successUrl) {
    return config.stripe.successUrl;
  }
  return `${PUBLIC_BASE_URL}/warp/${code}`;
}

function buildCancelUrl(code, metadata = {}) {
  if (metadata.cancelUrl) {
    return metadata.cancelUrl;
  }
  if (config.stripe.cancelUrl) {
    return config.stripe.cancelUrl;
  }
  return `${PUBLIC_BASE_URL}/warp/${code}`;
}

function toStripeMetadata(metadata = {}) {
  const entries = {};
  Object.entries(metadata).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    let stringValue;
    if (typeof value === 'object') {
      try {
        stringValue = JSON.stringify(value);
      } catch (error) {
        return;
      }
    } else {
      stringValue = String(value);
    }

    if (!stringValue) {
      return;
    }

    if (stringValue.length > 500) {
      // Skip oversized values (e.g. base64 images) to comply with Stripe limits.
      return;
    }

    entries[key] = stringValue;
  });
  return entries;
}

function normalizePaymentMethod(rawMethod, fallback = 'checkout') {
  if (!rawMethod) {
    return fallback;
  }
  const normalized = String(rawMethod).trim().toLowerCase();
  if (normalized === 'promptpay') {
    return 'promptpay';
  }
  if (normalized === 'card' || normalized === 'checkout') {
    return 'checkout';
  }
  return fallback;
}

function extractPromptPayDetails(paymentIntent, fallback = {}) {
  if (!paymentIntent && !fallback) {
    return null;
  }

  const details = { ...(fallback || {}) };

  if (paymentIntent?.id) {
    details.paymentIntentId = paymentIntent.id;
  }

  if (typeof paymentIntent?.amount === 'number') {
    details.amount = paymentIntent.amount / 100;
  }

  if (paymentIntent?.currency) {
    details.currency = paymentIntent.currency.toUpperCase();
  }

  if (paymentIntent?.status) {
    details.status = paymentIntent.status;
  }

  const qrCode = paymentIntent?.next_action?.promptpay_display_qr_code;
  if (qrCode) {
    if (qrCode.image_url_png) {
      details.qrImageUrl = qrCode.image_url_png;
    }
    if (qrCode.image_url_svg) {
      details.qrImageUrlSvg = qrCode.image_url_svg;
    }
    if (typeof qrCode.expires_at === 'number') {
      details.expiresAt = new Date(qrCode.expires_at * 1000).toISOString();
    }
    const references = qrCode.references || {};
    details.referenceNumber =
      references.number ||
      references.transaction ||
      references.reference_number ||
      details.referenceNumber ||
      null;
  }

  return Object.values(details).some((value) => value != null) ? details : null;
}

async function syncStripeTransaction(transaction, { actor = 'system' } = {}) {
  const existingPromptPayMetadata = transaction?.metadata?.promptpay || null;

  // ตรวจสอบว่าธุรกรรมนี้ชำระเงินแล้วหรือยัง
  if (transaction.status === 'paid') {
    return {
      status: transaction.status,
      stripeStatus: {
        session: transaction.metadata?.stripeCheckoutStatus || null,
        paymentStatus: transaction.metadata?.stripePaymentStatus || 'succeeded',
      },
      note: 'Payment already completed',
      promptPay: existingPromptPayMetadata,
    };
  }

  if (!isStripeConfigured()) {
    return {
      status: transaction.status,
      stripeStatus: null,
      note: 'Stripe integration is not configured',
      promptPay: existingPromptPayMetadata,
    };
  }

  const sessionId = transaction?.metadata?.stripeCheckoutSessionId;
  const paymentIntentId = transaction?.metadata?.stripePaymentIntentId;

  if (!sessionId && !paymentIntentId) {
    return {
      status: transaction.status,
      stripeStatus: null,
      note: 'No Stripe checkout session recorded for this transaction',
      promptPay: existingPromptPayMetadata,
    };
  }

  let session = null;
  let sessionError = null;
  if (sessionId) {
    try {
      session = await retrieveCheckoutSession(sessionId);
    } catch (error) {
      sessionError = error;
    }
  }

  let paymentIntent = null;
  let paymentIntentError = null;
  const effectivePaymentIntentId = paymentIntentId || session?.payment_intent;
  if (effectivePaymentIntentId) {
    try {
      paymentIntent = await retrievePaymentIntent(effectivePaymentIntentId);
    } catch (error) {
      paymentIntentError = error;
    }
  }

  const stripeStatus = {
    session: session?.status || null,
    paymentStatus: paymentIntent?.status || session?.payment_status || null,
  };
  const promptPayDetails = extractPromptPayDetails(paymentIntent, existingPromptPayMetadata);

  let note = 'Stripe status synced';
  if (sessionError && !session) {
    note = `Failed to load Stripe checkout session: ${sessionError.message}`;
  } else if (paymentIntentError && !paymentIntent) {
    note = `Failed to load Stripe payment intent: ${paymentIntentError.message}`;
  } else if (!session && !paymentIntent) {
    note = 'Stripe checkout session or payment intent not found';
  } else if (stripeStatus.paymentStatus === 'succeeded' || session?.payment_status === 'paid') {
    note = 'Payment completed';
  } else if (session?.status === 'expired' || paymentIntent?.status === 'canceled') {
    note = 'Payment expired or canceled';
  } else if (stripeStatus.paymentStatus === 'requires_payment_method') {
    note = 'Awaiting a valid payment method';
  } else if (stripeStatus.paymentStatus === 'requires_action') {
    note = 'Waiting for customer action';
  }

  let newStatus = transaction.status;
  if (stripeStatus.paymentStatus === 'succeeded' || session?.payment_status === 'paid') {
    newStatus = 'paid';
  } else if (session?.status === 'expired' || paymentIntent?.status === 'canceled') {
    newStatus = 'cancelled';
  } else if (transaction.status === 'pending') {
    newStatus = 'pending';
  }

  const now = new Date();
  if (promptPayDetails && stripeStatus.paymentStatus === 'succeeded') {
    promptPayDetails.paidAt = promptPayDetails.paidAt || now.toISOString();
  }
  const updates = {
    'metadata.stripeCheckoutSessionId': session?.id || sessionId || null,
    'metadata.stripeCheckoutUrl': session?.url || transaction?.metadata?.stripeCheckoutUrl || null,
    'metadata.stripeCheckoutStatus': session?.status || null,
    'metadata.stripePaymentStatus': stripeStatus.paymentStatus || null,
    'metadata.stripePaymentIntentId': paymentIntent?.id || effectivePaymentIntentId || null,
    'metadata.stripeCustomerEmail': session?.customer_details?.email || session?.customer_email || null,
    'metadata.lastStripeSyncAt': now,
    'metadata.stripeReceiptUrl':
      paymentIntent?.charges?.data?.[0]?.receipt_url || transaction?.metadata?.stripeReceiptUrl || null,
  };

  if (promptPayDetails) {
    updates['metadata.promptpay'] = { ...promptPayDetails };
  }

  if (session?.amount_total != null) {
    updates['metadata.stripeAmountTotal'] = session.amount_total / 100;
  }
  if (paymentIntent?.amount_received != null) {
    updates['metadata.stripeAmountReceived'] = paymentIntent.amount_received / 100;
  }
  if (session?.currency) {
    updates['metadata.stripeCurrency'] = session.currency.toUpperCase();
  } else if (paymentIntent?.currency) {
    updates['metadata.stripeCurrency'] = paymentIntent.currency.toUpperCase();
  }

  const updateOps = { $set: updates };
  if (newStatus !== transaction.status) {
    updateOps.$set.status = newStatus;
    if (newStatus === 'paid') {
      updateOps.$set['metadata.paidAt'] = now;
    }
  }

  const updated = await WarpTransaction.findByIdAndUpdate(transaction._id, updateOps, { new: true });

  if (newStatus !== transaction.status) {
    const description =
      newStatus === 'paid'
        ? `Payment completed via Stripe (${stripeStatus.paymentStatus || 'paid'})`
        : `Status updated via Stripe sync -> ${newStatus}`;
    await appendActivity(transaction._id, {
      action: 'status_changed',
      description,
      actor,
    });

    if (newStatus === 'paid') {
      emitStoreUpdates(transaction.store);
    }
  } else {
    await appendActivity(transaction._id, {
      action: 'status_check',
      description: `Stripe status check executed (${note})`,
      actor,
    });
  }

  return {
    status: updated.status,
    stripeStatus,
    note,
    promptPay: promptPayDetails,
  };
}

async function issueStripeCheckout({
  transaction,
  amount,
  currency,
  metadata,
  storeName,
  actor,
  customerEmail,
}) {
  const successUrl = buildSuccessUrl(transaction.code, metadata);
  const cancelUrl = buildCancelUrl(transaction.code, metadata);

  const session = await createCheckoutSession({
    amount,
    currency,
    metadata: toStripeMetadata({
      ...metadata,
      transactionId: transaction._id.toString(),
      storeId: transaction.store?.toString(),
      code: transaction.code,
      source: metadata?.source || actor,
    }),
    successUrl,
    cancelUrl,
    customerEmail: customerEmail || metadata?.customerEmail,
    description: `Warp for ${storeName} (${transaction.code})`,
  });

  await WarpTransaction.findByIdAndUpdate(transaction._id, {
    $set: {
      status: 'pending',
      'metadata.stripeCheckoutSessionId': session.id,
      'metadata.stripeCheckoutUrl': session.url,
      'metadata.stripeAmountTotal': session.amount_total != null ? session.amount_total / 100 : amount,
      'metadata.stripeCurrency': session.currency?.toUpperCase() || currency,
      'metadata.stripeCustomerEmail': session.customer_email || metadata?.customerEmail || null,
      'metadata.stripePaymentStatus': session.payment_status || null,
      'metadata.lastStripeSyncAt': new Date(),
    },
  });

  await appendActivity(transaction._id, {
    action: 'checkout_session_created',
    description: 'Stripe checkout session created',
    actor,
  });

  return session;
}

router.get('/leaderboard/top-supporters', publicStore, async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 3;
    const supporters = await getTopSupporters({ storeId: req.store._id, limit });
    return res.status(200).json({
      supporters,
      store: {
        id: req.store._id,
        name: req.store.name,
        slug: req.store.slug,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

router.get('/leaderboard/stream', publicStore, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const sendSnapshot = async () => {
    try {
      const supporters = await getTopSupporters({ storeId: req.store._id });
      res.write(
        `data: ${JSON.stringify({
          supporters,
          store: {
            id: req.store._id,
            name: req.store.name,
            slug: req.store.slug,
          },
        })}\n\n`
      );
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to load leaderboard' })}\n\n`);
    }
  };

  const onUpdate = async (payload) => {
    if (payload?.storeId && payload.storeId !== req.store._id.toString()) {
      return;
    }
    await sendSnapshot();
  };

  leaderboardEmitter.on('update', onUpdate);

  sendSnapshot();

  req.on('close', () => {
    leaderboardEmitter.off('update', onUpdate);
  });
});

router.get('/display/stream', publicStore, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const sendSnapshot = async () => {
    try {
      const storeFilter = { store: req.store._id };
      const queueCount = await WarpTransaction.countDocuments({ status: 'paid', ...storeFilter });
      const current = await WarpTransaction.findOne({ status: 'displaying', ...storeFilter })
        .sort({ displayStartedAt: 1, createdAt: 1 })
        .lean();

      res.write(
        `data: ${JSON.stringify({
          queueCount,
          current: current
            ? {
                id: current._id,
                customerName: current.customerName,
                socialLink: current.socialLink,
                displaySeconds: current.displaySeconds,
                startedAt: current.displayStartedAt,
                storeId: req.store._id,
              }
            : null,
          store: {
            id: req.store._id,
            name: req.store.name,
            slug: req.store.slug,
          },
        })}\n\n`
      );
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to load display queue' })}\n\n`);
    }
  };

  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 20000);

  const onUpdate = async (payload) => {
    if (payload?.storeId && payload.storeId !== req.store._id.toString()) {
      return;
    }
    await sendSnapshot();
  };

  displayEmitter.on('update', onUpdate);

  sendSnapshot();

  req.on('close', () => {
    clearInterval(heartbeat);
    displayEmitter.off('update', onUpdate);
  });
});

router.get('/public/packages', publicStore, async (req, res) => {
  try {
    const packages = await WarpPackage.find({ store: req.store._id, isActive: true })
      .sort({ seconds: 1 })
      .lean();
    return res.status(200).json({
      packages,
      store: {
        id: req.store._id,
        name: req.store.name,
        slug: req.store.slug,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load packages' });
  }
});

router.post('/transactions', adminAuth, storeContext(), async (req, res) => {
  try {
    const {
      code,
      customerName,
      customerAvatar,
      socialLink,
      quote,
      displaySeconds: displaySecondsInput,
      amount: amountInput,
      currency,
      status,
      metadata = {},
      packageId,
      customerEmail: customerEmailInput,
    } = req.body;

    if (!code || !customerName || !socialLink) {
      return res.status(400).json({ message: 'code, customerName, and socialLink are required' });
    }

    const storeId = req.storeContext?.storeId;
    if (!storeId) {
      return res.status(400).json({ message: 'Store context missing' });
    }

    const storeName = req.storeContext?.storeName || 'meeWarp';
    const profile = await WarpProfile.findOne({ code, store: storeId });

    let displaySeconds = Number(displaySecondsInput);
    let amount = Number(amountInput);
    let packageRef = null;

    if (packageId) {
      packageRef = await WarpPackage.findOne({ _id: packageId, isActive: true, store: storeId }).lean();
      if (!packageRef) {
        return res.status(400).json({ message: 'Invalid packageId' });
      }
      displaySeconds = packageRef.seconds;
      amount = packageRef.price;
    }

    if (!displaySeconds || !amount) {
      return res.status(400).json({ message: 'displaySeconds and amount are required' });
    }

    const metadataBase =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? { ...metadata } : {};
    const paymentMethod = normalizePaymentMethod(req.body.paymentMethod || metadataBase.paymentMethod, 'checkout');
    const rawCustomerEmail = (typeof customerEmailInput === 'string' ? customerEmailInput : metadataBase.customerEmail || '')
      .toString()
      .trim();
    metadataBase.paymentMethod = paymentMethod;
    metadataBase.storeName = storeName;
    if (rawCustomerEmail) {
      metadataBase.customerEmail = rawCustomerEmail;
    } else {
      delete metadataBase.customerEmail;
    }

    const transaction = await WarpTransaction.create({
      store: storeId,
      warpProfile: profile ? profile._id : undefined,
      code,
      customerName,
      customerAvatar,
      socialLink,
      quote,
      displaySeconds,
      amount,
      currency: (currency || 'THB').toUpperCase(),
      packageId: packageRef?._id,
      status: status || (isStripeConfigured() ? 'pending' : 'paid'),
      metadata: metadataBase,
    });

    await appendActivity(transaction._id, {
      action: 'created',
      description: `Transaction created by admin for ${customerName}`,
      actor: req.admin?.email || 'admin',
    });

    let responsePayload = {
      id: transaction._id,
      code: transaction.code,
      customerName: transaction.customerName,
      totalAmount: transaction.amount,
      displaySeconds: transaction.displaySeconds,
      status: transaction.status,
      packageId: transaction.packageId,
      paymentMethod,
    };

    if (isStripeConfigured()) {
      try {
        const stripeMetadata = toStripeMetadata({
          ...metadataBase,
          transactionId: transaction._id.toString(),
          storeId: storeId.toString(),
          code,
        });

        if (paymentMethod === 'promptpay') {
          const paymentIntent = await createPromptPayPaymentIntent({
            amount,
            currency: (currency || 'THB').toLowerCase(),
            metadata: stripeMetadata,
            description: `Warp for ${storeName} (${code})`,
            customerEmail: rawCustomerEmail || undefined,
            customerName,
          });

          const promptPayDetails =
            extractPromptPayDetails(paymentIntent, {
              amount,
              currency: (currency || 'THB').toUpperCase(),
              status: paymentIntent.status,
            }) || null;
          const now = new Date();

          await WarpTransaction.findByIdAndUpdate(transaction._id, {
            $set: {
              'metadata.stripePaymentIntentId': paymentIntent.id,
              'metadata.stripePaymentStatus': paymentIntent.status,
              'metadata.stripeCurrency':
                paymentIntent.currency?.toUpperCase() || (currency || 'THB').toUpperCase(),
              'metadata.stripeAmountTotal':
                typeof paymentIntent.amount === 'number' ? paymentIntent.amount / 100 : amount,
              'metadata.lastStripeSyncAt': now,
              'metadata.promptpay': promptPayDetails
                ? { ...promptPayDetails, generatedAt: now.toISOString() }
                : null,
            },
          });

          await appendActivity(transaction._id, {
            action: 'promptpay_qr_issued',
            description: 'Stripe PromptPay QR code generated',
            actor: 'system',
          });

          responsePayload = {
            ...responsePayload,
            promptPay: promptPayDetails,
          };
        } else {
          const session = await issueStripeCheckout({
            transaction,
            amount,
            currency: (currency || 'THB').toLowerCase(),
            metadata: stripeMetadata,
            storeName,
            actor: req.admin?.email || 'admin',
            customerEmail: rawCustomerEmail || undefined,
          });

          responsePayload = {
            ...responsePayload,
            stripeSessionId: session.id,
            checkoutUrl: session.url,
          };
        }
      } catch (error) {
        await appendActivity(transaction._id, {
          action: 'payment_link_failed',
          description: `Stripe payment initialization failed: ${error.message}`,
          actor: 'system',
        });

        return res.status(502).json({
          message: 'Failed to initialize Stripe payment',
          details: error.message,
        });
      }
    } else {
      emitStoreUpdates(storeId);
    }

    return res.status(201).json(responsePayload);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create transaction' });
  }
});

router.get('/transactions/activity-log', adminAuth, storeContext({ allowSuperAdminAll: true }), async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 20;
    const entries = await listRecentActivities({
      storeId: req.storeContext?.storeId || null,
      limit,
    });
    return res.status(200).json({ entries });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load activity log' });
  }
});

router.post('/transactions/:id/check-status', adminAuth, storeContext(), async (req, res) => {
  try {
    const storeId = req.storeContext?.storeId;
    if (!storeId) {
      return res.status(400).json({ message: 'Store context required' });
    }

    const transaction = await WarpTransaction.findOne({ _id: req.params.id, store: storeId }).lean();

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const result = await syncStripeTransaction(transaction, { actor: req.admin?.email || 'admin' });

    return res.status(200).json({
      status: result.status,
      stripeStatus: result.stripeStatus,
      note: result.note,
      promptPay: result.promptPay || null,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to check transaction status' });
  }
});

router.post('/public/transactions', publicStore, async (req, res) => {
  try {
    const {
      code,
      customerAvatar,
      socialLink,
      quote,
      displaySeconds: displaySecondsInput,
      amount: amountInput,
      metadata = {},
      packageId,
      customerEmail: customerEmailInput,
    } = req.body;
    const submittedCustomerName = (req.body.customerName || '').trim();

    if (!code || !submittedCustomerName || !socialLink) {
      return res.status(400).json({
        message: 'code, customerName, and socialLink are required',
      });
    }

    const storeId = req.store._id;
    const profile = await WarpProfile.findOne({ code, store: storeId });

    let displaySeconds = Number(displaySecondsInput);
    let amount = Number(amountInput);
    let packageRef = null;

    if (packageId) {
      packageRef = await WarpPackage.findOne({ _id: packageId, isActive: true, store: storeId }).lean();
      if (!packageRef) {
        return res.status(400).json({ message: 'Invalid packageId' });
      }
      displaySeconds = packageRef.seconds;
      amount = packageRef.price;
    }

    if (!displaySeconds || !amount) {
      return res.status(400).json({ message: 'displaySeconds and amount are required' });
    }

    const storeName = req.store?.name || 'meeWarp';
    const metadataBase =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? { ...metadata } : {};
    const paymentMethod = normalizePaymentMethod(req.body.paymentMethod || metadataBase.paymentMethod, 'checkout');
    const rawCustomerEmail = (typeof customerEmailInput === 'string' ? customerEmailInput : metadataBase.customerEmail || '')
      .toString()
      .trim();
    metadataBase.paymentMethod = paymentMethod;
    metadataBase.source = metadataBase.source || 'public-customer';
    metadataBase.storeName = storeName;
    if (rawCustomerEmail) {
      metadataBase.customerEmail = rawCustomerEmail;
    } else {
      delete metadataBase.customerEmail;
    }
    // Handle customer avatar: upload Base64 to MinIO if needed
    let finalCustomerAvatar = customerAvatar;
    
    if (customerAvatar && customerAvatar.startsWith('data:image/')) {
      // It's a Base64 image, upload to MinIO
      try {
        const uploaded = await uploadImageFromBase64(customerAvatar, 'avatar.jpg', {
          type: 'avatar',
          storeId: storeId.toString(),
          customerName: submittedCustomerName,
        });
        finalCustomerAvatar = uploaded.url;
      } catch (error) {
        console.error('Failed to upload avatar to MinIO:', error.message);
        // Fallback to ui-avatars.com
        finalCustomerAvatar = submittedCustomerName
          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
              submittedCustomerName
            )}&background=6366f1&color=ffffff&size=200`
          : '';
      }
    } else if (!finalCustomerAvatar && submittedCustomerName) {
      // No avatar provided, use ui-avatars.com
      finalCustomerAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        submittedCustomerName
      )}&background=6366f1&color=ffffff&size=200`;
    }

    const transaction = await WarpTransaction.create({
      store: storeId,
      warpProfile: profile ? profile._id : undefined,
      code,
      customerName: submittedCustomerName,
      customerAvatar: finalCustomerAvatar,
      socialLink,
      quote,
      displaySeconds,
      amount,
      currency: 'THB',
      packageId: packageRef?._id,
      status: isStripeConfigured() ? 'pending' : 'paid',
      metadata: metadataBase,
    });

    await appendActivity(transaction._id, {
      action: 'created',
      description: `Transaction created by customer: ${submittedCustomerName}`,
      actor: 'customer',
    });

    let responsePayload = {
      id: transaction._id,
      code: transaction.code,
      customerName: transaction.customerName,
      totalAmount: transaction.amount,
      displaySeconds: transaction.displaySeconds,
      status: transaction.status,
      packageId: transaction.packageId,
      paymentMethod,
    };

    if (isStripeConfigured()) {
      try {
        const stripeMetadata = toStripeMetadata({
          ...metadataBase,
          transactionId: transaction._id.toString(),
          storeId: storeId.toString(),
          code,
        });

        if (paymentMethod === 'promptpay') {
          const paymentIntent = await createPromptPayPaymentIntent({
            amount,
            currency: 'thb',
            metadata: stripeMetadata,
            description: `Warp for ${storeName} (${code})`,
            customerEmail: rawCustomerEmail || undefined,
            customerName: submittedCustomerName,
          });

          const promptPayDetails =
            extractPromptPayDetails(paymentIntent, {
              amount,
              currency: 'THB',
              status: paymentIntent.status,
            }) || null;
          const now = new Date();

          await WarpTransaction.findByIdAndUpdate(transaction._id, {
            $set: {
              'metadata.stripePaymentIntentId': paymentIntent.id,
              'metadata.stripePaymentStatus': paymentIntent.status,
              'metadata.stripeCurrency':
                paymentIntent.currency?.toUpperCase() || 'THB',
              'metadata.stripeAmountTotal':
                typeof paymentIntent.amount === 'number' ? paymentIntent.amount / 100 : amount,
              'metadata.lastStripeSyncAt': now,
              'metadata.promptpay': promptPayDetails
                ? { ...promptPayDetails, generatedAt: now.toISOString() }
                : null,
            },
          });

          await appendActivity(transaction._id, {
            action: 'promptpay_qr_issued',
            description: 'Stripe PromptPay QR code generated',
            actor: 'system',
          });

          responsePayload = {
            ...responsePayload,
            promptPay: promptPayDetails,
          };
        } else {
          const session = await issueStripeCheckout({
            transaction,
            amount,
            currency: 'thb',
            metadata: stripeMetadata,
            storeName,
            actor: 'customer',
            customerEmail: rawCustomerEmail || undefined,
          });
          responsePayload = {
            ...responsePayload,
            stripeSessionId: session.id,
            checkoutUrl: session.url,
          };
        }
      } catch (error) {
        await appendActivity(transaction._id, {
          action: 'payment_link_failed',
          description: `Stripe payment initialization failed: ${error.message}`,
          actor: 'system',
        });

        return res.status(502).json({
          message: 'Failed to initialize Stripe payment',
          details: error.message,
        });
      }
    } else {
      emitStoreUpdates(storeId);
    }

    return res.status(201).json(responsePayload);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create transaction',
      details: error.message,
    });
  }
});

router.post('/public/transactions/check-status', publicStore, async (req, res) => {
  try {
    const { transactionId } = req.body || {};

    const storeId = req.store._id;

    if (!transactionId) {
      return res.status(400).json({ message: 'transactionId is required' });
    }

    const transaction = await WarpTransaction.findOne({ _id: transactionId, store: storeId }).lean();

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const result = await syncStripeTransaction(transaction, { actor: 'customer' });

    return res.status(200).json({
      status: result.status,
      stripeStatus: result.stripeStatus,
      note: result.note,
      promptPay: result.promptPay || null,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to check status', details: error.message });
  }
});

router.post('/public/display/next', publicStore, async (req, res) => {
  try {
    const now = new Date();
    const storeId = req.store._id;

    const currentDisplaying = await WarpTransaction.findOne({ status: 'displaying', store: storeId })
      .sort({ displayStartedAt: -1, createdAt: -1 })
      .lean();

    if (currentDisplaying) {
      return res.status(200).json({
        id: currentDisplaying._id,
        customerName: currentDisplaying.customerName,
        customerAvatar: currentDisplaying.customerAvatar,
        socialLink: currentDisplaying.socialLink,
        quote: currentDisplaying.quote,
        displaySeconds: currentDisplaying.displaySeconds,
        metadata: currentDisplaying.metadata || {},
        selfDisplayName: currentDisplaying.metadata?.selfDisplayName || currentDisplaying.customerName,
      });
    }

    const transaction = await WarpTransaction.findOneAndUpdate(
      { status: 'paid', store: storeId },
      {
        $set: {
          status: 'displaying',
          displayStartedAt: now,
          'metadata.displayStartedAt': now,
        },
      },
      {
        sort: { createdAt: 1 },
        new: true,
      }
    );

    if (!transaction) {
      return res.status(204).send();
    }

    const estimatedEnd = new Date(now.getTime() + (transaction.displaySeconds || 0) * 1000);

    await WarpTransaction.findByIdAndUpdate(transaction._id, {
      $set: {
        'metadata.displayStartedAt': now,
        'metadata.displayEstimatedEndAt': estimatedEnd,
      },
    });

    await appendActivity(transaction._id, {
      action: 'display_started',
      description: `Warp display started for ${transaction.customerName}`,
      actor: 'display-system',
    });

    displayEmitter.emit('update', { storeId: storeId.toString() });

    return res.status(200).json({
      id: transaction._id,
      customerName: transaction.customerName,
      customerAvatar: transaction.customerAvatar,
      socialLink: transaction.socialLink,
      quote: transaction.quote,
      displaySeconds: transaction.displaySeconds,
      metadata: transaction.metadata || {},
      selfDisplayName: transaction.metadata?.selfDisplayName || transaction.customerName,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to lock next display warp' });
  }
});

router.post('/public/display/:id/complete', publicStore, async (req, res) => {
  try {
    const now = new Date();
    const storeId = req.store._id;
    const transaction = await WarpTransaction.findOneAndUpdate(
      { _id: req.params.id, status: 'displaying', store: storeId },
      {
        $set: {
          status: 'displayed',
          displayCompletedAt: now,
          'metadata.displayCompletedAt': now,
        },
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Display session not found' });
    }

    // Delete customer avatar from MinIO (if it's from MinIO)
    // Check for both Kong domain and direct IP
    if (transaction.customerAvatar && 
        (transaction.customerAvatar.includes('s3.mee-warp.com') || 
         transaction.customerAvatar.includes('43.249.35.14'))) {
      try {
        await deleteImageByUrl(transaction.customerAvatar);
        console.log(`🗑️  Deleted avatar after warp displayed: ${transaction.customerAvatar}`);
      } catch (error) {
        console.error('Failed to delete avatar:', error.message);
      }
    }

    await appendActivity(transaction._id, {
      action: 'display_completed',
      description: 'Warp display marked as completed',
      actor: 'display-system',
    });

    const storeIdString = storeId.toString();
    displayEmitter.emit('update', { storeId: storeIdString });
    leaderboardEmitter.emit('update', { storeId: storeIdString });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to complete display session' });
  }
});

router.post('/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!isStripeConfigured()) {
      return res.status(200).json({ received: true, note: 'Stripe disabled' });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ message: 'Missing stripe-signature header' });
    }

    let event;
    try {
      event = constructStripeEvent(req.body, signature);
    } catch (error) {
      return res.status(400).json({ message: `Invalid signature: ${error.message}` });
    }

    const { type, id: eventId, created } = event;
    const now = new Date();
    let eventHandled = false;

    if (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const transactionId = session?.metadata?.transactionId;
      const songRequestId = session?.metadata?.songRequestId;
      const metadataType = session?.metadata?.type;

      // Handle Song Request payment
      if (metadataType === 'song_request' && songRequestId) {
        console.log(`🎵 Webhook: Song Request payment (checkout) - ID: ${songRequestId}`);
        const SongRequest = require('../models/SongRequest');
        const songRequest = await SongRequest.findById(songRequestId);

        if (songRequest && songRequest.status !== 'paid') {
          console.log(`✅ Updating song request ${songRequestId} to paid, setting paidAt: ${now.toISOString()}`);
          const updates = {
            status: 'paid',
            paidAt: now,
            'metadata.stripeCheckoutSessionId': session.id,
            'metadata.stripeCheckoutStatus': session.status || null,
            'metadata.stripePaymentStatus': session.payment_status || null,
            'metadata.stripePaymentIntentId': session.payment_intent || null,
            'metadata.stripeCustomerEmail': session.customer_details?.email || session.customer_email || null,
            'metadata.stripeAmountTotal':
              session.amount_total != null ? session.amount_total / 100 : songRequest.amount,
            'metadata.lastStripeEventId': eventId,
            'metadata.lastStripeEventType': type,
            'metadata.lastStripeWebhookAt': now,
            'metadata.stripeEventCreatedAt': created ? new Date(created * 1000) : now,
            'metadata.lastStripeSyncAt': now,
          };

          // Update and push activity in one operation
          await SongRequest.findByIdAndUpdate(songRequest._id, {
            $set: updates,
            $push: {
              activityLog: {
                action: 'status_changed',
                description: 'Payment marked as paid via Stripe webhook (Checkout)',
                actor: 'stripe-webhook',
                timestamp: now,
              },
            },
          });

          console.log(`✅ Song Request ${songRequestId} marked as paid via webhook`);
          eventHandled = true;
        }
      }
      // Handle Warp Transaction payment
      else if (transactionId) {
        const transaction = await WarpTransaction.findById(transactionId);

        if (transaction && transaction.status !== 'paid') {
          const updates = {
            status: 'paid',
            'metadata.stripeCheckoutSessionId': session.id,
            'metadata.stripeCheckoutStatus': session.status || null,
            'metadata.stripePaymentStatus': session.payment_status || null,
            'metadata.stripePaymentIntentId': session.payment_intent || null,
            'metadata.stripeCheckoutUrl': session.url || transaction?.metadata?.stripeCheckoutUrl || null,
            'metadata.stripeCustomerEmail': session.customer_details?.email || session.customer_email || null,
            'metadata.stripeAmountTotal':
              session.amount_total != null ? session.amount_total / 100 : transaction.amount,
            'metadata.lastStripeEventId': eventId,
            'metadata.lastStripeEventType': type,
            'metadata.lastStripeWebhookAt': now,
            'metadata.stripeEventCreatedAt': created ? new Date(created * 1000) : now,
            'metadata.lastStripeSyncAt': now,
          };

          await WarpTransaction.findByIdAndUpdate(transaction._id, {
            $set: updates,
          });

          await appendActivity(transaction._id, {
            action: 'status_changed',
            description: 'Payment marked as paid via Stripe webhook',
            actor: 'stripe-webhook',
          });

          emitStoreUpdates(transaction.store);
          eventHandled = true;
        }
      }
    } else if (type === 'payment_intent.payment_failed' || type === 'checkout.session.expired') {
      const payload = event.data.object;
      const transactionId = payload?.metadata?.transactionId;

      if (transactionId) {
        const transaction = await WarpTransaction.findById(transactionId);

        if (transaction && transaction.status === 'pending') {
          const updates = {
            status: 'cancelled',
            'metadata.lastStripeEventId': eventId,
            'metadata.lastStripeEventType': type,
            'metadata.lastStripeWebhookAt': now,
            'metadata.lastStripeSyncAt': now,
          };

          if (payload?.object === 'payment_intent') {
            const promptPayDetails =
              extractPromptPayDetails(payload, transaction.metadata?.promptpay || null) || null;
            if (promptPayDetails) {
              updates['metadata.promptpay'] = { ...promptPayDetails, failedAt: now.toISOString() };
            }
          }

          await WarpTransaction.findByIdAndUpdate(transaction._id, {
            $set: updates,
          });

          await appendActivity(transaction._id, {
            action: 'status_changed',
            description: `Payment marked as cancelled via Stripe webhook (${type})`,
            actor: 'stripe-webhook',
          });
          eventHandled = true;
        }
      }
    } else if (type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const transactionId = intent?.metadata?.transactionId;
      const songRequestId = intent?.metadata?.songRequestId;
      const metadataType = intent?.metadata?.type;

      // Handle Song Request payment
      if (metadataType === 'song_request' && songRequestId) {
        console.log(`🎵 Webhook: Song Request payment (PromptPay) - ID: ${songRequestId}`);
        const SongRequest = require('../models/SongRequest');
        const songRequest = await SongRequest.findById(songRequestId);

        if (songRequest && songRequest.status !== 'paid') {
          console.log(`✅ Updating song request ${songRequestId} to paid, setting paidAt: ${now.toISOString()}`);
          const updates = {
            status: 'paid',
            paidAt: now,
            'metadata.stripePaymentIntentId': intent.id,
            'metadata.stripePaymentStatus': intent.status,
            'metadata.stripeAmountReceived':
              intent.amount_received != null ? intent.amount_received / 100 : songRequest.amount,
            'metadata.stripeReceiptUrl': intent.charges?.data?.[0]?.receipt_url || null,
            'metadata.lastStripeEventId': eventId,
            'metadata.lastStripeEventType': type,
            'metadata.lastStripeWebhookAt': now,
            'metadata.lastStripeSyncAt': now,
          };

          const promptPayDetails =
            extractPromptPayDetails(intent, songRequest.metadata?.promptpay || null) || null;
          if (promptPayDetails) {
            promptPayDetails.paidAt = promptPayDetails.paidAt || now.toISOString();
            updates['metadata.promptpay'] = promptPayDetails;
          }

          // Update and push activity in one operation
          await SongRequest.findByIdAndUpdate(songRequest._id, {
            $set: updates,
            $push: {
              activityLog: {
                action: 'status_changed',
                description: 'Payment marked as paid via Stripe payment intent webhook (PromptPay)',
                actor: 'stripe-webhook',
                timestamp: now,
              },
            },
          });

          console.log(`✅ Song Request ${songRequestId} marked as paid via PromptPay webhook`);
          eventHandled = true;
        }
      }
      // Handle Warp Transaction payment
      else if (transactionId) {
        const transaction = await WarpTransaction.findById(transactionId);
        if (transaction && transaction.status !== 'paid') {
          const updates = {
            status: 'paid',
            'metadata.stripePaymentIntentId': intent.id,
            'metadata.stripePaymentStatus': intent.status,
            'metadata.stripeAmountReceived':
              intent.amount_received != null ? intent.amount_received / 100 : transaction.amount,
            'metadata.stripeReceiptUrl': intent.charges?.data?.[0]?.receipt_url || null,
            'metadata.lastStripeEventId': eventId,
            'metadata.lastStripeEventType': type,
            'metadata.lastStripeWebhookAt': now,
            'metadata.lastStripeSyncAt': now,
          };

          const promptPayDetails =
            extractPromptPayDetails(intent, transaction.metadata?.promptpay || null) || null;
          if (promptPayDetails) {
            promptPayDetails.paidAt = promptPayDetails.paidAt || now.toISOString();
            updates['metadata.promptpay'] = promptPayDetails;
          }

          await WarpTransaction.findByIdAndUpdate(transaction._id, {
            $set: updates,
          });

          await appendActivity(transaction._id, {
            action: 'status_changed',
            description: 'Payment marked as paid via Stripe payment intent webhook',
            actor: 'stripe-webhook',
          });

          emitStoreUpdates(transaction.store);
          eventHandled = true;
        }
      }
    }

    return res.status(200).json({ received: true, handled: eventHandled });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process webhook' });
  }
});

module.exports = router;
