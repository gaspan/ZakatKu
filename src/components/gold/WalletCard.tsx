import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { Wallet, GoldItem } from '@/types';
import { formatGram } from '@/utils/format';
import { hapticLight } from '@/utils/haptic';

interface WalletCardProps {
  wallet: Wallet;
  items: GoldItem[];
  onToggleActive: (walletId: number, currentActive: boolean) => void;
  onPress: (wallet: Wallet) => void;
  onAddItem: (wallet: Wallet) => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  items,
  onToggleActive,
  onPress,
  onAddItem,
}) => {
  const { theme } = useTheme();
  const isActive = wallet.is_active === 1;

  const totalWeight = items
    .filter((it) => it.wallet_id === wallet.id)
    .reduce((acc, it) => acc + (it.weight_gram || 0), 0);

  const itemCount = items.filter((it) => it.wallet_id === wallet.id).length;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(wallet)}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceCard,
          borderColor: isActive ? wallet.color || theme.colors.primary : theme.colors.border,
          borderLeftWidth: 4,
          borderLeftColor: wallet.color || theme.colors.primary,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <View style={[styles.iconWrap, { backgroundColor: `${wallet.color || theme.colors.primary}18` }]}>
            <Ionicons
              name={(wallet.icon as any) || 'wallet-outline'}
              size={20}
              color={wallet.color || theme.colors.primary}
            />
          </View>
          <View style={styles.nameWrap}>
            <Text style={[styles.name, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {wallet.name}
            </Text>
            {wallet.description ? (
              <Text style={[styles.desc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {wallet.description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Checkbox inclusion toggle */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              backgroundColor: isActive ? theme.colors.primary : 'transparent',
              borderColor: isActive ? theme.colors.primary : theme.colors.textMuted,
            },
          ]}
          onPress={() => {
            hapticLight();
            onToggleActive(wallet.id, isActive);
          }}
          accessibilityLabel={`Sertakan ${wallet.name} dalam hisab zakat`}
        >
          {isActive && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Total Emas</Text>
          <Text style={[styles.statValue, { color: wallet.color || theme.colors.primary }]}>
            {formatGram(totalWeight)}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Text style={[styles.itemCount, { color: theme.colors.textSecondary }]}>
            {itemCount} item tersimpan
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: `${theme.colors.primary}15` }]}
            onPress={(e) => {
              e.stopPropagation();
              hapticLight();
              onAddItem(wallet);
            }}
          >
            <Ionicons name="add" size={16} color={theme.colors.primary} />
            <Text style={[styles.addText, { color: theme.colors.primary }]}>Catat Emas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  nameWrap: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  desc: {
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemCount: {
    fontSize: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
