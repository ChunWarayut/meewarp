const mongoose = require('mongoose');

const WarpProfileSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    socialLink: {
      type: String,
      required: true,
      trim: true,
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

WarpProfileSchema.index({ store: 1, code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('WarpProfile', WarpProfileSchema);
