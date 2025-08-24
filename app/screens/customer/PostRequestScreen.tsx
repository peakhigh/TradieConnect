import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/theme';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ServiceRequest } from '../../types';
import { Calendar, Clock, DollarSign, MapPin, FileText, Plus, X } from 'lucide-react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

const POPULAR_TRADES = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Gardening'
];

const OTHER_TRADES = [
  'Roofing', 'HVAC', 'Flooring', 'General Handyman', 'Tiling', 'Fencing',
  'Demolition', 'Landscaping', 'Pest Control', 'Security Systems'
];

const URGENCY_LEVELS = [
  { label: 'Low', value: 'low', color: '#16a34a' },
  { label: 'Medium', value: 'medium', color: '#ca8a04' },
  { label: 'High', value: 'high', color: '#dc2626' }
];

type TabParamList = {
  Dashboard: undefined;
  PostRequest: undefined;
  History: undefined;
  Profile: undefined;
};

export default function PostRequestScreen() {
  const { user, showSuccessMessage } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [loading, setLoading] = useState(false);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [showOtherTrades, setShowOtherTrades] = useState(false);
  const [showEarliestDatePicker, setShowEarliestDatePicker] = useState(false);
  const [showLatestDatePicker, setShowLatestDatePicker] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  
  const [formData, setFormData] = useState({
    description: '',
    suburb: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
    budgetMin: '',
    budgetMax: '',
    earliestDate: new Date(),
    latestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    additionalNotes: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTrade = (trade: string) => {
    const newTrades = selectedTrades.includes(trade) 
      ? selectedTrades.filter(t => t !== trade)
      : [...selectedTrades, trade];
    
    setSelectedTrades(newTrades);
    
    // Clear trade error if trades are selected
    if (newTrades.length > 0 && errors.trades) {
      setErrors(prev => ({...prev, trades: ''}));
    }
  };

  const handleSubmit = async () => {
    console.log('Form submission started');
    console.log('Selected trades:', selectedTrades);
    console.log('Form data:', formData);
    
    // Validate form
    const newErrors: {[key: string]: string} = {};
    if (selectedTrades.length === 0) {
      newErrors.trades = 'Please select at least one trade type';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.suburb.trim()) {
      newErrors.suburb = 'Suburb is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    console.log('Validation passed, starting submission');
    setLoading(true);
    try {
      const serviceRequest: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        customerId: user!.id,
        customer: user! as any,
        tradeType: selectedTrades.join(', '),
        description: formData.description,
        suburb: formData.suburb,
        urgency: formData.urgency,
        status: 'active',
        photos: [],
        voiceMessage: null, // Fixed: use null instead of undefined
        budget: formData.budgetMin && formData.budgetMax ? {
          min: parseFloat(formData.budgetMin),
          max: parseFloat(formData.budgetMax)
        } : null, // Fixed: use null instead of undefined
        preferredDates: {
          earliest: formData.earliestDate,
          latest: formData.latestDate
        }
      };

      console.log('About to save to Firestore:', serviceRequest);
      
      await addDoc(collection(db, 'serviceRequests'), {
        ...serviceRequest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Successfully saved to Firestore');
      
      // Reset form
      setSelectedTrades([]);
      setFormData({
        description: '',
        suburb: '',
        urgency: 'medium',
        budgetMin: '',
        budgetMax: '',
        earliestDate: new Date(),
        latestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        additionalNotes: ''
      });

      // Navigate to Dashboard and show success message
      console.log('About to navigate and show success message');
      showSuccessMessage('Service request posted successfully!');
      console.log('Success message set, now navigating');
      navigation.navigate('Dashboard');
      console.log('Navigation triggered');

    } catch (error) {
      console.error('Error posting service request:', error);
      Alert.alert('Error', 'Failed to post service request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
        <Text style={styles.title}>Post Service Request</Text>

        {/* Trade Type Multi-Select */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <FileText size={16} color={errors.trades ? "#dc2626" : "#4b5563"} />
            <Text style={[styles.label, errors.trades && styles.errorLabel]}>
              Trade Types * ({selectedTrades.length} selected)
            </Text>
          </View>
          
          {/* Popular Trades */}
          <Text style={styles.subLabel}>Popular</Text>
          <View style={styles.tradeGrid}>
            {POPULAR_TRADES.map((trade) => (
              <TouchableOpacity
                key={trade}
                style={[
                  styles.tradeTag,
                  selectedTrades.includes(trade) && styles.selectedTradeTag
                ]}
                onPress={() => toggleTrade(trade)}
              >
                <Text style={[
                  styles.tradeTagText,
                  selectedTrades.includes(trade) && styles.selectedTradeTagText
                ]}>
                  {trade}
                </Text>
                {selectedTrades.includes(trade) && (
                  <X size={14} color="#ffffff" style={styles.removeIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Other Trades Toggle */}
          <TouchableOpacity
            style={styles.otherTradesToggle}
            onPress={() => setShowOtherTrades(!showOtherTrades)}
          >
            <Text style={styles.otherTradesText}>
              {showOtherTrades ? 'Hide' : 'Show'} Other Trades
            </Text>
            <Plus size={16} color="#3b82f6" style={{ 
              transform: [{ rotate: showOtherTrades ? '45deg' : '0deg' }] 
            }} />
          </TouchableOpacity>

          {/* Other Trades */}
          {showOtherTrades && (
            <View style={styles.tradeGrid}>
              {OTHER_TRADES.map((trade) => (
                <TouchableOpacity
                  key={trade}
                  style={[
                    styles.tradeTag,
                    selectedTrades.includes(trade) && styles.selectedTradeTag
                  ]}
                  onPress={() => toggleTrade(trade)}
                >
                  <Text style={[
                    styles.tradeTagText,
                    selectedTrades.includes(trade) && styles.selectedTradeTagText
                  ]}>
                    {trade}
                  </Text>
                  {selectedTrades.includes(trade) && (
                    <X size={14} color="#ffffff" style={styles.removeIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.trades && <Text style={styles.errorText}>{errors.trades}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <FileText size={16} color={errors.description ? "#dc2626" : "#4b5563"} />
            <Text style={[styles.label, errors.description && styles.errorLabel]}>
              Description *
            </Text>
          </View>
          <Input
            placeholder="Describe the work you need done..."
            value={formData.description}
            onChangeText={(value) => {
              handleInputChange('description', value);
              if (errors.description) {
                setErrors(prev => ({...prev, description: ''}));
              }
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.textAreaInput, errors.description && styles.errorInput]}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Suburb */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <MapPin size={16} color={errors.suburb ? "#dc2626" : "#4b5563"} />
            <Text style={[styles.label, errors.suburb && styles.errorLabel]}>
              Suburb *
            </Text>
          </View>
          <Input
            placeholder="Enter your suburb"
            value={formData.suburb}
            onChangeText={(value) => {
              handleInputChange('suburb', value);
              if (errors.suburb) {
                setErrors(prev => ({...prev, suburb: ''}));
              }
            }}
            style={[styles.standardInput, errors.suburb && styles.errorInput]}
          />
          {errors.suburb && <Text style={styles.errorText}>{errors.suburb}</Text>}
        </View>

        {/* Urgency Level */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Clock size={16} color="#4b5563" />
            <Text style={styles.label}>
              Urgency Level *
            </Text>
          </View>
          <View style={styles.urgencyButtons}>
            {URGENCY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.urgencyButton,
                  formData.urgency === level.value && styles.selectedUrgencyButton
                ]}
                onPress={() => handleInputChange('urgency', level.value)}
              >
                <Text style={[
                  styles.urgencyText,
                  formData.urgency === level.value && styles.selectedUrgencyText
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget Range */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <DollarSign size={16} color="#4b5563" />
            <Text style={styles.label}>
              Budget Range (Optional)
            </Text>
          </View>
          <View style={styles.budgetRow}>
            <View style={styles.budgetInput}>
              <Input
                placeholder="Min $"
                value={formData.budgetMin}
                onChangeText={(value) => handleInputChange('budgetMin', value)}
                keyboardType="numeric"
                style={styles.standardInput}
              />
            </View>
            <Text style={styles.budgetSeparator}>to</Text>
            <View style={styles.budgetInput}>
              <Input
                placeholder="Max $"
                value={formData.budgetMax}
                onChangeText={(value) => handleInputChange('budgetMax', value)}
                keyboardType="numeric"
                style={styles.standardInput}
              />
            </View>
          </View>
        </View>

        {/* Preferred Dates */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Calendar size={16} color="#4b5563" />
            <Text style={styles.label}>
              Preferred Dates
            </Text>
          </View>
          
          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={styles.dateLabel}>Earliest Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEarliestDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formData.earliestDate.toLocaleDateString()}
                </Text>
                <Calendar size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateInput}>
              <Text style={styles.dateLabel}>Latest Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowLatestDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formData.latestDate.toLocaleDateString()}
                </Text>
                <Calendar size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Pickers */}
          {showEarliestDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                mode="single"
                date={formData.earliestDate}
                onChange={(params) => {
                  if (params.date) {
                    handleInputChange('earliestDate', params.date);
                    setShowEarliestDatePicker(false);
                  }
                }}
              />
            </View>
          )}

          {showLatestDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                mode="single"
                date={formData.latestDate}
                onChange={(params) => {
                  if (params.date) {
                    handleInputChange('latestDate', params.date);
                    setShowLatestDatePicker(false);
                  }
                }}
              />
            </View>
          )}
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Input
            label="Additional Notes (Optional)"
            placeholder="Any other details or special requirements..."
            value={formData.additionalNotes}
            onChangeText={(value) => handleInputChange('additionalNotes', value)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.textAreaInput}
          />
        </View>

        {/* Submit Button */}
        <Button
          title="Post Service Request"
          onPress={handleSubmit}
          loading={loading}
          size="large"
          style={styles.submitButton}
        />
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  tradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tradeTag: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedTradeTag: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tradeTagText: {
    fontSize: 14,
    color: '#4b5563',
  },
  selectedTradeTagText: {
    color: '#ffffff',
  },
  removeIcon: {
    marginLeft: 4,
  },
  otherTradesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  otherTradesText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  urgencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectedUrgencyButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  urgencyText: {
    fontSize: 14,
    color: '#4b5563',
  },
  selectedUrgencyText: {
    color: '#ffffff',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetInput: {
    flex: 1,
  },
  budgetSeparator: {
    fontSize: 14,
    color: '#6b7280',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    minHeight: 52,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#1f2937',
  },
  datePickerContainer: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  standardInput: {
    minHeight: 52,
  },
  textAreaInput: {
    minHeight: 100,
  },
  submitButton: {
    marginTop: 20,
  },
  errorLabel: {
    color: '#dc2626',
  },
  errorInput: {
    borderColor: '#dc2626',
    borderWidth: 1,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
});