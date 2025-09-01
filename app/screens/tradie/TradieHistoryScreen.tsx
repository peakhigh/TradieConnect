import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { Container } from '../../components/UI/Container';
import { EmptyState } from '../../components/UI/EmptyState';
import { theme } from '../../theme/theme';
import { History, Star, DollarSign, Calendar } from 'lucide-react-native';

export default function TradieHistoryScreen() {
  const [loading, setLoading] = useState(false);

  return (
    <Container style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Job History</Text>
            <Text style={styles.subtitle}>Track your completed jobs and earnings</Text>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Total Jobs</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>$0</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0.0</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
          </View>

          {/* Filter Section */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filter by Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterTags}>
                {['All', 'Completed', 'In Progress', 'Cancelled'].map((filter) => (
                  <View key={filter} style={styles.filterTag}>
                    <Text style={styles.filterTagText}>{filter}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Job History List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            
            <EmptyState
              title="No Job History"
              message="You haven't completed any jobs yet. Start exploring service requests to build your history!"
            />
          </View>

          {/* Sample Job History Card (for design reference) */}
          <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobTitle}>Kitchen Plumbing Repair</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>
            
            <Text style={styles.customerName}>John Smith</Text>
            <Text style={styles.jobLocation}>Bondi, NSW 2026</Text>
            
            <View style={styles.jobMeta}>
              <View style={styles.metaItem}>
                <Calendar size={16} color={theme.colors.text.secondary} />
                <Text style={styles.metaText}>Completed: 15 Dec 2023</Text>
              </View>
              
              <View style={styles.metaItem}>
                <DollarSign size={16} color={theme.colors.success} />
                <Text style={styles.metaText}>Earned: $350</Text>
              </View>
              
              <View style={styles.metaItem}>
                <Star size={16} color={theme.colors.warning} />
                <Text style={styles.metaText}>Rating: 4.8/5</Text>
              </View>
            </View>
            
            <Text style={styles.jobDescription}>
              Fixed leaking kitchen tap and replaced worn washers. Customer was very satisfied with the quick service.
            </Text>
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
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: Platform.OS === 'web' ? theme.fontSize.xxl : theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  statsSection: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  statNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: theme.spacing.xl,
  },
  filterTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  filterTags: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterTag: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  filterTagText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  jobCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  jobTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    backgroundColor: theme.colors.success + '20',
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.success,
  },
  customerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  jobLocation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  jobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  jobDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});