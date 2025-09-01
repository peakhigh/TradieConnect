import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme/theme';
import { TradeSelector } from '../../../components/UI/TradeSelector';

interface InterestsStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  shouldValidate?: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSave?: () => Promise<void>;
}

export default function InterestsStep({ formData, updateFormData, shouldValidate, onNext, onPrev, onSave }: InterestsStepProps) {
  const [newPostcode, setNewPostcode] = useState('');
  const [showErrors, setShowErrors] = useState(false);


  React.useEffect(() => {
    if (shouldValidate && !showErrors) {
      setShowErrors(true);
    }
  }, [shouldValidate, showErrors]);

  const addPostcode = () => {
    if (!newPostcode.trim()) return;
    if (!/^\d{4}$/.test(newPostcode)) return;
    
    const suburbs = formData.interestedSuburbs || [];
    if (!suburbs.includes(newPostcode)) {
      updateFormData({ 
        ...formData,
        interestedSuburbs: [...suburbs, newPostcode] 
      });
    }
    setNewPostcode('');
  };

  const removeSuburb = (suburb: string) => {
    const suburbs = (formData.interestedSuburbs || []).filter((s: string) => s !== suburb);
    updateFormData({ 
      ...formData,
      interestedSuburbs: suburbs 
    });
  };



  const handleNext = async () => {
    if (!formData.interestedSuburbs?.length || !formData.interestedTrades?.length) {
      setShowErrors(true);
      return;
    }
    
    // Save all onboarding data here
    await saveOnboardingData();
    onNext();
  };

  const saveOnboardingData = async () => {
    if (onSave) {
      await onSave();
    }
  };



  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Service Interests</Text>
      <Text style={styles.subtitle}>Select the postcodes and trades you're interested in working with</Text>

      {/* Interested Trades */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interested Trades *</Text>
        
        <TradeSelector
          selectedTrades={formData.interestedTrades || []}
          onTradesChange={(trades) => updateFormData({ ...formData, interestedTrades: trades })}
          error={showErrors && (!formData.interestedTrades?.length) ? 'Please select at least one trade' : undefined}
        />
      </View>

      {/* Interested Postcodes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interested Postcodes *</Text>
        
        <View style={styles.postcodeInputRow}>
          <TextInput
            style={styles.postcodeInput}
            placeholder="Enter 4-digit postcode"
            value={newPostcode}
            onChangeText={setNewPostcode}
            keyboardType="numeric"
            maxLength={4}
            onSubmitEditing={addPostcode}
          />
          <TouchableOpacity style={styles.addButton} onPress={addPostcode}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tagsContainer}>
          {(formData.interestedSuburbs || []).map((suburb: string) => (
            <View key={suburb} style={styles.tag}>
              <Text style={styles.tagText}>{suburb}</Text>
              <TouchableOpacity onPress={() => removeSuburb(suburb)} style={styles.tagRemove}>
                <Text style={styles.tagRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        
        {showErrors && (!formData.interestedSuburbs?.length) && (
          <Text style={styles.errorText}>Please add at least one postcode</Text>
        )}
      </View>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
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
  subSectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  tradesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tradeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    backgroundColor: theme.colors.surface,
  },
  tradeButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tradeButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  tradeButtonTextSelected: {
    color: theme.colors.text.inverse,
  },
  moreTradesButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: theme.borderRadius.md,
    borderStyle: 'dashed',
    marginBottom: theme.spacing.sm,
  },
  moreTradesButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  selectedCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  postcodeInputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  postcodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    backgroundColor: theme.colors.surface,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
  },
  addButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  tagText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  tagRemove: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagRemoveText: {
    color: theme.colors.text.inverse,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  modalClose: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  searchInput: {
    margin: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    backgroundColor: theme.colors.surface,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  tradeListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  tradeListItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  tradeListText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  tradeListTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  checkmark: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
  },
});