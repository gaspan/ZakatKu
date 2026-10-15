import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useTheme } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NumericInput } from '@/components/ui/NumericInput';
import { WalletCard } from '@/components/gold/WalletCard';
import { HaulStatusCard } from '@/components/gold/HaulStatusCard';
import { AddWalletModal } from '@/components/gold/AddWalletModal';
import { AddGoldItemModal } from '@/components/gold/AddGoldItemModal';
import { ShareModal } from '@/components/common/ShareModal';
import {
  getWallets,
  addWallet,
  toggleWalletActive,
  getGoldItems,
  addGoldItem,
  updateGoldItem,
  deleteGoldItem,
  addZakatHistory,
} from '@/lib/database';
import { getSettings, updateSettings } from '@/lib/storage';
import {
  Wallet,
  GoldItem,
  GoldCalculationResult,
  HaulSystem,
} from '@/types';
import {
  formatRupiah,
  formatGram,
  calculateDaysElapsed,
  calculateHaulTargetDate,
} from '@/utils/format';
import { triggerHaulDueNotification } from '@/lib/notifications';
import {
  generateGoldWhatsAppMessage,
  shareToWhatsApp,
  exportGoldPdf,
} from '@/lib/shareService';
import { hapticLight, hapticSuccess } from '@/utils/haptic';

export default function ZakatEmasScreen() {
  const { theme } = useTheme();
  const db = useSQLiteContext();

  const [refreshing, setRefreshing] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  const [haulSystem, setHaulSystemState] = useState<HaulSystem>('hijri');
  const [goldPrice, setGoldPrice] = useState<number>(1450000);

  // Modals state
  const [isAddWalletVisible, setIsAddWalletVisible] = useState(false);
  const [isAddGoldVisible, setIsAddGoldVisible] = useState(false);
  const [isShareVisible, setIsShareVisible] = useState(false);
  const [selectedWalletForAdd, setSelectedWalletForAdd] = useState<Wallet | null>(null);
  const [selectedWalletDetail, setSelectedWalletDetail] = useState<Wallet | null>(null);
  const [editingGoldItem, setEditingGoldItem] = useState<GoldItem | null>(null);
  const [isSavingHistory, setIsSavingHistory] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [wList, gList, s] = await Promise.all([
        getWallets(db),
        getGoldItems(db),
        getSettings(),
      ]);
      setWallets(wList);
      setGoldItems(gList);
      setHaulSystemState(s.haul_system);
      setGoldPrice(s.default_gold_price || 1450000);
    } catch (e) {
      console.warn('Error loading gold data:', e);
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

  // ─────────────────────────────────────────────────────────────────────────
  // Core Calculation: Nishab & Haul logic
  // ─────────────────────────────────────────────────────────────────────────
  const calculationResult: GoldCalculationResult = useMemo(() => {
    // 1. Filter only active wallets
    const activeWalletIds = new Set(wallets.filter((w) => w.is_active === 1).map((w) => w.id));
    const activeItems = goldItems.filter((item) => activeWalletIds.has(item.wallet_id));

    // 2. Total accumulated weight (gram)
    const totalWeight = activeItems.reduce((acc, it) => acc + (it.weight_gram || 0), 0);
    const nishabThreshold = 85.0; // 85 gram emas
    const isNishab = totalWeight >= nishabThreshold;
    const progressPct = Math.min(100, (totalWeight / nishabThreshold) * 100);

    // 3. Haul check
    const haulDaysThreshold = haulSystem === 'hijri' ? 354 : 365;
    let earliestDate: string | null = null;
    let daysElapsed = 0;

    if (activeItems.length > 0) {
      const sorted = [...activeItems].sort((a, b) =>
        dayjs(a.purchase_date).diff(dayjs(b.purchase_date))
      );
      earliestDate = sorted[0].purchase_date;
      daysElapsed = calculateDaysElapsed(earliestDate);
    }

    const isHaul = daysElapsed >= haulDaysThreshold;
    const daysRemaining = Math.max(0, haulDaysThreshold - daysElapsed);
    const targetHaulDate = earliestDate
      ? calculateHaulTargetDate(earliestDate, haulDaysThreshold)
      : null;

    // 4. Obligation check
    const isWajib = isNishab && isHaul;
    const zakatRate = 0.025; // 2.5%
    const zakatWeight = isWajib ? totalWeight * zakatRate : 0;
    const zakatRupiah = zakatWeight * goldPrice;

    return {
      total_weight_gram: totalWeight,
      equivalent_24k_gram: totalWeight,
      nishab_threshold_gram: nishabThreshold,
      is_nishab: isNishab,
      progress_pct: progressPct,
      haul_system: haulSystem,
      haul_days_threshold: haulDaysThreshold,
      days_elapsed: daysElapsed,
      days_remaining: daysRemaining,
      is_haul: isHaul,
      earliest_purchase_date: earliestDate,
      target_haul_date: targetHaulDate,
      is_wajib_zakat: isWajib,
      zakat_rate: zakatRate,
      zakat_weight_gram: zakatWeight,
      gold_price_per_gram: goldPrice,
      zakat_rupiah: zakatRupiah,
    };
  }, [wallets, goldItems, haulSystem, goldPrice]);

  // Trigger local notification when haul & nishab are reached
  useEffect(() => {
    if (calculationResult.is_wajib_zakat) {
      triggerHaulDueNotification(
        calculationResult.total_weight_gram,
        calculationResult.zakat_rupiah
      );
    }
  }, [calculationResult.is_wajib_zakat, calculationResult.total_weight_gram, calculationResult.zakat_rupiah]);

  // Toggle active wallet for inclusion in calculation
  const handleToggleWallet = async (walletId: number, currentActive: boolean) => {
    await toggleWalletActive(db, walletId, !currentActive);
    setWallets((prev) =>
      prev.map((w) => (w.id === walletId ? { ...w, is_active: !currentActive ? 1 : 0 } : w))
    );
  };

  // Change haul system
  const handleToggleHaulSystem = async (sys: HaulSystem) => {
    setHaulSystemState(sys);
    await updateSettings({ haul_system: sys });
  };

  // Save new wallet
  const handleSaveWallet = async (data: { name: string; description: string; icon: string; color: string }) => {
    await addWallet(db, {
      ...data,
      is_active: 1,
    });
    hapticSuccess();
    await loadData();
  };

  // Save or update gold item
  const handleSaveGoldItem = async (data: {
    wallet_id: number;
    name: string;
    weight_gram: number;
    purity: number;
    purchase_date: string;
    notes: string;
  }) => {
    if (editingGoldItem) {
      await updateGoldItem(db, editingGoldItem.id, data);
      setEditingGoldItem(null);
    } else {
      await addGoldItem(db, data);
    }
    hapticSuccess();
    await loadData();
  };

  // Delete gold item
  const handleDeleteGoldItem = (itemId: number) => {
    Alert.alert(
      'Hapus Catatan Emas',
      'Apakah Anda yakin ingin menghapus catatan kepemilikan emas ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteGoldItem(db, itemId);
            hapticLight();
            await loadData();
          },
        },
      ]
    );
  };

  // Save to history
  const handleSaveToHistory = async () => {
    setIsSavingHistory(true);
    try {
      await addZakatHistory(db, {
        type: 'emas',
        title: `Zakat Emas (${formatGram(calculationResult.total_weight_gram)})`,
        total_weight: calculationResult.total_weight_gram,
        nishab_threshold: 85,
        is_wajib: calculationResult.is_wajib_zakat ? 1 : 0,
        zakat_rate: 0.025,
        zakat_amount_display: `${formatGram(calculationResult.zakat_weight_gram)} (${formatRupiah(calculationResult.zakat_rupiah)})`,
        zakat_amount_money: calculationResult.zakat_rupiah,
        price_per_unit: calculationResult.gold_price_per_gram,
        haul_date: calculationResult.target_haul_date || undefined,
        notes: `Haul: ${calculationResult.days_elapsed}/${calculationResult.haul_days_threshold} hari (${calculationResult.haul_system})`,
      });
      hapticSuccess();
      Alert.alert('Berhasil', 'Perhitungan zakat emas berhasil disimpan ke dalam Riwayat.');
    } catch {
      Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan riwayat.');
    } finally {
      setIsSavingHistory(false);
    }
  };

  // Selected wallet items for inline drawer/view
  const itemsInSelectedWallet = selectedWalletDetail
    ? goldItems.filter((it) => it.wallet_id === selectedWalletDetail.id)
    : [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.gold}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.gold }]}>
            MODUL PERHITUNGAN
          </Text>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Zakat Emas
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            hapticLight();
            setIsAddWalletVisible(true);
          }}
          style={[styles.addWalletBtn, { backgroundColor: `${theme.colors.gold}20`, borderColor: theme.colors.gold }]}
        >
          <Ionicons name="add" size={18} color={theme.colors.gold} />
          <Text style={[styles.addWalletText, { color: theme.colors.gold }]}>Dompet Baru</Text>
        </TouchableOpacity>
      </View>

      {/* Haul & Nishab Status Banner */}
      <HaulStatusCard
        result={calculationResult}
        onToggleHaulSystem={handleToggleHaulSystem}
      />

      {/* Gold Price Input */}
      <Card elevated style={styles.priceCard}>
        <View style={styles.priceHeaderRow}>
          <View style={styles.priceTitleArea}>
            <Ionicons name="pricetag-outline" size={18} color={theme.colors.gold} />
            <Text style={[styles.priceTitle, { color: theme.colors.textPrimary }]}>
              Harga Emas Hari Ini
            </Text>
          </View>
          <Text style={[styles.priceHelper, { color: theme.colors.textMuted }]}>
            Acuan Antam / Pegadaian
          </Text>
        </View>

        <NumericInput
          value={goldPrice}
          onChangeValue={setGoldPrice}
          prefix="Rp"
          suffix="/ gram"
          goldTheme
          helper="Digunakan untuk konversi nilai zakat 2,5% ke Rupiah"
        />

        {/* Quick price presets */}
        <View style={styles.pricePresetsRow}>
          {[1400000, 1450000, 1500000, 1550000].map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => {
                hapticLight();
                setGoldPrice(p);
              }}
              style={[
                styles.pricePresetChip,
                {
                  backgroundColor: goldPrice === p ? `${theme.colors.gold}25` : theme.colors.surfaceElevated,
                  borderColor: goldPrice === p ? theme.colors.gold : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pricePresetText,
                  { color: goldPrice === p ? theme.colors.gold : theme.colors.textSecondary, fontWeight: goldPrice === p ? '700' : '500' },
                ]}
              >
                {formatRupiah(p)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Result Card (Zakat yang Harus Dikeluarkan) */}
      <Card
        gradient={calculationResult.is_wajib_zakat ? theme.colors.primaryGradient : undefined}
        elevated={!calculationResult.is_wajib_zakat}
        glow={calculationResult.is_wajib_zakat}
        style={styles.resultCard}
      >
        <Text
          style={[
            styles.resultCardTitle,
            { color: calculationResult.is_wajib_zakat ? '#FFFFFF' : theme.colors.textSecondary },
          ]}
        >
          Kewajiban Zakat Emas (Tarif 2,5%)
        </Text>

        <View style={styles.resultMainRow}>
          <Text
            style={[
              styles.resultMoney,
              { color: calculationResult.is_wajib_zakat ? '#FFFFFF' : theme.colors.textPrimary },
            ]}
          >
            {calculationResult.is_wajib_zakat
              ? formatRupiah(calculationResult.zakat_rupiah)
              : 'Rp 0'}
          </Text>
          <Text
            style={[
              styles.resultGram,
              { color: calculationResult.is_wajib_zakat ? 'rgba(255,255,255,0.9)' : theme.colors.gold },
            ]}
          >
            ≈ {formatGram(calculationResult.zakat_weight_gram)}
          </Text>
        </View>

        <Text
          style={[
            styles.resultStatusText,
            { color: calculationResult.is_wajib_zakat ? 'rgba(255,255,255,0.85)' : theme.colors.textMuted },
          ]}
        >
          {calculationResult.is_wajib_zakat
            ? '✅ Syarat Nishab (>= 85g) & Haul (1 tahun) terpenuhi secara sah.'
            : calculationResult.is_nishab
            ? `⏳ Total emas sudah ${formatGram(calculationResult.total_weight_gram)} (>=85g), namun haul baru berjalan ${calculationResult.days_elapsed}/${calculationResult.haul_days_threshold} hari.`
            : `❌ Total emas ${formatGram(calculationResult.total_weight_gram)} belum mencapai nishab 85 gram.`}
        </Text>

        {/* Action Buttons: Simpan & Bagikan */}
        <View style={styles.resultActions}>
          <Button
            title="Simpan Riwayat"
            icon="save-outline"
            variant={calculationResult.is_wajib_zakat ? 'gold' : 'secondary'}
            loading={isSavingHistory}
            onPress={handleSaveToHistory}
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
      </Card>

      {/* Multi-Wallet Management Section */}
      <View style={styles.walletsSection}>
        <View style={styles.walletsHeader}>
          <View>
            <Text style={[styles.walletsTitle, { color: theme.colors.textPrimary }]}>
              Daftar Dompet Penyimpanan Emas
            </Text>
            <Text style={[styles.walletsSub, { color: theme.colors.textSecondary }]}>
              Centang dompet yang ingin disertakan dalam hisab zakat akumulasi
            </Text>
          </View>
        </View>

        {wallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            items={goldItems}
            onToggleActive={handleToggleWallet}
            onPress={(w) => {
              setSelectedWalletDetail(w);
            }}
            onAddItem={(w) => {
              setSelectedWalletForAdd(w);
              setEditingGoldItem(null);
              setIsAddGoldVisible(true);
            }}
          />
        ))}

        {wallets.length === 0 && (
          <View style={[styles.emptyBox, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
            <Ionicons name="wallet-outline" size={32} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Belum ada dompet penyimpanan emas.
            </Text>
            <Button
              title="Buat Dompet Pertama"
              variant="primary"
              onPress={() => setIsAddWalletVisible(true)}
              style={{ marginTop: 10 }}
            />
          </View>
        )}
      </View>

      {/* Items list in selected wallet detail modal / section */}
      {selectedWalletDetail && (
        <Card elevated style={styles.detailBox}>
          <View style={styles.detailHeader}>
            <View style={styles.detailTitleArea}>
              <View style={[styles.detailIcon, { backgroundColor: `${selectedWalletDetail.color}20` }]}>
                <Ionicons
                  name={(selectedWalletDetail.icon as any) || 'wallet'}
                  size={18}
                  color={selectedWalletDetail.color}
                />
              </View>
              <View>
                <Text style={[styles.detailTitle, { color: theme.colors.textPrimary }]}>
                  {selectedWalletDetail.name}
                </Text>
                <Text style={[styles.detailSub, { color: theme.colors.textSecondary }]}>
                  {itemsInSelectedWallet.length} item tersimpan
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setSelectedWalletDetail(null)}
              style={styles.closeDetailBtn}
            >
              <Ionicons name="close-circle-outline" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* List items */}
          {itemsInSelectedWallet.map((item) => (
            <View
              key={item.id}
              style={[styles.itemRow, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>
                  {item.name}
                </Text>
                <Text style={[styles.itemMeta, { color: theme.colors.textSecondary }]}>
                  {item.purity}K • Mulai simpan: {item.purchase_date} ({calculateDaysElapsed(item.purchase_date)} hari)
                </Text>
                {item.notes ? (
                  <Text style={[styles.itemNotes, { color: theme.colors.textMuted }]}>
                    Catatan: {item.notes}
                  </Text>
                ) : null}
              </View>

              <View style={styles.itemRight}>
                <Text style={[styles.itemWeight, { color: theme.colors.gold }]}>
                  {formatGram(item.weight_gram)}
                </Text>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingGoldItem(item);
                      setSelectedWalletForAdd(selectedWalletDetail);
                      setIsAddGoldVisible(true);
                    }}
                    style={styles.itemActionBtn}
                  >
                    <Ionicons name="pencil" size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteGoldItem(item.id)}
                    style={styles.itemActionBtn}
                  >
                    <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {itemsInSelectedWallet.length === 0 && (
            <Text style={[styles.emptyItemsText, { color: theme.colors.textMuted }]}>
              Belum ada emas tercatat di dompet ini.
            </Text>
          )}

          <Button
            title="Tambah Emas ke Dompet Ini"
            icon="add"
            variant="ghost"
            onPress={() => {
              setSelectedWalletForAdd(selectedWalletDetail);
              setEditingGoldItem(null);
              setIsAddGoldVisible(true);
            }}
            style={{ marginTop: 10 }}
          />
        </Card>
      )}

      {/* Bottom spacer for custom tab bar */}
      <View style={{ height: 100 }} />

      {/* Add Wallet Modal */}
      <AddWalletModal
        visible={isAddWalletVisible}
        onClose={() => setIsAddWalletVisible(false)}
        onSave={handleSaveWallet}
      />

      {/* Add/Edit Gold Item Modal */}
      <AddGoldItemModal
        visible={isAddGoldVisible}
        wallets={wallets}
        selectedWalletId={selectedWalletForAdd?.id}
        initialItem={editingGoldItem}
        onClose={() => {
          setIsAddGoldVisible(false);
          setEditingGoldItem(null);
        }}
        onSave={handleSaveGoldItem}
      />

      {/* Share / Export PDF Modal */}
      <ShareModal
        visible={isShareVisible}
        title="Bagikan Hisab Zakat Emas"
        onClose={() => setIsShareVisible(false)}
        onShareWhatsApp={() => {
          const msg = generateGoldWhatsAppMessage(calculationResult);
          shareToWhatsApp(msg);
          setIsShareVisible(false);
        }}
        onExportPdf={async () => {
          await exportGoldPdf(calculationResult);
          setIsShareVisible(false);
        }}
      />
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
    alignItems: 'center',
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
  addWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  addWalletText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceCard: {
    padding: 16,
    marginBottom: 16,
  },
  priceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  priceHelper: {
    fontSize: 11,
  },
  pricePresetsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: -4,
  },
  pricePresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  pricePresetText: {
    fontSize: 11,
  },
  resultCard: {
    padding: 18,
    marginBottom: 20,
    borderRadius: 18,
  },
  resultCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  resultMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  resultMoney: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  resultGram: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultStatusText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
  },
  walletsSection: {
    marginBottom: 16,
  },
  walletsHeader: {
    marginBottom: 12,
  },
  walletsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  walletsSub: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
  },
  detailBox: {
    padding: 16,
    marginBottom: 20,
    borderRadius: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailSub: {
    fontSize: 11,
  },
  closeDetailBtn: {
    padding: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 10,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemWeight: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 6,
  },
  itemActionBtn: {
    padding: 4,
  },
  emptyItemsText: {
    textAlign: 'center',
    paddingVertical: 14,
    fontSize: 12,
  },
});
