const WarpPackage = require('../models/WarpPackage');

async function listPackages({ storeId, includeInactive = false } = {}) {
  const query = {};
  if (storeId) {
    query.store = storeId;
  }
  if (!includeInactive) {
    query.isActive = true;
  }
  return WarpPackage.find(query).sort({ seconds: 1 }).lean();
}

async function createPackage({ storeId, name, seconds, price }) {
  return WarpPackage.create({ store: storeId, name, seconds, price });
}

async function updatePackage({ id, storeId, payload }) {
  const updatePayload = { ...payload };
  if (storeId) {
    return WarpPackage.findOneAndUpdate({ _id: id, store: storeId }, updatePayload, { new: true });
  }
  return WarpPackage.findByIdAndUpdate(id, updatePayload, { new: true });
}

async function deletePackage({ id, storeId }) {
  if (storeId) {
    return WarpPackage.findOneAndDelete({ _id: id, store: storeId });
  }
  return WarpPackage.findByIdAndDelete(id);
}

async function findPackageBySeconds({ storeId, seconds }) {
  const match = { seconds, isActive: true };
  if (storeId) {
    match.store = storeId;
  }
  return WarpPackage.findOne(match).lean();
}

module.exports = {
  listPackages,
  createPackage,
  updatePackage,
  deletePackage,
  findPackageBySeconds,
};
