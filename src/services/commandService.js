const fs = require('fs');
const path = require('path');

function listCommands() {
  const commandsDir = path.join(__dirname, '../commands');
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
  return files.map(file => {
    const cmd = require(path.join(commandsDir, file));
    return {
      name: cmd.name || file.replace('.js', ''),
      description: cmd.description || '',
      ...cmd.meta // jika ada meta lain
    };
  });
}

function runCommand(commandName, sock, msg, args = []) {
  const commandsDir = path.join(__dirname, '../commands');
  const file = path.join(commandsDir, `${commandName}.js`);
  if (!fs.existsSync(file)) throw new Error('Command tidak ditemukan');
  const cmd = require(file);
  if (typeof cmd.execute !== 'function') throw new Error('Command tidak valid');
  return cmd.execute(sock, msg, args);
}

module.exports = { listCommands, runCommand };
