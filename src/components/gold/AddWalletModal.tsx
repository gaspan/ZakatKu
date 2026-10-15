import React, { useState } from 'react';
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
import { useTheme } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { hapticLight } from '@/utils/haptic';

interface AddWalletModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; icon: string; color: string }) => void;
}

const WALLET_ICONS = [
  'wallet-outline',
  'shield-checkmark-outline',
  'cube-outline',
  'card-outline',
  'sparkles-outline',
  'lock-closed-outline',
  'briefcase-outline',
  'file-tray-outline',
];

const WALLET_COLORS = [
  '#059669', // Emerald
  '#D97706', // Gold
  '#0284C7', // Ocean Blue
  '#7C3AED', // Royal Purple
  '#E11D48', // Ruby
  '#0D9488', // Teal
  '#475569', // Slate
];

export const AddWalletModal: React.FC<AddWalletModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('wallet-outline');
  const [color, setColor] = useState('#059669');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Nama tempat penyimpanan harus diisi');
      return;
    }
    setError('');
    onSave({
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
    });
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
                Tambah Dompet Emas
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Tempat atau akun penyimpanan emas Anda
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Input
              label="Nama Dompet / Tempat Simpan"
              placeholder="Contoh: Brankas Rumah, Pegadaian, Antam Digital"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
              error={error}
            />

            <Input
              label="Keterangan / Catatan (Opsional)"
              placeholder="Contoh: Disimpan di kamar utama, nomor sertifikat..."
              value={description}
              onChangeText={setDescription}
            />

            {/* Icon Picker */}
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Pilih Ikon</Text>
            <View style={styles.pickerRow}>
              {WALLET_ICONS.map((ic) => {
                const isSelected = icon === ic;
                return (
                  <TouchableOpacity
                    key={ic}
                    onPress={() => {
                      hapticLight();
                      setIcon(ic);
                    }}
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor: isSelected ? `${color}20` : theme.colors.surfaceElevated,
                        borderColor: isSelected ? color : theme.colors.border,
                      },
                    ]}
                  >
                    <Ionicons name={ic as any} size={20} color={isSelected ? color : theme.colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Color Picker */}
            <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 14 }]}>Pilih Warna Aksen</Text>
            <View style={styles.pickerRow}>
              {WALLET_COLORS.map((c) => {
                const isSelected = color === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      hapticLight();
                      setColor(c);
                    }}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      isSelected && styles.colorSelected,
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.actionRow}>
            <Button
              title="Batal"
              variant="ghost"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title="Simpan Dompet"
              variant="primary"
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
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
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
});
