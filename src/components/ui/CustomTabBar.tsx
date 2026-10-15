import React, { useEffect, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, type Theme } from '@/constants/theme';
import { hapticLight } from '@/utils/haptic';

interface BottomTabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string; params?: object }[];
  };
  descriptors: Record<string, { options: { tabBarAccessibilityLabel?: string; tabBarTestID?: string } }>;
  navigation: {
    emit: (event: any) => any;
    navigate: (name: string, params?: object) => void;
  };
}

const TAB_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }> = {
  index: {
    label: 'Beranda',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  emas: {
    label: 'Zakat Emas',
    icon: 'cube-outline',
    activeIcon: 'cube',
  },
  padi: {
    label: 'Zakat Padi',
    icon: 'leaf-outline',
    activeIcon: 'leaf',
  },
  history: {
    label: 'Riwayat',
    icon: 'file-tray-full-outline',
    activeIcon: 'file-tray-full',
  },
};

const TabBarIcon = ({
  routeName,
  isFocused,
  theme,
}: {
  routeName: string;
  isFocused: boolean;
  theme: Theme;
}) => {
  const scale = useSharedValue(isFocused ? 1.15 : 1);
  const glowOpacity = useSharedValue(isFocused ? 1 : 0);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.7);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.12 : 1, { damping: 14, stiffness: 220 });
    glowOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
    labelOpacity.value = withTiming(isFocused ? 1 : 0.7, { duration: 200 });
  }, [isFocused, scale, glowOpacity, labelOpacity]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 0.8 + glowOpacity.value * 0.2 }],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const config = TAB_CONFIG[routeName] || { label: routeName, icon: 'ellipse-outline', activeIcon: 'ellipse' };
  const isEmas = routeName === 'emas';
  const activeColor = isEmas ? theme.colors.gold : theme.colors.primary;
  const color = isFocused ? activeColor : theme.colors.textMuted;

  return (
    <View style={iconStyles.iconWrap}>
      <Animated.View 
        style={[
          iconStyles.activeGlow, 
          { backgroundColor: isFocused ? `${activeColor}15` : 'transparent' }, 
          animatedGlowStyle
        ]} 
      />
      <Animated.View style={animatedIconStyle}>
        <Ionicons
          name={isFocused ? config.activeIcon : config.icon}
          size={22}
          color={color}
        />
      </Animated.View>
      <Animated.Text style={[iconStyles.label, { color, fontWeight: isFocused ? '700' : '500' }, animatedLabelStyle]}>
        {config.label}
      </Animated.Text>
    </View>
  );
};

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              hapticLight();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <TabBarIcon
                routeName={route.name}
                isFocused={isFocused}
                theme={theme}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const iconStyles = StyleSheet.create({
  iconWrap: {
    width: 64,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    top: 2,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
    marginTop: 3,
  },
});

const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    height: 66,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: 33,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      } as any,
    }),
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
