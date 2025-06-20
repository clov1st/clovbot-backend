# 🤖 ClovBot Backend API

ClovBot Backend adalah API server open-source yang dirancang untuk menjadi tulang punggung dari aplikasi **ClovBot** — sebuah platform builder instan untuk membuat dan menjalankan WhatsApp Bot dengan mudah. Backend ini mendukung multi-bot, dokumentasi Swagger, autentikasi pengguna, dan integrasi penuh dengan WhatsApp API.

## 🌐 Fitur Utama

- 🔐 **User Authentication**: Registrasi, login, dan manajemen profil pengguna.
- ⚙️ **Integrasi WhatsApp API**: Komunikasi dua arah melalui WhatsApp, dengan session handler.
- 💬 **Manajemen Command**:
  - Tambah perintah bot
  - Edit, hapus, dan ambil daftar perintah
- 🧩 **Template Pesan**:
  - Tambah dan hapus template
  - Daftar semua template pengguna
- ⚙️ **CreateBot**: Konfigurasi bot baru (nama, token, pengaturan).
- 🚀 **SetupBot**: Siapkan sesi bot dari session WhatsApp yang sudah ada.
- ▶️ **RunBot**: Jalankan bot dengan konfigurasi yang telah dibuat.
- 📄 **Swagger API Docs**: Dokumentasi API lengkap di `GET /api-docs`
- 🧠 **Multi-Bot Support**: Menjalankan banyak bot secara paralel.

## 📁 Struktur Folder
tolll
```

.
├── models/          # Skema database (User, Bot, Command, Template)
├── routes/          # Rute-rute API utama
├── controllers/     # Logika bisnis tiap endpoint
├── utils/           # Middleware dan helper (auth, logger, dsb)
├── config/          # Konfigurasi database dan WhatsApp session
├── app.js           # Entry-point server Express
├── swagger.json     # Definisi Swagger untuk dokumentasi API
└── README.md

````

## 🔧 Instalasi

1. Clone repositori:
   ```bash
   git clone https://github.com/clov1st/clovbot-backend.git
   cd clovbot-backend
````

2. Install dependencies:

   ```bash
   npm install
   ```

3. Buat file `.env`:

   ```env
   PORT=3000
   DB_URL=mongodb://localhost:27017/clovbot
   JWT_SECRET=your_jwt_secret
   ```

4. Jalankan server:

   ```bash
   npm start
   ```

## 📑 Dokumentasi API

Akses dokumentasi Swagger:

```
GET /api-docs
```

Swagger UI menampilkan seluruh endpoint, parameter, dan response model untuk memudahkan integrasi dengan aplikasi frontend/mobile.

## 🧪 Contoh Endpoint

* **Auth**

  * `POST /auth/register`
  * `POST /auth/login`

* **Command**

  * `GET /command/list`
  * `POST /command/add`
  * `PUT /command/edit/:id`
  * `DELETE /command/delete/:id`

* **Template**

  * `GET /template/list`
  * `POST /template/add`
  * `DELETE /template/delete/:id`

* **Bot**

  * `POST /bot/create`
  * `POST /bot/setup/:botId`
  * `POST /bot/run/:botId`

## 🧬 Teknologi yang Digunakan

* **Node.js + Express** — Backend framework
* **MongoDB + Mongoose** — Database
* **JWT** — Autentikasi pengguna
* **Swagger (OpenAPI)** — Dokumentasi API
* **WhatsApp Web API Wrapper** — Untuk integrasi dan kontrol sesi WhatsApp
* **Socket.io** *(opsional)* — Jika real-time event diperlukan

## 🔄 Deployment

Server dapat di-deploy di platform seperti:

* **Heroku**
* **Render**
* **Railway**
* **VPS (Ubuntu/Debian dengan PM2/NGINX)**

## 📦 Contributing

Kontribusi sangat terbuka!

1. Fork project
2. Buat branch baru (`git checkout -b fitur-anda`)
3. Commit perubahan Anda (`git commit -am 'Tambah fitur A'`)
4. Push ke branch Anda (`git push origin fitur-anda`)
5. Buat Pull Request 🎉

## 📮 Kontak & Info Tambahan

* GitHub: [https://github.com/clov1st](https://github.com/clov1st)
* Project Repo: [ClovBot Backend](https://github.com/clov1st/clovbot-backend)

---

Lisensi: MIT License

```

---

Jika kamu juga ingin file `README.md` ini dalam bentuk file `.md`, cukup beri tahu agar bisa saya kirim langsung.
```
