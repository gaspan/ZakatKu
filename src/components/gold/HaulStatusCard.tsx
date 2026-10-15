import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GoldCalculationResult, HaulSystem } from '@/types';
import { formatGram, formatDateIndo } from '@/utils/format';
import { hapticLight } from '@/utils/haptic';

interface HaulStatusCardProps {
  result: GoldCalculationResult;
  onToggleHaulSystem: (system: HaulSystem) => void;
}

export const HaulStatusCard: React.FC<HaulStatusCardProps> = ({
  result,
  onToggleHaulSystem,
}) => {
  const { theme } = useTheme();

  const isNishab = result.is_nishab;
  const isHaul = result.is_haul;
  const isWajib = result.is_wajib_zakat;

  const progressPct = Math.min(100, result.progress_pct);
  const remainingGram = Math.max(0, result.nishab_threshold_gram - result.total_weight_gram);

  return (
    <Card elevated style={styles.card}>
      {/* Header status badge & Haul system toggle */}
      <View style={styles.topRow}>
        <View style={styles.statusBadgeWrap}>
          {isWajib ? (
            <Badge
              label="Wajib Zakat Sekarang!"
              color={theme.colors.danger}
              backgroundColor={`${theme.colors.danger}20`}
              icon="alert-circle"
            />
          ) : isNishab ? (
            <Badge
              label="Nishab Tercapai • Menunggu Haul"
              color={theme.colors.warning}
              backgroundColor={`${theme.colors.warning}20`}
              icon="time"
            />
          ) : (
            <Badge
              label="Belum Mencapai Nishab"
              color={theme.colors.info}
              backgroundColor={`${theme.colors.info}18`}
              icon="information-circle"
            />
          )}
        </View>

        {/* Haul system toggle (Hijri vs Masehi) */}
        <View style={[styles.haulToggle, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={() => {
              hapticLight();
              onToggleHaulSystem('hijri');
            }}
            style={[
              styles.haulToggleBtn,
              result.haul_system === 'hijri' && { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text
              style={[
                styles.haulToggleText,
                { color: result.haul_system === 'hijri' ? '#FFFFFF' : theme.colors.textSecondary },
              ]}
            >
              Hijriah
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              hapticLight();
              onToggleHaulSystem('masehi');
            }}
            style={[
              styles.haulToggleBtn,
              result.haul_system === 'masehi' && { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text
              style={[
                styles.haulToggleText,
                { color: result.haul_system === 'masehi' ? '#FFFFFF' : theme.colors.textSecondary },
              ]}
            >
              Masehi
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar towards 85 gram */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={[styles.progressTitle, { color: theme.colors.textPrimary }]}>
            Nishab Emas (85 Gram)
          </Text>
          <Text style={[styles.progressValue, { color: isNishab ? theme.colors.primary : theme.colors.gold }]}>
            {result.total_weight_gram.toFixed(1)} / 85 g ({progressPct.toFixed(0)}%)
          </Text>
        </View>

        <ProgressBar
          progress={progressPct}
          gradientColors={isNishab ? theme.colors.primaryGradient : theme.colors.goldGradient}
          height={12}
        />

        <Text style={[styles.progressHelper, { color: theme.colors.textMuted }]}>
          {isNishab
            ? '✅ Telah melewati nishab minimal 85 gram emas murni.'
            : `Kurang ${remainingGram.toFixed(1)} gram lagi untuk mencapai batas nishab.`}
        </Text>
      </View>

      {/* Haul Countdown Grid */}
      <View style={[styles.countdownBox, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
        <View style={styles.countdownCol}>
          <Text style={[styles.countdownLabel, { color: theme.colors.textMuted }]}>
            Tanggal Awal
          </Text>
          <Text style={[styles.countdownVal, { color: theme.colors.textPrimary }]}>
            {formatDateIndo(result.earliest_purchase_date)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.countdownCol}>
          <Text style={[styles.countdownLabel, { color: theme.colors.textMuted }]}>
            Sisa Waktu Haul
          </Text>
          <Text
            style={[
              styles.countdownVal,
              { color: isHaul ? theme.colors.danger : theme.colors.gold, fontWeight: '800' },
            ]}
          >
            {isHaul ? 'Haul Genap!' : `${result.days_remaining} Hari Lagi`}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.countdownCol}>
          <Text style={[styles.countdownLabel, { color: theme.colors.textMuted }]}>
            Haul Standar
          </Text>
          <Text style={[styles.countdownVal, { color: theme.colors.textPrimary }]}>
            {result.haul_days_threshold} Hari
          </Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadgeWrap: {
    flexShrink: 1,
  },
  haulToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  haulToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  haulToggleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressHelper: {
    fontSize: 12,
    marginTop: 6,
  },
  countdownBox: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  countdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  countdownVal: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 28,
  },
});
