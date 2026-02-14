# SIPD-RKA Management System 📊

> **Sistem Informasi Perencanaan Daerah - Manajemen RKA & RKPD**
>
> Solusi modern untuk pengelolaan Rencana Kerja Pemerintah Daerah (RKPD) dan Rencana Kerja Anggaran (RKA) yang efisien, transparan, dan terintegrasi standar SIPD.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)

---

## 🎯 Tentang Aplikasi

**SIPD-RKA Management System** dirancang untuk membantu Organisasi Perangkat Daerah (OPD) dalam menyusun, memonitor, dan memvalidasi anggaran. Aplikasi ini menggantikan proses manual dengan antarmuka digital yang intuitif, memungkinkan kolaborasi real-time dan perhitungan anggaran yang akurat sesuai standar harga daerah (SSH, SBU, HSPK, ASB).

## ✨ Fitur Unggulan

### 1. Dashboard Monitoring & Jadwal 🚀
- **Real-time Progress**: Visualisasi capaian input RKA dengan indikator persentase interaktif.
- **Jadwal Tahapan**: Timeline dinamis untuk memantau tahapan perencanaan (Murni/Perubahan) yang sedang berlangsung.
- **Status Notifikasi**: Informasi terkini mengenai status validasi dan aktivitas sistem.

### 2. Manajemen RKA & RKPD (Renja) 📋
- **Struktur Hierarki**: Tampilan data terstruktur mulai dari *Urusan > Program > Kegiatan > Sub Kegiatan*.
- **Indikator Anggaran Cerdas**:
  - 🔴 **Surplus**: Pagu Validasi > Total Rincian (Sisa Anggaran).
  - 🟢 **Defisit**: Pagu Validasi < Total Rincian (Over Budget).
  - 🔵 **Balanced**: Anggaran Sesuai.
- **Validasi Bertingkat**: Mekanisme kunci (lock) untuk sub kegiatan yang telah divalidasi.

### 3. Input Rincian Belanja (Detailing) 💰
- **Kalkulator Koefisien Multi-Level**: Mendukung perhitungan kompleks (contoh: `5 Orang x 3 Hari x 2 Kegiatan`).
- **Pencarian Standar Harga**: Terintegrasi langsung dengan database SSH, SBU, HSPK, dan ASB.
- **Analisis Satuan**: Auto-complete satuan cerdas dan konversi manual.
- **Perhitungan Pajak Otomatis**: Opsi PPN 11% yang dapat disesuaikan per item belanja.

### 4. Manajemen Referensi & Pengguna 👥
- **Kelola OPD**: Manajemen data organisasi perangkat daerah.
- **User Roles**: Pembagian hak akses admin dan user (OPD).
- **Master Data**: Pusat data Urusan, Program, Kegiatan, dan Sumber Dana.

---

## 🆕 What's New (Terbaru)

### Versi 1.0.0 - Initial Release
- **Fitur Jadwal**: Modul baru untuk mengatur tahapan input RKA.
- **Dashboard v2**: Desain dashboard baru dengan ringkasan menu dan traffic aktivitas.
- **Consolidated Schema**: Struktur database yang disederhanakan untuk kemudahan deployment.

---

## 🛠 Instalasi & Penggunaan

Ikuti langkah berikut untuk menjalankan aplikasi di lingkungan lokal Anda:

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/sipd-rka-web.git
    cd sipd-rka-web
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Database (Supabase)**
    - Buat proyek baru di [Supabase](https://supabase.com).
    - Buka menu **SQL Editor**.
    - Copy konten dari file `src/db/schema_complete.sql` dan jalankan query.
    - Database siap digunakan dengan tabel dan *policies* yang lengkap.

4.  **Konfigurasi Environment**
    - Duplikasi file `.env.example` menjadi `.env.local`.
    - Isi URL dan Anon Key Supabase Anda.

5.  **Jalankan Aplikasi**
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📝 Lisensi

Copyright © 2026 **by hakiem**.
Licensed under [MIT](LICENSE).
