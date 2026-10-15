import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAppDb } from '@/lib/dbProvider';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, ThemePreference } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SegmentTabs } from '@/components/ui/SegmentTabs';
import { NumericInput } from '@/components/ui/NumericInput';
import {
  getZakatHistory,
  deleteZakatHistory,
  clearAllZakatHistory,
} from '@/lib/database';
import { getSettings, updateSettings } from '@/lib/storage';
import { ZakatHistoryItem, AppSettings, HaulSystem } from '@/types';
import { formatRupiah, formatDateIndo } from '@/utils/format';
import { DALIL_LIST, FIQIH_SUMMARY } from '@/constants/dalil';
import { sendTestNotification } from '@/lib/notifications';
import { shareToWhatsApp } from '@/lib/shareService';
import { hapticLight, hapticSuccess } from '@/utils/haptic';

export default function HistoryAndSettingsScreen() {
  const { theme, themePreference, setThemePreference } = useTheme();
  const db = useAppDb();

  const [mainTab, setMainTab] = useState<'history' | 'settings'>('history');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'emas' | 'padi'>('all');
  const [historyList, setHistoryList] = useState<ZakatHistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const typeFilter = historyFilter === 'all' ? undefined : historyFilter;
      const [hList, s] = await Promise.all([
        getZakatHistory(db, typeFilter),
        getSettings(),
      ]);
      setHistoryList(hList);
      setSettings(s);
    } catch (e) {
      console.warn('Error loading history & settings', e);
    }
  }, [db, historyFilter]);

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

  const handleDeleteHistory = (id: number) => {
    Alert.alert('Hapus Catatan', 'Apakah Anda yakin ingin menghapus catatan hisab ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteZakatHistory(db, id);
          hapticLight();
          await loadData();
        },
      },
    ]);
  };

  const handleClearAllHistory = () => {
    Alert.alert(
      'Hapus Semua Riwayat',
      'Seluruh riwayat perhitungan zakat akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            await clearAllZakatHistory(db);
            hapticLight();
            await loadData();
          },
        },
      ]
    );
  };

  const handleShareHistoryItem = (item: ZakatHistoryItem) => {
    const text = `*LEMBAR HISAB ZAKATKU — ${item.title}*
Tanggal: ${formatDateIndo(item.created_at)}
Status: ${item.is_wajib === 1 ? 'WAJIB ZAKAT' : 'BELUM WAJIB ZAKAT / SUNNAH'}
Kewajiban Zakat: ${item.zakat_amount_display}
Nilai Rupiah: ${formatRupiah(item.zakat_amount_money)}
Keterangan: ${item.notes || '-'}
------------------------------------
Dihitung dengan aplikasi ZakatKu (Emas & Tani)`;

    shareToWhatsApp(text);
  };

  const handleUpdateHaulSystem = async (sys: HaulSystem) => {
    hapticLight();
    const updated = await updateSettings({ haul_system: sys });
    setSettings(updated);
  };

  const handleUpdatePrice = async (key: 'default_gold_price' | 'default_gkg_price' | 'default_beras_price', val: number) => {
    const updated = await updateSettings({ [key]: val });
    setSettings(updated);
  };

  const handleToggleReminder = async (val: boolean) => {
    hapticLight();
    const updated = await updateSettings({ reminder_enabled: val });
    setSettings(updated);
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
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={[styles.headerSubtitle, { color: theme.colors.primary }]}>
          ARSIP & KONFIGURASI
        </Text>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Riwayat & Pengaturan
        </Text>
      </View>

      {/* Main Switcher: Riwayat vs Pengaturan */}
      <SegmentTabs
        options={[
          { key: 'history', label: 'Riwayat Hisab' },
          { key: 'settings', label: 'Pengaturan & Fiqih' },
        ]}
        value={mainTab}
        onChange={(k) => setMainTab(k as any)}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: RIWAYAT HISAB                                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainTab === 'history' && (
        <View>
          {/* Subfilter: Semua / Emas / Padi */}
          <View style={styles.filterRow}>
            {(['all', 'emas', 'padi'] as const).map((f) => {
              const isSelected = historyFilter === f;
              const label = f === 'all' ? 'Semua' : f === 'emas' ? 'Zakat Emas' : 'Zakat Padi';
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => {
                    hapticLight();
                    setHistoryFilter(f);
                  }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? `${theme.colors.primary}20` : theme.colors.surfaceElevated,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: isSelected ? theme.colors.primary : theme.colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* List Riwayat */}
          {historyList.map((item) => {
            const isEmas = item.type === 'emas';
            const isWajib = item.is_wajib === 1;

            return (
              <Card key={item.id} elevated style={styles.historyCard}>
                <View style={styles.historyCardHeader}>
                  <View style={styles.historyHeaderLeft}>
                    <View
                      style={[
                        styles.historyIconCircle,
                        { backgroundColor: isEmas ? `${theme.colors.gold}20` : `${theme.colors.primary}20` },
                      ]}
                    >
                      <Ionicons
                        name={isEmas ? 'cube' : 'leaf'}
                        size={20}
                        color={isEmas ? theme.colors.gold : theme.colors.primary}
                      />
                    </View>
                    <View>
                      <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.cardDate, { color: theme.colors.textMuted }]}>
                        {formatDateIndo(item.created_at)}
                      </Text>
                    </View>
                  </View>

                  <Badge
                    label={isWajib ? 'Wajib Zakat' : 'Sunnah Infaq'}
                    color={isWajib ? theme.colors.primary : theme.colors.warning}
                    size="sm"
                  />
                </View>

                {/* Zakat amount breakdown */}
                <View style={[styles.historyBody, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: theme.colors.textMuted }]}>
                      Zakat Dikeluarkan
                    </Text>
                    <Text style={[styles.historyVal, { color: isEmas ? theme.colors.gold : theme.colors.primary }]}>
                      {item.zakat_amount_display}
                    </Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={[styles.historyLabel, { color: theme.colors.textMuted }]}>
                      Nilai Rupiah (Qimah)
                    </Text>
                    <Text style={[styles.historyMoney, { color: theme.colors.textPrimary }]}>
                      {formatRupiah(item.zakat_amount_money)}
                    </Text>
                  </View>
                  {item.notes ? (
                    <Text style={[styles.historyNotes, { color: theme.colors.textSecondary }]}>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>

                {/* Actions */}
                <View style={styles.historyCardActions}>
                  <TouchableOpacity
                    onPress={() => handleShareHistoryItem(item)}
                    style={[styles.smallActionBtn, { backgroundColor: `${theme.colors.primary}15` }]}
                  >
                    <Ionicons name="share-social-outline" size={14} color={theme.colors.primary} />
                    <Text style={[styles.smallActionText, { color: theme.colors.primary }]}>Bagikan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteHistory(item.id)}
                    style={[styles.smallActionBtn, { backgroundColor: `${theme.colors.danger}15` }]}
                  >
                    <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
                    <Text style={[styles.smallActionText, { color: theme.colors.danger }]}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}

          {historyList.length === 0 && (
            <View style={[styles.emptyBox, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
              <Ionicons name="receipt-outline" size={36} color={theme.colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                Belum Ada Riwayat Perhitungan
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.textSecondary }]}>
                Hasil perhitungan dari modul Zakat Emas dan Zakat Padi yang disimpan akan muncul di sini.
              </Text>
            </View>
          )}

          {historyList.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAllHistory}
              style={styles.clearAllBtn}
            >
              <Ionicons name="trash-bin-outline" size={16} color={theme.colors.danger} />
              <Text style={[styles.clearAllText, { color: theme.colors.danger }]}>
                Kosongkan Semua Riwayat
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: PENGATURAN & FIQIH                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainTab === 'settings' && (
        <View>
          {/* Section: Preferensi Hisab Emas */}
          <Card elevated style={styles.settingCard}>
            <View style={styles.settingCardHeader}>
              <Ionicons name="sparkles" size={18} color={theme.colors.gold} />
              <Text style={[styles.settingCardTitle, { color: theme.colors.textPrimary }]}>
                Preferensi Hisab Emas
              </Text>
            </View>

            <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>
              Metode Perhitungan Haul:
            </Text>
            <View style={styles.haulOptionsRow}>
              <TouchableOpacity
                onPress={() => handleUpdateHaulSystem('hijri')}
                style={[
                  styles.haulOption,
                  {
                    backgroundColor: settings?.haul_system === 'hijri' ? `${theme.colors.primary}20` : theme.colors.surfaceElevated,
                    borderColor: settings?.haul_system === 'hijri' ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.haulOptionTitle, { color: theme.colors.textPrimary }]}>
                  Tahun Hijriah (354 Hari)
                </Text>
                <Text style={[styles.haulOptionSub, { color: theme.colors.textSecondary }]}>
                  Standar mayoritas jumhur ulama fikih
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleUpdateHaulSystem('masehi')}
                style={[
                  styles.haulOption,
                  {
                    backgroundColor: settings?.haul_system === 'masehi' ? `${theme.colors.primary}20` : theme.colors.surfaceElevated,
                    borderColor: settings?.haul_system === 'masehi' ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.haulOptionTitle, { color: theme.colors.textPrimary }]}>
                  Tahun Masehi (365 Hari)
                </Text>
                <Text style={[styles.haulOptionSub, { color: theme.colors.textSecondary }]}>
                  Standar kalender matahari Gregorian
                </Text>
              </TouchableOpacity>
            </View>

            <NumericInput
              label="Harga Default Emas (Rp / gram)"
              value={settings?.default_gold_price || 1450000}
              onChangeValue={(v) => handleUpdatePrice('default_gold_price', v)}
              prefix="Rp"
              suffix="/ gram"
              goldTheme
              helper="Nilai awal yang otomatis termuat saat membuka modul emas"
            />
          </Card>

          {/* Section: Preferensi Zakat Pertanian */}
          <Card elevated style={styles.settingCard}>
            <View style={styles.settingCardHeader}>
              <Ionicons name="leaf" size={18} color={theme.colors.primary} />
              <Text style={[styles.settingCardTitle, { color: theme.colors.textPrimary }]}>
                Preferensi Pertanian Padi
              </Text>
            </View>

            <NumericInput
              label="Default Harga Gabah GKG (Rp / kg)"
              value={settings?.default_gkg_price || 7500}
              onChangeValue={(v) => handleUpdatePrice('default_gkg_price', v)}
              prefix="Rp"
              suffix="/ kg GKG"
            />

            <NumericInput
              label="Default Harga Beras (Rp / kg)"
              value={settings?.default_beras_price || 15000}
              onChangeValue={(v) => handleUpdatePrice('default_beras_price', v)}
              prefix="Rp"
              suffix="/ kg Beras"
            />
          </Card>

          {/* Section: Notifikasi & Tema */}
          <Card elevated style={styles.settingCard}>
            <View style={styles.settingCardHeader}>
              <Ionicons name="notifications-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.settingCardTitle, { color: theme.colors.textPrimary }]}>
                Notifikasi & Tampilan
              </Text>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.switchTitle, { color: theme.colors.textPrimary }]}>
                  Pengingat Otomatis Haul Emas
                </Text>
                <Text style={[styles.switchSub, { color: theme.colors.textSecondary }]}>
                  Beri notifikasi saat simpanan emas mencapai nishab dan genap 1 tahun
                </Text>
              </View>
              <Switch
                value={settings?.reminder_enabled ?? true}
                onValueChange={handleToggleReminder}
                trackColor={{ false: theme.colors.track, true: theme.colors.primary }}
              />
            </View>

            <Button
              title="Uji Coba Kirim Notifikasi"
              variant="secondary"
              icon="notifications"
              onPress={sendTestNotification}
              style={{ marginTop: 10, marginBottom: 16 }}
            />

            <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>
              Mode Tampilan (Tema):
            </Text>
            <View style={styles.themeRow}>
              {(['light', 'dark', 'system'] as const).map((mode) => {
                const isSelected = themePreference === mode;
                const label = mode === 'light' ? 'Terang' : mode === 'dark' ? 'Gelap' : 'Sistem';
                const icon = mode === 'light' ? 'sunny-outline' : mode === 'dark' ? 'moon-outline' : 'phone-portrait-outline';

                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => {
                      hapticLight();
                      setThemePreference(mode as ThemePreference);
                    }}
                    style={[
                      styles.themeBtn,
                      {
                        backgroundColor: isSelected ? `${theme.colors.primary}20` : theme.colors.surfaceElevated,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={icon as any}
                      size={16}
                      color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.themeBtnText,
                        { color: isSelected ? theme.colors.primary : theme.colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Section: Fiqih & Dalil Zakat */}
          <Card elevated style={styles.settingCard}>
            <View style={styles.settingCardHeader}>
              <Ionicons name="book-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.settingCardTitle, { color: theme.colors.textPrimary }]}>
                Ringkasan Fiqih & Dalil Zakat
              </Text>
            </View>

            <View style={[styles.fiqihBox, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
              <Text style={[styles.fiqihTopic, { color: theme.colors.gold }]}>
                1. Zakat Emas (Simpanan / Perhiasan Non-Rutin)
              </Text>
              <Text style={[styles.fiqihText, { color: theme.colors.textPrimary }]}>
                • Nishab: {FIQIH_SUMMARY.emas.nishab}{'\n'}
                • Haul: {FIQIH_SUMMARY.emas.haul}{'\n'}
                • Kadar Zakat: {FIQIH_SUMMARY.emas.rate}{'\n'}
                • Ketentuan: {FIQIH_SUMMARY.emas.syarat}
              </Text>
            </View>

            <View style={[styles.fiqihBox, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
              <Text style={[styles.fiqihTopic, { color: theme.colors.primary }]}>
                2. Zakat Pertanian (Padi / Gabah)
              </Text>
              <Text style={[styles.fiqihText, { color: theme.colors.textPrimary }]}>
                • Nishab: {FIQIH_SUMMARY.padi.nishab}{'\n'}
                • Haul: {FIQIH_SUMMARY.padi.haul}{'\n'}
                • Kadar Zakat: {FIQIH_SUMMARY.padi.rate}{'\n'}
                • Ketentuan: {FIQIH_SUMMARY.padi.syarat}
              </Text>
            </View>

            <Text style={[styles.aboutText, { color: theme.colors.textMuted }]}>
              Aplikasi ZakatKu (Emas & Tani) dirancang sesuai pedoman Fiqih Zakat kontemporer dan standar Badan Amil Zakat Nasional (BAZNAS).
            </Text>
          </Card>
        </View>
      )}

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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
  },
  historyCard: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  historyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardDate: {
    fontSize: 11,
    marginTop: 2,
  },
  historyBody: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    gap: 4,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLabel: {
    fontSize: 11,
  },
  historyVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyMoney: {
    fontSize: 14,
    fontWeight: '800',
  },
  historyNotes: {
    fontSize: 10,
    marginTop: 4,
  },
  historyCardActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  smallActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyBox: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  settingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  settingCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  haulOptionsRow: {
    gap: 8,
    marginBottom: 14,
  },
  haulOption: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  haulOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  haulOptionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 12,
  },
  fiqihBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  fiqihTopic: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  fiqihText: {
    fontSize: 12,
    lineHeight: 18,
  },
  aboutText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 15,
  },
});
