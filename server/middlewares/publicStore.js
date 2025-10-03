const Store = require('../models/Store');

function extractSlug(req) {
  return (
    req.params.storeSlug ||
    req.query.store ||
    req.headers['x-store-slug'] ||
    null
  );
}

module.exports = async function publicStore(req, res, next) {
  try {
    const slug = extractSlug(req);
    if (!slug) {
      return res.status(400).json({ message: 'store parameter is required' });
    }

    const store = await Store.findOne({ slug, isActive: true }).lean();
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    req.store = store;
    return next();
  } catch (error) {
    return next(error);
  }
};
