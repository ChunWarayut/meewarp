const mongoose = require('mongoose');

const AppSettingsSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      index: true,
    },
    brandName: {
      type: String,
      default: 'meeWarp',
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
    },
    primaryColor: {
      type: String,
      default: '#6366F1',
      trim: true,
    },
    logo: {
      type: String,
    },
    backgroundImage: {
      type: String,
    },
    backgroundImages: {
      type: [String],
      default: [],
    },
    backgroundRotationDuration: {
      type: Number,
      default: 15000,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    siteDescription: {
      type: String,
      trim: true,
    },
    siteKeywords: {
      type: String,
      trim: true,
    },
    facebookUrl: {
      type: String,
      trim: true,
    },
    instagramUrl: {
      type: String,
      trim: true,
    },
    twitterUrl: {
      type: String,
      trim: true,
    },
    youtubeUrl: {
      type: String,
      trim: true,
    },
    tiktokUrl: {
      type: String,
      trim: true,
    },
    socialLinks: {
      type: Map,
      of: String,
      default: {},
    },
    promotionImages: {
      type: [String],
      default: [],
    },
    promotionDuration: {
      type: Number,
      default: 5000, // 5 seconds in milliseconds
    },
    promotionEnabled: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

AppSettingsSchema.index({ store: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('AppSettings', AppSettingsSchema);
