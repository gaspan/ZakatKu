import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme, type Theme } from '@/constants/theme';
import { shouldReduceMotion } from '@/utils/motion';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  gradientColors?: readonly [string, string];
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  color, 
  gradientColors,
  height = 10, 
  style 
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const pct = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const widthSV = useSharedValue(0);

  useEffect(() => {
    widthSV.value = shouldReduceMotion()
      ? pct
      : withTiming(pct, { duration: 600 });
  }, [pct, widthSV]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthSV.value}%` as any,
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <Animated.View
        style={[
          {
            height: '100%',
            borderRadius: height / 2,
            overflow: 'hidden',
          },
          fillStyle,
        ]}
      >
        {gradientColors ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: color ?? theme.colors.primary,
            }}
          />
        )}
      </Animated.View>
    </View>
  );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: theme.colors.track,
    overflow: 'hidden',
  },
});
