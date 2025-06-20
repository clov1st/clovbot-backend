const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// const profileController = require('../controllers/profileController');
const authMiddleware = require('../utils/authMiddleware');

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registrasi user baru
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registrasi berhasil
 *       400:
 *         description: Input tidak valid
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil, return JWT
 *       400:
 *         description: Input tidak valid
 */

router.post('/login', authController.login);
// router.get('/profile', authMiddleware, profileController.profile);

module.exports = router;
