const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const callbackController = require('../controllers/callback.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.put('/profile', verifyToken, userController.updateProfile);
router.get('/profile', verifyToken, userController.getProfile);

// Callback routes
router.post('/callbacks', callbackController.createCallback);
router.get('/callbacks', verifyToken, callbackController.getCallbacks);

module.exports = router;