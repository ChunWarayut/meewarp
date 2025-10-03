const mongoose = require('mongoose');

const WarpTransactionSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      index: true,
    },
    warpProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarpProfile',
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerAvatar: {
      type: String,
      trim: true,
    },
    socialLink: {
      type: String,
      required: true,
      trim: true,
    },
    quote: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    displaySeconds: {
      type: Number,
      required: true,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'THB',
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarpPackage',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'displaying', 'displayed', 'cancelled'],
      default: 'pending',
    },
    displayStartedAt: {
      type: Date,
    },
    displayCompletedAt: {
      type: Date,
    },
    metadata: {
      type: Object,
    },
    activityLog: [
      {
        action: {
          type: String,
          required: true,
        },
        description: String,
        actor: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

WarpTransactionSchema.index({ store: 1, status: 1, createdAt: -1 });
WarpTransactionSchema.index({ store: 1, code: 1, createdAt: -1 });

module.exports = mongoose.model('WarpTransaction', WarpTransactionSchema);
