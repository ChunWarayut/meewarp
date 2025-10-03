const mongoose = require('mongoose');
const Store = require('../models/Store');

function extractStoreIdentifier(req) {
  return (
    req.query.storeId ||
    req.headers['x-store-id'] ||
    req.body?.storeId ||
    null
  );
}

module.exports = function storeContext({ allowSuperAdminAll = false, optional = false } = {}) {
  return async function resolveStoreContext(req, res, next) {
    const { admin } = req;

    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Super admin can scope per request
    if (admin.role === 'superadmin') {
      const rawStoreId = extractStoreIdentifier(req);

      if (!rawStoreId) {
        if (allowSuperAdminAll) {
          req.storeContext = { scope: 'all', storeId: null };
          return next();
        }

        if (optional) {
          req.storeContext = { scope: 'optional', storeId: null };
          return next();
        }

        return res.status(400).json({ message: 'storeId is required for this action' });
      }

      if (!mongoose.Types.ObjectId.isValid(rawStoreId)) {
        return res.status(400).json({ message: 'Invalid storeId provided' });
      }

      const store = await Store.findById(rawStoreId).lean();
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }

      req.storeContext = {
        scope: 'store',
        storeId: store._id.toString(),
        storeName: store.name,
        storeSlug: store.slug,
        store,
      };
      return next();
    }

    if (!admin.storeId) {
      if (optional) {
        req.storeContext = { scope: 'optional', storeId: null };
        return next();
      }

      return res.status(403).json({ message: 'Store context is required' });
    }

    req.storeContext = {
      scope: 'store',
      storeId: admin.storeId,
      storeName: admin.storeName || null,
      storeSlug: admin.storeSlug || null,
    };

    return next();
  };
};
