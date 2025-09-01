import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Container } from '../../components/UI/Container';
import { StatCard } from '../../components/UI/StatCard';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Sparkles, Search, Wallet, TrendingUp, MessageCircle, Star } from 'lucide-react-native';

export default function TradieDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleExploreJobs = () => {
    navigation.navigate('Explorer' as never);
  };

  const handleViewWallet = () => {
    navigation.navigate('Wallet' as never);
  };

  const handleViewMessages = () => {
    navigation.navigate('Messages' as never);
  };

  return (
    <Container style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  <Sparkles size={24} color={theme.colors.primary} /> Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
                </Text>
                <Text style={styles.subtitle}>
                  Ready to find your next job opportunity?
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity onPress={handleExploreJobs} style={styles.linkButton}>
              <Search size={20} color={theme.colors.primary} />
              <Text style={styles.linkButtonText}>Explore Jobs</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Performance</Text>
            <View style={styles.statsGrid}>
              <StatCard
                number={user?.walletBalance || 0}
                label="Wallet Balance"
                color={theme.colors.success}
                onPress={handleViewWallet}
              />
              <StatCard
                number={user?.totalJobs || 0}
                label="Total Jobs"
                color={theme.colors.primary}
              />
              <StatCard
                number={user?.rating || 0}
                label="Rating"
                color={theme.colors.warning}
              />
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No recent activity. Start exploring jobs to get started!
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={handleExploreJobs}>
                <Search size={32} color={theme.colors.primary} />
                <Text style={styles.actionTitle}>Find Jobs</Text>
                <Text style={styles.actionSubtitle}>Browse available requests</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard} onPress={handleViewWallet}>
                <Wallet size={32} color={theme.colors.success} />
                <Text style={styles.actionTitle}>Wallet</Text>
                <Text style={styles.actionSubtitle}>Manage your credits</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard} onPress={handleViewMessages}>
                <MessageCircle size={32} color={theme.colors.info} />
                <Text style={styles.actionTitle}>Messages</Text>
                <Text style={styles.actionSubtitle}>Chat with customers</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard}>
                <TrendingUp size={32} color={theme.colors.warning} />
                <Text style={styles.actionTitle}>Analytics</Text>
                <Text style={styles.actionSubtitle}>View performance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xxl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
  },
  title: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.xxl : theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.md : theme.fontSize.sm,
    color: theme.colors.text.secondary,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  quickActions: {
    marginBottom: theme.spacing.xxl,
    alignItems: 'flex-end',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  linkButtonText: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.lg : theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6b7280',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  actionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});