import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { Container } from '../../components/UI/Container';
import { Input } from '../../components/UI/Input';
import { SimpleButton } from '../../components/UI/SimpleButton';
import { theme } from '../../theme/theme';
import { functions, httpsCallable } from '../../services/firebase';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  Calendar,
  FileText,
} from 'lucide-react-native';
import { EnrichedServiceRequest } from '../../types/explorer';

interface QuoteFormData {
  materialsCost: string;
  laborCost: string;
  totalPrice: string;
  timelineDays: string;
  estimatedStartDate: string;
  notes: string;
}

export default function SubmitQuoteScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const request: EnrichedServiceRequest = route.params?.request;
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<QuoteFormData>({
    defaultValues: {
      materialsCost: '',
      laborCost: '',
      totalPrice: '',
      timelineDays: '',
      estimatedStartDate: '',
      notes: '',
    },
  });

  const materialsCost = watch('materialsCost');
  const laborCost = watch('laborCost');
  const timelineDays = watch('timelineDays');
  const estimatedStartDate = watch('estimatedStartDate');

  // Auto-calculate total price
  useEffect(() => {
    const materials = parseFloat(materialsCost) || 0;
    const labor = parseFloat(laborCost) || 0;
    if (materials > 0 || labor > 0) {
      setValue('totalPrice', (materials + labor).toFixed(2));
    }
  }, [materialsCost, laborCost, setValue]);

  // Calculate estimated completion date
  const getEstimatedCompletionDate = (): string => {
    if (!estimatedStartDate || !timelineDays) return '';
    const start = new Date(estimatedStartDate);
    if (isNaN(start.getTime())) return '';
    const days = parseInt(timelineDays) || 0;
    const completion = new Date(start);
    completion.setDate(completion.getDate() + days);
    return completion.toISOString().split('T')[0];
  };

  const onSubmit = async (data: QuoteFormData) => {
    const totalPrice = parseFloat(data.totalPrice);
    const materials = parseFloat(data.materialsCost);
    const labor = parseFloat(data.laborCost);
    const timeline = parseInt(data.timelineDays);

    if (!totalPrice || totalPrice <= 0) {
      Alert.alert('Error', 'Please enter a valid total price');
      return;
    }
    if (!timeline || timeline <= 0) {
      Alert.alert('Error', 'Please enter a valid timeline');
      return;
    }

    setSubmitting(true);
    try {
      const submitQuoteFn = httpsCallable(functions, 'submitQuote');
      await submitQuoteFn({
        serviceRequestId: request.id,
        totalPrice,
        materialsCost: materials || 0,
        laborCost: labor || 0,
        timelineDays: timeline,
        estimatedStartDate: data.estimatedStartDate || null,
        estimatedCompletionDate: getEstimatedCompletionDate() || null,
        notes: data.notes || '',
      });

      Alert.alert('Success', 'Your quote has been submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const msg = error?.message || 'Failed to submit quote';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getTradeDisplay = () => {
    if (request?.trades && request.trades.length > 0) {
      return request.trades.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
    }
    return 'General Service';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      default: return '#65a30d';
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return '#16a34a';
      case 'medium': return '#d97706';
      case 'high': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (!request) {
    return (
      <Container>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No request data available</Text>
          <SimpleButton title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
        </View>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Quote</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Request Context Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          <View style={styles.contextCard}>
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Trade:</Text>
              <Text style={styles.contextValue}>{getTradeDisplay()}</Text>
            </View>
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Postcode:</Text>
              <Text style={styles.contextValue}>{request.postcode}</Text>
            </View>
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Urgency:</Text>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(request.urgency) }]}>
                <Text style={styles.urgencyText}>{request.urgency?.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.descriptionText}>{request.description}</Text>

            {/* Photos */}
            {request.photos && request.photos.length > 0 && (
              <View style={styles.photosRow}>
                {request.photos.slice(0, 4).map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.thumbnail} />
                ))}
                {request.photos.length > 4 && (
                  <View style={styles.morePhotos}>
                    <Text style={styles.morePhotosText}>+{request.photos.length - 4}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Intelligence Panel */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <BarChart3 size={16} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Market Intelligence</Text>
          </View>
          <View style={styles.intelCard}>
            <View style={styles.intelRow}>
              <View style={styles.intelItem}>
                <Users size={14} color="#6b7280" />
                <Text style={styles.intelLabel}>Quotes</Text>
                <Text style={styles.intelValue}>{request.quotes?.totalQuotes || 0}</Text>
              </View>
              <View style={styles.intelItem}>
                <DollarSign size={14} color="#6b7280" />
                <Text style={styles.intelLabel}>Range</Text>
                <Text style={styles.intelValue}>
                  ${request.quotes?.priceRange?.min?.toFixed(0) || 0} - ${request.quotes?.priceRange?.max?.toFixed(0) || 0}
                </Text>
              </View>
            </View>
            <View style={styles.intelRow}>
              <View style={styles.intelItem}>
                <TrendingUp size={14} color="#16a34a" />
                <Text style={styles.intelLabel}>Recommended</Text>
                <Text style={[styles.intelValue, { color: '#16a34a' }]}>
                  ${request.intelligence?.recommendedPriceRange?.optimal?.toFixed(2) || '0.00'}
                </Text>
              </View>
              <View style={styles.intelItem}>
                <View style={[styles.competitionDot, { backgroundColor: getCompetitionColor(request.quotes?.competitionLevel || 'low') }]} />
                <Text style={styles.intelLabel}>Competition</Text>
                <Text style={styles.intelValue}>{request.quotes?.competitionLevel || 'low'}</Text>
              </View>
            </View>
            <View style={styles.intelRow}>
              <View style={styles.intelItem}>
                <Clock size={14} color="#6b7280" />
                <Text style={styles.intelLabel}>Win Probability</Text>
                <Text style={styles.intelValue}>
                  {((request.intelligence?.winProbability || 0) * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quote Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Quote</Text>

          <Controller
            control={control}
            name="materialsCost"
            rules={{ required: 'Materials cost is required' }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Materials Cost ($)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChange}
                error={errors.materialsCost?.message}
                leftIcon={<DollarSign size={16} color="#6b7280" />}
              />
            )}
          />

          <Controller
            control={control}
            name="laborCost"
            rules={{ required: 'Labor cost is required' }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Labor Cost ($)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChange}
                error={errors.laborCost?.message}
                leftIcon={<DollarSign size={16} color="#6b7280" />}
              />
            )}
          />

          <Controller
            control={control}
            name="totalPrice"
            rules={{ required: 'Total price is required' }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Total Price ($)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChange}
                error={errors.totalPrice?.message}
                helperText="Auto-calculated from materials + labor (editable)"
                leftIcon={<DollarSign size={16} color="#3b82f6" />}
              />
            )}
          />

          <Controller
            control={control}
            name="timelineDays"
            rules={{ required: 'Timeline is required' }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Timeline (days)"
                placeholder="e.g. 3"
                keyboardType="number-pad"
                value={value}
                onChangeText={onChange}
                error={errors.timelineDays?.message}
                leftIcon={<Clock size={16} color="#6b7280" />}
              />
            )}
          />

          <Controller
            control={control}
            name="estimatedStartDate"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Estimated Start Date"
                placeholder="YYYY-MM-DD"
                value={value}
                onChangeText={onChange}
                helperText="When you can start the job"
                leftIcon={<Calendar size={16} color="#6b7280" />}
              />
            )}
          />

          {/* Estimated Completion (read-only, auto-calculated) */}
          {estimatedStartDate && timelineDays && (
            <View style={styles.completionRow}>
              <Text style={styles.completionLabel}>Estimated Completion:</Text>
              <Text style={styles.completionValue}>
                {getEstimatedCompletionDate() || 'N/A'}
              </Text>
            </View>
          )}

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Notes"
                placeholder="Any additional details for the customer..."
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={4}
                style={styles.notesInput}
                leftIcon={<FileText size={16} color="#6b7280" />}
              />
            )}
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <SimpleButton
            title={submitting ? 'Submitting...' : 'Submit Quote'}
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
            disabled={submitting}
            fullWidth
            size="large"
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  contextCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    width: 80,
  },
  contextValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  descriptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginTop: 8,
  },
  photosRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  morePhotos: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  intelCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  intelRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  intelItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  intelLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  intelValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  competitionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  completionLabel: {
    fontSize: theme.fontSize.sm,
    color: '#166534',
    fontWeight: '500',
  },
  completionValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: '#166534',
    marginLeft: 8,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitSection: {
    marginTop: 24,
    paddingHorizontal: 0,
  },
  bottomSpacer: {
    height: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
});
