import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NumericInput } from '@/components/ui/NumericInput';
import { ConversionVisualizer } from '@/components/padi/ConversionVisualizer';
import { PadiResultCard } from '@/components/padi/PadiResultCard';
import { ShareModal } from '@/components/common/ShareModal';
import { addZakatHistory } from '@/lib/database';
import { getSettings } from '@/lib/storage';
import {
  IrrigationType,
  PriceBasis,
  PadiCalculationResult,
} from '@/types';
import { formatRupiah, formatKg } from '@/utils/format';
import {
  generatePadiWhatsAppMessage,
  shareToWhatsApp,
  exportPadiPdf,
} from '@/lib/shareService';
import { hapticLight, hapticSuccess } from '@/utils/haptic';

export default function ZakatPadiScreen() {
  const { theme } = useTheme();
  const db = useSQLiteContext();

  const [refreshing, setRefreshing] = useState(false);
  const [gkpKg, setGkpKg] = useState<number>(1000); // Default 1.000 kg GKP
  const [susutPct, setSusutPct] = useState<number>(85); // Default 85%
  const [rendemenPct, setRendemenPct] = useState<number>(64); // Default 64%
  const [irrigationType, setIrrigationType] = useState<IrrigationType>('tadah_hujan');
  const [priceBasis, setPriceBasis] = useState<PriceBasis>('gkg');
  const [gkgPrice, setGkgPrice] = useState<number>(7500); // Rp 7.500 / kg GKG
  const [berasPrice, setBerasPrice] = useState<number>(15000); // Rp 15.000 / kg Beras

  const [isShareVisible, setIsShareVisible] = useState(false);
  const [isSavingHistory, setIsSavingHistory] = useState(false);

  const loadDefaults = useCallback(async () => {
    try {
      const s = await getSettings();
      if (s.default_susut_pct) setSusutPct(s.default_susut_pct);
      if (s.default_rendemen_pct) setRendemenPct(s.default_rendemen_pct);
      if (s.default_gkg_price) setGkgPrice(s.default_gkg_price);
      if (s.default_beras_price) setBerasPrice(s.default_beras_price);
    } catch (e) {
      console.warn('Error loading default padi settings', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDefaults();
    }, [loadDefaults])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDefaults();
    setRefreshing(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Calculation: GKP ➔ GKG ➔ Beras & Nishab check
  // ─────────────────────────────────────────────────────────────────────────
  const calculationResult: PadiCalculationResult = useMemo(() => {
    // 1. Taksiran GKG = GKP * (susutPct / 100)
    const gkgKg = gkpKg * (susutPct / 100);

    // 2. Taksiran Beras = GKG * (rendemenPct / 100)
    const berasKg = gkgKg * (rendemenPct / 100);

    // 3. Nishab check (653 kg GKG atau 520 kg Beras)
    const nishabGkg = 653.0;
    const nishabBeras = 520.0;
    const isNishab = gkgKg >= nishabGkg;
    const progressPct = Math.min(100, (gkgKg / nishabGkg) * 100);

    // 4. Kadar Zakat berdasarkan jenis pengairan
    const zakatRate = irrigationType === 'tadah_hujan' ? 0.10 : 0.05;
    const zakatRateDisplay = irrigationType === 'tadah_hujan' ? '10%' : '5%';

    // 5. Output zakat 3 format
    const zakatGkgKg = isNishab ? gkgKg * zakatRate : 0;
    const zakatBerasKg = isNishab ? berasKg * zakatRate : 0;

    const currentPrice = priceBasis === 'gkg' ? gkgPrice : berasPrice;
    const zakatRupiah = priceBasis === 'gkg'
      ? zakatGkgKg * gkgPrice
      : zakatBerasKg * berasPrice;

    return {
      gkp_kg: gkpKg,
      gkg_kg: gkgKg,
      beras_kg: berasKg,
      susut_pct: susutPct,
      rendemen_pct: rendemenPct,
      nishab_gkg_kg: nishabGkg,
      nishab_beras_kg: nishabBeras,
      is_nishab: isNishab,
      progress_pct: progressPct,
      irrigation_type: irrigationType,
      zakat_rate: zakatRate,
      zakat_rate_display: zakatRateDisplay,
      zakat_gkg_kg: zakatGkgKg,
      zakat_beras_kg: zakatBerasKg,
      price_basis: priceBasis,
      price_per_kg: currentPrice,
      zakat_rupiah: zakatRupiah,
    };
  }, [gkpKg, susutPct, rendemenPct, irrigationType, priceBasis, gkgPrice, berasPrice]);

  // Save to SQLite zakat_history
  const handleSaveHistory = async () => {
    setIsSavingHistory(true);
    try {
      const irrText = irrigationType === 'tadah_hujan' ? 'Tadah Hujan (10%)' : 'Irigasi Berbiaya (5%)';
      await addZakatHistory(db, {
        type: 'padi',
        title: `Panen Padi (${formatKg(gkpKg)} GKP)`,
        total_weight: gkpKg,
        nishab_threshold: 653,
        is_wajib: calculationResult.is_nishab ? 1 : 0,
        zakat_rate: calculationResult.zakat_rate,
        zakat_amount_display: `${formatKg(calculationResult.zakat_gkg_kg)} GKG / ${formatKg(calculationResult.zakat_beras_kg)} Beras`,
        zakat_amount_money: calculationResult.zakat_rupiah,
        price_per_unit: calculationResult.price_per_kg,
        irrigation_type: irrigationType,
        notes: `${irrText} • Susut: ${susutPct}% • Rendemen: ${rendemenPct}%`,
      });
      hapticSuccess();
      Alert.alert('Berhasil', 'Perhitungan zakat panen padi berhasil disimpan ke dalam Riwayat.');
    } catch {
      Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan riwayat.');
    } finally {
      setIsSavingHistory(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.primary }]}>
            MODUL PERHITUNGAN
          </Text>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Zakat Pertanian Padi
          </Text>
        </View>
      </View>

      {/* Main Input: Berat Panen GKP */}
      <Card elevated style={styles.inputCard}>
        <View style={styles.inputTitleRow}>
          <Ionicons name="scale-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.inputCardTitle, { color: theme.colors.textPrimary }]}>
            1. Input Hasil Panen (GKP)
          </Text>
        </View>
        <Text style={[styles.inputCardSub, { color: theme.colors.textSecondary }]}>
          Masukkan total berat gabah kering panen yang baru dipanen dari sawah.
        </Text>

        <NumericInput
          value={gkpKg}
          onChangeValue={setGkpKg}
          suffix="kg"
          allowDecimal
          helper="Satuan Kilogram (kg) Gabah Kering Panen"
        />

        {/* Quick harvest weight presets */}
        <View style={styles.weightPresetsRow}>
          {[500, 750, 1000, 1500, 2000].map((w) => (
            <TouchableOpacity
              key={w}
              onPress={() => {
                hapticLight();
                setGkpKg(w);
              }}
              style={[
                styles.weightChip,
                {
                  backgroundColor: gkpKg === w ? `${theme.colors.primary}20` : theme.colors.surfaceElevated,
                  borderColor: gkpKg === w ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.weightChipText,
                  { color: gkpKg === w ? theme.colors.primary : theme.colors.textSecondary, fontWeight: gkpKg === w ? '700' : '500' },
                ]}
              >
                {formatKg(w)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Conversion Visualizer (GKP ➔ GKG ➔ Beras with Sliders) */}
      <ConversionVisualizer
        gkpKg={gkpKg}
        susutPct={susutPct}
        gkgKg={calculationResult.gkg_kg}
        rendemenPct={rendemenPct}
        berasKg={calculationResult.beras_kg}
        onChangeSusut={setSusutPct}
        onChangeRendemen={setRendemenPct}
      />

      {/* Price Market Input */}
      <Card elevated style={styles.priceCard}>
        <View style={styles.priceHeader}>
          <Ionicons name="cash-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.priceTitle, { color: theme.colors.textPrimary }]}>
            Acuan Harga Pasar (Untuk Konversi Uang Tunai/Qimah)
          </Text>
        </View>

        {priceBasis === 'gkg' ? (
          <NumericInput
            label="Harga Gabah Kering Giling (GKG)"
            value={gkgPrice}
            onChangeValue={setGkgPrice}
            prefix="Rp"
            suffix="/ kg GKG"
            helper="Harga rata-rata GKG saat musim panen di daerah Anda"
          />
        ) : (
          <NumericInput
            label="Harga Beras Konsumsi"
            value={berasPrice}
            onChangeValue={setBerasPrice}
            prefix="Rp"
            suffix="/ kg Beras"
            helper="Harga rata-rata beras konsumsi standar"
          />
        )}
      </Card>

      {/* Result Card: Nishab, Irrigation, 3 Output Formats */}
      <PadiResultCard
        result={calculationResult}
        irrigationType={irrigationType}
        onChangeIrrigation={setIrrigationType}
        priceBasis={priceBasis}
        onChangePriceBasis={setPriceBasis}
      />

      {/* Action Buttons: Simpan Riwayat & Bagikan / PDF */}
      <View style={styles.actionButtonsRow}>
        <Button
          title="Simpan Riwayat Panen"
          icon="save-outline"
          variant="secondary"
          loading={isSavingHistory}
          onPress={handleSaveHistory}
          style={{ flex: 1 }}
        />
        <Button
          title="Bagikan / PDF"
          icon="share-social-outline"
          variant="primary"
          onPress={() => {
            hapticLight();
            setIsShareVisible(true);
          }}
          style={{ flex: 1.2 }}
        />
      </View>

      {/* Share / PDF Modal */}
      <ShareModal
        visible={isShareVisible}
        title="Bagikan Hisab Zakat Padi"
        onClose={() => setIsShareVisible(false)}
        onShareWhatsApp={() => {
          const msg = generatePadiWhatsAppMessage(calculationResult);
          shareToWhatsApp(msg);
          setIsShareVisible(false);
        }}
        onExportPdf={async () => {
          await exportPadiPdf(calculationResult);
          setIsShareVisible(false);
        }}
      />

      {/* Bottom spacer for custom tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
  },
  header: {
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  inputCard: {
    padding: 16,
    marginBottom: 16,
  },
  inputTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  inputCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputCardSub: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  weightPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -4,
  },
  weightChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  weightChipText: {
    fontSize: 11,
  },
  priceCard: {
    padding: 16,
    marginBottom: 16,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  priceTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
});
