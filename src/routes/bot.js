const express = require('express');
const router = express.Router();
const { startSession, disconnectSession, getSessionStatus } = require('../services/whatsappService');
const authMiddleware = require('../utils/authMiddleware');
const { runCommand } = require('../services/commandService');
const { handleIncomingMessage } = require('../services/commandService');
const { Bot, Template, WaSession } = require('../models');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const pm2 = require('pm2');
const adminOnly = require('../utils/adminOnly');


/**
 * @swagger
 * /connect:
 *   post:
 *     summary: Koneksi ke WhatsApp dan dapatkan QR code
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status koneksi atau QR code
 */
router.post('/connect', authMiddleware, async (req, res) => {
  const { sessionId } = req.body;
  let sent = false;
  try {
    // Pastikan bot milik user
    const bot = await Bot.findOne({ where: { sessionId, ownerId: req.user.id } });
    if (!bot) return res.status(404).json({ error: 'Bot tidak ditemukan atau bukan milik Anda' });

    // Cek status session
    const status = await getSessionStatus(sessionId);
    if (status === 'connected') {
      return res.json({ status: 'connected' });
    }

    // Jalankan koneksi WhatsApp dan kirim QR code
    await startSession(sessionId, (qr) => {
      if (!sent) {
        res.json({ status: 'pending', qr });
        sent = true;
      }
    });

    setTimeout(() => {
      if (!sent) {
        res.status(504).json({ status: 'timeout', error: 'QR code timeout' });
        sent = true;
      }
    }, 10000);
  } catch (err) {
    if (!sent && !res.headersSent) res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /disconnect:
 *   post:
 *     summary: Putuskan koneksi WhatsApp dan hapus session
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session berhasil dihapus
 */
router.post('/disconnect', authMiddleware, async (req, res) => {
  const { sessionId } = req.body;
  try {
    // Pastikan bot milik user
    const bot = await Bot.findOne({ where: { sessionId, ownerId: req.user.id } });
    if (!bot) return res.status(404).json({ error: 'Bot tidak ditemukan atau bukan milik Anda' });

    await disconnectSession(sessionId);
    res.json({ message: 'Session berhasil dihapus dan WhatsApp disconnect.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Cek status koneksi WhatsApp
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID bot
 *     responses:
 *       200:
 *         description: Status koneksi
 */
router.get('/status', authMiddleware, async (req, res) => {
  const { sessionId } = req.query;
  try {
    const status = await getSessionStatus(sessionId);
    res.json({ status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /runbot:
 *   post:
 *     summary: Jalankan bot dengan PM2
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bot berhasil dijalankan
 */
router.post('/runbot', authMiddleware, async (req, res) => {
  const { sessionId } = req.body;
  try {
    const bot = await Bot.findOne({ where: { sessionId, ownerId: req.user.id } });
    if (!bot) return res.status(404).json({ error: 'Bot tidak ditemukan' });

    const botPath = path.join(__dirname, '../../', bot.folderPath);

    // 1. Cek node_modules, install jika belum ada
    if (!fs.existsSync(path.join(botPath, 'node_modules'))) {
      await new Promise((resolve, reject) => {
        exec('npm install', { cwd: botPath }, (err, stdout, stderr) => {
          if (err) return reject(stderr);
          resolve(stdout);
        });
      });
    }

    // 2. Jalankan bot dengan PM2
    pm2.connect((err) => {
      if (err) return res.status(500).json({ error: 'Gagal konek ke PM2' });

      pm2.start({
        name: `bot-${sessionId}`,
        script: 'index.js',
        cwd: botPath,
        autorestart: true
      }, (err, apps) => {
        pm2.disconnect();
        if (err) return res.status(500).json({ error: 'Gagal menjalankan bot dengan PM2', detail: err.message });
        res.json({ message: 'Bot berhasil dijalankan dengan PM2' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /stopbot:
 *   post:
 *     summary: Hentikan bot dengan PM2
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bot berhasil dihentikan
 */
router.post('/stopbot', authMiddleware, async (req, res) => {
  const { sessionId } = req.body;
  try {
    pm2.connect((err) => {
      if (err) return res.status(500).json({ error: 'Gagal konek ke PM2' });

      pm2.stop(`bot-${sessionId}`, (err, proc) => {
        pm2.disconnect();
        if (err) return res.status(500).json({ error: 'Gagal menghentikan bot', detail: err.message });
        res.json({ message: 'Bot berhasil dihentikan' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /createbot:
 *   post:
 *     summary: Membuat bot baru
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               ownerName: { type: string }
 *               ownerNumber: { type: string }
 *               botNumber: { type: string }
 *               prefix: { type: string }
 *               commands: { type: array, items: { type: string } }
 *               templateId: { type: integer }
 *     responses:
 *       200:
 *         description: Bot berhasil dibuat
 */
router.post('/createbot', authMiddleware, async (req, res) => {
  try {
    const { name, ownerName, ownerNumber, botNumber, prefix, commands, templateId } = req.body;
    const ownerId = req.user.id; // dari JWT

    // Generate sessionId unik untuk bot ini
    const sessionId = uuidv4();

    // Jika pakai template, ambil daftar command dari template
    let finalCommands = commands;
    if (templateId) {
      const template = await Template.findByPk(templateId);
      if (!template) return res.status(404).json({ error: 'Template tidak ditemukan' });
      finalCommands = template.commands;
    }

    // Tentukan folderPath bot (misal: /bots/bot-<sessionId>)
    const folderPath = `bots/bot-${sessionId}`;

    // Simpan ke database
    const bot = await Bot.create({
      name,
      ownerId,
      ownerName,
      ownerNumber,
      botNumber,
      prefix,
      sessionId,
      commands: finalCommands,
      templateId: templateId || null,
      folderPath
    });

    res.json({ message: 'Bot berhasil dibuat', bot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /setupbot:
 *   post:
 *     summary: Setup folder dan konfigurasi bot
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bot berhasil disetup
 */
router.post('/setupbot', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const bot = await Bot.findOne({ where: { sessionId, ownerId: req.user.id } });
    if (!bot) return res.status(404).json({ error: 'Bot tidak ditemukan' });

    let commands = bot.commands;
    if (typeof commands === 'string') {
      try {
        commands = JSON.parse(commands);
      } catch (e) {
        commands = [];
      }
    }
    console.log('commands after parse:', commands, typeof commands);

    // 1. Copy base bot ke folder baru
    const basePath = path.join(__dirname, '../../CLOVBOT-BASE');
    const botPath = path.join(__dirname, '../../', bot.folderPath);
    await fs.copy(basePath, botPath);

    // 2. Edit config.txt di folder bot
    const configTxt = [
      `BOT_NUMBER=${bot.botNumber}`,
      `OWNER_NUMBER=${bot.ownerNumber}`,
      `OWNER_NAME=${bot.ownerName}`,
      `BOT_NAME=${bot.name}`,
      `PREFIX=${bot.prefix}`,
      `FOOTER=©clovdev`
    ].join('\n');
    fs.writeFileSync(path.join(botPath, 'config.txt'), configTxt);

    // 3. Copy command yang dipilih ke folder bot/commands
    const commandsDir = path.join(botPath, 'commands');
    await fs.ensureDir(commandsDir);
    for (const cmdName of commands) {
      const src = path.join(__dirname, '../commands', `${cmdName}.js`);
      const dest = path.join(commandsDir, `${cmdName}.js`);
      console.log('Copying command:', src, '->', dest);
      if (fs.existsSync(src)) {
        await fs.copy(src, dest);
      } else {
        console.warn('Command file not found:', src);
      }
    }

    // 4. Copy seluruh folder session
    const sessionSrcDir = path.join(__dirname, '../../sessions', bot.sessionId);
    const sessionDestDir = path.join(botPath, 'session');
    if (fs.existsSync(sessionSrcDir)) {
      await fs.copy(sessionSrcDir, sessionDestDir);
    } else {
      console.warn('Session folder not found:', sessionSrcDir);
    }

    res.json({ message: 'Bot berhasil disetup', botPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /botstatus:
 *   get:
 *     summary: Cek status bot di PM2
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID bot
 *     responses:
 *       200:
 *         description: Status bot
 */
router.get('/botstatus', authMiddleware, async (req, res) => {
  const { sessionId } = req.query;
  pm2.connect((err) => {
    if (err) return res.status(500).json({ error: 'Gagal konek ke PM2' });
    pm2.describe(`bot-${sessionId}`, (err, processDescription) => {
      pm2.disconnect();
      if (err) return res.status(500).json({ error: 'Gagal cek status bot', detail: err.message });
      res.json({ status: processDescription });
    });
  });
});

/**
 * @swagger
 * /botlog:
 *   get:
 *     summary: Lihat log bot
 *     tags: [Bot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID bot
 *     responses:
 *       200:
 *         description: Log bot
 */
router.get('/botlog', authMiddleware, adminOnly, async (req, res) => {
  const { sessionId } = req.query;
  const logPath = path.join(process.env.HOME || process.env.USERPROFILE, '.pm2', 'logs', `bot-${sessionId}-out.log`);
  if (!fs.existsSync(logPath)) return res.status(404).json({ error: 'Log file not found' });
  const logContent = fs.readFileSync(logPath, 'utf-8');
  res.json({ log: logContent });
});


module.exports = router;
