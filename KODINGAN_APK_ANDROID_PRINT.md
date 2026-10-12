# Panduan & Kode Pembaruan Cetak Logo & Tanda Tangan (TTD) APK Android

Dokumen ini berisi kode Kotlin lengkap yang sudah diperbarui agar aplikasi Android APK Anda dapat mencetak **Logo Studio** dan **Tanda Tangan Digital (TTD)** secara fisik ke printer thermal Bluetooth.

---

## 1. File: `WebPrintInterface.kt`
Ganti seluruh isi file `WebPrintInterface.kt` di project Android Studio Anda (`package com.kafilasuci3.app`) dengan kode berikut:

```kotlin
package com.kafilasuci3.app

import android.content.Context
import android.webkit.JavascriptInterface

// Jembatan pemanggil fungsi cetak dari Web ke Kotlin Android
class WebPrintInterface(
    private val context: Context,
    private val strukHelper: StrukHelper
) {
    /**
     * Versi Utama (22 Parameter): Menerima seluruh data transaksi + Logo & TTD Base64
     */
    @JavascriptInterface
    fun prosesCetakBluetooth(
        namaAcara: String,
        namaKlien: String,
        paketDipilih: String,
        hargaPaketDasar: Long,
        namaTambahan: String,
        hargaTambahan: Long,
        lokasi: String,
        tanggalBayar: String,
        waktuEvent: Long,
        totalTarif: Long,
        nominalDibayar: Long,
        nominalDiskon: Long,
        dpDibayar: Long,
        isLunas: Boolean,
        noStruk: String,
        catatan: String,
        metodeBayar: String,
        isArsip: Boolean,
        namaBrand: String,
        namaAdmin: String,
        logoBase64: String,
        ttdBase64: String
    ) {
        strukHelper.cetakStrukBluetoothFisik(
            namaAcara = namaAcara,
            namaKlien = namaKlien,
            paketDipilih = paketDipilih,
            hargaPaketDasar = hargaPaketDasar,
            namaTambahan = namaTambahan,
            hargaTambahan = hargaTambahan,
            lokasi = lokasi,
            tanggalBayar = tanggalBayar,
            waktuEvent = waktuEvent,
            totalTarif = totalTarif,
            nominalDibayar = nominalDibayar,
            nominalDiskon = nominalDiskon,
            dpDibayar = dpDibayar,
            isLunas = isLunas,
            noStruk = noStruk,
            catatan = catatan,
            metodeBayar = metodeBayar,
            isArsip = isArsip,
            namaBrand = namaBrand,
            namaAdmin = namaAdmin,
            logoBase64 = logoBase64,
            ttdBase64 = ttdBase64
        )
    }

    /**
     * Versi Kompatibilitas Mundur (18 Parameter): Jika dipanggil tanpa logo & TTD
     */
    @JavascriptInterface
    fun prosesCetakBluetooth(
        namaAcara: String,
        namaKlien: String,
        paketDipilih: String,
        hargaPaketDasar: Long,
        namaTambahan: String,
        hargaTambahan: Long,
        lokasi: String,
        tanggalBayar: String,
        waktuEvent: Long,
        totalTarif: Long,
        nominalDibayar: Long,
        nominalDiskon: Long,
        dpDibayar: Long,
        isLunas: Boolean,
        noStruk: String,
        catatan: String,
        metodeBayar: String,
        isArsip: Boolean
    ) {
        prosesCetakBluetooth(
            namaAcara, namaKlien, paketDipilih, hargaPaketDasar, namaTambahan, hargaTambahan,
            lokasi, tanggalBayar, waktuEvent, totalTarif, nominalDibayar, nominalDiskon,
            dpDibayar, isLunas, noStruk, catatan, metodeBayar, isArsip,
            namaBrand = "Kafela's",
            namaAdmin = "Admin",
            logoBase64 = "",
            ttdBase64 = ""
        )
    }

    /**
     * Alias fungsi alternatif jika web memanggil cetakStrukDariWeb
     */
    @JavascriptInterface
    fun cetakStrukDariWeb(
        namaAcara: String, namaKlien: String, paketDipilih: String, hargaPaketDasar: Long,
        namaTambahan: String, hargaTambahan: Long, lokasi: String, tanggalBayar: String,
        waktuEvent: Long, totalTarif: Long, nominalDibayar: Long, nominalDiskon: Long,
        dpDibayar: Long, isLunas: Boolean, noStruk: String, catatan: String,
        metodeBayar: String, isArsip: Boolean
    ) {
        prosesCetakBluetooth(
            namaAcara, namaKlien, paketDipilih, hargaPaketDasar, namaTambahan, hargaTambahan,
            lokasi, tanggalBayar, waktuEvent, totalTarif, nominalDibayar, nominalDiskon,
            dpDibayar, isLunas, noStruk, catatan, metodeBayar, isArsip
        )
    }
}
```

---

## 2. File: `StrukHelper.kt`
Ganti seluruh isi file `StrukHelper.kt` di project Android Studio Anda (`package com.kafilasuci3.app`) dengan kode berikut:

```kotlin
package com.kafilasuci3.app

import android.annotation.SuppressLint
import android.app.Activity
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.os.Build
import android.util.Base64
import android.widget.Toast
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import java.io.ByteArrayOutputStream
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.UUID

class StrukHelper(
    private val activity: Activity,
    private var namaBrandDefault: String = "Kafela's",
    private var namaAdminDefault: String = "Admin"
) {
    private val formatRp = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
    private fun rp(nom: Long) = formatRp.format(nom).replace(",00", "").replace("Rp", "Rp ")

    fun cetakStrukBluetoothFisik(
        namaAcara: String,
        namaKlien: String,
        paketDipilih: String,
        hargaPaketDasar: Long,
        namaTambahan: String,
        hargaTambahan: Long,
        lokasi: String,
        tanggalBayar: String,
        waktuEvent: Long,
        totalTarif: Long,
        nominalDibayar: Long,
        nominalDiskon: Long,
        dpDibayar: Long,
        isLunas: Boolean,
        noStruk: String,
        catatan: String,
        metodeBayar: String,
        isArsip: Boolean,
        namaBrand: String = namaBrandDefault,
        namaAdmin: String = namaAdminDefault,
        logoBase64: String = "",
        ttdBase64: String = ""
    ) {
        // 1. Verifikasi Izin Runtime Khusus Android 12+ (API 31+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val izinConnect = androidx.core.content.ContextCompat.checkSelfPermission(
                activity,
                android.Manifest.permission.BLUETOOTH_CONNECT
            )
            if (izinConnect != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(
                    activity,
                    "Izin Bluetooth Connect belum diberikan! Mohon izinkan di pengaturan.",
                    Toast.LENGTH_LONG
                ).show()
                return
            }
        }

        // 2. Cek Apakah Perangkat Memiliki Bluetooth & Sudah Aktif
        val bluetoothManager = activity.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        val bluetoothAdapter = bluetoothManager?.adapter

        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
            Toast.makeText(activity, "Bluetooth belum aktif! Silakan nyalakan Bluetooth.", Toast.LENGTH_SHORT).show()
            return
        }

        // 3. Ambil Perangkat yang Sudah Dipasangkan (Pairing) dengan Aman
        val pairedDevices: Set<BluetoothDevice>? = try {
            bluetoothAdapter.bondedDevices
        } catch (e: SecurityException) {
            Toast.makeText(activity, "Gagal mengakses Bluetooth: Izin ditolak sistem.", Toast.LENGTH_SHORT).show()
            null
        }

        if (pairedDevices.isNullOrEmpty()) {
            Toast.makeText(activity, "Tidak ada printer Bluetooth yang terpasang (Paired).", Toast.LENGTH_LONG).show()
            return
        }

        val deviceList = pairedDevices.toList()
        val sharedPref = activity.getSharedPreferences("PengaturanApp", Context.MODE_PRIVATE)
        val savedMac = sharedPref.getString("SAVED_PRINTER_MAC", null)
        val savedDevice = deviceList.find { it.address == savedMac }

        if (savedDevice != null) {
            prosesKirimKePrinter(
                savedDevice, namaAcara, namaKlien, paketDipilih, hargaPaketDasar, namaTambahan, hargaTambahan,
                lokasi, tanggalBayar, waktuEvent, totalTarif, nominalDibayar, nominalDiskon, dpDibayar,
                isLunas, noStruk, catatan, metodeBayar, isArsip, namaBrand, namaAdmin, logoBase64, ttdBase64
            )
            return
        }

        val deviceNames = deviceList.map { it.name ?: it.address }.toTypedArray()
        if (deviceList.size == 1) {
            val selectedDevice = deviceList[0]
            sharedPref.edit().putString("SAVED_PRINTER_MAC", selectedDevice.address).apply()
            prosesKirimKePrinter(
                selectedDevice, namaAcara, namaKlien, paketDipilih, hargaPaketDasar, namaTambahan, hargaTambahan,
                lokasi, tanggalBayar, waktuEvent, totalTarif, nominalDibayar, nominalDiskon, dpDibayar,
                isLunas, noStruk, catatan, metodeBayar, isArsip, namaBrand, namaAdmin, logoBase64, ttdBase64
            )
        } else {
            MaterialAlertDialogBuilder(activity)
                .setTitle("Pilih Printer Bluetooth")
                .setItems(deviceNames) { _, index ->
                    val selectedDevice = deviceList[index]
                    sharedPref.edit().putString("SAVED_PRINTER_MAC", selectedDevice.address).apply()
                    Toast.makeText(activity, "Printer diset sebagai Default", Toast.LENGTH_SHORT).show()
                    prosesKirimKePrinter(
                        selectedDevice, namaAcara, namaKlien, paketDipilih, hargaPaketDasar, namaTambahan, hargaTambahan,
                        lokasi, tanggalBayar, waktuEvent, totalTarif, nominalDibayar, nominalDiskon, dpDibayar,
                        isLunas, noStruk, catatan, metodeBayar, isArsip, namaBrand, namaAdmin, logoBase64, ttdBase64
                    )
                }
                .setNegativeButton("Batal", null)
                .show()
        }
    }

    @SuppressLint("MissingPermission")
    private fun prosesKirimKePrinter(
        device: BluetoothDevice,
        namaAcara: String,
        namaKlien: String,
        paketDipilih: String,
        hargaPaketDasar: Long,
        namaTambahan: String,
        hargaTambahan: Long,
        lokasi: String,
        tanggalBayar: String,
        waktuEvent: Long,
        totalTarif: Long,
        nominalDibayar: Long,
        nominalDiskon: Long,
        dpDibayar: Long,
        isLunas: Boolean,
        noStruk: String,
        catatan: String,
        metodeBayar: String,
        isArsip: Boolean,
        namaBrand: String,
        namaAdmin: String,
        logoBase64: String,
        ttdBase64: String
    ) {
        activity.runOnUiThread {
            Toast.makeText(activity, "Mencetak ke ${device.name ?: "Printer"}...", Toast.LENGTH_SHORT).show()
        }

        Thread {
            try {
                val uuid = UUID.fromString("00001101-0000-1000-8000-00805f9b34fb")
                val socket = device.createRfcommSocketToServiceRecord(uuid)
                socket.connect()
                val outputStream = socket.outputStream
                val byteBuffer = ByteArrayOutputStream()

                val ESC_INIT = byteArrayOf(0x1B, 0x40)
                val ALIGN_CENTER = byteArrayOf(0x1B, 0x61, 0x01)
                val ALIGN_LEFT = byteArrayOf(0x1B, 0x61, 0x00)
                val BOLD_ON = byteArrayOf(0x1B, 0x45, 0x01)
                val BOLD_OFF = byteArrayOf(0x1B, 0x45, 0x00)
                val FONT_LARGE = byteArrayOf(0x1D, 0x21, 0x11)
                val FONT_NORMAL = byteArrayOf(0x1D, 0x21, 0x00)
                val garisGanda = "================================\n"
                val garisTunggal = "--------------------------------\n"

                val tagihanSetelahDiskon = totalTarif - nominalDiskon
                val finalDibayar = if (isLunas) tagihanSetelahDiskon else nominalDibayar
                val statusTeks = if (isLunas) "LUNAS" else "DP / BOOKING"
                val sisaTagihan = if (isLunas) 0L else (tagihanSetelahDiskon - dpDibayar)

                byteBuffer.write(ESC_INIT)
                byteBuffer.write(ALIGN_CENTER)

                // ============================================================
                // 1. CETAK LOGO STUDIO (Jika Ada Data Base64)
                // ============================================================
                if (logoBase64.isNotBlank()) {
                    val logoRasterBytes = decodeBase64ToEscPosRaster(logoBase64, maxTargetWidth = 280)
                    if (logoRasterBytes != null) {
                        byteBuffer.write(ALIGN_CENTER)
                        byteBuffer.write(logoRasterBytes)
                        byteBuffer.write("\n".toByteArray(Charsets.ISO_8859_1))
                    }
                }

                // ============================================================
                // 2. NAMA BRAND STUDIO & JUDUL STRUK
                // ============================================================
                val brandFinal = if (namaBrand.isNotBlank()) namaBrand else namaBrandDefault
                byteBuffer.write(BOLD_ON)
                byteBuffer.write(FONT_LARGE)
                byteBuffer.write("${brandFinal.uppercase()}\n".toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write(FONT_NORMAL)
                byteBuffer.write(BOLD_OFF)
                byteBuffer.write(garisGanda.toByteArray(Charsets.ISO_8859_1))

                val judulInvoice = if (isArsip) "SALINAN INVOICE\n" else "INVOICE PEMBAYARAN\n"
                byteBuffer.write(judulInvoice.toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write(ALIGN_LEFT)
                if (noStruk.isNotEmpty()) byteBuffer.write("${createAlignedLine("No.", noStruk)}\n".toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write("${createAlignedLine("Tanggal", tanggalBayar)}\n".toByteArray(Charsets.ISO_8859_1))
                val adminFinal = if (namaAdmin.isNotBlank()) namaAdmin else namaAdminDefault
                byteBuffer.write("${createAlignedLine("Admin", adminFinal)}\n".toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write(garisTunggal.toByteArray(Charsets.ISO_8859_1))

                byteBuffer.write("${createAlignedLine("Yth. Bpk/Ibu", namaKlien)}\n".toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write(ALIGN_CENTER)
                byteBuffer.write("$namaAcara\n".toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write(ALIGN_LEFT)
                byteBuffer.write("${createAlignedLine("Paket", paketDipilih)}\n".toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write("${createAlignedLine("Lokasi", lokasi)}\n".toByteArray(Charsets.ISO_8859_1))
                if (waktuEvent > 0L) {
                    val formatEvent = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale("id", "ID"))
                    byteBuffer.write("${createAlignedLine("Waktu", formatEvent.format(java.util.Date(waktuEvent)))}\n".toByteArray(Charsets.ISO_8859_1))
                }
                byteBuffer.write("${createAlignedLine("Metode", metodeBayar)}\n".toByteArray(Charsets.ISO_8859_1))
                if (catatan.isNotEmpty()) byteBuffer.write("${createAlignedLine("Catatan", catatan)}\n".toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write(garisTunggal.toByteArray(Charsets.ISO_8859_1))

                if (hargaTambahan > 0L) {
                    val labelPaket = if(paketDipilih.isNotBlank() && paketDipilih != "-") paketDipilih else "Harga Paket"
                    byteBuffer.write("${createAlignedLine(labelPaket, rp(hargaPaketDasar))}\n".toByteArray(Charsets.ISO_8859_1))
                    val labelTambahan = if(namaTambahan.isNotBlank()) "+: $namaTambahan" else "Tambahan"
                    byteBuffer.write("${createAlignedLine(labelTambahan, "+ ${rp(hargaTambahan)}")}\n".toByteArray(Charsets.ISO_8859_1))
                    byteBuffer.write("${createAlignedLine("Total ", rp(totalTarif))}\n".toByteArray(Charsets.ISO_8859_1))
                } else {
                    byteBuffer.write("${createAlignedLine("Total Tarif", rp(totalTarif))}\n".toByteArray(Charsets.ISO_8859_1))
                }

                if (nominalDiskon > 0) {
                    byteBuffer.write("${createAlignedLine("Diskon", "- ${rp(nominalDiskon)}")}\n".toByteArray(Charsets.ISO_8859_1))
                    byteBuffer.write("${createAlignedLine("Total Tagihan", rp(tagihanSetelahDiskon))}\n".toByteArray(Charsets.ISO_8859_1))
                }
                if (isLunas && dpDibayar > 0L) {
                    byteBuffer.write("${createAlignedLine("Telah DP", "- ${rp(dpDibayar)}")}\n".toByteArray(Charsets.ISO_8859_1))
                }
                byteBuffer.write(garisTunggal.toByteArray(Charsets.ISO_8859_1))

                byteBuffer.write(BOLD_ON)
                byteBuffer.write("${createAlignedLine("DIBAYAR", rp(finalDibayar))}\n".toByteArray(Charsets.ISO_8859_1))
                if (!isLunas && sisaTagihan > 0) {
                    byteBuffer.write("${createAlignedLine("SISA", rp(sisaTagihan))}\n".toByteArray(Charsets.ISO_8859_1))
                }
                byteBuffer.write(BOLD_OFF)
                byteBuffer.write(garisGanda.toByteArray(Charsets.ISO_8859_1))

                byteBuffer.write(ALIGN_CENTER)
                byteBuffer.write(BOLD_ON)
                byteBuffer.write("STATUS: $statusTeks\n".toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write(BOLD_OFF)

                // ============================================================
                // 3. CETAK TANDA TANGAN KASIR / OWNER (Jika Ada Data Base64)
                // ============================================================
                byteBuffer.write("\n".toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write("Petugas Kasir / Pengelola:\n\n".toByteArray(Charsets.ISO_8859_1))

                if (ttdBase64.isNotBlank()) {
                    val ttdRasterBytes = decodeBase64ToEscPosRaster(ttdBase64, maxTargetWidth = 240)
                    if (ttdRasterBytes != null) {
                        byteBuffer.write(ALIGN_CENTER)
                        byteBuffer.write(ttdRasterBytes)
                        byteBuffer.write("\n".toByteArray(Charsets.ISO_8859_1))
                    } else {
                        byteBuffer.write("\n\n".toByteArray(Charsets.ISO_8859_1))
                    }
                } else {
                    byteBuffer.write("\n\n".toByteArray(Charsets.ISO_8859_1))
                }

                byteBuffer.write("( $adminFinal )\n".toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write(garisTunggal.toByteArray(Charsets.ISO_8859_1))
                byteBuffer.write("Terima kasih atas\nkepercayaan Anda.\n\n\n\n".toByteArray(Charsets.ISO_8859_1))

                outputStream.write(byteBuffer.toByteArray())
                outputStream.flush()
                Thread.sleep(500)
                socket.close()

            } catch (e: Exception) {
                activity.runOnUiThread {
                    Toast.makeText(activity, "Gagal mencetak struk fisik: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }.start()
    }

    private fun createAlignedLine(left: String, right: String, maxChar: Int = 32): String {
        val safeLeft = if (left.length > 14) left.substring(0, 14) else left
        val safeRight = if (right.length > 17) right.substring(0, 17) else right
        val totalLength = safeLeft.length + safeRight.length
        if (totalLength >= maxChar) return "$safeLeft\n$safeRight"
        val spaces = " ".repeat(maxChar - totalLength)
        return "$safeLeft$spaces$safeRight"
    }

    /**
     * Konverter Gambar Base64 ke Format ESC/POS Raster Bit Image (GS v 0) Monokrom
     */
    private fun decodeBase64ToEscPosRaster(base64Data: String, maxTargetWidth: Int = 384): ByteArray? {
        try {
            val cleanBase64 = if (base64Data.contains(",")) {
                base64Data.substringAfter(",")
            } else {
                base64Data
            }.trim()

            if (cleanBase64.isEmpty()) return null

            val decodedBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
            val originalBmp = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size) ?: return null

            // 1. Skala gambar agar pas dengan lebar printer thermal 58mm (kelipatan 8)
            val originalWidth = originalBmp.width
            val originalHeight = originalBmp.height

            var targetWidth = if (originalWidth > maxTargetWidth) maxTargetWidth else originalWidth
            // Lebar harus kelipatan 8 agar byte horizontal genap
            targetWidth = (targetWidth / 8) * 8
            if (targetWidth <= 0) targetWidth = 8

            val targetHeight = (originalHeight * targetWidth) / originalWidth
            if (targetHeight <= 0) return null

            val scaledBmp = Bitmap.createScaledBitmap(originalBmp, targetWidth, targetHeight, true)

            // 2. Format Header ESC/POS Raster: GS v 0 0 xL xH yL yH
            val xBytes = targetWidth / 8
            val xL = (xBytes % 256).toByte()
            val xH = (xBytes / 256).toByte()
            val yL = (targetHeight % 256).toByte()
            val yH = (targetHeight / 256).toByte()

            val stream = ByteArrayOutputStream()
            // Perintah ESC/POS Raster: GS v 0 m xL xH yL yH
            stream.write(byteArrayOf(0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH))

            // 3. Konversi Pixel ke Bit Monokrom (1 = Hitam dicetak, 0 = Putih kosong)
            for (y in 0 until targetHeight) {
                for (xb in 0 until xBytes) {
                    var byteVal = 0
                    for (b in 0 until 8) {
                        val x = xb * 8 + b
                        if (x < targetWidth) {
                            val pixel = scaledBmp.getPixel(x, y)
                            val alpha = Color.alpha(pixel)
                            val red = Color.red(pixel)
                            val green = Color.green(pixel)
                            val blue = Color.blue(pixel)

                            // Thresholding: pixel transparan diabaikan (putih)
                            // Pixel gelap (luminance < 160) dicetak sebagai titik hitam
                            val luminance = (0.299 * red + 0.587 * green + 0.114 * blue).toInt()
                            val isBlack = (alpha > 50) && (luminance < 165)

                            if (isBlack) {
                                byteVal = byteVal or (1 shl (7 - b))
                            }
                        }
                    }
                    stream.write(byteVal)
                }
            }

            return stream.toByteArray()
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
}
```

---

## 3. File: `MainActivity.kt`
Pastikan pada `MainActivity.kt` Anda, baris pembuatan `WebPrintInterface` dan nama interface `"MesinPrint"` sudah terdaftar:

```kotlin
package com.kafilasuci3.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var strukHelper: StrukHelper

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)

        // Inisialisasi StrukHelper
        strukHelper = StrukHelper(this, "Kafela's", "Admin")

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        webView.webViewClient = WebViewClient()

        // PENTING: Daftarkan jembatan JavaScript dengan nama "MesinPrint"
        webView.addJavascriptInterface(WebPrintInterface(this, strukHelper), "MesinPrint")

        webView.loadUrl("https://kflsagnd.web.app")
    }
}
```

---

## Cara Pasang & Uji Coba:
1. Buka project Android di **Android Studio**.
2. Salin isi `WebPrintInterface.kt` dan `StrukHelper.kt` di atas ke file masing-masing pada package `com.kafilasuci3.app`.
3. Lakukan **Rebuild Project** / **Build APK** di Android Studio.
4. Pasang APK baru ke smartphone Android Anda.
5. Buka aplikasi -> Masuk ke Menu Struk -> Klik tombol **"Print Bluetooth"**:
   - Web App otomatis mengirimkan data transaksi bersama Base64 **Logo** dan **Tanda Tangan**.
   - Printer Bluetooth thermal Anda akan langsung mencetak Logo di bagian atas dan Tanda Tangan kasir di bagian bawah dengan presisi!
