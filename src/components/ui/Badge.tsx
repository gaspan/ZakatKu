import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type Theme } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ 
  label, 
  color,
  backgroundColor,
  icon,
  size = 'md',
  style 
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const badgeColor = color ?? theme.colors.primary;
  const isSm = size === 'sm';

  return (
    <View style={[
      styles.container, 
      isSm && styles.containerSm,
      { 
        backgroundColor: backgroundColor ?? `${badgeColor}18`, 
        borderColor: `${badgeColor}35` 
      }, 
      style
    ]}>
      {icon && (
        <Ionicons 
          name={icon} 
          size={isSm ? 11 : 13} 
          color={badgeColor} 
          style={styles.icon} 
        />
      )}
      <Text style={[styles.label, isSm && styles.labelSm, { color: badgeColor }]}>{label}</Text>
    </View>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.round,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  containerSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    ...theme.typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  labelSm: {
    fontSize: 10,
    fontWeight: '600',
  },
});
