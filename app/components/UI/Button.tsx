import React from 'react';
import { Pressable, ActivityIndicator } from 'react-native';
import { Box, Text, HStack, Spinner } from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
}) => {
  const getButtonStyles = () => {
    const baseStyles = {
      borderRadius: '$lg',
      alignItems: 'center',
      justifyContent: 'center',
      shadow: '$md',
      elevation: 3,
    };

    const sizeStyles = {
      small: { px: '$3', py: '$2' },
      medium: { px: '$4', py: '$3' },
      large: { px: '$6', py: '$4' },
    };

    const variantStyles = {
      primary: {
        bg: '$primary600',
        borderWidth: 0,
      },
      secondary: {
        bg: '$secondary600',
        borderWidth: 0,
      },
      outline: {
        bg: 'transparent',
        borderWidth: 2,
        borderColor: '$primary600',
      },
      danger: {
        bg: '$error600',
        borderWidth: 0,
      },
      success: {
        bg: '$success600',
        borderWidth: 0,
      },
    };

    const widthStyles = fullWidth ? { width: '100%' } : {};

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...widthStyles,
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyles = () => {
    const baseStyles = {
      fontWeight: '$bold',
      textAlign: 'center',
    };

    const sizeStyles = {
      small: { size: 'sm' },
      medium: { size: 'md' },
      large: { size: 'lg' },
    };

    const variantStyles = {
      primary: { color: '$white' },
      secondary: { color: '$white' },
      outline: { color: '$primary600' },
      danger: { color: '$white' },
      success: { color: '$white' },
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getGradientColors = () => {
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

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Box {...getButtonStyles()}>
        {isGradientVariant ? (
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
              borderRadius: 8,
            }}
          />
        ) : null}
        
        <HStack space="sm" alignItems="center">
          {loading ? (
            <Spinner size="small" color={variant === 'outline' ? '$primary600' : '$white'} />
          ) : (
            <>
              {leftIcon && <Box>{leftIcon}</Box>}
              <Text {...getTextStyles()}>{title}</Text>
              {rightIcon && <Box>{rightIcon}</Box>}
            </>
          )}
        </HStack>
      </Box>
    </Pressable>
  );
};
