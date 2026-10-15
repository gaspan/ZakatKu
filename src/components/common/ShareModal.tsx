import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { hapticLight } from '@/utils/haptic';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShareWhatsApp: () => void;
  onExportPdf: () => void;
  loading?: boolean;
  title?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  onShareWhatsApp,
  onExportPdf,
  loading = false,
  title = 'Bagikan Hasil Perhitungan',
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.surfaceCard, borderColor: theme.colors.border }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Kirim ringkasan hisab ke muzakki, amil, atau simpan sebagai dokumen PDF
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Sedang memproses dokumen...
              </Text>
            </View>
          ) : (
            <View style={styles.optionsWrap}>
              {/* WhatsApp Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  hapticLight();
                  onShareWhatsApp();
                }}
                style={[styles.optionItem, { backgroundColor: '#25D366' }]}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>Kirim ke WhatsApp</Text>
                  <Text style={styles.optionDesc}>Pesan teks rapi siap kirim ke kontak/grup</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              {/* PDF Export Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  hapticLight();
                  onExportPdf();
                }}
                style={[styles.optionItem, { backgroundColor: theme.colors.primary }]}
              >
                <Ionicons name="document-text-outline" size={24} color="#FFFFFF" />
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>Cetak / Ekspor PDF Resmi</Text>
                  <Text style={styles.optionDesc}>Lembar hisab zakat berformat kwitansi formal</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          <Button
            title="Tutup"
            variant="ghost"
            onPress={onClose}
            style={{ marginTop: 14 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
  optionsWrap: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 14,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  loadingWrap: {
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
});
