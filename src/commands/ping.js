module.exports = {
  name: 'ping',
  description: 'Cek status bot',
  async execute(sock, msg, args) {
    await sock.sendMessage(msg.key.remoteJid, { text: 'Pong!' });
  }
};
