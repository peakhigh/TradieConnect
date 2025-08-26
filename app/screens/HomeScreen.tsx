import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Home, Wrench, Shield, Clock, DollarSign, MessageCircle, Star, Smartphone } from 'lucide-react-native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleUserTypeSelection = (userType: 'customer' | 'tradie') => {
    navigation.navigate('Login', { userType });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logo}>
            <Wrench size={24} color={theme.colors.primary} />
            <Text style={styles.logoText}>TradieConnect</Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={() => handleUserTypeSelection('customer')}
              style={[styles.headerButton, styles.customerButton]}
            >
              <Text style={styles.customerButtonText}>Customer Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleUserTypeSelection('tradie')}
              style={[styles.headerButton, styles.tradieButton]}
            >
              <Text style={styles.tradieButtonText}>Tradie Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Connect with Trusted Tradies</Text>
        <Text style={styles.heroSubtitle}>
          Get quality work done by verified professionals. Post your job, receive quotes, and hire with confidence.
        </Text>
        <View style={styles.heroButtons}>
          <TouchableOpacity 
            onPress={() => handleUserTypeSelection('customer')}
            style={[styles.heroButton, styles.customerHeroButton]}
          >
            <Home size={20} color={theme.colors.primary} />
            <Text style={styles.customerHeroButtonText}>I Need a Tradie</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleUserTypeSelection('tradie')}
            style={[styles.heroButton, styles.tradieHeroButton]}
          >
            <Wrench size={20} color="#ffffff" />
            <Text style={styles.tradieHeroButtonText}>I'm a Tradie</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose TradieConnect?</Text>
        <Text style={styles.sectionSubtitle}>
          We make it easy to find quality tradies and get your jobs done right.
        </Text>
        
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Shield size={48} color={theme.colors.primary} />
            <Text style={styles.featureTitle}>Verified Tradies</Text>
            <Text style={styles.featureDescription}>
              All tradies are licensed, insured, and background checked for your peace of mind.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <DollarSign size={48} color="#10b981" />
            <Text style={styles.featureTitle}>Competitive Pricing</Text>
            <Text style={styles.featureDescription}>
              Get multiple quotes and choose the best value for your project.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Clock size={48} color="#8b5cf6" />
            <Text style={styles.featureTitle}>Quick Response</Text>
            <Text style={styles.featureDescription}>
              Receive quotes within hours, not days. Get your job started faster.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <MessageCircle size={48} color="#f59e0b" />
            <Text style={styles.featureTitle}>Direct Communication</Text>
            <Text style={styles.featureDescription}>
              Chat directly with tradies to discuss your project details.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Star size={48} color="#eab308" />
            <Text style={styles.featureTitle}>Quality Guaranteed</Text>
            <Text style={styles.featureDescription}>
              Read reviews and ratings from real customers before you hire.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Smartphone size={48} color="#ef4444" />
            <Text style={styles.featureTitle}>Mobile Friendly</Text>
            <Text style={styles.featureDescription}>
              Manage your projects on the go with our mobile-optimized platform.
            </Text>
          </View>
        </View>
      </View>

      {/* Pricing Section */}
      <View style={[styles.section, styles.pricingSection]}>
        <Text style={styles.sectionTitle}>Simple, Transparent Pricing</Text>
        <Text style={styles.sectionSubtitle}>
          No hidden fees. Pay only when you find value.
        </Text>
        
        <View style={styles.pricingGrid}>
          <View style={styles.pricingCard}>
            <Home size={48} color={theme.colors.primary} />
            <Text style={styles.pricingTitle}>For Customers</Text>
            <Text style={styles.pricingPrice}>FREE</Text>
            <View style={styles.pricingFeatures}>
              <Text style={styles.pricingFeature}>✓ Post unlimited jobs</Text>
              <Text style={styles.pricingFeature}>✓ Receive multiple quotes</Text>
              <Text style={styles.pricingFeature}>✓ Direct communication</Text>
              <Text style={styles.pricingFeature}>✓ Review and rating system</Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleUserTypeSelection('customer')}
              style={[styles.pricingButton, styles.customerPricingButton]}
            >
              <Text style={styles.customerPricingButtonText}>Get Started Free</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.pricingCard, styles.featuredPricingCard]}>
            <Wrench size={48} color="#10b981" />
            <Text style={styles.pricingTitle}>For Tradies</Text>
            <Text style={styles.pricingPrice}>$0.50</Text>
            <Text style={styles.pricingSubPrice}>per job unlock</Text>
            <View style={styles.pricingFeatures}>
              <Text style={styles.pricingFeature}>✓ Browse jobs for free</Text>
              <Text style={styles.pricingFeature}>✓ $10 signup bonus</Text>
              <Text style={styles.pricingFeature}>✓ Minimum $5 wallet recharge</Text>
              <Text style={styles.pricingFeature}>✓ Build your reputation</Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleUserTypeSelection('tradie')}
              style={[styles.pricingButton, styles.tradiePricingButton]}
            >
              <Text style={styles.tradiePricingButtonText}>Start Earning Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerLogo}>
            <Wrench size={24} color="#ffffff" />
            <Text style={styles.footerLogoText}>TradieConnect</Text>
          </View>
          <Text style={styles.footerDescription}>
            Connecting customers with trusted tradies across Australia.
          </Text>
        </View>
        <Text style={styles.copyright}>
          © 2024 TradieConnect. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  customerButton: {
    backgroundColor: theme.colors.primary,
  },
  customerButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tradieButton: {
    backgroundColor: '#10b981',
  },
  tradieButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  hero: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 80,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 32,
    maxWidth: 600,
  },
  heroButtons: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    gap: 8,
  },
  customerHeroButton: {
    backgroundColor: '#ffffff',
  },
  customerHeroButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  tradieHeroButton: {
    backgroundColor: '#10b981',
  },
  tradieHeroButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 64,
    maxWidth: 600,
    alignSelf: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    width: Platform.OS === 'web' ? 300 : '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  pricingSection: {
    backgroundColor: '#f9fafb',
  },
  pricingGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'center',
    gap: 24,
  },
  pricingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    width: Platform.OS === 'web' ? 350 : '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredPricingCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  pricingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  pricingPrice: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  pricingSubPrice: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  pricingFeatures: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  pricingFeature: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  pricingButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  customerPricingButton: {
    backgroundColor: theme.colors.primary,
  },
  customerPricingButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tradiePricingButton: {
    backgroundColor: '#10b981',
  },
  tradiePricingButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#111827',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  footerContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  footerDescription: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  copyright: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});