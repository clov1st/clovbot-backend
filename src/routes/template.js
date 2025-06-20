const express = require('express');
const router = express.Router();
const { Template } = require('../models');
const authMiddleware = require('../utils/authMiddleware');

/**
 * @swagger
 * /template/add:
 *   post:
 *     summary: Tambah template baru
 *     tags: [Template]
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
 *               description: { type: string }
 *               commands: { type: array, items: { type: string } }
 *               isDefault: { type: boolean }
 *     responses:
 *       200:
 *         description: Template berhasil dibuat
 */
router.post('/template/add', authMiddleware, async (req, res) => {
  try {
    const { name, description, commands, isDefault } = req.body;
    const template = await Template.create({ name, description, commands, isDefault });
    res.json({ message: 'Template berhasil dibuat', template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /template/edit:
 *   put:
 *     summary: Edit template
 *     tags: [Template]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: integer }
 *               name: { type: string }
 *               description: { type: string }
 *               commands: { type: array, items: { type: string } }
 *               isDefault: { type: boolean }
 *     responses:
 *       200:
 *         description: Template berhasil diupdate
 */
router.put('/template/edit', authMiddleware, async (req, res) => {
  try {
    const { id, name, description, commands, isDefault } = req.body;
    const template = await Template.findByPk(id);
    if (!template) return res.status(404).json({ error: 'Template tidak ditemukan' });
    template.name = name || template.name;
    template.description = description || template.description;
    template.commands = commands || template.commands;
    template.isDefault = isDefault !== undefined ? isDefault : template.isDefault;
    await template.save();
    res.json({ message: 'Template berhasil diupdate', template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /template/delete:
 *   delete:
 *     summary: Hapus template
 *     tags: [Template]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: integer }
 *     responses:
 *       200:
 *         description: Template berhasil dihapus
 */
router.delete('/template/delete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    const template = await Template.findByPk(id);
    if (!template) return res.status(404).json({ error: 'Template tidak ditemukan' });
    await template.destroy();
    res.json({ message: 'Template berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /listtemplates:
 *   get:
 *     summary: List semua template
 *     tags: [Template]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List template
 */
router.get('/listtemplates', authMiddleware, async (req, res) => {
  try {
    const templates = await Template.findAll();
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
