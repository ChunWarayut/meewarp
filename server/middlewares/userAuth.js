const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow unauthenticated requests to proceed; downstream handlers can decide if a token is required.
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    
    // Find user in database
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      req.user = null;
      return next();
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      req.user = null;
      return next();
    }
    
    if (error.name === 'TokenExpiredError') {
      req.user = null;
      return next();
    }

    console.error('User auth middleware error:', error);
    res.status(500).json({
      message: 'Authentication error',
      code: 'AUTH_ERROR',
    });
  }
};

module.exports = userAuth;
