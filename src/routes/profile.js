const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../utils/authMiddleware');

router.get('/profile', authMiddleware, profileController.profile);

module.exports = router;
