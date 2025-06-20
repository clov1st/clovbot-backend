const express = require('express');
const app = express();
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const botRoutes = require('./routes/bot');
const listCommandsRoute = require('./routes/listCommands');
const profileRoutes = require('./routes/profile');
const fs = require('fs');
const path = require('path');
const { Command } = require('./models');
const templateRoutes = require('./routes/template');
const createBotRoutes = require('./routes/bot');
const setupBotRoutes = require('./routes/bot');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerSpec = require('./swagger');

app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', botRoutes);
app.use('/api', listCommandsRoute);
app.use('/api', profileRoutes);
app.use('/api', templateRoutes);
app.use('/api', createBotRoutes);
app.use('/api', setupBotRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Limit semua endpoint (misal: 100 request per 15 menit per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // max 100 request per window per IP
  message: { error: 'Terlalu banyak request, coba lagi nanti.' }
});
app.use('/api/', apiLimiter);

// Atau limit endpoint sensitif saja
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 10, // max 10 request per window per IP
  message: { error: 'Terlalu banyak percobaan, coba lagi nanti.' }
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

async function syncDefaultCommands() {
  const commandsDir = path.join(__dirname, 'commands');
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const cmd = require(path.join(commandsDir, file));
    await Command.upsert({
      name: cmd.name || file.replace('.js', ''),
      description: cmd.description || '',
      isDefault: true
    });
  }
}

sequelize.sync({ alter: true })
  .then(async () => {
    await syncDefaultCommands();
    app.listen(3000, () => {
      console.log('Server berjalan di http://localhost:3000');
    });
  });
