import { Share, Platform, Linking } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { GoldCalculationResult, PadiCalculationResult } from '@/types';
import { formatRupiah, formatGram, formatKg, formatDateIndo } from '@/utils/format';

/**
 * Format teks WhatsApp untuk Zakat Emas
 */
export function generateGoldWhatsAppMessage(result: GoldCalculationResult): string {
  const isWajib = result.is_wajib_zakat;
  return `*🌙 ZAKATKU (Emas & Tani) — LEMBAR PERHITUNGAN ZAKAT EMAS*
------------------------------------------------
Tanggal Hitung: ${formatDateIndo(new Date().toISOString())}
Total Simpanan Emas: *${formatGram(result.total_weight_gram)}*
Batas Nishab: 85 gram (${result.is_nishab ? '✅ Mencapai Nishab' : '❌ Belum Mencapai Nishab'})

*Status Haul (${result.haul_system === 'hijri' ? 'Hijriah 354 hari' : 'Masehi 365 hari'}):*
• Hari Berlalu: ${result.days_elapsed} hari
• Tanggal Mulai: ${formatDateIndo(result.earliest_purchase_date)}
• Status Haul: ${result.is_haul ? '✅ Genap 1 Tahun (Haul)' : `⏳ Sisa ${result.days_remaining} hari`}

*STATUS KEWAJIBAN:*
${isWajib ? '🟢 *WAJIB ZAKAT (Nishab & Haul Terpenuhi)*' : '🟡 *BELUM WAJIB ZAKAT*'}

*RINCIAN ZAKAT (Tarif 2,5%):*
• Zakat Emas: *${formatGram(result.zakat_weight_gram)}*
• Acuan Harga: ${formatRupiah(result.gold_price_per_gram)} / gram
• *Kewajiban Tunai (Qimah):* *${formatRupiah(result.zakat_rupiah)}*

_“Ambillah zakat dari sebagian harta mereka, dengan zakat itu kamu membersihkan dan mensucikan mereka...” (QS. At-Taubah: 103)_
------------------------------------------------
Dihitung otomatis melalui aplikasi *ZakatKu*`;
}

/**
 * Format teks WhatsApp untuk Zakat Pertanian Padi
 */
export function generatePadiWhatsAppMessage(result: PadiCalculationResult): string {
  const isWajib = result.is_nishab;
  const irrText = result.irrigation_type === 'tadah_hujan' ? 'Tadah Hujan / Alami (10%)' : 'Irigasi Pompa / Berbiaya (5%)';

  return `*🌾 ZAKATKU (Emas & Tani) — LEMBAR PERHITUNGAN ZAKAT PADI*
------------------------------------------------
Tanggal Panen: ${formatDateIndo(new Date().toISOString())}
• Panen Kotor (GKP): *${formatKg(result.gkp_kg)}*
• Hasil Taksiran GKG (Susut ${result.susut_pct}%): *${formatKg(result.gkg_kg)}*
• Hasil Taksiran Beras (Rendemen ${result.rendemen_pct}%): *${formatKg(result.beras_kg)}*

*Pengecekan Nishab:*
• Standar Nishab: 653 kg GKG atau 520 kg Beras
• Status: ${isWajib ? '🟢 *WAJIB ZAKAT (Telah Mencapai Nishab)*' : '🟡 *BELUM WAJIB ZAKAT (Disunnahkan Infaq/Sedekah)*'}

*Jenis Pengairan:* ${irrText}
*Kadar Zakat:* *${result.zakat_rate_display}*

*HASIL ZAKAT YANG HARUS DIKELUARKAN:*
1. Berupa Gabah Kering (GKG): *${formatKg(result.zakat_gkg_kg)}*
2. Berupa Beras Konsumsi: *${formatKg(result.zakat_beras_kg)}*
3. Berupa Uang Tunai (Qimah): *${formatRupiah(result.zakat_rupiah)}*
   (Basis harga: ${formatRupiah(result.price_per_kg)}/kg ${result.price_basis.toUpperCase()})

_“Dan tunaikanlah haknya (zakatnya) di hari memetik hasilnya (panen).” (QS. Al-An'am: 141)_
------------------------------------------------
Dihitung otomatis melalui aplikasi *ZakatKu*`;
}

/**
 * Share pesan ke WhatsApp secara langsung atau via Share Sheet
 */
export async function shareToWhatsApp(message: string): Promise<void> {
  try {
    const encoded = encodeURIComponent(message);
    const waUrl = `whatsapp://send?text=${encoded}`;
    const canOpen = await Linking.canOpenURL(waUrl);

    if (canOpen) {
      await Linking.openURL(waUrl);
    } else {
      await Share.share({
        message,
        title: 'Lembar Perhitungan ZakatKu',
      });
    }
  } catch {
    await Share.share({ message });
  }
}

/**
 * Generate PDF kwitansi / lembar hisab zakat yang indah & elegan
 */
export async function exportGoldPdf(result: GoldCalculationResult): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Lembar Perhitungan Zakat Emas - ZakatKu</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 36px; color: #1e293b; background: #fff; }
        .header { text-align: center; border-bottom: 3px double #059669; padding-bottom: 20px; margin-bottom: 24px; }
        .bismillah { font-size: 20px; font-weight: bold; color: #064e3b; margin-bottom: 6px; }
        .brand { font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px; }
        .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
        .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin: 12px 0; }
        .badge-wajib { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
        .badge-belum { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .table td.label { color: #64748b; width: 45%; }
        .table td.val { font-weight: 600; color: #0f172a; text-align: right; }
        .highlight-box { background: #ecfdf5; border: 1.5px solid #059669; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
        .highlight-title { font-size: 13px; font-weight: 600; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; }
        .highlight-amount { font-size: 32px; font-weight: 800; color: #059669; margin: 8px 0; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 30px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div class="brand">ZAKATKU (Emas & Tani)</div>
        <div class="subtitle">Lembar Perhitungan Resmi Zakat Mal (Emas Simpanan)</div>
        <div class="badge ${result.is_wajib_zakat ? 'badge-wajib' : 'badge-belum'}">
          ${result.is_wajib_zakat ? 'STATUS: WAJIB ZAKAT' : 'STATUS: BELUM WAJIB ZAKAT'}
        </div>
      </div>

      <div class="card">
        <div style="font-weight: 700; font-size: 16px; color: #064e3b; margin-bottom: 8px;">1. Parameter Kepemilikan Emas</div>
        <table class="table">
          <tr><td class="label">Tanggal Perhitungan</td><td class="val">${formatDateIndo(new Date().toISOString())}</td></tr>
          <tr><td class="label">Total Berat Emas</td><td class="val">${formatGram(result.total_weight_gram)}</td></tr>
          <tr><td class="label">Nishab Emas (Standar Fiqih)</td><td class="val">85,00 gram (${result.is_nishab ? 'Terpenuhi' : 'Belum Terpenuhi'})</td></tr>
          <tr><td class="label">Sistem Perhitungan Haul</td><td class="val">1 Tahun ${result.haul_system === 'hijri' ? 'Hijriah (354 hari)' : 'Masehi (365 hari)'}</td></tr>
          <tr><td class="label">Tanggal Kepemilikan Awal</td><td class="val">${formatDateIndo(result.earliest_purchase_date)}</td></tr>
          <tr><td class="label">Masa Kepemilikan Tersimpan</td><td class="val">${result.days_elapsed} hari (${result.is_haul ? 'Haul Tercapai' : `Sisa ${result.days_remaining} hari`})</td></tr>
          <tr><td class="label">Harga Emas Acuan</td><td class="val">${formatRupiah(result.gold_price_per_gram)} / gram</td></tr>
        </table>
      </div>

      <div class="highlight-box">
        <div class="highlight-title">Kewajiban Zakat yang Harus Ditunaikan (Tarif 2,5%)</div>
        <div class="highlight-amount">${formatRupiah(result.zakat_rupiah)}</div>
        <div style="font-size: 15px; font-weight: 600; color: #047857;">Setara dengan: ${formatGram(result.zakat_weight_gram)} Emas Murni</div>
      </div>

      <div class="footer">
        “Bila engkau memiliki 20 dinar (85g emas) dan telah berlalu satu tahun (haul), maka padanya wajib zakat 1/2 dinar (2,5%).” (HR. Abu Dawud)<br>
        Dicetak secara otomatis melalui aplikasi ZakatKu pada ${new Date().toLocaleString('id-ID')}
      </div>
    </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    window.print();
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  }
}

/**
 * Generate PDF kwitansi / lembar hisab zakat padi
 */
export async function exportPadiPdf(result: PadiCalculationResult): Promise<void> {
  const irrText = result.irrigation_type === 'tadah_hujan' ? 'Tadah Hujan / Alami (10%)' : 'Irigasi Pompa Berbiaya (5%)';
  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Lembar Perhitungan Zakat Pertanian - ZakatKu</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 36px; color: #1e293b; background: #fff; }
        .header { text-align: center; border-bottom: 3px double #059669; padding-bottom: 20px; margin-bottom: 24px; }
        .bismillah { font-size: 20px; font-weight: bold; color: #064e3b; margin-bottom: 6px; }
        .brand { font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px; }
        .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
        .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin: 12px 0; }
        .badge-wajib { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
        .badge-belum { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .table td.label { color: #64748b; width: 45%; }
        .table td.val { font-weight: 600; color: #0f172a; text-align: right; }
        .highlight-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 24px 0; }
        .highlight-cell { background: #ecfdf5; border: 1.5px solid #059669; border-radius: 12px; padding: 16px; text-align: center; }
        .highlight-title { font-size: 11px; font-weight: 600; color: #065f46; text-transform: uppercase; }
        .highlight-val { font-size: 20px; font-weight: 800; color: #059669; margin-top: 6px; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 30px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div class="brand">ZAKATKU (Emas & Tani)</div>
        <div class="subtitle">Lembar Perhitungan Resmi Zakat Pertanian (Padi & Gabah)</div>
        <div class="badge ${result.is_nishab ? 'badge-wajib' : 'badge-belum'}">
          ${result.is_nishab ? 'STATUS: WAJIB ZAKAT (MENCAPAI NISHAB)' : 'STATUS: BELUM WAJIB ZAKAT (SUNNAH INFAQ)'}
        </div>
      </div>

      <div class="card">
        <div style="font-weight: 700; font-size: 16px; color: #064e3b; margin-bottom: 8px;">1. Alur Konversi & Taksiran Hasil Panen</div>
        <table class="table">
          <tr><td class="label">Berat Panen Gabah Kering Panen (GKP)</td><td class="val">${formatKg(result.gkp_kg)}</td></tr>
          <tr><td class="label">Rasio Susut Pengeringan GKP -> GKG</td><td class="val">${result.susut_pct}%</td></tr>
          <tr><td class="label">Taksiran Gabah Kering Giling (GKG)</td><td class="val">${formatKg(result.gkg_kg)}</td></tr>
          <tr><td class="label">Rendemen Penggilingan GKG -> Beras</td><td class="val">${result.rendemen_pct}%</td></tr>
          <tr><td class="label">Taksiran Beras Siap Konsumsi</td><td class="val">${formatKg(result.beras_kg)}</td></tr>
          <tr><td class="label">Standar Nishab Pertanian</td><td class="val">653 kg GKG / 520 kg Beras</td></tr>
          <tr><td class="label">Jenis Pengairan & Tarif Zakat</td><td class="val">${irrText} (${result.zakat_rate_display})</td></tr>
          <tr><td class="label">Harga Acuan Pasar</td><td class="val">${formatRupiah(result.price_per_kg)} / kg (${result.price_basis.toUpperCase()})</td></tr>
        </table>
      </div>

      <div style="font-weight: 700; font-size: 16px; color: #064e3b; margin-bottom: 12px;">2. Opsi Penunaian Zakat (3 Format Sekaligus):</div>
      <div class="highlight-grid">
        <div class="highlight-cell">
          <div class="highlight-title">Gabah Kering (GKG)</div>
          <div class="highlight-val">${formatKg(result.zakat_gkg_kg)}</div>
        </div>
        <div class="highlight-cell">
          <div class="highlight-title">Beras Siap Konsumsi</div>
          <div class="highlight-val">${formatKg(result.zakat_beras_kg)}</div>
        </div>
        <div class="highlight-cell">
          <div class="highlight-title">Nilai Tunai (Qimah)</div>
          <div class="highlight-val">${formatRupiah(result.zakat_rupiah)}</div>
        </div>
      </div>

      <div class="footer">
        “Dan tunaikanlah haknya (zakatnya) di hari memetik hasilnya (panen).” (QS. Al-An'am: 141)<br>
        Dicetak secara otomatis melalui aplikasi ZakatKu pada ${new Date().toLocaleString('id-ID')}
      </div>
    </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    window.print();
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  }
}
