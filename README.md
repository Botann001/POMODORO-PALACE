# ⏱️ POMODORO PALACE

Timer fokus **Pomodoro** bertema **Persona 5** — "infiltrate the Palace, secure the treasure". Dibangun murni dengan **HTML, CSS, dan JavaScript** (tanpa framework, tanpa build step), **100% statis** sehingga langsung bisa di-host di **GitHub Pages**.

> Proyek fan-inspired. Tidak berafiliasi dengan ATLUS/SEGA.

## ✨ Fitur

- **Timer Pomodoro** — mode Focus / Short Break / Long Break, durasi bisa diatur
- **Siklus Palace** — 4 sesi fokus → otomatis disarankan Long Break, divisualkan sebagai diamond progress
- **Statistik harian** — jumlah sesi fokus & total menit fokus hari ini
- **Grafik 7 hari terakhir** — bar chart menit fokus per hari (murni CSS, tanpa library)
- **Day streak** — berlanjut tiap ada sesi fokus, reset otomatis kalau bolos sehari
- **"TREASURE SECURED!"** — animasi starburst + bunyi jingle (Web Audio API, tanpa file audio) tiap sesi selesai
- **Auto-start** sesi berikutnya (opsional)
- **Judul tab live** — countdown terlihat di tab browser walau tab tidak aktif
- **localStorage** — semua data tersimpan lokal, tanpa akun/backend

## 🚀 Cara menjalankan lokal

```bash
cd pomodoro-palace
python3 -m http.server 8000
# buka http://localhost:8000
```

## 🌐 Deploy ke GitHub Pages

1. Buat repo baru di GitHub (misal `pomodoro-palace`)
2. Push semua file ini ke branch `main`
3. Buka **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / folder `/ (root)`
4. Tunggu ~1 menit, situs live di `https://<username>.github.io/pomodoro-palace/`

## 📁 Struktur

```
pomodoro-palace/
├── index.html      # markup utama
├── css/
│   └── style.css   # tema Phantom Thieves (merah/hitam, starburst, halftone)
├── js/
│   └── app.js      # timer (endTime-based), statistik, streak, suara (vanilla JS)
└── README.md
```

## 🗺️ Roadmap (ide pengembangan)

- [ ] Notifikasi desktop saat sesi selesai (Notification API)
- [ ] Mode "Palace theme" — daftar misi per sesi fokus (integrasi dengan Velvet Task)
- [ ] Ekspor statistik mingguan (CSV)
- [ ] PWA — installable & berjalan offline penuh
