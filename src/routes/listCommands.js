const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Command } = require('../models');
const authMiddleware = require('../utils/authMiddleware');
const multer = require('multer');

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
router.post('/addcommand', authMiddleware, upload.single('commandFile'), async (req, res) => {
  try {
    const { description } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // console.log(`mendapatkan file dengan nama : ${file.originalname}`);

    // Simpan metadata ke database
    await Command.create({
      name: path.basename(file.originalname, '.js'),
      description,
      isDefault: false
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
  const { name } = req.body;
  try {
    const command = await Command.findOne({ where: { name } });
    if (!command) return res.status(404).json({ error: 'Command tidak ditemukan.' });
    if (command.isDefault) {
      return res.status(400).json({ error: 'Tidak bisa menghapus command default.' });
    }
    await command.destroy();

    // Hapus file command dari folder /src/commands/
    const filePath = path.join(__dirname, '../commands', `${name}.js`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Command custom berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
