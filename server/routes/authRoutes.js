const express = require('express');

const router = express.Router();

router.get('/instagram/login', (req, res) => {
  res.status(503).json({
    message: 'Instagram login is disabled. This endpoint is kept for backward compatibility.',
    configured: false,
  });
});

router.post('/instagram/callback', (req, res) => {
  res.status(503).json({
    message: 'Instagram login is disabled. No callback processing is performed.',
  });
});

router.get('/verify', (req, res) => {
  res.status(200).json({
    valid: false,
    user: null,
    message: 'Public warp creation no longer requires authentication.',
  });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Authentication is disabled. Nothing to log out.' });
});

module.exports = router;
