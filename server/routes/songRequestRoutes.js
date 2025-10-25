const express = require('express');
const router = express.Router();
const SongRequest = require('../models/SongRequest');
const publicStore = require('../middlewares/publicStore');
const adminAuth = require('../middlewares/adminAuth');
const { createCheckoutSession, createPromptPayPaymentIntent } = require('../services/stripeService');

// Helper function to append activity log
async function appendActivity(requestId, activity) {
  try {
    const request = await SongRequest.findById(requestId);
    if (request) {
      await request.addActivity(activity.action, activity.description, activity.actor);
    }
  } catch (error) {
    console.error('Failed to append activity:', error);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLIC ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/v1/public/song-requests
 * Create a new song request with payment
 */
router.post('/public/song-requests', publicStore, async (req, res) => {
  try {
    const {
      songTitle,
      artistName,
      message,
      requesterName,
      requesterInstagram,
      requesterEmail,
      amount,
      paymentMethod = 'promptpay',
    } = req.body;

    // Validation
    if (!songTitle || !songTitle.trim()) {
      return res.status(400).json({ message: 'Song title is required' });
    }
    if (!requesterName || !requesterName.trim()) {
      return res.status(400).json({ message: 'Requester name is required' });
    }
    if (!amount || amount < 50) {
      return res.status(400).json({ message: 'Amount must be at least 50 THB' });
    }

    // Create song request
    const songRequest = new SongRequest({
      songTitle: songTitle.trim(),
      artistName: artistName?.trim(),
      message: message?.trim(),
      requesterName: requesterName.trim(),
      requesterInstagram: requesterInstagram?.trim(),
      requesterEmail: requesterEmail?.trim(),
      amount,
      paymentMethod,
      status: 'pending',
      store: req.store._id,
      priority: amount,
    });

    await songRequest.save();

    await appendActivity(songRequest._id, {
      action: 'created',
      description: `Song request created: "${songTitle}"`,
      actor: 'customer',
    });

    // Payment Integration
    let checkoutUrl = null;
    let stripeSessionId = null;
    let promptPay = null;

    if (paymentMethod === 'checkout') {
      // Stripe Checkout
      try {
        const session = await createCheckoutSession({
          amount,
          customerEmail: requesterEmail || 'noreply@meewarp.com',
          metadata: {
            type: 'song_request',
            songRequestId: songRequest._id.toString(),
            songTitle,
            requesterName,
            storeId: req.store._id.toString(),
          },
          successUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/${req.store.slug}/song-request/success?requestId=${songRequest._id}`,
          cancelUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/${req.store.slug}/song-request`,
        });

        checkoutUrl = session.url;
        stripeSessionId = session.id;

        songRequest.metadata.stripeCheckoutSessionId = session.id;
        songRequest.metadata.stripeCheckoutUrl = session.url;
        await songRequest.save();

        await appendActivity(songRequest._id, {
          action: 'payment_initiated',
          description: 'Stripe Checkout session created',
          actor: 'stripe',
        });
      } catch (error) {
        console.error('Failed to create Stripe checkout session:', error);
      }
    } else if (paymentMethod === 'promptpay') {
      // PromptPay
      try {
        const paymentIntent = await createPromptPayPaymentIntent({
          amount,
          customerEmail: requesterEmail || 'noreply@meewarp.com',
          customerName: requesterName,
          description: `Song Request: ${songTitle}`,
          metadata: {
            type: 'song_request',
            songRequestId: songRequest._id.toString(),
            songTitle,
            requesterName,
            storeId: req.store._id.toString(),
          },
        });

        const promptPaySource = paymentIntent.next_action?.promptpay_display_qr_code;
        if (promptPaySource) {
          promptPay = {
            qrImageUrl: promptPaySource.image_url_png,
            qrImageUrlSvg: promptPaySource.image_url_svg,
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
            paymentIntentId: paymentIntent.id,
            amount,
            currency: 'THB',
            status: 'pending',
          };

          songRequest.metadata.stripePaymentIntentId = paymentIntent.id;
          songRequest.metadata.promptpay = promptPay;
          await songRequest.save();

          await appendActivity(songRequest._id, {
            action: 'payment_initiated',
            description: 'PromptPay QR code generated',
            actor: 'stripe',
          });
        }
      } catch (error) {
        console.error('Failed to create PromptPay payment intent:', error);
      }
    }

    return res.status(201).json({
      id: songRequest._id,
      status: songRequest.status,
      checkoutUrl,
      stripeSessionId,
      promptPay,
      message: 'Song request created successfully',
    });
  } catch (error) {
    console.error('Failed to create song request:', error);
    return res.status(500).json({ message: 'Failed to create song request' });
  }
});

/**
 * POST /api/v1/public/song-requests/check-status
 * Check payment status of a song request
 */
router.post('/public/song-requests/check-status', publicStore, async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    const songRequest = await SongRequest.findById(requestId);

    if (!songRequest) {
      return res.status(404).json({ message: 'Song request not found' });
    }

    // Check if already paid
    const isAlreadyPaid = ['paid', 'playing', 'played'].includes(songRequest.status);

    return res.json({
      success: true,
      status: songRequest.status,
      isAlreadyPaid,
      message: isAlreadyPaid 
        ? 'Payment completed successfully'
        : 'Payment is still pending',
    });
  } catch (error) {
    console.error('Failed to check payment status:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to check payment status',
    });
  }
});

/**
 * GET /api/v1/public/song-requests/paid
 * Get paid song requests for display (TV)
 */
router.get('/public/song-requests-paid', publicStore, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const AUTO_HIDE_AFTER_MS = 60000; // 60 seconds

    // ดึงเฉพาะ status = 'paid' เท่านั้น (ไม่เอา 'playing')
    // เมื่อ admin mark as 'playing' จะหายจาก TV
    const songRequests = await SongRequest.find({
      store: req.store._id,
      status: 'paid',
    })
      .sort({ priority: -1, createdAt: 1 })
      .limit(Number(limit))
      .lean();

    const now = new Date();
    const filteredRequests = [];

    // Filter และ auto-update status
    for (const sr of songRequests) {
      if (!sr.paidAt) {
        console.log(`⚠️  Song ${sr._id} has no paidAt field`);
        filteredRequests.push({
          id: sr._id,
          songTitle: sr.songTitle,
          artistName: sr.artistName,
          customerName: sr.customerName,
          message: sr.message,
          amount: sr.amount,
          status: sr.status,
          paidAt: sr.paidAt,
        });
        continue;
      }

      const paidTime = new Date(sr.paidAt);
      const elapsedMs = now - paidTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      
      console.log(`🔍 Song ${sr._id} (${sr.songTitle}): elapsed ${elapsedSeconds}s / 60s, paidAt: ${sr.paidAt}`);

      if (elapsedMs >= AUTO_HIDE_AFTER_MS) {
        // Auto-update status to 'playing' after 60 seconds
        await SongRequest.findByIdAndUpdate(sr._id, {
          $set: { status: 'playing' },
          $push: {
            activityLog: {
              action: 'status_changed',
              description: 'Auto-hidden from TV after 60 seconds',
              actor: 'system',
              timestamp: now,
            },
          },
        });
        console.log(`Auto-hidden song request ${sr._id} after 60 seconds`);
        // ไม่ return ใน list
      } else {
        // ยังไม่เกิน 60 วินาที, แสดงบน TV
        filteredRequests.push({
          id: sr._id,
          songTitle: sr.songTitle,
          artistName: sr.artistName,
          customerName: sr.requesterName, // Map requesterName -> customerName
          message: sr.message,
          amount: sr.amount,
          status: sr.status,
          paidAt: sr.paidAt, // ส่ง paidAt ให้ frontend
        });
      }
    }

    return res.json({
      success: true,
      songRequests: filteredRequests,
    });
  } catch (error) {
    console.error('Failed to fetch paid song requests:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch song requests',
    });
  }
});

/**
 * GET /api/v1/public/song-requests/:id
 * Get song request details
 */
router.get('/public/song-requests/:id', publicStore, async (req, res) => {
  try {
    const songRequest = await SongRequest.findById(req.params.id);

    if (!songRequest) {
      return res.status(404).json({ message: 'Song request not found' });
    }

    return res.json({
      id: songRequest._id,
      songTitle: songRequest.songTitle,
      artistName: songRequest.artistName,
      requesterName: songRequest.requesterName,
      amount: songRequest.amount,
      status: songRequest.status,
      createdAt: songRequest.createdAt,
    });
  } catch (error) {
    console.error('Failed to fetch song request:', error);
    return res.status(500).json({ message: 'Failed to fetch song request' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/v1/admin/song-requests
 * Get all song requests with filtering
 */
router.get('/admin/song-requests', adminAuth, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const songRequests = await SongRequest.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await SongRequest.countDocuments(filter);

    return res.json({
      songRequests,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Failed to fetch song requests:', error);
    return res.status(500).json({ message: 'Failed to fetch song requests' });
  }
});

/**
 * PATCH /api/v1/admin/song-requests/:id
 * Update song request status
 */
router.patch('/admin/song-requests/:id', adminAuth, async (req, res) => {
  try {
    const { status, playedAt } = req.body;

    const songRequest = await SongRequest.findById(req.params.id);

    if (!songRequest) {
      return res.status(404).json({ message: 'Song request not found' });
    }

    if (status) {
      songRequest.status = status;
      
      await appendActivity(songRequest._id, {
        action: 'status_changed',
        description: `Status changed to: ${status}`,
        actor: req.admin?.email || 'admin',
      });
    }

    if (playedAt) {
      songRequest.playedAt = new Date(playedAt);
      songRequest.playedBy = req.admin?._id;
      
      await appendActivity(songRequest._id, {
        action: 'played',
        description: 'Song was played',
        actor: req.admin?.email || 'admin',
      });
    }

    await songRequest.save();

    return res.json({
      message: 'Song request updated successfully',
      songRequest,
    });
  } catch (error) {
    console.error('Failed to update song request:', error);
    return res.status(500).json({ message: 'Failed to update song request' });
  }
});

/**
 * DELETE /api/v1/admin/song-requests/:id
 * Delete song request
 */
router.delete('/admin/song-requests/:id', adminAuth, async (req, res) => {
  try {
    const songRequest = await SongRequest.findByIdAndDelete(req.params.id);

    if (!songRequest) {
      return res.status(404).json({ message: 'Song request not found' });
    }

    return res.json({
      message: 'Song request deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete song request:', error);
    return res.status(500).json({ message: 'Failed to delete song request' });
  }
});

module.exports = router;

