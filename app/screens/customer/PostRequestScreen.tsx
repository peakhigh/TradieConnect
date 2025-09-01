import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/theme';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { ServiceRequest } from '../../types';
import { Calendar, Clock, DollarSign, MapPin, FileText, Plus, X, Camera, Image as ImageIcon, Mic, ArrowLeft } from 'lucide-react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { ProjectLoader } from '../../components/UI/ProjectLoader';
import { FileUpload } from '../../components/UI/FileUpload';
import { TradeSelector } from '../../components/UI/TradeSelector';

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
  const route = useRoute();
  const editRequestId = route.params?.editRequestId;
  const isEditMode = !!editRequestId;
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollKey, setScrollKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);

  const [showEarliestDatePicker, setShowEarliestDatePicker] = useState(false);
  const [showLatestDatePicker, setShowLatestDatePicker] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  
  const { control, handleSubmit, watch, formState: { errors: formErrors }, setError, clearErrors, reset, setValue } = useForm({
    defaultValues: {
      description: '',
      postcode: user?.postcode || '',
      urgency: 'medium' as 'low' | 'medium' | 'high',
      budgetMin: '',
      budgetMax: '',
      earliestDate: new Date(),
      latestDate: new Date(Date.now() + 7 * 60 * 60 * 1000),
      additionalNotes: ''
    }
  });
  
  // Clear form data on every load, then load edit data if needed
  useEffect(() => {
    // Always clear form first
    setSelectedTrades([]);
    setSelectedFiles([]);
    setVoiceMessage(null);
    setErrors({});
    reset({
      description: '',
      postcode: user?.postcode || '',
      urgency: 'medium',
      budgetMin: '',
      budgetMax: '',
      earliestDate: new Date(),
      latestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      additionalNotes: ''
    });
    
    // Scroll to top
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, 100);
    
    // Then load edit data if in edit mode
    if (isEditMode && editRequestId) {
      loadRequestData(editRequestId);
    }
  }, [isEditMode, editRequestId]);
  
  const loadRequestData = async (requestId: string) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase');
      
      const requestDoc = await getDoc(doc(db, 'serviceRequests', requestId));
      if (requestDoc.exists()) {
        const data = requestDoc.data();
        console.log('Loading request data:', data);
        
        // Set form values
        setValue('description', data.description || '');
        setValue('postcode', data.postcode || '');
        setValue('urgency', data.urgency || 'medium');
        setValue('budgetMin', data.budget?.min?.toString() || '');
        setValue('budgetMax', data.budget?.max?.toString() || '');
        
        // Handle dates - check if they're Firestore timestamps or Date objects
        const earliestDate = data.preferredDates?.earliest;
        const latestDate = data.preferredDates?.latest;
        
        setValue('earliestDate', earliestDate?.toDate ? earliestDate.toDate() : (earliestDate || new Date()));
        setValue('latestDate', latestDate?.toDate ? latestDate.toDate() : (latestDate || new Date()));
        
        // Set selected trades
        if (data.tradeType) {
          setSelectedTrades(data.tradeType.split(', '));
        }
        
        // Set files (photos and documents)
        const files = [];
        if (data.photos && data.photos.length > 0) {
          files.push(...data.photos.map((url: string, index: number) => ({
            uri: url,
            name: `photo_${index + 1}.jpg`,
            type: 'image'
          })));
        }
        if (data.documents && data.documents.length > 0) {
          files.push(...data.documents.map((url: string, index: number) => ({
            uri: url,
            name: `document_${index + 1}`,
            type: 'document'
          })));
        }
        setSelectedFiles(files);
        console.log('Loaded files:', files);
        
        // Set voice message
        if (data.voiceMessage) {
          setVoiceMessage(data.voiceMessage);
          console.log('Loaded voice message:', data.voiceMessage);
        }
        
        console.log('Data loaded successfully');
      } else {
        console.log('Request document not found');
        Alert.alert('Error', 'Request not found');
      }
    } catch (error) {
      console.error('Error loading request data:', error);
      Alert.alert('Error', 'Failed to load request data');
    }
  };
  
  const formData = watch();
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [recording, setRecording] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setScrollKey(prev => prev + 1);
      // Scroll to top when screen is focused
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }, 100);
    });

    return unsubscribe;
  }, [navigation]);





  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const file = {
        uri: result.assets[0].uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image'
      };
      setSelectedFiles(prev => [...prev, file]);
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf,.doc,.docx,.txt';
      input.multiple = true;
      input.style.display = 'none';
      
      input.onchange = (e: any) => {
        const files = Array.from(e.target.files || []);
        const fileObjs = files.map((file: any, index: number) => {
          const isImage = file.type.startsWith('image/');
          return {
            uri: URL.createObjectURL(file),
            name: file.name || `file_${Date.now()}_${index}`,
            type: isImage ? 'image' : 'document'
          };
        });
        setSelectedFiles(prev => [...prev, ...fileObjs]);
        document.body.removeChild(input);
      };
      
      document.body.appendChild(input);
      input.click();
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Media library permission is required to pick images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const files = result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
          type: 'image'
        }));
        setSelectedFiles(prev => [...prev, ...files]);
      }
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
      });

      if (!result.canceled) {
        const files = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          type: 'document'
        }));
        setSelectedFiles(prev => [...prev, ...files]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setVoiceMessage(uri);
    
    // Clear description error if voice message is recorded
    if (errors.description) {
      setErrors(prev => ({...prev, description: ''}));
    }
  };

  const playVoiceMessage = async () => {
    if (!voiceMessage) return;
    const { sound } = await Audio.Sound.createAsync({ uri: voiceMessage });
    await sound.playAsync();
  };

  const deleteVoiceMessage = () => {
    setVoiceMessage(null);
  };

  const onSubmit = async () => {
    console.log('Form submission started');
    console.log('Selected trades:', selectedTrades);
    console.log('Form data:', formData);
    
    // Validate form
    const newErrors: {[key: string]: string} = {};
    if (selectedTrades.length === 0) {
      newErrors.trades = 'Please select at least one trade type';
    }
    if (!formData.description.trim() && !voiceMessage) {
      newErrors.description = 'Notes or voice message is required';
    }
    if (!formData.postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    console.log('Validation passed, starting submission');
    setLoading(true);
    try {
      const tradeTypeStr = selectedTrades.join(', ');
      const descriptionStr = formData.description;
      
      const serviceRequest: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        customerId: user!.id,
        customer: user! as any,
        tradeType: tradeTypeStr,
        description: descriptionStr,
        postcode: formData.postcode,
        urgency: formData.urgency,
        status: 'active',
        photos: selectedFiles.map(file => file.uri),
        documents: selectedFiles.filter(file => file.type === 'document').map(file => file.uri),
        voiceMessage: null,
        budget: formData.budgetMin && formData.budgetMax ? {
          min: parseFloat(formData.budgetMin),
          max: parseFloat(formData.budgetMax)
        } : null,
        preferredDates: {
          earliest: formData.earliestDate,
          latest: formData.latestDate
        },
        // Computed search fields for array-contains-any search
        searchKeywords: [
          ...tradeTypeStr.toLowerCase().split(/[\s,]+/).filter(word => word.length > 0),
          ...descriptionStr.toLowerCase().split(/\s+/).filter(word => word.length > 0),
          tradeTypeStr.toLowerCase(), // Full trade type for exact/partial match
          descriptionStr.toLowerCase(), // Full description for exact/partial match
          formData.postcode.toLowerCase()
        ].filter((word, index, arr) => arr.indexOf(word) === index), // Remove duplicates
        notesWords: descriptionStr.toLowerCase().split(/\s+/).filter(word => word.length > 0),
        tradeTypeLower: tradeTypeStr.toLowerCase(),
        descriptionLower: descriptionStr.toLowerCase()
      };

      console.log('About to upload files and save to Firestore:', serviceRequest);
      
      // Upload files to Firebase Storage
      const uploadedPhotos = [];
      const uploadedDocuments = [];
      let uploadedVoiceMessage = null;
      
      for (const file of selectedFiles) {
        try {
          // Skip uploading if it's already a Firebase Storage URL
          if (file.uri.startsWith('https://firebasestorage.googleapis.com')) {
            if (file.type === 'image') {
              uploadedPhotos.push(file.uri);
            } else {
              uploadedDocuments.push(file.uri);
            }
            continue;
          }
          
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const fileName = `${Date.now()}_${file.name}`;
          const storageRef = ref(storage, `service-requests/${user!.id}/${Date.now()}/${fileName}`);
          
          await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(storageRef);
          
          if (file.type === 'image') {
            uploadedPhotos.push(downloadURL);
          } else {
            uploadedDocuments.push(downloadURL);
          }
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
        }
      }
      
      // Upload voice message if exists
      if (voiceMessage) {
        try {
          // Skip uploading if it's already a Firebase Storage URL
          if (voiceMessage.startsWith('https://firebasestorage.googleapis.com')) {
            uploadedVoiceMessage = voiceMessage;
          } else {
            const response = await fetch(voiceMessage);
            const blob = await response.blob();
            const fileName = `voice_${Date.now()}.m4a`;
            const storageRef = ref(storage, `service-requests/${user!.id}/${Date.now()}/${fileName}`);
            
            await uploadBytes(storageRef, blob);
            uploadedVoiceMessage = await getDownloadURL(storageRef);
          }
        } catch (error) {
          console.error('Error uploading voice message:', error);
        }
      }
      
      // Update service request with uploaded file URLs
      serviceRequest.photos = uploadedPhotos;
      serviceRequest.documents = uploadedDocuments;
      serviceRequest.voiceMessage = uploadedVoiceMessage;
      
      if (isEditMode && editRequestId) {
        // Update existing request
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'serviceRequests', editRequestId), {
          ...serviceRequest,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new request
        await addDoc(collection(db, 'serviceRequests'), {
          ...serviceRequest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      console.log(isEditMode ? 'Successfully updated request' : 'Successfully saved to Firestore');
      
      // Add mock service request to localStorage for demo
      const mockRequest = {
        id: `req_${Date.now()}`,
        customerId: user!.id,
        tradeType: selectedTrades.join(', '),
        description: formData.description,
        postcode: formData.postcode,
        urgency: formData.urgency,
        status: 'active',
        createdAt: new Date(),
        photos: [], // Will be populated after upload
        documents: [], // Will be populated after upload
        budget: formData.budgetMin && formData.budgetMax ? {
          min: parseFloat(formData.budgetMin),
          max: parseFloat(formData.budgetMax)
        } : null,
        preferredDates: {
          earliest: formData.earliestDate,
          latest: formData.latestDate
        }
      };
      
      // Store in localStorage for demo
      if (typeof window !== 'undefined' && window.localStorage) {
        const existingRequests = JSON.parse(localStorage.getItem('mock_service_requests') || '[]');
        existingRequests.push(mockRequest);
        localStorage.setItem('mock_service_requests', JSON.stringify(existingRequests));
      }
      
      // Reset form only if not in edit mode
      if (!isEditMode) {
        setSelectedTrades([]);
        reset({
          description: '',
          postcode: user?.postcode || '',
          urgency: 'medium',
          budgetMin: '',
          budgetMax: '',
          earliestDate: new Date(),
          latestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          additionalNotes: ''
        });
        setSelectedFiles([]);
        setVoiceMessage(null);
      }

      // Navigate to Dashboard and show success message
      console.log('About to navigate and show success message');
      showSuccessMessage(isEditMode ? 'Service request updated successfully!' : 'Service request posted successfully!');
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
      <ScrollView 
        key={scrollKey}
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <ArrowLeft size={20} color={theme.colors.text.secondary} />
            <Text style={styles.backButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isEditMode ? 'Edit Service Request' : 'Post Service Request'}</Text>
        </View>

        {/* Trade Type Multi-Select */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <FileText size={16} color={errors.trades ? "#dc2626" : "#4b5563"} />
            <Text style={[styles.label, errors.trades && styles.errorLabel]}>
              Trade Types * ({selectedTrades.length} selected)
            </Text>
          </View>
          
          <TradeSelector
            selectedTrades={selectedTrades}
            onTradesChange={(trades) => {
              setSelectedTrades(trades);
              // Clear trade error if trades are selected
              if (trades.length > 0 && errors.trades) {
                setTimeout(() => {
                  setErrors(prev => ({...prev, trades: ''}));
                }, 0);
              }
            }}
            error={errors.trades}
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <FileText size={16} color={errors.description ? "#dc2626" : "#4b5563"} />
            <Text style={[styles.label, errors.description && styles.errorLabel]}>
              Notes *
            </Text>
          </View>
          <View style={styles.notesContainer}>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Describe the work you need done..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={[styles.textAreaInput, errors.description && styles.errorInput]}
                  onSubmitEditing={() => onSubmit()}
                  returnKeyType="done"
                />
              )}
            />
            <TouchableOpacity 
              style={[styles.micButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Mic size={20} color={isRecording ? "#ffffff" : "#3b82f6"} />
            </TouchableOpacity>
          </View>
          {voiceMessage && (
            <View style={styles.voiceMessage}>
              <Text>Voice message recorded</Text>
              <View style={styles.voiceControls}>
                <TouchableOpacity style={styles.voiceButton} onPress={playVoiceMessage}>
                  <Text>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.voiceButton} onPress={deleteVoiceMessage}>
                  <Text>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Postcode */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <MapPin size={16} color={errors.postcode ? "#dc2626" : "#4b5563"} />
            <Text style={[styles.label, errors.postcode && styles.errorLabel]}>
              Postcode *
            </Text>
          </View>
          <Controller
            control={control}
            name="postcode"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Enter your postcode"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                style={[styles.standardInput, errors.postcode && styles.errorInput]}
                onSubmitEditing={() => onSubmit()}
                returnKeyType="done"
              />
            )}
          />
          {errors.postcode && <Text style={styles.errorText}>{errors.postcode}</Text>}
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
                onPress={() => setValue('urgency', level.value)}
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







        {/* Photos & Documents */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <ImageIcon size={16} color="#4b5563" />
            <Text style={styles.label}>
              Photos & Documents (Optional)
            </Text>
          </View>
          
          <FileUpload
            onTakePhoto={handleTakePhoto}
            onPickImage={handlePickImage}
            onPickDocument={handlePickDocument}
          />
          
          {selectedFiles.length > 0 && (
            <View style={styles.selectedFiles}>
              {selectedFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name || `File ${index + 1}`}
                  </Text>
                  <TouchableOpacity onPress={() => removeFile(index)}>
                    <X size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>



        {/* Submit Button */}
        <Button
          title={isEditMode ? 'Update Request' : 'Post Service Request'}
          onPress={onSubmit}
          loading={loading}
          size="large"
          style={styles.submitButton}
        />
      </ScrollView>
      

      {loading && <ProjectLoader message="Uploading files and creating request..." />}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    minHeight: Platform.OS === 'web' ? 48 : 44,
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
    minHeight: Platform.OS === 'web' ? 48 : 44,
  },
  textAreaInput: {
    minHeight: Platform.OS === 'web' ? 120 : 100,
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
  fileButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
  },
  fileButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  selectedFiles: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  notesContainer: {
    position: 'relative',
  },
  micButton: {
    position: 'absolute',
    bottom: 20,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  recordingButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  voiceControls: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
});