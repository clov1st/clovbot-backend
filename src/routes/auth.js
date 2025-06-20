const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// const profileController = require('../controllers/profileController');
const authMiddleware = require('../utils/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
// router.get('/profile', authMiddleware, profileController.profile);

module.exports = router;
