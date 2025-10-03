const mongoose = require('mongoose');

const WarpPackageSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    seconds: {
      type: Number,
      required: true,
      min: 5,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
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

WarpPackageSchema.index({ store: 1, seconds: 1 }, { unique: true, sparse: true });
WarpPackageSchema.index({ store: 1, name: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('WarpPackage', WarpPackageSchema);
