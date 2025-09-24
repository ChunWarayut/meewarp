const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const WarpProfile = require('../models/WarpProfile');
const config = require('../config/env');
const adminAuth = require('../middlewares/adminAuth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: config.loginRateLimit.windowMs,
  max: config.loginRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/admin/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  if (
    email !== config.adminCredentials.email ||
    password !== config.adminCredentials.password
  ) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    const token = jwt.sign({ email }, config.auth.jwtSecret, {
      expiresIn: config.auth.tokenExpiresIn,
    });

    return res.status(200).json({ token, expiresIn: config.auth.tokenExpiresIn });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate token' });
  }
});

router.post('/admin/warp', adminAuth, async (req, res) => {
  try {
    const { code, name, socialLink, isActive } = req.body;

    if (!code || !name || !socialLink) {
      return res.status(400).json({ message: 'code, name, and socialLink are required' });
    }

    const warpProfile = await WarpProfile.create({ code, name, socialLink, isActive });
    return res.status(201).json({
      id: warpProfile._id,
      code: warpProfile.code,
      name: warpProfile.name,
      socialLink: warpProfile.socialLink,
      isActive: warpProfile.isActive,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Warp code already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to create Warp profile' });
  }
});

router.get('/warp/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const warpProfile = await WarpProfile.findOne({ code });

    if (!warpProfile || !warpProfile.isActive) {
      return res.status(404).json({ message: 'Warp profile not found' });
    }

    return res.status(200).json({ socialLink: warpProfile.socialLink });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve Warp profile' });
  }
});

module.exports = router;
