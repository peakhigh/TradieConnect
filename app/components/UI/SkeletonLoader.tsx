import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'profile';
  count?: number;
}

const SkeletonCard = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={[styles.skeleton, styles.title]} />
      <View style={[styles.skeleton, styles.badge]} />
    </View>
    <View style={[styles.skeleton, styles.description]} />
    <View style={[styles.skeleton, styles.meta]} />
    <View style={styles.buttonRow}>
      <View style={[styles.skeleton, styles.button]} />
      <View style={[styles.skeleton, styles.button]} />
      <View style={[styles.skeleton, styles.button]} />
    </View>
  </View>
);

const SkeletonList = () => (
  <View style={styles.listItem}>
    <View style={[styles.skeleton, styles.listTitle]} />
    <View style={[styles.skeleton, styles.listSubtitle]} />
    <View style={[styles.skeleton, styles.listMeta]} />
  </View>
);

const SkeletonProfile = () => (
  <View style={styles.profileContainer}>
    <View style={[styles.skeleton, styles.avatar]} />
    <View style={[styles.skeleton, styles.profileName]} />
    <View style={[styles.skeleton, styles.profileSubtitle]} />
  </View>
);

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'card', 
  count = 3 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'list':
        return <SkeletonList />;
      case 'profile':
        return <SkeletonProfile />;
      default:
        return <SkeletonCard />;
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index}>
          {renderSkeleton()}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  skeleton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    height: 20,
    width: '60%',
  },
  badge: {
    height: 24,
    width: 60,
    borderRadius: 12,
  },
  description: {
    height: 16,
    width: '100%',
    marginBottom: 8,
  },
  meta: {
    height: 14,
    width: '40%',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  button: {
    height: 32,
    flex: 1,
    borderRadius: 6,
  },
  listItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  listTitle: {
    height: 18,
    width: '70%',
    marginBottom: 8,
  },
  listSubtitle: {
    height: 14,
    width: '50%',
    marginBottom: 6,
  },
  listMeta: {
    height: 12,
    width: '30%',
  },
  profileContainer: {
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  profileName: {
    height: 24,
    width: 150,
    marginBottom: 8,
  },
  profileSubtitle: {
    height: 16,
    width: 100,
  },
});

// Add shimmer animation for web
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
    .skeleton {
      background: linear-gradient(90deg, #e5e7eb 0px, #f3f4f6 40px, #e5e7eb 80px);
      background-size: 200px 100%;
      animation: shimmer 1.5s infinite;
    }
  `;
  document.head.appendChild(style);
}