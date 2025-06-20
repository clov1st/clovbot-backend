const express = require('express');
const router = express.Router();
const { Template } = require('../models');
const authMiddleware = require('../utils/authMiddleware');

// Tambah template
router.post('/template/add', authMiddleware, async (req, res) => {
  try {
    const { name, description, commands, isDefault } = req.body;
    const template = await Template.create({ name, description, commands, isDefault });
    res.json({ message: 'Template berhasil dibuat', template });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit template
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

// Hapus template
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

// List template
router.get('/listtemplates', authMiddleware, async (req, res) => {
  try {
    const templates = await Template.findAll();
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
