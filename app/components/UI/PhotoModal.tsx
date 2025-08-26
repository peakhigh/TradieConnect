import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface PhotoModalProps {
  visible: boolean;
  onClose: () => void;
  photos: string[];
  initialIndex: number;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  visible,
  onClose,
  photos,
  initialIndex
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!visible) return;

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
  }, [visible, photos.length]);

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : photos.length - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev < photos.length - 1 ? prev + 1 : 0);
  };

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
          <Text style={styles.title}>
            {currentIndex + 1} of {photos.length}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Main Image */}
        <View style={styles.mainImageContainer}>
          <Image 
            source={{ uri: photos[currentIndex] }} 
            style={[styles.mainImage, { width: screenWidth, height: screenHeight * 0.6 }]}
            resizeMode="contain"
          />
          
          {/* Navigation Arrows */}
          {photos.length > 1 && (
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
        {photos.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailScroll}
            >
              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnail,
                    currentIndex === index && styles.activeThumbnail
                  ]}
                  onPress={() => setCurrentIndex(index)}
                >
                  <Image source={{ uri: photo }} style={styles.thumbnailImage} />
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
  thumbnailImage: {
    width: 60,
    height: 60,
  },
});