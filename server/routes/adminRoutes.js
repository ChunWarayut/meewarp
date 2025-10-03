const express = require('express');
const adminAuth = require('../middlewares/adminAuth');
const requireRole = require('../middlewares/requireRole');
const { upload, deleteOldImage } = require('../middlewares/upload');
const { uploadImageFromMulterFile } = require('../services/cloudflareImagesService');
const storeContext = require('../middlewares/storeContext');
const {
  getDashboardOverview,
  getStatistics,
  getCustomerDirectory,
  getSuperAdminOverview,
} = require('../services/statisticsService');
const { listOrders, exportOrders } = require('../services/ordersService');
const { getSettings, updateSettings } = require('../services/settingsService');
const {
  listPackages,
  createPackage,
  updatePackage,
  deletePackage,
} = require('../services/packageService');
const Admin = require('../models/Admin');
const Store = require('../models/Store');

const router = express.Router();

router.use(adminAuth);

router.get('/admin/dashboard/overview', storeContext(), async (req, res) => {
  try {
    const overview = await getDashboardOverview({ storeId: req.storeContext.storeId });
    return res.status(200).json(overview);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard overview' });
  }
});

router.get('/admin/statistics', storeContext(), async (req, res) => {
  try {
    const { range, from, to } = req.query;
    const statistics = await getStatistics({
      storeId: req.storeContext.storeId,
      range,
      from,
      to,
    });
    return res.status(200).json(statistics);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to load statistics' });
  }
});

router.get('/admin/customers', storeContext(), async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const directory = await getCustomerDirectory({
      storeId: req.storeContext.storeId,
      page,
      limit,
      search,
    });
    return res.status(200).json(directory);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load customers' });
  }
});

router.get('/admin/orders', storeContext(), async (req, res) => {
  try {
    const { page, limit, status, search, from, to, format } = req.query;

    if (format) {
      const file = await exportOrders({
        storeId: req.storeContext.storeId,
        format,
        status,
        search,
        from,
        to,
      });
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${file.filename}`);
      return res.send(file.buffer);
    }

    const orders = await listOrders({
      storeId: req.storeContext.storeId,
      page,
      limit,
      status,
      search,
      from,
      to,
    });
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load orders' });
  }
});

router.get(
  '/admin/settings',
  requireRole('staff', 'manager', 'superadmin'),
  storeContext(),
  async (req, res) => {
    try {
      const settings = await getSettings({ storeId: req.storeContext.storeId });
      return res.status(200).json(settings);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to load settings' });
    }
  }
);

router.put(
  '/admin/settings',
  requireRole('manager', 'superadmin'),
  upload.fields([
    { name: 'backgroundImage', maxCount: 1 },
    { name: 'backgroundImages', maxCount: 15 },
    { name: 'promotionImages', maxCount: 10 },
    { name: 'logo', maxCount: 1 },
  ]),
  storeContext(),
  async (req, res) => {
    try {
      const payload = { ...req.body };

      const parseJsonArray = (raw) => {
        if (!raw) {
          return [];
        }
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch (error) {
          console.error('Failed to parse array payload:', raw, error);
          return [];
        }
      };

      const existingBackgroundImages = (() => {
        if (req.body.backgroundImagesExisting) {
          return parseJsonArray(req.body.backgroundImagesExisting);
        }
        if (req.body.backgroundImages) {
          return parseJsonArray(req.body.backgroundImages);
        }
        if (req.body.oldBackgroundImage) {
          return [req.body.oldBackgroundImage].filter(Boolean);
        }
        return [];
      })();

      const backgroundImagesToRemove = (() => parseJsonArray(req.body.backgroundImagesRemoved))();

      const existingPromotionImages = (() => {
        if (req.body.promotionImagesExisting) {
          return parseJsonArray(req.body.promotionImagesExisting);
        }

        if (req.body.promotionImages) {
          return parseJsonArray(req.body.promotionImages);
        }

        return [];
      })();

      const promotionImagesToRemove = (() => {
        if (!req.body.promotionImagesRemoved) {
          return [];
        }
        return parseJsonArray(req.body.promotionImagesRemoved);
      })();

      const files = req.files || {};

      let backgroundImages = [...existingBackgroundImages];

      if (files.backgroundImages && files.backgroundImages.length > 0) {
        const uploadedBackgrounds = await Promise.all(
          files.backgroundImages.map((file) =>
            uploadImageFromMulterFile(file, {
              storeId: req.storeContext.storeId,
              type: 'background',
            })
          )
        );

        backgroundImages = [
          ...backgroundImages,
          ...uploadedBackgrounds.map((image) => image.url).filter(Boolean),
        ];
      }

      if (files.backgroundImage && files.backgroundImage[0]) {
        const uploaded = await uploadImageFromMulterFile(files.backgroundImage[0], {
          storeId: req.storeContext.storeId,
          type: 'background',
        });

        backgroundImages = [...backgroundImages, uploaded.url].filter(Boolean);

        if (req.body.oldBackgroundImage) {
          await deleteOldImage(req.body.oldBackgroundImage);
        }
      }

      if (backgroundImagesToRemove.length > 0) {
        backgroundImages = backgroundImages.filter((image) => !backgroundImagesToRemove.includes(image));
        await Promise.all(backgroundImagesToRemove.map((image) => deleteOldImage(image)));
      }

      backgroundImages = Array.from(new Set(backgroundImages));

      payload.backgroundImages = backgroundImages;
      payload.backgroundImage = backgroundImages[0] || '';

      if (files.logo && files.logo[0]) {
        const uploaded = await uploadImageFromMulterFile(files.logo[0], {
          storeId: req.storeContext.storeId,
          type: 'logo',
        });

        payload.logo = uploaded.url;

        if (req.body.oldLogo) {
          await deleteOldImage(req.body.oldLogo);
        }
      }

      if (files.promotionImages && files.promotionImages.length > 0) {
        const uploadedPromotionImages = await Promise.all(
          files.promotionImages.map((file) =>
            uploadImageFromMulterFile(file, {
              storeId: req.storeContext.storeId,
              type: 'promotion',
            })
          )
        );

        payload.promotionImages = [
          ...existingPromotionImages,
          ...uploadedPromotionImages.map((image) => image.url).filter(Boolean),
        ];
      } else if (existingPromotionImages.length > 0) {
        payload.promotionImages = existingPromotionImages;
      } else {
        payload.promotionImages = [];
      }

      if (promotionImagesToRemove.length > 0) {
        await Promise.all(promotionImagesToRemove.map((image) => deleteOldImage(image)));
      }

      if (req.body.logoRemoved === 'true') {
        if (req.body.oldLogo) {
          await deleteOldImage(req.body.oldLogo);
        }
        payload.logo = '';
      }

      if (req.body.backgroundRotationDuration !== undefined) {
        const parsedDuration = parseInt(req.body.backgroundRotationDuration, 10);
        if (!Number.isNaN(parsedDuration) && parsedDuration > 0) {
          payload.backgroundRotationDuration = parsedDuration;
        }
      }

      if (req.body.promotionEnabled !== undefined) {
        payload.promotionEnabled = req.body.promotionEnabled === 'true';
      }

      if (req.body.promotionDuration !== undefined) {
        payload.promotionDuration = parseInt(req.body.promotionDuration, 10) || 5000;
      }

      delete payload.logoRemoved;
      delete payload.oldLogo;
      delete payload.oldBackgroundImage;
      delete payload.backgroundImagesExisting;
      delete payload.backgroundImagesRemoved;
      delete payload.promotionImagesExisting;
      delete payload.promotionImagesRemoved;

      const settings = await updateSettings({
        payload,
        adminId: req.admin.id,
        storeId: req.storeContext.storeId,
      });
      return res.status(200).json(settings);
    } catch (error) {
      console.error('Failed to update settings', error);
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      const statusCode = message.includes('Cloudflare Images') ? 400 : 500;
      return res.status(statusCode).json({ message });
    }
  }
);

router.get(
  '/admin/packages',
  requireRole('staff', 'manager', 'superadmin'),
  storeContext(),
  async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const packages = await listPackages({
      storeId: req.storeContext.storeId,
      includeInactive,
    });
    return res.status(200).json(packages);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load packages' });
  }
  }
);

router.post('/admin/packages', requireRole('manager', 'superadmin'), storeContext(), async (req, res) => {
  try {
    const { name, seconds, price } = req.body;
    if (!name || !seconds || !price) {
      return res.status(400).json({ message: 'name, seconds, and price are required' });
    }
    const pkg = await createPackage({
      storeId: req.storeContext.storeId,
      name,
      seconds,
      price,
    });
    return res.status(201).json(pkg);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Package with the same duration already exists' });
    }
    return res.status(500).json({ message: 'Failed to create package' });
  }
});

router.put('/admin/packages/:id', requireRole('manager', 'superadmin'), storeContext(), async (req, res) => {
  try {
    const pkg = await updatePackage({
      id: req.params.id,
      storeId: req.storeContext.storeId,
      payload: req.body,
    });
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }
    return res.status(200).json(pkg);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update package' });
  }
});

router.delete('/admin/packages/:id', requireRole('superadmin'), storeContext(), async (req, res) => {
  try {
    const pkg = await deletePackage({
      id: req.params.id,
      storeId: req.storeContext.storeId,
    });
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete package' });
  }
});

router.get('/admin/users', requireRole('superadmin'), async (req, res) => {
  try {
    const admins = await Admin.find({})
      .sort({ createdAt: -1 })
      .populate('store', 'name slug')
      .lean();
    return res.status(200).json(
      admins.map(({ password, store, ...rest }) => ({
        ...rest,
        store: store
          ? {
              id: store._id,
              name: store.name,
              slug: store.slug,
            }
          : null,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load admin users' });
  }
});

router.post('/admin/users', requireRole('superadmin'), async (req, res) => {
  try {
    const { email, password, role, displayName, storeId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const normalizedRole = role || 'manager';

    if (normalizedRole !== 'superadmin' && !storeId) {
      return res.status(400).json({ message: 'storeId is required for non-superadmin users' });
    }

    let store = null;
    if (storeId) {
      store = await Store.findById(storeId).lean();
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
    }

    const admin = await Admin.create({
      email,
      password,
      role: normalizedRole,
      displayName,
      store: store?._id,
    });
    const { password: _, ...sanitized } = admin.toObject();
    return res.status(201).json(sanitized);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: 'Failed to create admin user' });
  }
});

router.patch('/admin/users/:id', requireRole('superadmin'), async (req, res) => {
  try {
    const { role, password, displayName, isActive, storeId } = req.body;
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    if (role) admin.role = role;
    if (typeof isActive === 'boolean') admin.isActive = isActive;
    if (displayName !== undefined) admin.displayName = displayName;
    if (password) admin.password = password;

    if (storeId !== undefined) {
      if (!storeId && admin.role !== 'superadmin') {
        return res.status(400).json({ message: 'storeId is required for non-superadmin users' });
      }

      if (storeId) {
        const store = await Store.findById(storeId).lean();
        if (!store) {
          return res.status(404).json({ message: 'Store not found' });
        }
        admin.store = store._id;
      } else {
        admin.store = undefined;
      }
    }

    await admin.save();

    const { password: _, ...sanitized } = admin.toObject();
    return res.status(200).json(sanitized);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update admin user' });
  }
});

router.get('/admin/stores', requireRole('superadmin'), async (req, res) => {
  try {
    const stores = await Store.find({}).sort({ name: 1 }).lean();
    return res.status(200).json(stores);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load stores' });
  }
});

router.post('/admin/stores', requireRole('superadmin'), async (req, res) => {
  try {
    const { name, slug, description, contactEmail, contactPhone, timezone, metadata } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: 'name and slug are required' });
    }

    let parsedMetadata = metadata;
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (error) {
        return res.status(400).json({ message: 'metadata must be valid JSON' });
      }
    }

    const store = await Store.create({
      name,
      slug,
      description,
      contactEmail,
      contactPhone,
      timezone,
      metadata: parsedMetadata,
    });

    return res.status(201).json(store.toObject());
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Slug already in use' });
    }
    return res.status(500).json({ message: 'Failed to create store' });
  }
});

router.put('/admin/stores/:id', requireRole('superadmin'), async (req, res) => {
  try {
    const { name, slug, description, contactEmail, contactPhone, timezone, metadata, isActive } = req.body;

    let parsedMetadata = metadata;
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (error) {
        return res.status(400).json({ message: 'metadata must be valid JSON' });
      }
    }

    const update = {
      name,
      slug,
      description,
      contactEmail,
      contactPhone,
      timezone,
      metadata: parsedMetadata,
      isActive,
    };

    // Remove undefined values to avoid overwriting
    Object.keys(update).forEach((key) => {
      if (update[key] === undefined) {
        delete update[key];
      }
    });

    const store = await Store.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    return res.status(200).json(store.toObject());
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Slug already in use' });
    }
    return res.status(500).json({ message: 'Failed to update store' });
  }
});

router.get('/admin/super/reports/overview', requireRole('superadmin'), async (req, res) => {
  try {
    const report = await getSuperAdminOverview();
    return res.status(200).json(report);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load overview report' });
  }
});

module.exports = router;
