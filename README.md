# DMS Route Validator - RTM Portal

Portal validasi rute otomatis untuk memastikan kelancaran integrasi data ke sistem DMS.

## Fitur Utama
- **Smart Extractor**: Otomatis merapikan merged cells dan mendeteksi header dinamis.
- **Hybrid Validation**: Validasi super cepat menggunakan Cloudflare Workers.
- **Auto-Split & ZIP**: Memisahkan rute per Salesman dan membungkusnya dalam folder ZIP siap inject.
- **Visual Error Log**: Download file revisi dengan highlight warna sesuai SOP RTM.

## Struktur Proyek
- `/dms-validator-api`: Backend (Cloudflare Workers)
- `/dms-validator-ui`: Frontend (Cloudflare Pages)

## SOP Pengajuan
1. Pengajuan dilakukan tanggal 1-7 setiap bulan.
2. File wajib 100% valid sebelum dikirim ke tim RTM.
