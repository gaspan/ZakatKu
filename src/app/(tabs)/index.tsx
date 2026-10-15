import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';

import { useTheme } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import {
  getWallets,
  getGoldItems,
  getZakatHistory,
} from '@/lib/database';
import { getSettings } from '@/lib/storage';
import {
  Wallet,
  GoldItem,
  ZakatHistoryItem,
  AppSettings,
  GoldCalculationResult,
} from '@/types';
import { formatRupiah, formatGram, formatDateIndo, calculateDaysElapsed } from '@/utils/format';
import { DALIL_LIST } from '@/constants/dalil';
import { hapticLight } from '@/utils/haptic';

export default function HomeScreen() {
  const { theme } = useTheme();
  const db = useSQLiteContext();

  const [refreshing, setRefreshing] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  const [recentHistory, setRecentHistory] = useState<ZakatHistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [goldCalc, setGoldCalc] = useState<GoldCalculationResult | null>(null);
  const [activeDalilIndex, setActiveDalilIndex] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [wList, gList, hList, s] = await Promise.all([
        getWallets(db),
        getGoldItems(db),
        getZakatHistory(db),
        getSettings(),
      ]);

      setWallets(wList);
      setGoldItems(gList);
      setRecentHistory(hList.slice(0, 3));
      setSettings(s);

      // Calculate gold status
      const activeWalletIds = new Set(wList.filter((w) => w.is_active === 1).map((w) => w.id));
      const activeItems = gList.filter((g) => activeWalletIds.has(g.wallet_id));

      const totalWeight = activeItems.reduce((acc, it) => acc + (it.weight_gram || 0), 0);
      const isNishab = totalWeight >= 85;
      const progressPct = Math.min(100, (totalWeight / 85) * 100);

      // Find earliest purchase date among active items
      let earliestDate: string | null = null;
      let minDiff = 0;

      if (activeItems.length > 0) {
        const sorted = [...activeItems].sort((a, b) =>
          dayjs(a.purchase_date).diff(dayjs(b.purchase_date))
        );
        earliestDate = sorted[0].purchase_date;
        minDiff = calculateDaysElapsed(earliestDate);
      }

      const haulDaysThreshold = s.haul_system === 'hijri' ? 354 : 365;
      const isHaul = minDiff >= haulDaysThreshold;
      const daysRemaining = Math.max(0, haulDaysThreshold - minDiff);
      const isWajib = isNishab && isHaul;

      const zakatWeight = isWajib ? totalWeight * 0.025 : 0;
      const zakatRupiah = zakatWeight * (s.default_gold_price || 1450000);

      setGoldCalc({
        total_weight_gram: totalWeight,
        equivalent_24k_gram: totalWeight,
        nishab_threshold_gram: 85,
        is_nishab: isNishab,
        progress_pct: progressPct,
        haul_system: s.haul_system,
        haul_days_threshold: haulDaysThreshold,
        days_elapsed: minDiff,
        days_remaining: daysRemaining,
        is_haul: isHaul,
        earliest_purchase_date: earliestDate,
        target_haul_date: earliestDate ? dayjs(earliestDate).add(haulDaysThreshold, 'day').format('YYYY-MM-DD') : null,
        is_wajib_zakat: isWajib,
        zakat_rate: 0.025,
        zakat_weight_gram: zakatWeight,
        gold_price_per_gram: s.default_gold_price || 1450000,
        zakat_rupiah: zakatRupiah,
      });
    } catch (e) {
      console.warn('Error loading dashboard data:', e);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const currentDalil = DALIL_LIST[activeDalilIndex % DALIL_LIST.length];

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
      {/* Top Greeting Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.bismillah, { color: theme.colors.primary }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
          <Text style={[styles.appTitle, { color: theme.colors.textPrimary }]}>
            ZakatKu <Text style={{ color: theme.colors.gold }}>• Emas & Tani</Text>
          </Text>
          <Text style={[styles.todayDate, { color: theme.colors.textSecondary }]}>
            {formatDateIndo(new Date().toISOString())}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            hapticLight();
            router.push('/(tabs)/history');
          }}
          style={[styles.settingsButton, { backgroundColor: theme.colors.surfaceCard, borderColor: theme.colors.border }]}
        >
          <Ionicons name="options-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Hero Card: Status Kewajiban Zakat Emas */}
      <Card gradient={theme.colors.heroGradient} glow style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroSub}>Ringkasan Kewajiban Zakat Emas</Text>
            <Text style={styles.heroMainAmount}>
              {goldCalc?.is_wajib_zakat
                ? formatRupiah(goldCalc.zakat_rupiah)
                : 'Rp 0'}
            </Text>
          </View>
          <View style={styles.heroBadgeWrap}>
            {goldCalc?.is_wajib_zakat ? (
              <Badge
                label="Wajib Zakat!"
                color="#FFFFFF"
                backgroundColor="rgba(239, 68, 68, 0.35)"
                icon="alert-circle"
              />
            ) : goldCalc?.is_nishab ? (
              <Badge
                label="Tunggu Haul"
                color="#FFFFFF"
                backgroundColor="rgba(245, 158, 11, 0.35)"
                icon="time"
              />
            ) : (
              <Badge
                label="Belum Nishab"
                color="#FFFFFF"
                backgroundColor="rgba(255, 255, 255, 0.2)"
                icon="information-circle"
              />
            )}
          </View>
        </View>

        <View style={styles.heroDivider} />

        <View style={styles.heroStatGrid}>
          <View style={styles.heroStatCol}>
            <Text style={styles.heroStatLabel}>Total Emas Tersimpan</Text>
            <Text style={styles.heroStatVal}>
              {formatGram(goldCalc?.total_weight_gram || 0)}
            </Text>
          </View>
          <View style={styles.heroStatCol}>
            <Text style={styles.heroStatLabel}>Status Haul</Text>
            <Text style={styles.heroStatVal}>
              {goldCalc?.is_haul
                ? 'Genap 1 Tahun'
                : `${goldCalc?.days_remaining || 0} Hari Lagi`}
            </Text>
          </View>
          <View style={styles.heroStatCol}>
            <Text style={styles.heroStatLabel}>Nishab (85g)</Text>
            <Text style={styles.heroStatVal}>
              {(goldCalc?.progress_pct || 0).toFixed(0)}%
            </Text>
          </View>
        </View>
      </Card>

      {/* Quick Action Buttons */}
      <View style={styles.quickActionRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            hapticLight();
            router.push('/(tabs)/emas');
          }}
          style={[styles.quickActionCard, { backgroundColor: theme.colors.surfaceCard, borderColor: theme.colors.gold }]}
        >
          <LinearGradient
            colors={theme.colors.goldGradient}
            style={styles.quickIconCircle}
          >
            <Ionicons name="cube" size={22} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.quickActionTitle, { color: theme.colors.textPrimary }]}>
            Zakat Emas
          </Text>
          <Text style={[styles.quickActionSub, { color: theme.colors.textSecondary }]}>
            Multi-dompet & Haul
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            hapticLight();
            router.push('/(tabs)/padi');
          }}
          style={[styles.quickActionCard, { backgroundColor: theme.colors.surfaceCard, borderColor: theme.colors.primary }]}
        >
          <LinearGradient
            colors={theme.colors.primaryGradient}
            style={styles.quickIconCircle}
          >
            <Ionicons name="leaf" size={22} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.quickActionTitle, { color: theme.colors.textPrimary }]}>
            Zakat Padi
          </Text>
          <Text style={[styles.quickActionSub, { color: theme.colors.textSecondary }]}>
            Konversi GKP ➔ GKG ➔ Beras
          </Text>
        </TouchableOpacity>
      </View>

      {/* Overview Emas & Countdown Haul */}
      <Card elevated style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="sparkles" size={18} color={theme.colors.gold} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Progress Nishab & Haul Emas
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              hapticLight();
              router.push('/(tabs)/emas');
            }}
          >
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>Kelola Dompet ➔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
            Akumulasi Dompet: {formatGram(goldCalc?.total_weight_gram || 0)}
          </Text>
          <Text style={[styles.progressTarget, { color: theme.colors.gold }]}>
            Nishab: 85 g
          </Text>
        </View>

        <ProgressBar
          progress={goldCalc?.progress_pct || 0}
          gradientColors={goldCalc?.is_nishab ? theme.colors.primaryGradient : theme.colors.goldGradient}
          height={10}
        />

        <View style={styles.countdownBanner}>
          <Ionicons
            name={goldCalc?.is_haul ? 'alert-circle' : 'hourglass-outline'}
            size={18}
            color={goldCalc?.is_haul ? theme.colors.danger : theme.colors.primary}
          />
          <Text style={[styles.countdownText, { color: theme.colors.textPrimary }]}>
            {goldCalc?.is_haul
              ? 'Waktu haul telah tercapai! Zakat 2,5% siap ditunaikan.'
              : `Sisa waktu haul: ${goldCalc?.days_remaining || 0} hari menuju genap 1 tahun.`}
          </Text>
        </View>
      </Card>

      {/* Overview Zakat Pertanian Standar */}
      <Card elevated style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="leaf" size={18} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Aturan Nishab Zakat Pertanian (Padi)
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              hapticLight();
              router.push('/(tabs)/padi');
            }}
          >
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>Hitung Panen ➔</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoRow, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Nishab GKG</Text>
            <Text style={[styles.infoVal, { color: theme.colors.gold }]}>653 kg GKG</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Setara Beras</Text>
            <Text style={[styles.infoVal, { color: theme.colors.primary }]}>520 kg Beras</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Waktu Bayar</Text>
            <Text style={[styles.infoVal, { color: theme.colors.textPrimary }]}>Saat Panen</Text>
          </View>
        </View>

        <Text style={[styles.padiHelperText, { color: theme.colors.textSecondary }]}>
          Tarif 10% untuk tadah hujan/alami, atau 5% untuk pengairan pompa/berbiaya. Tidak mensyaratkan haul 1 tahun.
        </Text>
      </Card>

      {/* Dalil & Fiqih Card (Interactive Switcher) */}
      <Card elevated style={styles.dalilCard}>
        <View style={styles.dalilHeader}>
          <Badge
            label={currentDalil.topic.toUpperCase()}
            color={theme.colors.primary}
            size="sm"
          />
          <Text style={[styles.dalilSource, { color: theme.colors.textMuted }]}>
            {currentDalil.source}
          </Text>
        </View>

        {currentDalil.arabic && (
          <Text style={[styles.dalilArabic, { color: theme.colors.primaryDark || theme.colors.primary }]}>
            {currentDalil.arabic}
          </Text>
        )}

        <Text style={[styles.dalilTranslation, { color: theme.colors.textPrimary }]}>
          “{currentDalil.translation}”
        </Text>

        <Text style={[styles.dalilExplanation, { color: theme.colors.textSecondary }]}>
          💡 {currentDalil.explanation}
        </Text>

        <TouchableOpacity
          onPress={() => {
            hapticLight();
            setActiveDalilIndex((prev) => prev + 1);
          }}
          style={styles.nextDalilBtn}
        >
          <Text style={[styles.nextDalilText, { color: theme.colors.primary }]}>
            Baca Dalil Berikutnya ➔
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Riwayat Terakhir */}
      {recentHistory.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Riwayat Perhitungan Terakhir
            </Text>
            <TouchableOpacity
              onPress={() => {
                hapticLight();
                router.push('/(tabs)/history');
              }}
            >
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {recentHistory.map((item) => {
            const isEmas = item.type === 'emas';
            return (
              <View
                key={item.id}
                style={[
                  styles.historyItemCard,
                  { backgroundColor: theme.colors.surfaceCard, borderColor: theme.colors.border },
                ]}
              >
                <View
                  style={[
                    styles.historyIcon,
                    { backgroundColor: isEmas ? `${theme.colors.gold}20` : `${theme.colors.primary}20` },
                  ]}
                >
                  <Ionicons
                    name={isEmas ? 'cube' : 'leaf'}
                    size={18}
                    color={isEmas ? theme.colors.gold : theme.colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyTitle, { color: theme.colors.textPrimary }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.historySub, { color: theme.colors.textSecondary }]}>
                    {formatDateIndo(item.created_at)} • {item.zakat_amount_display}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyAmount,
                    { color: item.is_wajib === 1 ? theme.colors.primary : theme.colors.textMuted },
                  ]}
                >
                  {formatRupiah(item.zakat_amount_money)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Bottom spacer for custom tab bar */}
      <View style={{ height: 90 }} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  bismillah: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  todayDate: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  heroMainAmount: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  heroBadgeWrap: {
    alignItems: 'flex-end',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 14,
  },
  heroStatGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatCol: {
    flex: 1,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  heroStatVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionSub: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressTarget: {
    fontSize: 12,
    fontWeight: '700',
  },
  countdownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  countdownText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  infoCol: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoDivider: {
    width: 1,
    height: '100%',
  },
  padiHelperText: {
    fontSize: 11,
    lineHeight: 15,
  },
  dalilCard: {
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  dalilHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dalilSource: {
    fontSize: 11,
    fontWeight: '600',
  },
  dalilArabic: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 30,
    marginBottom: 10,
  },
  dalilTranslation: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: 8,
  },
  dalilExplanation: {
    fontSize: 11,
    lineHeight: 16,
  },
  nextDalilBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  nextDalilText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historySection: {
    marginBottom: 16,
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  historySub: {
    fontSize: 11,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
});
