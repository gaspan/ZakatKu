import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme, fonts } from '@/constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  variant = 'primary', 
  icon,
  loading = false, 
  fullWidth = false,
  style,
  disabled,
  ...props 
}) => {
  const { theme } = useTheme();
  const isPrimary = variant === 'primary';
  const isGold = variant === 'gold';
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const styles = useMemo(() => StyleSheet.create({
    button: {
      height: 50,
      borderRadius: theme.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    fullWidth: {
      width: '100%',
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.danger,
    },
    disabled: {
      opacity: 0.45,
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
    },
    text: {
      ...theme.typography.body,
      fontFamily: fonts.semibold,
      fontSize: 15,
      letterSpacing: 0.2,
      color: theme.colors.primary,
    },
    textPrimary: {
      color: theme.colors.textOnPrimary,
    },
    textGold: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    textDanger: {
      color: theme.colors.danger,
    },
    textGhost: {
      color: theme.colors.textSecondary,
    },
  }), [theme]);

  const iconColor = (isPrimary || isGold) ? '#FFFFFF' : variant === 'danger' ? theme.colors.danger : theme.colors.primary;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={(isPrimary || isGold) ? '#FFFFFF' : theme.colors.primary} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={iconColor} />}
          <Text style={[
            styles.text, 
            isPrimary && styles.textPrimary,
            isGold && styles.textGold,
            variant === 'danger' && styles.textDanger,
            variant === 'ghost' && styles.textGhost,
            isDisabled && !isPrimary && !isGold && { color: theme.colors.textSecondary }
          ]}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  const buttonStyle = [
    styles.button,
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && styles.ghost,
    variant === 'danger' && styles.danger,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style
  ];

  if ((isPrimary || isGold) && !isDisabled) {
    const gradientColors = isGold ? theme.colors.goldGradient : theme.colors.primaryGradient;
    const shadowStyle = isGold ? theme.shadow.goldGlow : theme.shadow.glow;
    return (
      <AnimatedTouchable
        activeOpacity={0.88}
        disabled={isDisabled}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        {...props}
        style={[fullWidth ? { width: '100%' } : undefined, animatedStyle, shadowStyle]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, fullWidth && styles.fullWidth, style]}
        >
          {content}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      activeOpacity={0.7}
      disabled={isDisabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[buttonStyle, animatedStyle]}
      {...props}
    >
      {content}
    </AnimatedTouchable>
  );
};
