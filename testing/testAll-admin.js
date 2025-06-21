const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { User, sequelize } = require('../src/models');
const bcrypt = require('bcrypt');

function httpRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Helper untuk upload file command
function uploadCommand(token, filePath, isDefault = false, name, description) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('commandFile', fs.createReadStream(filePath));
    form.append('name', name);
    form.append('description', description);
    if (isDefault) form.append('isDefault', 'true');

    const options = {
      method: 'POST',
      host: 'localhost',
      port: 3000,
      path: isDefault ? '/api/addcommanddefault' : '/api/addcommand',
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });
}

(async () => {
  // 1. Buat admin langsung di database
  await sequelize.sync();
  const adminPassword = 'adminpass';
  const hash = await bcrypt.hash(adminPassword, 10);
  await User.destroy({ where: { username: 'admin' } }); // hapus jika sudah ada
  await User.create({
    username: 'admin',
    email: 'admin@test.com',
    phone: '08123456789',
    password: hash,
    role: 'admin'
  });
  console.log('✅ Admin user created in DB');

  // 2. Login admin
  let res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ identity: 'admin', password: adminPassword }));
  if (res.status !== 200 || !res.body.token) return console.log('❌ Login admin FAIL', res.body);
  const token = res.body.token;
  console.log('✅ Login admin OK');

  // 3. Profile
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/profile',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 200) {
    console.log('✅ Profile OK');
  } else {
    console.log('❌ Profile FAIL', res.body);
  }

  // 4. Create command default (upload file)
  res = await uploadCommand(
    token,
    path.join(__dirname, 'cmd-test', 'cmdDefault.js'),
    true,
    'cmd-default',
    'Command default'
  );
  if (res.status === 200) {
    console.log('✅ Create command default OK');
  } else {
    console.log('❌ Create command default FAIL', res.body);
  }

  // 5. Add command non default (upload file)
  res = await uploadCommand(
    token,
    path.join(__dirname, 'cmd-test', 'cmdNonDefault.js'),
    false,
    'cmd-nondefault',
    'Command non default'
  );
  if (res.status === 200) {
    console.log('✅ Add command non default OK');
  } else {
    console.log('❌ Add command non default FAIL', res.body);
  }

  // 6. Hapus command non default
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/deletecommand?name=cmd-nondefault',
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (res.status === 200) {
    console.log('✅ Hapus command non default OK');
  } else {
    console.log('❌ Hapus command non default FAIL', res.body);
  }

  // 7. Create template default dengan command yang sudah tersedia
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/addtemplatedefault',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    name: 'template-default',
    description: 'Template default',
    commands: ['cmd-default']
  }));
  if (res.status === 200) {
    console.log('✅ Create template default OK');
  } else {
    console.log('❌ Create template default FAIL', res.body);
  }

  // 8. Add template non default
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/template/add',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    name: 'template-nondefault',
    description: 'Template non default',
    commands: ['cmd-default']
  }));
  if (res.status === 200) {
    console.log('✅ Add template non default OK');
    var nonDefaultTemplateId = res.body.template.id; // simpan ID untuk edit
  } else {
    console.log('❌ Add template non default FAIL', res.body);
  }

  // 9. Edit template non default
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/template/edit',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    id: nonDefaultTemplateId,
    name: 'template-nondefault',
    description: 'Template non default edited',
    commands: ['cmd-default']
  }));
  if (res.status === 200) {
    console.log('✅ Edit template non default OK');
  } else {
    console.log('❌ Edit template non default FAIL', res.body);
  }

  // 10. Hapus template non default
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/template/delete?id=${nonDefaultTemplateId}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (res.status === 200) {
    console.log('✅ Hapus template non default OK');
  } else {
    console.log('❌ Hapus template non default FAIL', res.body);
  }

  // 11. Createbot dengan template yang tersedia
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/createbot',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    name: 'bot-admin',
    ownerName: 'Nama Owner',
    ownerNumber: '6281234567890',
    botNumber: '6281234567890',
    prefix: '.',
    commands: ['cmd-default'],
    // templateId: idTemplateJikaPakai
  }));
  if (res.status === 200) {
    console.log('✅ Createbot OK');
  } else {
    console.log('❌ Createbot FAIL', res.body);
  }

  // 12. Get all users
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/users',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 200) {
    console.log('✅ Get all users OK');
  } else {
    console.log('❌ Get all users FAIL', res.body);
  }

  // 13. Get all bots
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/bot',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 200) {
    console.log('✅ Get all bots OK');
  } else {
    console.log('❌ Get all bots FAIL', res.body);
  }

  // 14. Get analytics
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/analytics',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 200) {
    console.log('✅ Get analytics OK');
  } else {
    console.log('❌ Get analytics FAIL', res.body);
  }

  process.exit(0);
})();
