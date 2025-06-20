const { User, Bot } = require('../models/index');

exports.profile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'phone', 'createdAt']
    });
    const bots = await Bot.findAll({ where: { ownerId: req.user.id } });
    res.json({
      user,
      bots: bots.map(bot => ({
        id: bot.id,
        sessionId: bot.sessionId,
        name: bot.name,
        isActive: bot.isActive // tambahkan field ini di model jika perlu
      }))
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
