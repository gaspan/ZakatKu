import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '@/constants/theme';
import { Wallet, GoldItem } from '@/types';
import { Input } from '@/components/ui/Input';
import { NumericInput } from '@/components/ui/NumericInput';
import { Button } from '@/components/ui/Button';
import { hapticLight } from '@/utils/haptic';

interface AddGoldItemModalProps {
  visible: boolean;
  wallets: Wallet[];
  selectedWalletId?: number;
  initialItem?: GoldItem | null;
  onClose: () => void;
  onSave: (data: {
    wallet_id: number;
    name: string;
    weight_gram: number;
    purity: number;
    purchase_date: string;
    notes: string;
  }) => void;
}

const PURITY_OPTIONS = [
  { label: '24K (99.9%)', value: 24 },
  { label: '22K (91.6%)', value: 22 },
  { label: '18K (75.0%)', value: 18 },
  { label: '14K (58.3%)', value: 14 },
];

export const AddGoldItemModal: React.FC<AddGoldItemModalProps> = ({
  visible,
  wallets,
  selectedWalletId,
  initialItem,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();

  const [walletId, setWalletId] = useState<number>(wallets[0]?.id || 1);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState<number>(0);
  const [purity, setPurity] = useState<number>(24);
  const [purchaseDate, setPurchaseDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialItem) {
      setWalletId(initialItem.wallet_id);
      setName(initialItem.name);
      setWeight(initialItem.weight_gram);
      setPurity(initialItem.purity || 24);
      setPurchaseDate(initialItem.purchase_date || dayjs().format('YYYY-MM-DD'));
      setNotes(initialItem.notes || '');
    } else {
      if (selectedWalletId) setWalletId(selectedWalletId);
      setName('');
      setWeight(0);
      setPurity(24);
      setPurchaseDate(dayjs().format('YYYY-MM-DD'));
      setNotes('');
    }
    setError('');
  }, [initialItem, selectedWalletId, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Nama atau jenis emas harus diisi');
      return;
    }
    if (weight <= 0) {
      setError('Berat emas harus lebih dari 0 gram');
      return;
    }
    if (!purchaseDate) {
      setError('Tanggal kepemilikan awal harus diisi untuk hisab haul');
      return;
    }

    onSave({
      wallet_id: walletId,
      name: name.trim(),
      weight_gram: weight,
      purity,
      purchase_date: purchaseDate,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.modalCard, { backgroundColor: theme.colors.surfaceCard, borderColor: theme.colors.border }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                {initialItem ? 'Ubah Catatan Emas' : 'Tambah Catatan Emas'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Masukkan berat & tanggal awal untuk hisab haul
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            {/* Wallet Selection */}
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Pilih Dompet Penyimpanan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
              {wallets.map((w) => {
                const isSelected = walletId === w.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => {
                      hapticLight();
                      setWalletId(w.id);
                    }}
                    style={[
                      styles.walletChip,
                      {
                        backgroundColor: isSelected ? `${w.color}20` : theme.colors.surfaceElevated,
                        borderColor: isSelected ? w.color : theme.colors.border,
                      },
                    ]}
                  >
                    <Ionicons name={(w.icon as any) || 'wallet-outline'} size={14} color={isSelected ? w.color : theme.colors.textSecondary} />
                    <Text style={[styles.walletChipText, { color: isSelected ? w.color : theme.colors.textSecondary, fontWeight: isSelected ? '700' : '500' }]}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Item Name */}
            <Input
              label="Nama / Keterangan Emas"
              placeholder="Contoh: Logam Mulia Antam 50g, Cincin Kawin..."
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
              error={error && !name.trim() ? error : undefined}
            />

            {/* Weight */}
            <NumericInput
              label="Berat Emas (Gram)"
              value={weight}
              onChangeValue={(v) => {
                setWeight(v);
                if (error) setError('');
              }}
              suffix="gram"
              allowDecimal
              helper="Bisa desimal, contoh: 10.5 atau 25"
              error={error && weight <= 0 ? error : undefined}
            />

            {/* Purity / Kadar */}
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Kadar Emas (Opsional, Default 24K)</Text>
            <View style={styles.purityRow}>
              {PURITY_OPTIONS.map((opt) => {
                const isSelected = purity === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      hapticLight();
                      setPurity(opt.value);
                    }}
                    style={[
                      styles.purityChip,
                      {
                        backgroundColor: isSelected ? `${theme.colors.gold}20` : theme.colors.surfaceElevated,
                        borderColor: isSelected ? theme.colors.gold : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.purityText,
                        { color: isSelected ? theme.colors.gold : theme.colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Purchase Date / Tanggal Awal */}
            <Input
              label="Tanggal Kepemilikan Awal (YYYY-MM-DD)"
              placeholder="Contoh: 2025-01-15"
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              helper="Digunakan untuk menghitung sisa hari menuju Haul zakat"
              leftIcon={<Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />}
            />

            {/* Quick date presets */}
            <View style={styles.datePresetsRow}>
              <TouchableOpacity
                style={[styles.datePresetChip, { backgroundColor: theme.colors.surfaceElevated }]}
                onPress={() => {
                  hapticLight();
                  setPurchaseDate(dayjs().subtract(1, 'year').format('YYYY-MM-DD'));
                }}
              >
                <Text style={[styles.datePresetText, { color: theme.colors.primary }]}>1 Tahun Lalu (Haul Genap)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePresetChip, { backgroundColor: theme.colors.surfaceElevated }]}
                onPress={() => {
                  hapticLight();
                  setPurchaseDate(dayjs().subtract(6, 'month').format('YYYY-MM-DD'));
                }}
              >
                <Text style={[styles.datePresetText, { color: theme.colors.textSecondary }]}>6 Bulan Lalu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePresetChip, { backgroundColor: theme.colors.surfaceElevated }]}
                onPress={() => {
                  hapticLight();
                  setPurchaseDate(dayjs().format('YYYY-MM-DD'));
                }}
              >
                <Text style={[styles.datePresetText, { color: theme.colors.textSecondary }]}>Hari Ini</Text>
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <Input
              label="Catatan Tambahan (Opsional)"
              placeholder="Contoh: Nomor seri sertifikat LBMA / kwitansi beli"
              value={notes}
              onChangeText={setNotes}
            />
          </ScrollView>

          <View style={styles.actionRow}>
            <Button
              title="Batal"
              variant="ghost"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title={initialItem ? 'Perbarui' : 'Simpan Emas'}
              variant="gold"
              onPress={handleSave}
              style={{ flex: 1.5 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  walletScroll: {
    marginBottom: 14,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 8,
  },
  walletChipText: {
    fontSize: 12,
  },
  purityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  purityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  purityText: {
    fontSize: 12,
  },
  datePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
    marginTop: -8,
  },
  datePresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  datePresetText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
});
