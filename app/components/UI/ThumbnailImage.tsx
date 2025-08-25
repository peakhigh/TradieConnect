import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';

interface ThumbnailImageProps {
  uri: string;
  size?: number;
  onPress?: () => void;
  style?: any;
}

export const ThumbnailImage: React.FC<ThumbnailImageProps> = ({
  uri,
  size = 40,
  onPress,
  style
}) => {
  const borderRadius = size > 100 ? 12 : 4;
  
  const containerStyle = [
    styles.container,
    { width: size, height: size, borderRadius },
    style
  ];

  const imageStyle = [
    styles.image,
    { width: size, height: size, borderRadius }
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress}>
        <Image source={{ uri }} style={imageStyle} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={containerStyle}>
      <Image source={{ uri }} style={imageStyle} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  image: {
    borderRadius: 4,
  },
});