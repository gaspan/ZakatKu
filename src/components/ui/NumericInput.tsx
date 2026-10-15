import React, { useState, useMemo, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';
import { formatRupiahNumberOnly } from '@/utils/format';

interface NumericInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  label?: string;
  error?: string;
  helper?: string;
  value: number;
  onChangeValue: (val: number) => void;
  prefix?: string; // e.g. 'Rp'
  suffix?: string; // e.g. 'gram' or 'kg'
  allowDecimal?: boolean;
  goldTheme?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({ 
  label, 
  error, 
  helper,
  value, 
  onChangeValue, 
  prefix,
  suffix,
  allowDecimal = false,
  goldTheme = false,
  style, 
  ...props 
}) => {
  const { theme } = useTheme();
  const [internalText, setInternalText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  // Sync internalText from value prop when not focused
  useEffect(() => {
    if (!isFocused) {
      if (value === 0) {
        setInternalText('');
      } else if (allowDecimal) {
        setInternalText(value.toString());
      } else {
        setInternalText(formatRupiahNumberOnly(value));
      }
    }
  }, [value, isFocused, allowDecimal]);

  const handleChangeText = (text: string) => {
    if (allowDecimal) {
      // Replace comma with dot
      const normalized = text.replace(',', '.');
      // Allow only numbers and one dot
      const clean = normalized.replace(/[^0-9.]/g, '');
      const parts = clean.split('.');
      const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
      
      setInternalText(sanitized);
      const parsed = parseFloat(sanitized);
      onChangeValue(isNaN(parsed) ? 0 : parsed);
    } else {
      const numericStr = text.replace(/[^0-9]/g, '');
      const num = parseInt(numericStr, 10);
      const safeNum = isNaN(num) ? 0 : num;
      setInternalText(safeNum === 0 ? '' : formatRupiahNumberOnly(safeNum));
      onChangeValue(safeNum);
    }
  };

  const primaryColor = goldTheme ? theme.colors.gold : theme.colors.primary;
  const gradientColors = goldTheme ? theme.colors.goldGradient : theme.colors.primaryGradient;

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: focusAnim.value === 1
      ? primaryColor
      : error ? theme.colors.danger : theme.colors.border,
    shadowColor: primaryColor,
    shadowOpacity: focusAnim.value * 0.15,
    shadowRadius: focusAnim.value * 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: focusAnim.value * 4,
  }));

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      ...theme.typography.bodySmall,
      fontWeight: '600',
      marginBottom: 6,
      color: theme.colors.textSecondary,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceCard,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.sm,
      height: 60,
    },
    prefixContainer: {
      borderRadius: theme.radius.sm,
      marginRight: theme.spacing.sm,
      overflow: 'hidden',
    },
    prefixGradient: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radius.sm,
    },
    prefix: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    suffix: {
      ...theme.typography.body,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      paddingHorizontal: theme.spacing.sm,
    },
    input: {
      ...theme.typography.h2,
      flex: 1,
      paddingVertical: 0,
      fontSize: 22,
      color: theme.colors.textPrimary,
    },
    errorText: {
      ...theme.typography.caption,
      color: theme.colors.danger,
      marginTop: 4,
    },
    helperText: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputContainer, animatedBorder, style as any]}>
        {prefix && (
          <View style={styles.prefixContainer}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.prefixGradient}
            >
              <Text style={styles.prefix}>{prefix}</Text>
            </LinearGradient>
          </View>
        )}
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType={allowDecimal ? 'decimal-pad' : 'numeric'}
          value={internalText}
          onChangeText={handleChangeText}
          onFocus={(e) => {
            setIsFocused(true);
            focusAnim.value = withTiming(1, { duration: 200 });
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            focusAnim.value = withTiming(0, { duration: 200 });
            props.onBlur?.(e);
          }}
          {...props}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helper && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
};
