import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Platform } from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ThumbnailImage } from './ThumbnailImage';

interface ImageViewerProps {
  visible: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  onClose,
  images,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          goToPrevious();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          goToNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [visible, images.length]);

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
  };

  if (!visible || images.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Main Image */}
        <View style={styles.mainImageContainer}>
          <ThumbnailImage
            uri={images[currentIndex]}
            size={Math.min(screenWidth * 0.9, screenHeight * 0.6)}
            style={styles.mainImage}
          />
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <TouchableOpacity style={styles.prevButton} onPress={goToPrevious}>
                <ChevronLeft size={32} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={goToNext}>
                <ChevronRight size={32} color="#ffffff" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Thumbnails */}
        {images.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailScroll}
            >
              {images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnail,
                    currentIndex === index && styles.activeThumbnail
                  ]}
                  onPress={() => setCurrentIndex(index)}
                >
                  <ThumbnailImage uri={image} size={60} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  mainImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mainImage: {
    borderRadius: 8,
  },
  prevButton: {
    position: 'absolute',
    left: 20,
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  nextButton: {
    position: 'absolute',
    right: 20,
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  thumbnailContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  thumbnailScroll: {
    paddingHorizontal: 10,
    gap: 8,
  },
  thumbnail: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#3b82f6',
  },
});