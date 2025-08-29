import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, Platform } from 'react-native';
import { createCursorStyle } from '../../theme/crossPlatform';
import { theme } from '../../theme/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {isRequired && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            error && styles.inputError,
            style,
          ]}
          placeholderTextColor="#9ca3af"
          editable={!isDisabled && !isReadOnly}
          {...props}
        />
        
        {rightIcon && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginBottom: theme.margin.lg,
  },
  labelContainer: {
    marginBottom: theme.margin.sm,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.margin.md,
    fontFamily: theme.fontFamily.medium,
    letterSpacing: 0,
  },
  required: {
    color: theme.colors.error,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: theme.borderWidth.thin,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.padding.lg,
    paddingVertical: theme.padding.md,
    fontSize: theme.fontSize.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text.primary,
    borderColor: theme.colors.border.medium,
    minHeight: theme.minHeight.input,
    fontFamily: theme.fontFamily.regular,
    ...createCursorStyle('text'),
  },
  inputWithLeftIcon: {
    paddingLeft: theme.padding.xxxxl + theme.padding.lg,
  },
  inputWithRightIcon: {
    paddingRight: theme.padding.xxxxl + theme.padding.lg,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  leftIcon: {
    position: 'absolute',
    left: theme.padding.lg,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: theme.zIndex.dropdown,
  },
  rightIcon: {
    position: 'absolute',
    right: theme.padding.lg,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: theme.zIndex.dropdown,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.margin.xs,
    marginLeft: theme.margin.xs,
  },
  helperText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.margin.xs,
    marginLeft: theme.margin.xs,
  },
});
