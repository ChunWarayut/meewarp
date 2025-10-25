const mongoose = require('mongoose');

const SongRequestSchema = new mongoose.Schema({
  // Song Information
  songTitle: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200,
  },
  artistName: {
    type: String,
    trim: true,
    maxLength: 100,
  },
  message: {
    type: String,
    trim: true,
    maxLength: 500,
  },
  
  // Requester Information
  requesterName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100,
  },
  requesterInstagram: {
    type: String,
    trim: true,
    maxLength: 100,
  },
  requesterEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  
  // Payment & Status
  amount: {
    type: Number,
    required: true,
    min: 50,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'playing', 'played', 'rejected'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['promptpay', 'checkout'],
    default: 'promptpay',
  },
  
  // Store Reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  
  // Stripe/Payment Data
  metadata: {
    stripeCheckoutSessionId: String,
    stripePaymentIntentId: String,
    stripeCheckoutStatus: String,
    stripePaymentStatus: String,
    stripeCheckoutUrl: String,
    stripeCustomerEmail: String,
    stripeAmountTotal: Number,
    stripeAmountReceived: Number,
    stripeReceiptUrl: String,
    lastStripeEventId: String,
    lastStripeEventType: String,
    lastStripeWebhookAt: Date,
    lastStripeSyncAt: Date,
    stripeEventCreatedAt: Date,
    promptpay: {
      qrImageUrl: String,
      qrImageUrlSvg: String,
      expiresAt: Date,
      paymentIntentId: String,
      referenceNumber: String,
      paidAt: Date,
      amount: Number,
      currency: String,
      status: String,
    },
  },
  
  // Timestamps
  paidAt: Date,
  playedAt: Date,
  rejectedAt: Date,
  
  // Display Information
  playedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  priority: {
    type: Number,
    default: 0,
  },
  
  // Activity Log
  activityLog: [{
    action: String,
    description: String,
    actor: String,
    timestamp: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// Pre-save hook to set priority based on amount
SongRequestSchema.pre('save', function(next) {
  if (this.isModified('amount')) {
    this.priority = this.amount;
  }
  next();
});

// Index for sorting by priority and creation time
SongRequestSchema.index({ priority: -1, createdAt: 1 });
SongRequestSchema.index({ status: 1, store: 1 });
SongRequestSchema.index({ store: 1, status: 1, priority: -1 });

// Virtual for display name
SongRequestSchema.virtual('displayName').get(function() {
  return this.artistName 
    ? `${this.songTitle} - ${this.artistName}`
    : this.songTitle;
});

// Method to add activity log entry
SongRequestSchema.methods.addActivity = function(action, description, actor = 'system') {
  this.activityLog.push({
    action,
    description,
    actor,
    timestamp: new Date(),
  });
  return this.save();
};

module.exports = mongoose.model('SongRequest', SongRequestSchema);

