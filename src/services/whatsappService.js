const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { WaSession, Bot } = require('../models/index');

const sessions = {};

async function startSession(sessionId, sendQR) {
  const sessionFolder = path.join(__dirname, '../../sessions', sessionId);
  if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', async () => {
    await saveCreds();
    const files = fs.readdirSync(sessionFolder);
    const sessionData = {};
    files.forEach(file => {
      sessionData[file] = fs.readFileSync(path.join(sessionFolder, file), 'utf-8');
    });
    const bot = await Bot.findOne({ where: { sessionId } });
    if (bot) {
      await WaSession.upsert({
        sessionId,
        botId: bot.id,
        creds: JSON.stringify(sessionData)
      });
    }
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr && sendQR) {
      sendQR(qr);
    }
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        startSession(sessionId, sendQR);
      } else {
        delete sessions[sessionId];
        await WaSession.destroy({ where: { sessionId } });
        fs.rmSync(sessionFolder, { recursive: true, force: true });
      }
    }
  });

  sessions[sessionId] = sock;
  return sock;
}

async function disconnectSession(sessionId) {
  if (sessions[sessionId]) {
    try {
      await sessions[sessionId].logout();
    } catch (e) {
      // log error, tapi jangan throw
    }
    delete sessions[sessionId];
  }
  const sessionPath = path.join(__dirname, '../../sessions', sessionId);
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  }
  if (WaSession) {
    await WaSession.destroy({ where: { sessionId } });
  }
}

async function getSessionStatus(sessionId) {
  const sock = sessions[sessionId];
  if (!sock) return 'disconnected';
  if (sock.user) return 'connected'; // Baileys set .user jika sudah login
  return 'pending';
}

module.exports = { startSession, disconnectSession, getSessionStatus };
