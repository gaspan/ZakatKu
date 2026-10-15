import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme, type Theme } from '@/constants/theme';
import { hapticLight } from '@/utils/haptic';

interface SegmentTabsProps {
  options: { key: string; label: string; icon?: string }[];
  value: string;
  onChange: (key: string) => void;
  goldAccent?: boolean;
}

export const SegmentTabs: React.FC<SegmentTabsProps> = ({ 
  options, 
  value, 
  onChange,
  goldAccent = false,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const indicatorX = useSharedValue(0);
  const tabWidth = useSharedValue(0);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});

  const updateIndicator = useCallback((key: string) => {
    const layout = tabLayouts.current[key];
    if (layout && layout.width > 0) {
      indicatorX.value = withSpring(layout.x, { damping: 20, stiffness: 220 });
      tabWidth.value = withSpring(layout.width, { damping: 20, stiffness: 220 });
    }
  }, [indicatorX, tabWidth]);

  useEffect(() => {
    updateIndicator(value);
  }, [value, updateIndicator]);

  const handlePress = useCallback((key: string) => {
    if (key !== value) {
      hapticLight();
      updateIndicator(key);
      onChange(key);
    }
  }, [value, onChange, updateIndicator]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: tabWidth.value > 0 ? tabWidth.value : `${100 / options.length}%` as any,
  }));

  const gradientColors = goldAccent ? theme.colors.goldGradient : theme.colors.primaryGradient;

  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.indicator, indicatorStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.indicatorGradient}
        />
      </Animated.View>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            style={styles.item}
            activeOpacity={0.8}
            onPress={() => handlePress(o.key)}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              tabLayouts.current[o.key] = { x, width };
              if (o.key === value) {
                updateIndicator(value);
              }
            }}
            accessibilityRole="button"
          >
            <Text style={[styles.text, active && styles.textActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: 4,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    zIndex: 0,
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: theme.radius.sm,
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    zIndex: 1,
  },
  text: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  textActive: { 
    color: theme.colors.textOnPrimary, 
    fontWeight: '700' 
  },
});
