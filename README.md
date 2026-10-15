# ZakatKu (Emas & Tani) 🌙🌾

Aplikasi mobile modern untuk pencatatan dan hisab zakat mal: **Zakat Emas** (sistem multi-dompet & pengingat haul otomatis) serta **Zakat Pertanian Padi/Gabah** (konversi bertahap GKP ➔ GKG ➔ Beras).

Dibangun dengan standar desain antarmuka bersih, modern, dan bernuansa islami (**Emerald Green**, **Gold**, dan **Putih**), mengikuti tech stack **FinTrack** (Expo SDK 57, Expo Router, React Native 0.86, Expo SQLite, Reanimated, dan Expo Print/Sharing).

---

## 🌟 Fitur Utama

### 1. Modul Zakat Emas (Multi-Dompet & Pengingat Haul)
- **Manajemen Multi-Dompet:**
  - Buat berbagai tempat penyimpanan emas (*Brankas Rumah, Pegadaian Tabungan Emas, Antam Digital / Logam Mulia, Perhiasan Simpanan*, dll).
  - Catat kepemilikan emas: Nama/Keterangan, Berat (gram desimal), Kadar Karat (24K, 22K, 18K, 14K), dan **Tanggal Kepemilikan Awal**.
  - Opsi toggle/checkbox untuk memilih dompet yang diikutkan dalam hisab zakat.
- **Logika Perhitungan Nishab & Haul:**
  - **Nishab Emas:** 85 gram akumulatif dengan visual progress bar dinamis.
  - **Haul:** Pilihan 1 tahun **Hijriah (354 hari)** atau 1 tahun **Masehi (365 hari)**.
  - **Kadar Zakat:** 2,5% dari total emas yang telah mencapai nishab dan haul.
  - **Harga Emas Hari Ini (Rp/gram):** Terintegrasi langsung untuk konversi nilai zakat ke mata uang Rupiah.
- **Sistem Pengingat (Reminder & Alert):**
  - Hitung mundur (countdown) sisa hari menuju haul.
  - Badge peringatan merah/emas dan pemicu notifikasi lokal ketika emas $\ge$ 85 gram dan genap haul.

### 2. Modul Zakat Pertanian Padi (Konversi GKP ➔ GKG ➔ Beras)
- **Alur Konversi Bertahap:**
  - **Input Utama:** Berat panen kotor dalam bentuk **GKP (Gabah Kering Panen)** dalam Kilogram (kg).
  - **Taksiran GKG (Gabah Kering Giling):** Slider rasio penyusutan kadar air (default **85%**, rentang 60% – 95%).
  - **Taksiran Beras Siap Konsumsi:** Slider rendemen giling (default **64%**, rentang 45% – 75%).
- **Pengecekan Nishab Pertanian:**
  - Standar nishab **653 kg GKG** atau setara **520 kg Beras** (5 wasaq).
  - Status visual: *"Wajib Zakat (Sudah Mencapai Nishab)"* atau *"Belum Wajib Zakat (Di Bawah Nishab — Disunnahkan Infaq/Sedekah)"*.
- **Kadar Zakat Berdasarkan Pengairan:**
  - **Tadah Hujan / Alami:** Tarif **10%**.
  - **Irigasi Pompa / Berbiaya:** Tarif **5%**.
- **Output Zakat (3 Format Sekaligus):**
  1. Berupa **Gabah Kering Giling (GKG)**: `... kg GKG`
  2. Berupa **Beras Siap Konsumsi**: `... kg Beras`
  3. Berupa **Uang Tunai (Qimah)**: `Rp ...` (berdasarkan harga acuan per kg yang diinput).

### 3. Ekspor Dokumen & Berbagi (WhatsApp / PDF)
- **Ekspor Dokumen PDF Resmi:** Format hisab formal lengkap dengan basmalah, dalil, rincian parameter nishab, dan cap stempel hisab zakat.
- **Kirim ke WhatsApp:** Teks WhatsApp terstruktur rapi dengan emoji, dalil Qur'an, dan rincian kewajiban zakat.

### 4. Penyimpanan Lokal & Riwayat
- Menggunakan **Expo SQLite** (`zakatku.db`) dengan skema tabel relasional (`wallets`, `gold_items`, `zakat_history`).
- Riwayat hisab tersimpan offline secara aman dan dapat difilter (Semua, Emas, Padi), dibagikan ulang, atau dihapus.
- Pengaturan preferensi tersimpan di **AsyncStorage**.

---

## 📱 Struktur Navigasi (Bottom Tab Bar)

1. **Beranda (`/(tabs)`):** Ringkasan kewajiban zakat aktif, countdown haul, akses cepat hitung, acuan harga pasar hari ini, mutiara dalil Qur'an & Hadits harian.
2. **Zakat Emas (`/(tabs)/emas`):** Manajemen multi-dompet, input emas, progress nishab 85g, countdown haul, input harga emas hari ini, hasil 2.5%, simpan & bagikan.
3. **Zakat Padi (`/(tabs)/padi`):** Input berat panen GKP, slider konversi GKP ➔ GKG ➔ Beras, pengecekan nishab 653 kg GKG / 520 kg Beras, selector pengairan 10% / 5%, dan kartu output 3 format sekaligus.
4. **Riwayat & Pengaturan (`/(tabs)/history`):** Daftar arsip riwayat hisab yang tersimpan, konfigurasi haul Hijriah vs Masehi, default harga acuan, notifikasi pengingat, switch tema Terang / Gelap, dan ensiklopedia Fiqih Zakat.

---

## 🛠️ Tech Stack (Mengikuti FinTrack)

- **Framework:** [Expo SDK 57](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/)
- **Core:** React Native 0.86, React 19, TypeScript
- **Database:** `expo-sqlite` (SQLite lokal ter-enkapsulasi dengan migrasi versi)
- **Preferences:** `@react-native-async-storage/async-storage`
- **Animasi & Interaktivitas:** `react-native-reanimated`, `react-native-gesture-handler`
- **UI & Slider:** `@react-native-community/slider`, `expo-linear-gradient`, `@expo/vector-icons`
- **Notifikasi & Haptic:** `expo-notifications`, `expo-haptics`
- **Cetak & Berbagi:** `expo-print` (PDF Generator), `expo-sharing`
- **Tipografi:** `@expo-google-fonts/inter`

---

## 🚀 Cara Menjalankan

1. **Install Dependensi:**
   ```bash
   npm install
   # atau jika offline:
   npm ci --prefer-offline
   ```

2. **Jalankan Aplikasi:**
   - **Mode Web:**
     ```bash
     npm run web
     ```
   - **Mode Android:**
     ```bash
     npm run android
     ```
   - **Mode iOS:**
     ```bash
     npm run ios
     ```
   - **Metro Bundler (QR Code untuk Expo Go / Dev Client):**
     ```bash
     npm start
     ```
