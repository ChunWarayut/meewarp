const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    pictureUrl: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ lastLoginAt: -1 });

module.exports = mongoose.model('User', UserSchema);
