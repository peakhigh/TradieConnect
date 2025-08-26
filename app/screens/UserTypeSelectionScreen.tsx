import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SimpleButton } from '../components/UI/SimpleButton';
import { Container } from '../components/UI/Container';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Home, Wrench } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function UserTypeSelectionScreen() {
  const navigation = useNavigation();



  useEffect(() => {
    if (Platform.OS === 'web') {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'customer' || hash === 'tradie') {
        handleUserTypeSelection(hash as 'customer' | 'tradie');
      }
    }
  }, [navigation]);

  const handleUserTypeSelection = (userType: 'customer' | 'tradie') => {
    // Navigate to login/signup with user type
    navigation.navigate('Login', { userType });
  };

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDark]}
      style={styles.container}
    >
      <Container>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to TradieConnect</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to use our platform
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Home size={48} color={theme.colors.primary} />
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
              <Wrench size={48} color={theme.colors.secondary} />
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
        </ScrollView>
      </Container>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: 60,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
    minHeight: 400,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    ...theme.shadows.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  cardDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xxl,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    opacity: 0.8,
  },
});
