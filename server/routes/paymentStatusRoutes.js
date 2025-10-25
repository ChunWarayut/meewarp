const express = require('express');
const WarpTransaction = require('../models/WarpTransaction');
const publicStore = require('../middlewares/publicStore');
const storeContext = require('../middlewares/storeContext');
const adminAuth = require('../middlewares/adminAuth');

const router = express.Router();

/**
 * ตรวจสอบสถานะการชำระเงินและป้องกันการ update ซ้ำ
 * @param {string} transactionId - ID ของธุรกรรม
 * @param {string} storeId - ID ของร้านค้า
 * @param {string} actor - ผู้ดำเนินการ
 * @returns {Object} ผลลัพธ์การตรวจสอบ
 */
async function checkPaymentStatus(transactionId, storeId, actor = 'customer') {
  try {
    const transaction = await WarpTransaction.findOne({ 
      _id: transactionId, 
      store: storeId 
    }).lean();

    if (!transaction) {
      return {
        success: false,
        message: 'Transaction not found',
        status: null,
        isAlreadyPaid: false
      };
    }

    // ตรวจสอบว่าธุรกรรมนี้ชำระเงินแล้วหรือยัง
    if (transaction.status === 'paid') {
      return {
        success: true,
        message: 'Payment already completed',
        status: 'paid',
        isAlreadyPaid: true,
        transaction: {
          id: transaction._id,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          paidAt: transaction.metadata?.paidAt || transaction.updatedAt,
          customerName: transaction.customerName,
          socialLink: transaction.socialLink,
          quote: transaction.quote
        }
      };
    }

    // ถ้ายังไม่ชำระเงิน ให้ส่งข้อมูลสถานะปัจจุบัน
    return {
      success: true,
      message: 'Payment status checked',
      status: transaction.status,
      isAlreadyPaid: false,
      transaction: {
        id: transaction._id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        customerName: transaction.customerName,
        socialLink: transaction.socialLink,
        quote: transaction.quote
      }
    };

  } catch (error) {
    console.error('Error checking payment status:', error);
    return {
      success: false,
      message: 'Failed to check payment status',
      status: null,
      isAlreadyPaid: false,
      error: error.message
    };
  }
}

/**
 * API endpoint สำหรับลูกค้าตรวจสอบสถานะการชำระเงิน (ไม่ต้องใช้ authentication)
 */
router.post('/public/check-payment-status', async (req, res) => {
  try {
    console.log('Payment status check request:', req.body, req.query);
    
    const { transactionId } = req.body || {};
    const storeSlug = req.query.store;

    if (!transactionId) {
      return res.status(400).json({ 
        success: false,
        message: 'transactionId is required' 
      });
    }

    if (!storeSlug) {
      return res.status(400).json({ 
        success: false,
        message: 'store parameter is required' 
      });
    }

    // หา store จาก slug
    const Store = require('../models/Store');
    const store = await Store.findOne({ slug: storeSlug, isActive: true }).lean();
    
    if (!store) {
      return res.status(404).json({ 
        success: false,
        message: 'Store not found' 
      });
    }

    const result = await checkPaymentStatus(transactionId, store._id, 'customer');

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Payment status check error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to check payment status',
      error: error.message 
    });
  }
});

/**
 * API endpoint สำหรับลูกค้าตรวจสอบสถานะการชำระเงิน (ไม่มี middleware)
 */
router.post('/check-payment-status', async (req, res) => {
  try {
    console.log('Payment status check request (no middleware):', req.body, req.query);
    
    const { transactionId } = req.body || {};
    const storeSlug = req.query.store;

    if (!transactionId) {
      return res.status(400).json({ 
        success: false,
        message: 'transactionId is required' 
      });
    }

    if (!storeSlug) {
      return res.status(400).json({ 
        success: false,
        message: 'store parameter is required' 
      });
    }

    // หา store จาก slug
    const Store = require('../models/Store');
    const store = await Store.findOne({ slug: storeSlug, isActive: true }).lean();
    
    if (!store) {
      return res.status(404).json({ 
        success: false,
        message: 'Store not found' 
      });
    }

    const result = await checkPaymentStatus(transactionId, store._id, 'customer');

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Payment status check error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to check payment status',
      error: error.message 
    });
  }
});

/**
 * API endpoint สำหรับลูกค้าตรวจสอบสถานะการชำระเงิน (ไม่มี middleware - route ใหม่)
 */
router.post('/payment-status', async (req, res) => {
  try {
    console.log('Payment status check request (new route):', req.body, req.query);
    
    const { transactionId } = req.body || {};
    const storeSlug = req.query.store;

    if (!transactionId) {
      return res.status(400).json({ 
        success: false,
        message: 'transactionId is required' 
      });
    }

    if (!storeSlug) {
      return res.status(400).json({ 
        success: false,
        message: 'store parameter is required' 
      });
    }

    // หา store จาก slug
    const Store = require('../models/Store');
    const store = await Store.findOne({ slug: storeSlug, isActive: true }).lean();
    
    if (!store) {
      return res.status(404).json({ 
        success: false,
        message: 'Store not found' 
      });
    }

    const result = await checkPaymentStatus(transactionId, store._id, 'customer');

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Payment status check error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to check payment status',
      error: error.message 
    });
  }
});

/**
 * API endpoint สำหรับ admin ตรวจสอบสถานะการชำระเงิน
 */
router.post('/admin/check-payment-status', adminAuth, storeContext(), async (req, res) => {
  try {
    const { transactionId } = req.body || {};
    const storeId = req.storeContext?.storeId;

    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        message: 'Store context required' 
      });
    }

    if (!transactionId) {
      return res.status(400).json({ 
        success: false,
        message: 'transactionId is required' 
      });
    }

    const result = await checkPaymentStatus(transactionId, storeId, req.admin?.email || 'admin');

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Admin payment status check error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to check payment status',
      error: error.message 
    });
  }
});

module.exports = router;
