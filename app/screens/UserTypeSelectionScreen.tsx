import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SimpleButton } from '../components/UI/SimpleButton';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function UserTypeSelectionScreen() {
  const navigation = useNavigation();

  const handleUserTypeSelection = (userType: 'customer' | 'tradie') => {
    // Navigate to login/signup with user type
    navigation.navigate('Auth', { userType });
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to TradieApp</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to use our platform
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🏠</Text>
            </View>
            <Text style={styles.cardTitle}>I'm a Customer</Text>
            <Text style={styles.cardDescription}>
              Need a tradie? Post service requests and get quotes from qualified professionals.
            </Text>
            <SimpleButton
              title="Continue as Customer"
              onPress={() => handleUserTypeSelection('customer')}
              variant="primary"
              size="large"
              fullWidth
              style={styles.button}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔧</Text>
            </View>
            <Text style={styles.cardTitle}>I'm a Tradie</Text>
            <Text style={styles.cardDescription}>
              Looking for work? Browse service requests and submit quotes to customers.
            </Text>
            <SimpleButton
              title="Continue as Tradie"
              onPress={() => handleUserTypeSelection('tradie')}
              variant="secondary"
              size="large"
              fullWidth
              style={styles.button}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Join thousands of customers and tradies using our platform
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
  },
});
