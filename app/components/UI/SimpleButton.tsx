import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createCursorStyle } from '../../theme/crossPlatform';
import { theme } from '../../theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

export const SimpleButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  leftIcon,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: theme.minHeight.button,
      ...theme.shadows.md,
      ...createCursorStyle('pointer'),
    };

    const sizeStyle: ViewStyle = {
      small: { paddingHorizontal: theme.padding.md, paddingVertical: theme.padding.sm },
      medium: { paddingHorizontal: theme.padding.lg, paddingVertical: theme.padding.md },
      large: { paddingHorizontal: theme.padding.xl, paddingVertical: theme.padding.lg },
    }[size];

    const variantStyle: ViewStyle = {
      primary: { backgroundColor: theme.colors.primary },
      secondary: { backgroundColor: theme.colors.secondary },
      outline: { 
        backgroundColor: 'transparent',
        borderWidth: theme.borderWidth.medium,
        borderColor: theme.colors.primary,
      },
      danger: { backgroundColor: theme.colors.error },
      success: { backgroundColor: theme.colors.success },
    }[variant];

    const widthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};

    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...widthStyle,
      opacity: disabled ? theme.opacity.disabled : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
      fontFamily: theme.fontFamily.bold,
    };

    const sizeStyle: TextStyle = {
      small: { fontSize: theme.fontSize.sm },
      medium: { fontSize: theme.fontSize.md },
      large: { fontSize: theme.fontSize.lg },
    }[size];

    const variantStyle: TextStyle = {
      primary: { color: theme.colors.text.inverse },
      secondary: { color: theme.colors.text.inverse },
      outline: { color: theme.colors.primary },
      danger: { color: theme.colors.text.inverse },
      success: { color: theme.colors.text.inverse },
    }[variant];

    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
    };
  };

  const getGradientColors = (): string[] => {
    switch (variant) {
      case 'primary':
        return ['#667eea', '#764ba2'];
      case 'secondary':
        return ['#f093fb', '#f5576c'];
      case 'success':
        return ['#4facfe', '#00f2fe'];
      case 'danger':
        return ['#fa709a', '#fee140'];
      default:
        return ['#667eea', '#764ba2'];
    }
  };

  const isGradientVariant = variant !== 'outline';

  if (isGradientVariant) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[getButtonStyle(), style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            borderRadius: theme.borderRadius.lg,
          }}
        />
        {loading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.gap.lg }}>
            {leftIcon}
            <Text style={[getTextStyle(), textStyle]}>
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? '#2563eb' : '#ffffff'} 
          size="small" 
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.gap.lg }}>
          {leftIcon}
          <Text style={[getTextStyle(), textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
