import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PadiCalculationResult, IrrigationType, PriceBasis } from '@/types';
import { formatRupiah, formatKg } from '@/utils/format';
import { hapticLight } from '@/utils/haptic';

interface PadiResultCardProps {
  result: PadiCalculationResult;
  irrigationType: IrrigationType;
  onChangeIrrigation: (type: IrrigationType) => void;
  priceBasis: PriceBasis;
  onChangePriceBasis: (basis: PriceBasis) => void;
}

export const PadiResultCard: React.FC<PadiResultCardProps> = ({
  result,
  irrigationType,
  onChangeIrrigation,
  priceBasis,
  onChangePriceBasis,
}) => {
  const { theme } = useTheme();
  const isNishab = result.is_nishab;

  return (
    <Card elevated style={styles.card}>
      {/* Nishab Status Header */}
      <View style={styles.statusSection}>
        <View style={styles.statusHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Status Nishab Pertanian
          </Text>
          {isNishab ? (
            <Badge
              label="Wajib Zakat (Mencapai Nishab)"
              color={theme.colors.primary}
              backgroundColor={`${theme.colors.primary}18`}
              icon="checkmark-circle"
            />
          ) : (
            <Badge
              label="Di Bawah Nishab (Sunnah Infaq)"
              color={theme.colors.warning}
              backgroundColor={`${theme.colors.warning}18`}
              icon="heart-outline"
            />
          )}
        </View>

        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
            Kemajuan Nishab (Acuan GKG 653 kg):
          </Text>
          <Text style={[styles.progressVal, { color: isNishab ? theme.colors.primary : theme.colors.gold }]}>
            {result.gkg_kg.toFixed(0)} / 653 kg ({result.progress_pct.toFixed(0)}%)
          </Text>
        </View>

        <ProgressBar
          progress={result.progress_pct}
          gradientColors={isNishab ? theme.colors.primaryGradient : theme.colors.goldGradient}
          height={10}
        />

        <Text style={[styles.statusDescription, { color: theme.colors.textMuted }]}>
          {isNishab
            ? 'Alhamdulillah, hasil panen telah memenuhi nishab (5 wasaq ≈ 653 kg GKG / 520 kg beras). Wajib dikeluarkan zakatnya pada hari panen.'
            : `Hasil panen belum mencapai batas nishab (kurang ${(Math.max(0, 653 - result.gkg_kg)).toFixed(0)} kg GKG). Tidak ada kewajiban zakat, namun disunnahkan berinfaq atau sedekah.`}
        </Text>
      </View>

      {/* Irrigation Type Selector */}
      <View style={[styles.irrigationSection, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.subSectionTitle, { color: theme.colors.textPrimary }]}>
          Pilih Jenis Pengairan (Menentukan Tarif Zakat):
        </Text>

        <View style={styles.irrigationRow}>
          {/* Tadah Hujan (10%) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              hapticLight();
              onChangeIrrigation('tadah_hujan');
            }}
            style={[
              styles.irrOption,
              {
                backgroundColor: irrigationType === 'tadah_hujan' ? `${theme.colors.primary}15` : theme.colors.surfaceElevated,
                borderColor: irrigationType === 'tadah_hujan' ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <View style={styles.irrRadioRow}>
              <View
                style={[
                  styles.radioDot,
                  {
                    borderColor: irrigationType === 'tadah_hujan' ? theme.colors.primary : theme.colors.textMuted,
                    backgroundColor: irrigationType === 'tadah_hujan' ? theme.colors.primary : 'transparent',
                  },
                ]}
              />
              <Text style={[styles.irrRateBadge, { color: theme.colors.primary }]}>Tarif 10%</Text>
            </View>
            <Text style={[styles.irrTitle, { color: theme.colors.textPrimary }]}>
              Tadah Hujan / Alami
            </Text>
            <Text style={[styles.irrDesc, { color: theme.colors.textSecondary }]}>
              Air hujan, sungai mengalir, tanpa biaya pompa/listrik.
            </Text>
          </TouchableOpacity>

          {/* Irigasi Berbiaya (5%) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              hapticLight();
              onChangeIrrigation('irigasi');
            }}
            style={[
              styles.irrOption,
              {
                backgroundColor: irrigationType === 'irigasi' ? `${theme.colors.gold}15` : theme.colors.surfaceElevated,
                borderColor: irrigationType === 'irigasi' ? theme.colors.gold : theme.colors.border,
              },
            ]}
          >
            <View style={styles.irrRadioRow}>
              <View
                style={[
                  styles.radioDot,
                  {
                    borderColor: irrigationType === 'irigasi' ? theme.colors.gold : theme.colors.textMuted,
                    backgroundColor: irrigationType === 'irigasi' ? theme.colors.gold : 'transparent',
                  },
                ]}
              />
              <Text style={[styles.irrRateBadge, { color: theme.colors.gold }]}>Tarif 5%</Text>
            </View>
            <Text style={[styles.irrTitle, { color: theme.colors.textPrimary }]}>
              Irigasi Berbiaya
            </Text>
            <Text style={[styles.irrDesc, { color: theme.colors.textSecondary }]}>
              Pompa mesin, BBM solar, atau iuran pajak irigasi komersial.
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Output 3 Format Sekaligus */}
      <View style={[styles.outputSection, { borderTopColor: theme.colors.border }]}>
        <View style={styles.outputTitleRow}>
          <Text style={[styles.subSectionTitle, { color: theme.colors.textPrimary }]}>
            Output Zakat yang Dikeluarkan (3 Pilihan):
          </Text>
          <View style={styles.priceBasisToggle}>
            <TouchableOpacity
              onPress={() => {
                hapticLight();
                onChangePriceBasis('gkg');
              }}
              style={[
                styles.basisBtn,
                priceBasis === 'gkg' && { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.basisText,
                  { color: priceBasis === 'gkg' ? '#FFFFFF' : theme.colors.textSecondary },
                ]}
              >
                Basis GKG
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                hapticLight();
                onChangePriceBasis('beras');
              }}
              style={[
                styles.basisBtn,
                priceBasis === 'beras' && { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.basisText,
                  { color: priceBasis === 'beras' ? '#FFFFFF' : theme.colors.textSecondary },
                ]}
              >
                Basis Beras
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.outputGrid}>
          {/* Format 1: GKG */}
          <View style={[styles.outputCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
            <View style={styles.outputIconRow}>
              <Ionicons name="cube-outline" size={16} color={theme.colors.gold} />
              <Text style={[styles.outputLabel, { color: theme.colors.textMuted }]}>
                Opsi 1: Gabah (GKG)
              </Text>
            </View>
            <Text style={[styles.outputAmount, { color: theme.colors.gold }]}>
              {formatKg(result.zakat_gkg_kg)}
            </Text>
            <Text style={[styles.outputSub, { color: theme.colors.textSecondary }]}>
              Gabah Kering Giling
            </Text>
          </View>

          {/* Format 2: Beras */}
          <View style={[styles.outputCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
            <View style={styles.outputIconRow}>
              <Ionicons name="restaurant-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.outputLabel, { color: theme.colors.textMuted }]}>
                Opsi 2: Beras Bersih
              </Text>
            </View>
            <Text style={[styles.outputAmount, { color: theme.colors.primary }]}>
              {formatKg(result.zakat_beras_kg)}
            </Text>
            <Text style={[styles.outputSub, { color: theme.colors.textSecondary }]}>
              Beras Siap Konsumsi
            </Text>
          </View>

          {/* Format 3: Uang Tunai (Qimah) */}
          <View
            style={[
              styles.outputCard,
              styles.outputCardFull,
              { backgroundColor: `${theme.colors.primary}10`, borderColor: theme.colors.primary },
            ]}
          >
            <View style={styles.outputIconRow}>
              <Ionicons name="cash-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.outputLabel, { color: theme.colors.primary, fontWeight: '700' }]}>
                Opsi 3: Nilai Tunai (Qimah)
              </Text>
            </View>
            <Text style={[styles.outputAmountLarge, { color: theme.colors.primary }]}>
              {formatRupiah(result.zakat_rupiah)}
            </Text>
            <Text style={[styles.outputSub, { color: theme.colors.textSecondary }]}>
              Berdasarkan harga acuan {formatRupiah(result.price_per_kg)}/kg {result.price_basis.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
  },
  statusSection: {
    marginBottom: 16,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  irrigationSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  irrigationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  irrOption: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
  },
  irrRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  radioDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  irrRateBadge: {
    fontSize: 12,
    fontWeight: '800',
  },
  irrTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  irrDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  outputSection: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  outputTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  priceBasisToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 6,
    padding: 2,
  },
  basisBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  basisText: {
    fontSize: 10,
    fontWeight: '600',
  },
  outputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  outputCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  outputCardFull: {
    width: '100%',
    padding: 14,
  },
  outputIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  outputLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  outputAmount: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  outputAmountLarge: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  outputSub: {
    fontSize: 11,
  },
});
