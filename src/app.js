const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');
const botRoutes = require('./routes/bot');
const adminRoutes = require('./routes/admin');
const listCommandsRoute = require('./routes/listCommands');
const profileRoutes = require('./routes/profile');
const templateRoutes = require('./routes/template');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

// Middleware
app.use(express.json());

// Routes
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', botRoutes);
app.use('/api', adminRoutes);
app.use('/api', listCommandsRoute);
app.use('/api', profileRoutes);
app.use('/api', templateRoutes);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rate limiter global
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Terlalu banyak request, coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false
});

// Tambahkan sebelum app.use('/api/', apiLimiter);
app.use((req, res, next) => {
  // Fallback jika req.ip tidak terdefinisi (misal saat test/manual http)
  if (!req.ip || req.ip === '::1' || req.ip === '::ffff:127.0.0.1') {
    req.ip = req.headers['x-forwarded-for'] || '127.0.0.1';
  }
  next();
});

app.use('/api/', apiLimiter);

// Rate limiter khusus login/register
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak percobaan, coba lagi nanti.' }
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

app.use((err, req, res, next) => {
  if (err && err.code === 'ERR_ERL_UNDEFINED_IP_ADDRESS') {
    // Tangani error IP undefined dari express-rate-limit
    return res.status(429).json({ error: 'Terlalu banyak request, coba lagi nanti.' });
  }
  // Error lain tetap dilempar ke handler berikutnya
  next(err);
});

module.exports = app;
