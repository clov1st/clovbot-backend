const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/config').development;

const sequelize = new Sequelize(
  process.env.DB_NAME || 'clovbot',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

// Definisikan model di sini, bukan di file terpisah!
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  phone: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'user' } // 'user' atau 'admin'
});

const Bot = sequelize.define('Bot', {
  name: { type: DataTypes.STRING, allowNull: false },
  ownerId: { type: DataTypes.INTEGER, allowNull: false }, // relasi ke User
  ownerName: { type: DataTypes.STRING, allowNull: false },
  ownerNumber: { type: DataTypes.STRING, allowNull: false },
  botNumber: { type: DataTypes.STRING, allowNull: false },
  prefix: { type: DataTypes.STRING, allowNull: false },
  sessionId: { type: DataTypes.STRING, unique: true, allowNull: false },
  commands: { type: DataTypes.JSON, allowNull: false, defaultValue: [] }, // array nama command
  templateId: { type: DataTypes.INTEGER, allowNull: true }, // jika pakai template
  folderPath: { type: DataTypes.STRING, allowNull: false }
});

const WaSession = sequelize.define('WaSession', {
  sessionId: { type: DataTypes.STRING, unique: true },
  botId: { type: DataTypes.INTEGER, allowNull: false },
  creds: { type: DataTypes.TEXT }
});

const BotCommand = sequelize.define('BotCommand', {
  sessionId: DataTypes.STRING,
  command: DataTypes.STRING
});

const Command = sequelize.define('Command', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.STRING, allowNull: false },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
  filename: { type: DataTypes.STRING, allowNull: false }
  // field lain?
});

const Template = sequelize.define('Template', {
  name: { type: DataTypes.STRING, unique: true, allowNull: false },
  description: DataTypes.STRING,
  commands: { // Simpan array nama command (atau bisa relasi many-to-many)
    type: DataTypes.JSON, // atau DataTypes.TEXT jika ingin simpan string JSON
    allowNull: false,
    defaultValue: []
  },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// Relasi
User.hasMany(Bot, { foreignKey: 'ownerId' });
Bot.belongsTo(User, { foreignKey: 'ownerId' });

Bot.hasOne(WaSession, { foreignKey: 'botId' });
WaSession.belongsTo(Bot, { foreignKey: 'botId' });

module.exports = {
  sequelize,
  User,
  Bot,
  WaSession,
  BotCommand,
  Command,
  Template
};
