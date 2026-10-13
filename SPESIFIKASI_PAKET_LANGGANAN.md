# Spesifikasi Aplikasi Kasir & Manajemen Laundry: Skema Paket Langganan

Dokumen ini merinci arsitektur, pembagian hak akses, dan spesifikasi fitur aplikasi kasir laundry **Kafela's Laundry** berdasarkan skema paket langganan resmi.

---

## 1. Prinsip Utama & Kompatibilitas ("Versi HP Tetap Dipertahankan")

1. **Versi Mobile HP (Android/iOS)**:
   - Seluruh antarmuka, alur kerja kasir, operasional harian, dan fitur yang sudah ada di versi HP tetap dipertahankan 100%.
   - Tidak ada pengurangan fitur kasir harian di HP bagi pengguna Paket Basic maupun Pro.
2. **Masa Percobaan Pengguna Baru (Free Trial)**:
   - Setiap pengguna yang baru mendaftar (*sign up*) otomatis mendapatkan **7 hari gratis** dengan akses penuh (fitur Pro) untuk menguji operasional di HP maupun PC.

---

## 2. Rincian Skema Paket Langganan

| Kategori | Paket Basic | Paket Pro (Rekomendasi) |
| :--- | :--- | :--- |
| **Harga Bulanan** | **Rp27.000 / bulan** (30 hari) | **Rp57.000 / bulan** (30 hari) |
| **Cabang Tambahan** | +Rp20.000 / cabang tambahan | +Rp20.000 / cabang tambahan |
| **Akses Mobile (Android / iOS / PWA)** |  **Penuh** |  **Penuh** |
| **Akses Dashboard Web PC / Komputer** | Format Mobile di Layar PC (Tersedia opsi upgrade ke Pro) |  **Akses Penuh** (Sidebar Desktop, Multi-Kolom, Layar Lebar) |
| **Pencatatan Transaksi Kasir Standar** |  **Ya** (Kilat, Satuan, Kiloan, Antrean) |  **Ya** (Kilat, Satuan, Kiloan, Antrean) |
| **Fleksibilitas Biaya Ekstra / Item Tambahan** |  **Ya** (Biaya antar-jemput, parfum khusus, noda berat, dll.) |  **Ya** (Biaya antar-jemput, parfum khusus, noda berat, dll.) |
| **Laporan Operasional & Keuangan Lengkap** | Ringkasan Dasar |  **Lengkap** (Analitik Harian/Bulanan, Ekspor CSV/Excel, Top Pelanggan & Layanan) |
| **Cetak Struk Thermal & Bagikan WA** |  **Ya** |  **Ya** |

---

## 3. Rincian Fitur Per Paket

### A. Paket Basic (Rp27.000 / Bulan)
Target: Pemilik laundry tunggal atau kasir outlet yang fokus pada operasional menggunakan smartphone/tablet Android atau iPhone.

1. **Akses Aplikasi Mobile**:
   - Berjalan lancar di smartphone Android (APK / TWA / PWA) dan iOS Safari PWA.
   - Desain responsif ramah jempol (*one-hand navigation*).
2. **Pencatatan Transaksi Standar**:
   - Input antrean cucian masuk: Kiloan, Satuan, Karpet, Bedcover.
   - Perhitungan otomatis DP, pelunasan tunai / QRIS / transfer.
   - Estimasi selesai otomatis dan cetak struk Bluetooth / bagikan nota via WhatsApp.
   - Manajemen alur status: *Diterima*  *Proses*  *Selesai*  *Diambil*.
3. **Fleksibilitas Penambahan Biaya Ekstra**:
   - Fitur cepat `+ Biaya / Item Ekstra` pada formulir transaksi baru.
   - Pilihan template biaya populer:
     - Biaya Antar - Jemput
     - Parfum / Pelembut Khusus Premium
     - Cuci Kilat / Express Ekstra
     - Pembersih Noda Berat / Karpet
     - Hanger / Plastik Klip Khusus
   - Pengisian nama layanan kustom dan penyesuaian nominal harga sesuai kebutuhan di lapangan.

---

### B. Paket Pro (Rp57.000 / Bulan)
Target: Pemilik usaha laundry yang membutuhkan visibilitas bisnis menyeluruh, manajemen multi-cabang, penggunaan komputer kasir di meja depan, dan analisis keuangan mendalam.

1. **Semua Fitur Paket Basic**:
   - Meliputi seluruh hak akses operasional mobile dan kasir harian.
2. **Akses Dashboard Versi Web di PC / Komputer**:
   - Tata letak khusus layar lebar desktop (*Desktop Web Shell*).
   - Sidebar navigasi tetap (*Pinned Desktop Sidebar*), pintasan keyboard (*Quick Action*), dan tabel antrean responsif.
   - Nyaman digunakan pada monitor kasir, laptop kasir, dan PC back-office.
   - *Catatan Akses*: Pengguna Paket Basic yang membuka di PC diberikan opsi untuk beralih tampilan mobile atau upgrade 1-klik ke Paket Pro.
3. **Fitur Laporan Operasional & Keuangan Lengkap**:
   - **Ekspor Data (Excel / CSV)**:
     - Unduh rekapitulasi transaksi operasional (Nomor Nota, Pelanggan, Berat/Qty, Nilai Transaksi, Status Bayar, Metode Bayar, dsb.).
     - Unduh rekapitulasi pengeluaran kas operasional.
   - **Analitik Harian & Bulanan**:
     - Grafik tren omzet harian/bulanan.
     - Perhitungan laba kotor, arus kas masuk nyata, dan pengeluaran.
     - Analisis 10 Pelanggan Teratas (*Top Loyal Customers*).
     - Analisis performa layanan cucian terlaris.
     - Tampilan rincian harian (*Daily Breakdown* per tanggal).

---

## 4. Mekanisme Pembayaran & Saldo Dompet

- Perpanjangan dilakukan langsung di menu **Pengaturan  Owner & Kelola Cabang**.
- Pemilik dapat mengisi saldo dompet (*Top Up Wallet*) secara mandiri.
- Ketika masa aktif diperpanjang:
  - Durasi masa aktif akun bertambah akumulatif (`subscriptionEndDate`).
  - Tipe langganan diperbarui ke `basic` atau `pro` (`subscriptionType`).
  - Riwayat transaksi perpanjangan tercatat di `SubscriptionHistory`.
- Status paket dan sisa masa aktif ditampilkan transparan di Header Dashboard dan Sidebar PC.

---

## 5. Ringkasan Teknis Komponen

- `src/views/KelolaOwnerView.tsx`: Kartu pilihan paket langganan (Basic, Pro, Harian) dengan rincian fitur dan verifikasi saldo dompet.
- `src/views/TambahEditView.tsx`: Modal & tombol `+ Biaya / Item Ekstra` fleksibel untuk item tambahan.
- `src/views/LaporanView.tsx`: Fitur Ekspor Data CSV/Excel, filter bulanan/harian, dan proteksi fitur pro analitik.
- `src/components/DesktopSidebar.tsx` & `src/App.tsx`: Deteksi perangkat, penguncian/pengalihan dashboard PC khusus Pro dengan fallback mode mobile yang mulus.
