import React, { useState, useMemo } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  helper,
  leftIcon,
  rightIcon,
  style, 
  ...props 
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

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
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceCard,
      borderWidth: 1.5,
      borderColor: error ? theme.colors.danger : isFocused ? theme.colors.primary : theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 48,
    },
    input: {
      ...theme.typography.body,
      flex: 1,
      color: theme.colors.textPrimary,
      paddingVertical: 10,
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
    iconWrap: {
      marginRight: 8,
    },
  }), [theme, isFocused, error]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}>
        {leftIcon && <View style={styles.iconWrap}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helper && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
};
