const Stripe = require('stripe');
const config = require('../config/env');

let stripeClient = null;

function getStripe() {
  if (!stripeClient) {
    if (!config.stripe.secretKey) {
      throw new Error('Stripe secret key is not configured');
    }
    stripeClient = new Stripe(config.stripe.secretKey);
  }
  return stripeClient;
}

function isStripeConfigured() {
  return Boolean(config.stripe.secretKey);
}

function toStripeAmount(amount) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Amount must be a positive number');
  }
  return Math.round(parsed * 100);
}

async function createCheckoutSession({
  amount,
  currency = 'thb',
  metadata = {},
  successUrl,
  cancelUrl,
  customerEmail,
  description,
}) {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: toStripeAmount(amount),
          product_data: {
            name: metadata?.productName || description || 'meeWarp payment',
            description: metadata?.productDescription || description || undefined,
          },
        },
      },
    ],
    metadata,
    customer_email: customerEmail || undefined,
    success_url: successUrl || config.stripe.successUrl || undefined,
    cancel_url: cancelUrl || config.stripe.cancelUrl || undefined,
  });

  return session;
}

async function createPromptPayPaymentIntent({
  amount,
  currency = 'thb',
  metadata = {},
  description,
  customerEmail,
  customerName,
}) {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: toStripeAmount(amount),
    currency: currency.toLowerCase(),
    description,
    metadata,
    payment_method_types: ['promptpay'],
    receipt_email: customerEmail || undefined,
  });

  const paymentMethodData = { type: 'promptpay' };
  if (customerEmail || customerName) {
    paymentMethodData.billing_details = {};
    if (customerEmail) {
      paymentMethodData.billing_details.email = customerEmail;
    }
    if (customerName) {
      paymentMethodData.billing_details.name = customerName;
    }
  }

  const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
    payment_method_data: paymentMethodData,
  });

  return confirmedIntent;
}

async function retrieveCheckoutSession(sessionId) {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }

  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId);
}

async function retrievePaymentIntent(paymentIntentId) {
  if (!paymentIntentId) {
    throw new Error('paymentIntentId is required');
  }

  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

function constructStripeEvent(rawBody, signature) {
  if (!config.stripe.webhookSecret) {
    throw new Error('Stripe webhook secret is not configured');
  }
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
}

module.exports = {
  getStripe,
  isStripeConfigured,
  createCheckoutSession,
  createPromptPayPaymentIntent,
  retrieveCheckoutSession,
  retrievePaymentIntent,
  constructStripeEvent,
};
