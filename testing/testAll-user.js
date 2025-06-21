const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

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

function uploadCommand(token, filePath, name, description) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('commandFile', fs.createReadStream(filePath));
    form.append('name', name);
    form.append('description', description);

    const options = {
      method: 'POST',
      host: 'localhost',
      port: 3000,
      path: '/api/addcommand',
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
  // 1. Register user
  const userData = {
    username: 'user1',
    email: 'user1@test.com',
    phone: '08123456780',
    password: 'userpass'
  };
  let res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify(userData));
  if (res.status === 200) console.log('✅ Register user OK');
  else return console.log('❌ Register user FAIL', res.body);

  // 2. Login user
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ identity: 'user1', password: 'userpass' }));
  if (res.status !== 200 || !res.body.token) return console.log('❌ Login user FAIL', res.body);
  const token = res.body.token;
  console.log('✅ Login user OK');

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

  // 4. Add command non default (upload file)
  res = await uploadCommand(
    token,
    path.join(__dirname, 'cmd-test', 'cmdNonDefaultUser.js'),
    'cmd-user',
    'Command user'
  );
  if (res.status === 200) {
    console.log('✅ Add command non default OK');
  } else {
    console.log('❌ Add command non default FAIL', res.body);
  }

  // 5. Hapus command non default
  res = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/deletecommand?name=cmd-user',
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

  // 6. Create template non default dengan command yang sudah tersedia
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
    name: 'template-user',
    description: 'Template user',
    commands: ['cmd-user']
  }));
  if (res.status === 200) {
    console.log('✅ Create template non default OK');
  } else {
    console.log('❌ Create template non default FAIL', res.body);
  }

  let nonDefaultTemplateId = res.body.template?.id;

  // 7. Edit template non default
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
    name: 'template-user',
    description: 'Template user edited',
    commands: ['cmd-user']
  }));
  if (res.status === 200) {
    console.log('✅ Edit template non default OK');
  } else {
    console.log('❌ Edit template non default FAIL', res.body);
  }

  // 8. Hapus template non default
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

  // 9. Createbot dengan template yang tersedia
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
    name: 'bot-user',
    ownerName: 'Nama User',
    ownerNumber: '628123456780',
    botNumber: '628123456780',
    prefix: '.',
    commands: ['cmd-user'],
    // templateId: nonDefaultTemplateId // jika backend butuh id, tambahkan ini
  }));
  if (res.status === 200) {
    console.log('✅ Createbot OK');
  } else {
    console.log('❌ Createbot FAIL', res.body);
  }

  process.exit(0);
})();
