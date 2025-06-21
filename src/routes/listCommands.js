const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Command } = require('../models');
const authMiddleware = require('../utils/authMiddleware');
const multer = require('multer');
const adminOnly = require('../utils/adminOnly');

/**
 * @swagger
 * /listcommand:
 *   get:
 *     summary: List semua command yang tersedia
 *     tags: [Command]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List command
 */
router.get('/listcommand', authMiddleware, async (req, res) => {
  try {
    const commands = await Command.findAll();
    res.json({ commands });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../commands/'));
  },
  filename: function (req, file, cb) {
    const dest = path.join(__dirname, '../commands/', file.originalname);
    // Cek apakah file sudah ada sebelum upload
    if (fs.existsSync(dest)) {
      return cb(new Error(`File command "${file.originalname}" sudah ada. Silakan gunakan nama file yang berbeda.`));
    }
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== '.js') {
      return cb(new Error('Only .js files are allowed!'));
    }
    cb(null, true);
  }
});

/**
 * @swagger
 * /addcommand:
 *   post:
 *     summary: Tambah command custom (upload file .js)
 *     tags: [Command]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               commandFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Command berhasil diupload
 */
router.post('/addcommand', authMiddleware, (req, res, next) => {
  upload.single('commandFile')(req, res, function (err) {
    if (err) {
      // Error dari multer (termasuk file sudah ada)
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, description } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Cek nama command di database
    const existing = await Command.findOne({ where: { name } });
    if (existing) {
      // Hapus file yang baru diupload (karena validasi nama command gagal)
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ error: `Command dengan nama "${name}" sudah ada. Silakan gunakan nama command yang berbeda.` });
    }

    // Simpan metadata ke database
    await Command.create({
      name,
      description,
      isDefault: false,
      filename: file.originalname
    });

    res.json({ message: 'Command berhasil diupload dan ditambahkan!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /deletecommand:
 *   delete:
 *     summary: Hapus command custom
 *     tags: [Command]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Command berhasil dihapus
 */
router.delete('/deletecommand', authMiddleware, async (req, res) => {
  // Ambil dari body atau query
  const name = req.body?.name || req.query?.name;
  if (!name) return res.status(400).json({ error: 'Parameter name wajib diisi.' });
  try {
    const command = await Command.findOne({ where: { name } });
    if (!command) return res.status(404).json({ error: 'Command tidak ditemukan.' });
    if (command.isDefault) {
      return res.status(400).json({ error: 'Tidak bisa menghapus command default.' });
    }

    // Hapus file command dari folder /src/commands/ berdasarkan field filename
    const filePath = path.join(__dirname, '../commands', command.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await command.destroy();

    res.json({ message: 'Command custom berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /addcommanddefault:
 *   post:
 *     summary: Tambah command default
 *     tags: [Command]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Command default berhasil ditambahkan
 */
router.post('/addcommanddefault', authMiddleware, adminOnly, (req, res, next) => {
  upload.single('commandFile')(req, res, function (err) {
    if (err) {
      // Error dari multer (termasuk file sudah ada)
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, description } = req.body;
    const isDefault = req.body.isDefault === 'true' || req.body.isDefault === true;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Cek nama command di database
    const existing = await Command.findOne({ where: { name } });
    if (existing) {
      // Hapus file yang baru diupload (karena validasi nama command gagal)
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ error: `Command dengan nama "${name}" sudah ada. Silakan gunakan nama command yang berbeda.` });
    }

    await Command.create({
      name,
      description,
      isDefault,
      filename: file.originalname
    });
    res.json({ message: 'Command default berhasil ditambahkan' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
