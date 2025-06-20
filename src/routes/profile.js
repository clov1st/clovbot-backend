const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../utils/authMiddleware');

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Mendapatkan informasi user dan bot
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Info user dan bot
 */
router.get('/profile', authMiddleware, profileController.profile);

module.exports = router;
