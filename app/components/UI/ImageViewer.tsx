import React, { useState, useEffect } from 'react';
import { View, Image, Text, Modal, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Platform, Linking } from 'react-native';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react-native';
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

  const handleDownload = async () => {
    const imageUrl = images[currentIndex];
    if (!imageUrl) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Web: fetch the image as a blob and trigger a download via anchor element
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `image_${currentIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Fallback: open in new tab if blob download fails (e.g. CORS)
        window.open(imageUrl, '_blank');
      }
    } else {
      // Native: open the image URL which allows the user to save from their browser/viewer
      try {
        await Linking.openURL(imageUrl);
      } catch (err) {
        console.error('Failed to open image URL:', err);
      }
    }
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
          <Text style={styles.counter}>
            {currentIndex + 1} of {images.length}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleDownload} style={styles.headerButton} accessibilityLabel="Download image">
              <Download size={22} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.headerButton} accessibilityLabel="Close image viewer">
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Image */}
        <View style={styles.mainImageContainer}>
          <Image
            source={{ uri: images[currentIndex] }}
            style={[
              styles.mainImage,
              { width: screenWidth * 0.9, height: screenHeight * 0.6 }
            ]}
            resizeMode="contain"
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  counter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
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