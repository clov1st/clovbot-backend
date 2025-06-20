const express = require('express');
const router = express.Router();
const { runCommand } = require('../services/commandService');
const authMiddleware = require('../utils/authMiddleware');
const { getSocketBySessionId } = require('../services/whatsappService');

// POST /api/runcommand
router.post('/runcommand', authMiddleware, async (req, res) => {
  const { command, sessionId, args } = req.body;
  try {
    const sock = getSocketBySessionId(sessionId);
    if (!sock) return res.status(404).json({ error: 'Bot belum terkoneksi' });

    // Simulasi pesan (msg) jika perlu, atau sesuaikan dengan kebutuhan
    const msg = { key: { remoteJid: botId } };

    await runCommand(command, sock, msg, args);
    res.json({ message: 'Command dijalankan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;