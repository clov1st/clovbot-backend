const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token tidak ditemukan' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token tidak valid' });
  }
}

module.exports = authMiddleware;
