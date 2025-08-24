import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { useAuth } from '../../context/AuthContext';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ServiceRequest } from '../../types';

const TRADE_TYPES = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning',
  'Gardening', 'Roofing', 'HVAC', 'Flooring', 'General Handyman'
];

const URGENCY_LEVELS = [
  { label: 'Low', value: 'low', color: '#16a34a' },
  { label: 'Medium', value: 'medium', color: '#ca8a04' },
  { label: 'High', value: 'high', color: '#dc2626' }
];

export default function PostRequestScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tradeType: '',
    description: '',
    suburb: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
    budgetMin: '',
    budgetMax: '',
    earliestDate: '',
    latestDate: '',
    additionalNotes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.tradeType || !formData.description || !formData.suburb) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const serviceRequest: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        customerId: user!.id,
        customer: user! as any, // Type assertion for now
        tradeType: formData.tradeType,
        description: formData.description,
        suburb: formData.suburb,
        urgency: formData.urgency,
        status: 'active',
        photos: [], // TODO: Implement photo upload
        voiceMessage: undefined, // TODO: Implement voice recording
        budget: formData.budgetMin && formData.budgetMax ? {
          min: parseFloat(formData.budgetMin),
          max: parseFloat(formData.budgetMax)
        } : undefined,
        preferredDates: formData.earliestDate && formData.latestDate ? {
          earliest: new Date(formData.earliestDate),
          latest: new Date(formData.latestDate)
        } : undefined
      };

      await addDoc(collection(db, 'serviceRequests'), {
        ...serviceRequest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      Alert.alert('Success', 'Service request posted successfully!');
      // Reset form
      setFormData({
        tradeType: '',
        description: '',
        suburb: '',
        urgency: 'medium',
        budgetMin: '',
        budgetMax: '',
        earliestDate: '',
        latestDate: '',
        additionalNotes: ''
      });
    } catch (error) {
      console.error('Error posting service request:', error);
      Alert.alert('Error', 'Failed to post service request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Post Service Request
        </Text>

        {/* Trade Type Selection */}
        <View style={styles.tradeTypeContainer}>
          <Text style={styles.label}>
            Trade Type *
          </Text>
          <View style={styles.tradeTypeButtons}>
            {TRADE_TYPES.map((trade) => (
              <TouchableOpacity
                key={trade}
                style={[
                  styles.tradeTypeButton,
                  formData.tradeType === trade && styles.selectedTradeTypeButton
                ]}
                onPress={() => handleInputChange('tradeType', trade)}
              >
                <Text
                  style={[
                    styles.tradeTypeText,
                    formData.tradeType === trade && styles.selectedTradeTypeText
                  ]}
                >
                  {trade}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <Input
          label="Description *"
          placeholder="Describe the work you need done..."
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Suburb */}
        <Input
          label="Suburb *"
          placeholder="Enter your suburb"
          value={formData.suburb}
          onChangeText={(value) => handleInputChange('suburb', value)}
        />

        {/* Urgency Level */}
        <View style={styles.urgencyLevelContainer}>
          <Text style={styles.label}>
            Urgency Level *
          </Text>
          <View style={styles.urgencyLevelButtons}>
            {URGENCY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.urgencyLevelButton,
                  formData.urgency === level.value && styles.selectedUrgencyLevelButton
                ]}
                onPress={() => handleInputChange('urgency', level.value)}
              >
                <Text
                  style={[
                    styles.urgencyLevelText,
                    formData.urgency === level.value && styles.selectedUrgencyLevelText
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget Range */}
        <View style={styles.budgetRangeContainer}>
          <Text style={styles.label}>
            Budget Range (Optional)
          </Text>
          <View style={styles.budgetRangeInputs}>
            <View style={styles.budgetInputContainer}>
              <Input
                placeholder="Min $"
                value={formData.budgetMin}
                onChangeText={(value) => handleInputChange('budgetMin', value)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.budgetInputContainer}>
              <Input
                placeholder="Max $"
                value={formData.budgetMax}
                onChangeText={(value) => handleInputChange('budgetMax', value)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Preferred Dates */}
        <View style={styles.preferredDatesContainer}>
          <Text style={styles.label}>
            Preferred Dates (Optional)
          </Text>
          <View style={styles.preferredDatesInputs}>
            <View style={styles.preferredDateInputContainer}>
              <Input
                placeholder="Earliest Date"
                value={formData.earliestDate}
                onChangeText={(value) => handleInputChange('earliestDate', value)}
              />
            </View>
            <View style={styles.preferredDateInputContainer}>
              <Input
                placeholder="Latest Date"
                value={formData.latestDate}
                onChangeText={(value) => handleInputChange('latestDate', value)}
              />
            </View>
          </View>
        </View>

        {/* Additional Notes */}
        <Input
          label="Additional Notes (Optional)"
          placeholder="Any other details or special requirements..."
          value={formData.additionalNotes}
          onChangeText={(value) => handleInputChange('additionalNotes', value)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Photo and Voice Note Placeholders */}
        <View style={styles.mediaPlaceholderContainer}>
          <Text style={styles.label}>
            Media (Coming Soon)
          </Text>
          <View style={styles.mediaPlaceholderContent}>
            <Text style={styles.mediaPlaceholderText}>
              📸 Photo upload and 🎤 voice recording features will be available soon
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <Button
          title="Post Service Request"
          onPress={handleSubmit}
          loading={loading}
          size="large"
        />

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>
            💡 Tips for Better Responses
          </Text>
          <Text style={styles.tipsText}>
            • Be specific about the work needed{'\n'}
            • Include your preferred timeline{'\n'}
            • Mention any special requirements{'\n'}
            • Provide clear location details
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // Tailwind gray-50
  },
  content: {
    padding: 20, // Tailwind p-6
  },
  title: {
    fontSize: 24, // Tailwind text-2xl
    fontWeight: 'bold', // Tailwind font-bold
    color: '#1f2937', // Tailwind text-gray-900
    marginBottom: 15, // Tailwind mb-6
  },
  tradeTypeContainer: {
    marginBottom: 15, // Tailwind mb-6
  },
  label: {
    fontSize: 14, // Tailwind text-sm
    fontWeight: '500', // Tailwind font-medium
    color: '#4b5563', // Tailwind text-gray-700
    marginBottom: 8, // Tailwind mb-3
  },
  tradeTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // Tailwind gap-2
  },
  tradeTypeButton: {
    paddingVertical: 8, // Tailwind py-2
    paddingHorizontal: 16, // Tailwind px-4
    borderRadius: 999, // Tailwind rounded-full
    borderWidth: 1, // Tailwind border
    borderColor: '#d1d5db', // Tailwind border-gray-300
    backgroundColor: '#ffffff', // Tailwind bg-white
  },
  selectedTradeTypeButton: {
    backgroundColor: '#3b82f6', // Tailwind bg-primary-600
    borderColor: '#3b82f6', // Tailwind border-primary-600
  },
  tradeTypeText: {
    fontSize: 14, // Tailwind font-medium
    color: '#4b5563', // Tailwind text-gray-700
  },
  selectedTradeTypeText: {
    color: '#ffffff', // Tailwind text-white
  },
  urgencyLevelContainer: {
    marginBottom: 15, // Tailwind mb-6
  },
  urgencyLevelButtons: {
    flexDirection: 'row',
    gap: 12, // Tailwind space-x-3
  },
  urgencyLevelButton: {
    paddingVertical: 8, // Tailwind py-2
    paddingHorizontal: 16, // Tailwind px-4
    borderRadius: 8, // Tailwind rounded-lg
    borderWidth: 1, // Tailwind border
    borderColor: '#d1d5db', // Tailwind border-gray-300
    backgroundColor: '#ffffff', // Tailwind bg-white
  },
  selectedUrgencyLevelButton: {
    backgroundColor: '#3b82f6', // Tailwind bg-primary-600
    borderColor: '#3b82f6', // Tailwind border-primary-600
  },
  urgencyLevelText: {
    fontSize: 14, // Tailwind font-medium
    color: '#4b5563', // Tailwind text-gray-700
  },
  selectedUrgencyLevelText: {
    color: '#ffffff', // Tailwind text-white
  },
  budgetRangeContainer: {
    marginBottom: 15, // Tailwind mb-6
  },
  budgetRangeInputs: {
    flexDirection: 'row',
    gap: 12, // Tailwind space-x-3
  },
  budgetInputContainer: {
    flex: 1,
  },
  preferredDatesContainer: {
    marginBottom: 15, // Tailwind mb-6
  },
  preferredDatesInputs: {
    flexDirection: 'row',
    gap: 12, // Tailwind space-x-3
  },
  preferredDateInputContainer: {
    flex: 1,
  },
  mediaPlaceholderContainer: {
    marginBottom: 15, // Tailwind mb-6
  },
  mediaPlaceholderContent: {
    backgroundColor: '#f3f4f6', // Tailwind bg-gray-100
    borderRadius: 8, // Tailwind rounded-lg
    padding: 16, // Tailwind p-4
  },
  mediaPlaceholderText: {
    fontSize: 14, // Tailwind text-sm
    color: '#6b7280', // Tailwind text-gray-500
    textAlign: 'center', // Tailwind text-center
  },
  tipsContainer: {
    marginTop: 24, // Tailwind mt-6
    backgroundColor: '#dbeafe', // Tailwind bg-blue-50
    borderRadius: 8, // Tailwind rounded-lg
    padding: 16, // Tailwind p-4
    borderWidth: 1, // Tailwind border
    borderColor: '#93c5fd', // Tailwind border-blue-200
  },
  tipsTitle: {
    fontSize: 14, // Tailwind text-sm
    fontWeight: '600', // Tailwind font-semibold
    color: '#1e40af', // Tailwind text-blue-800
    marginBottom: 8, // Tailwind mb-2
  },
  tipsText: {
    fontSize: 13, // Tailwind text-sm
    color: '#1d4ed8', // Tailwind text-blue-700
  },
});
