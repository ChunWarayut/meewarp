const AppSettings = require('../models/AppSettings');

async function ensureSettingsDocument(storeId) {
  const query = storeId ? { store: storeId } : {};
  const existing = await AppSettings.findOne(query).lean();

  if (existing) {
    return existing;
  }

  const payload = storeId ? { store: storeId } : {};
  const created = await AppSettings.create(payload);
  return created.toObject();
}

async function getSettings({ storeId } = {}) {
  return ensureSettingsDocument(storeId);
}

async function updateSettings({ payload, adminId, storeId }) {
  const update = {
    ...payload,
    updatedBy: adminId || null,
  };

  if (storeId) {
    update.store = storeId;
  }

  const filters = storeId ? { store: storeId } : {};

  const settings = await AppSettings.findOneAndUpdate(filters, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });

  return settings.toObject();
}

module.exports = {
  getSettings,
  updateSettings,
};
