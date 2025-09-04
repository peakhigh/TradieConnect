import React, { useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { X, Target, BarChart3, Lock, Tag } from 'lucide-react-native';
import { StatusBadge } from './StatusBadge';
import { TRADIE_STATUS_CONFIG, ServiceRequestStatus } from '../../types/serviceRequestStatus';

interface HelpDrawerProps {
  visible: boolean;
  onClose: () => void;
  section?: 'statuses' | 'intelligence' | 'unlock' | 'filters';
}

export function HelpDrawer({ visible, onClose, section = 'statuses' }: HelpDrawerProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Scroll to section after animation
      setTimeout(() => {
        scrollToSection(section);
      }, 400);
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, section]);

  const scrollToSection = (targetSection: string) => {
    const sectionOffsets = {
      statuses: 0,
      intelligence: 300,
      unlock: 650,
      filters: 1000
    };
    
    scrollViewRef.current?.scrollTo({
      y: sectionOffsets[targetSection as keyof typeof sectionOffsets] || 0,
      animated: true
    });
  };

  const statuses: ServiceRequestStatus[] = ['new', 'quoted', 'assigned', 'completed', 'cancelled', 'expired'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Help & Guide</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Tag size={16} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Request Statuses</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Each request has a status that shows its current stage in the process.
              </Text>
              {statuses.map((status) => {
                const config = TRADIE_STATUS_CONFIG[status];
                return (
                  <View key={status} style={styles.statusItem}>
                    <StatusBadge status={status} userType="tradie" size="medium" fixedWidth />
                    <Text style={styles.statusDescription}>{config.description}</Text>
                  </View>
                );
              })}
            </View>

            {/* Market Intelligence Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BarChart3 size={16} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Market Intelligence</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Smart insights to help you win more jobs and price competitively.
              </Text>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Quote Stats</Text>
                <Text style={styles.infoText}>Shows how many tradies have quoted and the price range</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Competition Level</Text>
                <Text style={styles.infoText}>Low (1-2 quotes), Medium (3-6), High (7+ quotes)</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Opportunity Score</Text>
                <Text style={styles.infoText}>0-100% score based on competition, budget, and timing</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Win Rate</Text>
                <Text style={styles.infoText}>Your estimated chance of winning this job</Text>
              </View>
            </View>

            {/* Unlock Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lock size={16} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Unlocking Requests</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Pay $0.50 to unlock full details and submit your quote.
              </Text>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>What You Get</Text>
                <Text style={styles.infoText}>• Full job description and requirements</Text>
                <Text style={styles.infoText}>• Customer contact details</Text>
                <Text style={styles.infoText}>• Detailed market intelligence</Text>
                <Text style={styles.infoText}>• Ability to submit your quote</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>When to Unlock</Text>
                <Text style={styles.infoText}>• High opportunity score (70%+)</Text>
                <Text style={styles.infoText}>• Low competition (1-3 quotes)</Text>
                <Text style={styles.infoText}>• Matches your skills and location</Text>
                <Text style={styles.infoText}>• Good budget range for the work</Text>
              </View>
            </View>

            {/* Filters Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Target size={16} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Using Filters</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Find the best opportunities by filtering requests that match your business.
              </Text>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Trade Types</Text>
                <Text style={styles.infoText}>Select your specialties (plumbing, electrical, etc.)</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Location & Radius</Text>
                <Text style={styles.infoText}>Set your service area by postcode and distance</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Budget Range</Text>
                <Text style={styles.infoText}>Filter by job value to match your business size</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Competition Level</Text>
                <Text style={styles.infoText}>Choose low competition for better win rates</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Opportunity Score</Text>
                <Text style={styles.infoText}>Set minimum score (recommend 50%+ for beginners)</Text>
              </View>
            </View>
            <View style={{ height: 300 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: '90%',
    maxWidth: 450,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 12,
    flex: 1,
    lineHeight: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});