const express = require('express');
const router = express.Router();
const { User, Bot, Template } = require('../models');
const authMiddleware = require('../utils/authMiddleware');
const adminOnly = require('../utils/adminOnly');


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Mendapatkan semua data user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List user
 */
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  });

/**
 * @swagger
 * /bot:
 *   get:
 *     summary: Mendapatkan semua data bot (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List bot
 */
router.get('/bot', authMiddleware, adminOnly, async (req, res) => {
    const bots = await Bot.findAll();
    res.json(bots);
});

/**
 * @swagger
 * /analytics:
 *   get:
 *     summary: Mendapatkan statistik aplikasi (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistik aplikasi
 */
router.get('/analytics', authMiddleware, adminOnly, async (req, res) => {
    const userCount = await User.count();
    const botCount = await Bot.count();
    const templateCount = await Template.count();
    res.json({
      userCount,
      botCount,
      templateCount
    });
});

module.exports = router;
