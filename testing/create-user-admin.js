const bcrypt = require('bcrypt');
const readline = require('readline');
const { User, sequelize } = require('../src/models');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

(async () => {
  try {
    await sequelize.authenticate();

    const username = await ask('Masukkan username admin: ');
    const email = await ask('Masukkan email admin: ');
    const phone = await ask('Nomor WhatsApp admin: ');
    const password = await ask('Masukkan password admin: ');

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user, created] = await User.findOrCreate({
      where: { username },
      defaults: {
        email,
        phone,
        password: hashedPassword,
        role: 'admin'
      }
    });

    if (created) {
      console.log('✅ Admin user berhasil dibuat!');
    } else {
      console.log('⚠️  Username sudah ada, update ke admin...');
      user.role = 'admin';
      user.email = email;
      user.phone = phone;
      user.password = hashedPassword;
      await user.save();
      console.log('✅ User diupdate menjadi admin!');
    }
  } catch (err) {
    console.error('Gagal membuat admin:', err.message);
  } finally {
    rl.close();
    await sequelize.close();
  }
})();
