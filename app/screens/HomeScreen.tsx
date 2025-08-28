import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Home, Wrench, Shield, Clock, DollarSign, MessageCircle, Star, Smartphone, Menu, X, CheckCircle, Users, TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;

export default function HomeScreen() {
  const navigation = useNavigation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [sectionPositions, setSectionPositions] = useState({
    howItWorks: 0,
    pricing: 0,
    contact: 0,
  });

  const handleUserTypeSelection = (userType: 'customer' | 'tradie') => {
    navigation.navigate('Login', { userType });
  };

  const scrollToSection = (section: keyof typeof sectionPositions) => {
    if (scrollViewRef.current && sectionPositions[section]) {
      scrollViewRef.current.scrollTo({
        y: sectionPositions[section] - 80,
        animated: true,
      });
    }
    setIsMenuOpen(false);
  };

  const onSectionLayout = (section: keyof typeof sectionPositions, event: any) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions(prev => ({ ...prev, [section]: y }));
  };

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, isMenuOpen && isSmallScreen && { paddingBottom: 0 }]}>
        <View style={styles.headerContent}>
          <View style={styles.logo}>
            <Wrench size={24} color={theme.colors.primary} />
            <Text style={styles.logoText}>TradieConnect</Text>
          </View>
          
          {isSmallScreen ? (
            <TouchableOpacity 
              onPress={() => setIsMenuOpen(!isMenuOpen)}
              style={styles.menuButton}
            >
              {isMenuOpen ? <X size={24} color="#111827" /> : <Menu size={24} color="#111827" />}
            </TouchableOpacity>
          ) : (
            <View style={styles.headerNav}>
              <View style={styles.navLinks}>
                <TouchableOpacity 
                  style={styles.navLink}
                  onPress={() => scrollToSection('howItWorks')}
                >
                  <Text style={styles.navLinkText}>How It Works</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.navLink}
                  onPress={() => scrollToSection('pricing')}
                >
                  <Text style={styles.navLinkText}>Pricing</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.navLink}
                  onPress={() => scrollToSection('contact')}
                >
                  <Text style={styles.navLinkText}>Contact Us</Text>
                </TouchableOpacity>
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
          )}
        </View>
        
        {/* Mobile Menu */}
        {isMenuOpen && isSmallScreen && (
          <View style={styles.mobileMenu}>
            <TouchableOpacity 
              onPress={() => scrollToSection('howItWorks')}
              style={styles.mobileNavLink}
            >
              <Text style={styles.mobileNavLinkText}>How It Works</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => scrollToSection('pricing')}
              style={styles.mobileNavLink}
            >
              <Text style={styles.mobileNavLinkText}>Pricing</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => scrollToSection('contact')}
              style={styles.mobileNavLink}
            >
              <Text style={styles.mobileNavLinkText}>Contact Us</Text>
            </TouchableOpacity>
            <View style={styles.mobileDivider} />
            <TouchableOpacity 
              onPress={() => {
                handleUserTypeSelection('customer');
                setIsMenuOpen(false);
              }}
              style={[styles.mobileMenuItem, styles.customerButton]}
            >
              <Text style={styles.customerButtonText}>Customer Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                handleUserTypeSelection('tradie');
                setIsMenuOpen(false);
              }}
              style={[styles.mobileMenuItem, styles.tradieButton]}
            >
              <Text style={styles.tradieButtonText}>Tradie Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Australia's Trusted Tradie Marketplace</Text>
          <Text style={styles.heroSubtitle}>
            Connect with 10,000+ verified tradies across Australia. Get your home repairs and improvements done with confidence, backed by our guarantee.
          </Text>
          
          {/* Stats */}
          <View style={styles.heroStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Verified Tradies</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50K+</Text>
              <Text style={styles.statLabel}>Jobs Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.9★</Text>
              <Text style={styles.statLabel}>Average Rating</Text>
            </View>
          </View>
          
          <View style={styles.heroButtons}>
            <TouchableOpacity 
              onPress={() => handleUserTypeSelection('customer')}
              style={[styles.heroButton, styles.customerHeroButton]}
            >
              <Home size={20} color={theme.colors.primary} />
              <Text style={styles.customerHeroButtonText}>Post Service Request - FREE</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleUserTypeSelection('tradie')}
              style={[styles.heroButton, styles.tradieHeroButton]}
            >
              <Wrench size={20} color="#ffffff" />
              <Text style={styles.tradieHeroButtonText}>Find Work - $10 Bonus</Text>
            </TouchableOpacity>
          </View>
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

      {/* How It Works */}
      <View 
        style={styles.section}
        onLayout={(event) => onSectionLayout('howItWorks', event)}
      >
        <Text style={styles.sectionTitle}>How TradieConnect Works</Text>
        <Text style={styles.sectionSubtitle}>
          Get your work done in 3 simple steps
        </Text>
        
        <View style={styles.stepsContainer}>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Post Service Request</Text>
            <Text style={styles.stepDescription}>
              Describe what needs fixing or building with photos and details. It's completely free!
            </Text>
          </View>
          
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Receive Quotes</Text>
            <Text style={styles.stepDescription}>
              Verified tradies compete for your work with competitive quotes.
            </Text>
          </View>
          
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Hire & Pay</Text>
            <Text style={styles.stepDescription}>
              Choose your tradie, get the work done, and pay securely through our platform.
            </Text>
          </View>
        </View>
      </View>

      {/* Pricing Section */}
      <View 
        style={[styles.section, styles.pricingSection]}
        onLayout={(event) => onSectionLayout('pricing', event)}
      >
        <Text style={styles.sectionTitle}>Simple, Transparent Pricing</Text>
        <Text style={styles.sectionSubtitle}>
          No hidden fees. Pay only when you find value.
        </Text>
        
        <View style={styles.pricingContainer}>
          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <Home size={48} color={theme.colors.primary} />
              <Text style={styles.pricingTitle}>For Customers</Text>
              <Text style={styles.pricingPrice}>FREE</Text>
              <Text style={styles.pricingSubPrice}>Always free to use</Text>
            </View>
            <View style={styles.pricingFeatures}>
              <View style={styles.pricingFeature}>
                <CheckCircle size={16} color="#10b981" />
                <Text style={styles.pricingFeatureText}>Post unlimited requests</Text>
              </View>
              <View style={styles.pricingFeature}>
                <CheckCircle size={16} color="#10b981" />
                <Text style={styles.pricingFeatureText}>Receive multiple quotes</Text>
              </View>
              <View style={styles.pricingFeature}>
                <CheckCircle size={16} color="#10b981" />
                <Text style={styles.pricingFeatureText}>Direct communication</Text>
              </View>
              <View style={styles.pricingFeature}>
                <CheckCircle size={16} color="#10b981" />
                <Text style={styles.pricingFeatureText}>Review and rating system</Text>
              </View>
              <View style={styles.pricingFeature}>
                <CheckCircle size={16} color="#10b981" />
                <Text style={styles.pricingFeatureText}>Secure payment protection</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => handleUserTypeSelection('customer')}
              style={[styles.pricingButton, styles.customerPricingButton]}
            >
              <Text style={styles.customerPricingButtonText}>Get Started Free</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.pricingCard, styles.featuredPricingCard]}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
            </View>
            <View style={styles.pricingHeader}>
              <Wrench size={48} color="#10b981" />
              <Text style={styles.pricingTitle}>For Tradies</Text>
              <Text style={styles.pricingPrice}>$0.50</Text>
              <Text style={styles.pricingSubPrice}>per request unlock</Text>
            </View>
            <View style={styles.pricingFeatures}>
              <View style={styles.pricingFeature}>
                <CheckCircle size={16} color="#10b981" />
                <Text style={styles.pricingFeatureText}>Browse requests for free</Text>
              </View>
              <View style={styles.pricingFeature}>
                <CheckCircle size={16} color="#10b981" />
                <Text style={styles.pricingFeatureText}>$10 signup bonus</Text>
              </View>
              <View style={styles.pricingFeature}>
                <CheckCircle size={16} color="#10b981" />
                <Text style={styles.pricingFeatureText}>Minimum $5 wallet recharge</Text>
              </View>
              <View style={styles.pricingFeature}>
                <CheckCircle size={16} color="#10b981" />
                <Text style={styles.pricingFeatureText}>Build your reputation</Text>
              </View>
              <View style={styles.pricingFeature}>
                <CheckCircle size={16} color="#10b981" />
                <Text style={styles.pricingFeatureText}>Direct customer contact</Text>
              </View>
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

      {/* Testimonials */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What Our Users Say</Text>
        <View style={styles.testimonialsGrid}>
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialStars}>
              {[1,2,3,4,5].map(i => <Star key={i} size={16} color="#fbbf24" />)}
            </View>
            <Text style={styles.testimonialText}>
              "Found an amazing electrician within hours. The whole process was seamless and professional."
            </Text>
            <Text style={styles.testimonialAuthor}>- Sarah M., Sydney</Text>
          </View>
          
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialStars}>
              {[1,2,3,4,5].map(i => <Star key={i} size={16} color="#fbbf24" />)}
            </View>
            <Text style={styles.testimonialText}>
              "As a plumber, TradieConnect has doubled my business. Quality leads at an affordable price."
            </Text>
            <Text style={styles.testimonialAuthor}>- Mike T., Melbourne</Text>
          </View>
          
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialStars}>
              {[1,2,3,4,5].map(i => <Star key={i} size={16} color="#fbbf24" />)}
            </View>
            <Text style={styles.testimonialText}>
              "Competitive quotes and excellent communication. Highly recommend for any home project."
            </Text>
            <Text style={styles.testimonialAuthor}>- James L., Brisbane</Text>
          </View>
        </View>
      </View>

      {/* Contact Section */}
      <View 
        style={[styles.section, styles.contactSection]}
        onLayout={(event) => onSectionLayout('contact', event)}
      >
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.sectionSubtitle}>
          Have questions? We're here to help you get started.
        </Text>
        
        <View style={styles.contactGrid}>
          <View style={styles.contactCard}>
            <MessageCircle size={48} color={theme.colors.primary} />
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactDescription}>
              Get help with your account, technical issues, or general questions.
            </Text>
            <Text style={styles.contactInfo}>support@tradieconnect.com.au</Text>
          </View>
          
          <View style={styles.contactCard}>
            <Smartphone size={48} color="#10b981" />
            <Text style={styles.contactTitle}>Phone Support</Text>
            <Text style={styles.contactDescription}>
              Speak directly with our team for urgent matters or complex issues.
            </Text>
            <Text style={styles.contactInfo}>1300 TRADIE (872 343)</Text>
          </View>
          
          <View style={styles.contactCard}>
            <Clock size={48} color="#f59e0b" />
            <Text style={styles.contactTitle}>Business Hours</Text>
            <Text style={styles.contactDescription}>
              Our support team is available during these hours (AEST).
            </Text>
            <Text style={styles.contactInfo}>Mon-Fri: 9AM-6PM{"\n"}Sat: 9AM-1PM</Text>
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
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: isSmallScreen ? 18 : 24,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 24,
  },
  navLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navLinkText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  menuButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileMenu: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  mobileNavLink: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  mobileNavLinkText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  mobileDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  mobileMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
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
    paddingVertical: isSmallScreen ? 60 : 100,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroContent: {
    maxWidth: 1200,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: isSmallScreen ? 28 : 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: isSmallScreen ? 36 : 56,
  },
  heroSubtitle: {
    fontSize: isSmallScreen ? 16 : 20,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 40,
    maxWidth: 700,
    lineHeight: isSmallScreen ? 24 : 30,
  },
  heroStats: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: isSmallScreen ? 16 : 40,
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: isSmallScreen ? 24 : 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 4,
  },
  heroButtons: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: 16,
    width: '100%',
    maxWidth: 500,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    flex: isSmallScreen ? 0 : 1,
    minHeight: 56,
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
    paddingVertical: isSmallScreen ? 60 : 80,
    paddingHorizontal: 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 24 : 36,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: isSmallScreen ? 32 : 44,
  },
  sectionSubtitle: {
    fontSize: isSmallScreen ? 16 : 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: isSmallScreen ? 40 : 64,
    maxWidth: 600,
    alignSelf: 'center',
    lineHeight: 26,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
  },
  stepsContainer: {
    flexDirection: 'column',
    gap: isSmallScreen ? 40 : 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCard: {
    alignItems: 'center',
    width: '100%',
    maxWidth: isSmallScreen ? '100%' : 350,
    paddingHorizontal: isSmallScreen ? 20 : 0,
  },
  stepNumber: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepNumberText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: isSmallScreen ? '100%' : 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
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
  pricingContainer: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'center',
    gap: 32,
    alignItems: isSmallScreen ? 'center' : 'stretch',
  },
  pricingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    width: isSmallScreen ? '100%' : 380,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
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
    gap: 12,
  },
  pricingFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pricingFeatureText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  pricingButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
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
  testimonialsGrid: {
    flexDirection: 'column',
    gap: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testimonialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: isSmallScreen ? '100%' : 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  testimonialText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
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
  contactSection: {
    backgroundColor: '#f9fafb',
  },
  contactGrid: {
    flexDirection: 'column',
    gap: 24,
    alignItems: 'center',
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: isSmallScreen ? '100%' : 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  contactDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  contactInfo: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});