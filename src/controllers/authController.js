const { User } = require('../models/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('sequelize');

exports.register = async (req, res) => {
  const { username, email, phone, password } = req.body;
  try {
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ error: 'Semua field wajib diisi.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, phone, password: hash });
    res.json({ message: 'Registrasi berhasil', user: { id: user.id, username, email, phone } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { identity, password } = req.body;
  try {
    const user = await User.findOne({
      where: {
        [sequelize.Op.or]: [
          { username: identity },
          { email: identity },
          { phone: identity }
        ]
      }
    });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Password salah' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ message: 'Login berhasil', token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// exports.profile = async (req, res) => {
//   try {
//     const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'email', 'createdAt'] });
//     if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
//     res.json({ user });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };
