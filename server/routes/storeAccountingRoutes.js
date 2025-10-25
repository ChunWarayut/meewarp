const express = require('express');
const router = express.Router();
const StoreAccounting = require('../models/StoreAccounting');
const adminAuth = require('../middlewares/adminAuth');
const AccountingService = require('../services/accountingService');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/v1/admin/store-accounting
 * Get all store accounting settings
 */
router.get('/admin/store-accounting', adminAuth, async (req, res) => {
  try {
    const { store } = req.query;
    
    const filter = {};
    if (store) {
      filter.store = store;
    } else if (req.admin?.role !== 'superadmin' && req.admin?.storeId) {
      filter.store = req.admin.storeId;
    }

    const accountingSettings = await StoreAccounting.find(filter)
      .populate('store', 'name slug')
      .populate('createdBy', 'email displayName')
      .populate('updatedBy', 'email displayName')
      .sort({ createdAt: -1 });

    return res.json({
      accountingSettings,
      total: accountingSettings.length,
    });
  } catch (error) {
    console.error('Failed to fetch store accounting settings:', error);
    return res.status(500).json({ message: 'Failed to fetch accounting settings' });
  }
});

/**
 * GET /api/v1/admin/store-accounting/weekly-settlement
 * Get weekly settlement summary for stores
 * NOTE: This must come BEFORE the /:storeId route
 */
router.get('/admin/store-accounting/weekly-settlement', adminAuth, async (req, res) => {
  try {
    const { store, week, year } = req.query;
    
    // Get current week if not specified
    const currentDate = new Date();
    const currentWeek = week || getWeekNumber(currentDate);
    const currentYear = year || currentDate.getFullYear();
    
    const filter = {};
    if (store) {
      filter.store = store;
    } else if (req.admin?.role !== 'superadmin' && req.admin?.storeId) {
      filter.store = req.admin.storeId;
    }

    const accountingSettings = await StoreAccounting.find(filter)
      .populate('store', 'name slug')
      .sort({ 'store.name': 1 });

    const weeklySettlements = [];
    
    for (const setting of accountingSettings) {
      const settlement = await AccountingService.getWeeklySettlement(
        setting.store._id.toString(),
        currentWeek,
        currentYear
      );
      
      weeklySettlements.push({
        store: setting.store,
        accounting: setting,
        settlement,
        week: currentWeek,
        year: currentYear,
      });
    }

    return res.json({
      weeklySettlements,
      week: currentWeek,
      year: currentYear,
      total: weeklySettlements.length,
    });
  } catch (error) {
    console.error('Failed to fetch weekly settlement:', error);
    return res.status(500).json({ message: 'Failed to fetch weekly settlement' });
  }
});

/**
 * GET /api/v1/admin/store-accounting/weekly-settlement/store/:storeId
 * Get weekly settlement for specific store
 * NOTE: This must come BEFORE the /:storeId route
 */
router.get('/admin/store-accounting/weekly-settlement/store/:storeId', adminAuth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { week, year } = req.query;
    
    // Check if user has permission to access this store
    if (req.admin?.role !== 'superadmin' && req.admin?.storeId !== storeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const currentDate = new Date();
    const currentWeek = week || getWeekNumber(currentDate);
    const currentYear = year || currentDate.getFullYear();

    const accounting = await StoreAccounting.findOne({ store: storeId })
      .populate('store', 'name slug');

    if (!accounting) {
      return res.status(404).json({ message: 'Accounting settings not found for this store' });
    }

    const settlement = await AccountingService.getWeeklySettlement(
      storeId,
      currentWeek,
      currentYear
    );

    return res.json({
      weeklySettlements: [{
        store: accounting.store,
        accounting,
        settlement,
        week: currentWeek,
        year: currentYear,
      }],
      week: currentWeek,
      year: currentYear,
      total: 1,
    });
  } catch (error) {
    console.error('Failed to fetch weekly settlement for store:', error);
    return res.status(500).json({ message: 'Failed to fetch weekly settlement' });
  }
});

/**
 * GET /api/v1/admin/store-accounting/:storeId
 * Get accounting settings for specific store
 * NOTE: This must come AFTER specific routes like /weekly-settlement
 */
router.get('/admin/store-accounting/:storeId', adminAuth, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    // Check access permissions
    if (req.admin?.role !== 'superadmin' && req.admin?.storeId !== storeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const accounting = await StoreAccounting.findOne({ store: storeId })
      .populate('store', 'name slug')
      .populate('createdBy', 'email displayName')
      .populate('updatedBy', 'email displayName');

    if (!accounting) {
      return res.status(404).json({ message: 'Accounting settings not found' });
    }

    return res.json({ accounting });
  } catch (error) {
    console.error('Failed to fetch store accounting:', error);
    return res.status(500).json({ message: 'Failed to fetch accounting settings' });
  }
});

/**
 * POST /api/v1/admin/store-accounting
 * Create or update accounting settings for a store
 */
router.post('/admin/store-accounting', adminAuth, async (req, res) => {
  try {
    console.log('POST /admin/store-accounting - req.admin:', req.admin);
    const {
      store,
      taxRate,
      taxType,
      taxBrackets,
      businessType,
      taxExemptions,
      ownerShareRate,
      accountingPeriod,
      notes,
    } = req.body;

    // Validate required fields
    if (!store) {
      return res.status(400).json({ message: 'Store is required' });
    }

    // Check access permissions
    if (req.admin?.role !== 'superadmin' && req.admin?.storeId !== store) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate rates
    if (taxRate < 0 || taxRate > 100) {
      return res.status(400).json({ message: 'Tax rate must be between 0-100%' });
    }
    if (ownerShareRate < 0 || ownerShareRate > 100) {
      return res.status(400).json({ message: 'Owner share rate must be between 0-100%' });
    }

    // Check if settings already exist
    const existingSettings = await StoreAccounting.findOne({ store });
    
    if (existingSettings) {
      // Update existing settings
      existingSettings.taxRate = taxRate || 0;
      existingSettings.taxType = taxType || 'flat';
      existingSettings.taxBrackets = taxBrackets || [];
      existingSettings.businessType = businessType || 'individual';
      existingSettings.taxExemptions = taxExemptions || {
        personalAllowance: 150000,
        businessExpenses: 50,
        otherDeductions: 0,
      };
      existingSettings.ownerShareRate = ownerShareRate || 10;
      existingSettings.accountingPeriod = accountingPeriod || 'monthly';
      existingSettings.notes = notes;
      existingSettings.updatedBy = req.admin._id;
      
      await existingSettings.save();
      
      return res.json({
        message: 'Accounting settings updated successfully',
        accounting: existingSettings,
      });
    } else {
      // Create new settings
      console.log('Creating accounting settings with admin:', req.admin);
      const accounting = new StoreAccounting({
        store,
        taxRate: taxRate || 0,
        taxType: taxType || 'flat',
        taxBrackets: taxBrackets || [],
        businessType: businessType || 'individual',
        taxExemptions: taxExemptions || {
          personalAllowance: 150000,
          businessExpenses: 50,
          otherDeductions: 0,
        },
        ownerShareRate: ownerShareRate || 10,
        accountingPeriod: accountingPeriod || 'monthly',
        notes,
        createdBy: req.admin.id,
      });

      await accounting.save();
      
      return res.json({
        message: 'Accounting settings created successfully',
        accounting,
      });
    }
  } catch (error) {
    console.error('Failed to save accounting settings:', error);
    return res.status(500).json({ message: 'Failed to save accounting settings' });
  }
});

/**
 * GET /api/v1/admin/store-accounting/:storeId/settlement
 * Calculate settlement for a store
 */
router.get('/admin/store-accounting/:storeId/settlement', adminAuth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { period } = req.query; // 'current', 'last', or specific date range
    
    // Check access permissions
    if (req.admin?.role !== 'superadmin' && req.admin?.storeId !== storeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const accounting = await StoreAccounting.findOne({ store: storeId });
    if (!accounting) {
      return res.status(404).json({ message: 'Accounting settings not found' });
    }

    // Get revenue data and calculate settlement
    const settlementData = await AccountingService.calculateSettlement(storeId, period);
    
    return res.json(settlementData);
  } catch (error) {
    console.error('Failed to calculate settlement:', error);
    return res.status(500).json({ message: 'Failed to calculate settlement' });
  }
});

/**
 * GET /api/v1/admin/store-accounting/summary
 * Get accounting summary for all stores
 */
router.get('/admin/store-accounting/summary', adminAuth, async (req, res) => {
  try {
    // Only superadmin can access this
    if (req.admin?.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const accountingSettings = await StoreAccounting.find({ isActive: true })
      .populate('store', 'name slug')
      .sort({ 'store.name': 1 });

    const summary = await AccountingService.getAllStoresSummary('current');
    return res.json(summary);
  } catch (error) {
    console.error('Failed to fetch accounting summary:', error);
    return res.status(500).json({ message: 'Failed to fetch accounting summary' });
  }
});

// NOTE: Duplicate routes removed - weekly settlement routes are now defined earlier in the file
// to prevent conflict with /:storeId route

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = router;
