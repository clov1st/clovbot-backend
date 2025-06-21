const app = require('./app');
const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');
const { Command } = require('./models');

async function syncDefaultCommands() {
  const commandsDir = path.join(__dirname, 'commands');
  if (!fs.existsSync(commandsDir)) return;
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
  })
  .catch(err => {
    console.error('Gagal sync database:', err);
  });
