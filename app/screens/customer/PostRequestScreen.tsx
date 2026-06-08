import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Modal, Pressable } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { Input } from '../../components/UI/Input';
import { Container } from '../../components/UI/Container';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/theme';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { ServiceRequest } from '../../types';
import { Clock, MapPin, FileText, X, Image as ImageIcon, Mic, ArrowLeft, AlertTriangle } from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useScreenNavigation } from '../../navigation/NavigationContext';
import { Audio } from 'expo-av';
import { ProjectLoader } from '../../components/UI/ProjectLoader';
import { FileUpload, FileList, UploadedFile, FileUploadHandle, StagedFile } from '../../commonComponents/FileUpload';
import { TradeSelector } from '../../components/UI/TradeSelector';
import { AudioPlayer } from '../../components/UI/AudioPlayer';
import { secureLog, secureError } from '../../utils/logger';
import { featureFlags } from '../../utils/featureFlags';

// --- Constants ---

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const URGENCY_LEVELS = [
  { label: 'Low', value: 'low', color: '#16a34a' },
  { label: 'Medium', value: 'medium', color: '#ca8a04' },
  { label: 'High', value: 'high', color: '#dc2626' }
];

export default function PostRequestScreen() {
  const { user, showSuccessMessage } = useAuth();
  const navigation = useScreenNavigation();
  let editRequestId: string | undefined;
  try {
    const route = useRoute();
    editRequestId = (route.params as any)?.editRequestId;
  } catch {
    editRequestId = undefined;
  }
  const isEditMode = !!editRequestId;
  const scrollViewRef = useRef<ScrollView>(null);
  const fileUploadRef = useRef<FileUploadHandle>(null);
  const [scrollKey, setScrollKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

  // Error modal state (cross-platform replacement for Alert.alert)
  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false, title: '', message: ''
  });

  // Autofill support
  const autofillData = (() => {
    try {
      const { getAutofillData } = require('../../utils/testAutofill');
      return getAutofillData('serviceRequest');
    } catch { return null; }
  })();
  
  const { control, watch, reset, setValue } = useForm({
    defaultValues: {
      description: autofillData?.description || '',
      postcode: autofillData?.postcode || user?.postcode || '',
      urgency: (autofillData?.urgency || 'medium') as 'low' | 'medium' | 'high',
    }
  });

  const [autofilledTrades] = useState<string[]>(autofillData?.trades || []);
  
  // Already uploaded files (for edit mode — files that are already in Storage)
  const [existingFiles, setExistingFiles] = useState<UploadedFile[]>([]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [recording, setRecording] = useState<any>(null);

  const formData = watch();

  // Total file count (existing + staged)
  const totalFileCount = existingFiles.length + stagedFiles.length;

  // --- Lifecycle ---

  useEffect(() => {
    if (!autofillData) {
      setSelectedTrades([]);
    } else {
      setSelectedTrades(autofilledTrades);
    }
    setStagedFiles([]);
    setExistingFiles([]);
    setVoiceMessage(null);
    setErrors({});
    reset({
      description: '',
      postcode: user?.postcode || '',
      urgency: 'medium',
    });
    
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, 100);
    
    if (isEditMode && editRequestId) {
      loadRequestData(editRequestId);
    }
  }, [isEditMode, editRequestId]);

  useEffect(() => {
    if (navigation && 'addListener' in navigation) {
      const unsubscribe = (navigation as any).addListener('focus', () => {
        setScrollKey(prev => prev + 1);
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        }, 100);
      });
      return unsubscribe;
    }
  }, [navigation]);
  
  // --- Load Edit Data ---

  const loadRequestData = async (requestId: string) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase');
      
      const requestDoc = await getDoc(doc(db, 'serviceRequests', requestId));
      if (requestDoc.exists()) {
        const data = requestDoc.data();
        secureLog('Loading request data:', data);
        
        setValue('description', data.description || '');
        setValue('postcode', data.postcode || '');
        setValue('urgency', data.urgency || 'medium');
        
        if (data.trades && Array.isArray(data.trades)) {
          setSelectedTrades(data.trades);
        } else if (data.tradeType) {
          if (Array.isArray(data.tradeType)) {
            setSelectedTrades(data.tradeType);
          } else {
            setSelectedTrades(data.tradeType.split(', '));
          }
        }
        
        // Load existing files (already uploaded to Storage)
        const files: UploadedFile[] = [];
        if (data.photos && data.photos.length > 0) {
          files.push(...data.photos.map((url: string, index: number) => ({
            downloadURL: url,
            name: `photo_${index + 1}.jpg`,
            type: 'image/jpeg',
            size: 0,
            uploadedAt: '',
          })));
        }
        if (data.documents && data.documents.length > 0) {
          files.push(...data.documents.map((url: string, index: number) => ({
            downloadURL: url,
            name: `document_${index + 1}`,
            type: 'application/octet-stream',
            size: 0,
            uploadedAt: '',
          })));
        }
        setExistingFiles(files);
        
        if (data.voiceMessage) {
          setVoiceMessage(data.voiceMessage);
        }
        
        secureLog('Data loaded successfully');
      } else {
        showError('Error', 'Request not found');
      }
    } catch (error) {
      secureError('Error loading request data:', error);
      showError('Error', 'Failed to load request data');
    }
  };

  // --- Helpers ---

  const showError = (title: string, message: string) => {
    setErrorModal({ visible: true, title, message });
  };

  const handleFileError = (error: Error) => {
    secureError('File upload/pick error:', error.message);
    showError('File Error', error.message);
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- Voice Recording ---

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
      showError('Recording Error', 'Failed to start voice recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setVoiceMessage(uri);
    
    if (errors.description) {
      setErrors(prev => ({...prev, description: ''}));
    }
  };

  const deleteVoiceMessage = () => {
    setVoiceMessage(null);
  };

  // --- Validation ---

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Trade types - required
    if (selectedTrades.length === 0) {
      newErrors.trades = 'Please select at least one trade type';
    }

    // Description - required (unless voice message)
    if (!formData.description.trim() && !voiceMessage) {
      newErrors.description = 'Please describe the work or record a voice message';
    } else if (formData.description.trim() && formData.description.trim().length < 10) {
      newErrors.description = 'Please provide at least 10 characters describing the work';
    }

    // Postcode - required + format validation (Australian: 4 digits)
    const postcode = formData.postcode.trim();
    if (!postcode) {
      newErrors.postcode = 'Postcode is required';
    } else if (!/^\d{4}$/.test(postcode)) {
      newErrors.postcode = 'Enter a valid 4-digit Australian postcode';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Scroll to top to show errors
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return false;
    }

    return true;
  };

  // --- Submit ---

  const onSubmit = async () => {
    secureLog('Form submission started');
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const descriptionStr = formData.description.trim();
      
      // 1. Upload staged files (deferred upload)
      let newlyUploadedFiles: UploadedFile[] = [];
      if (stagedFiles.length > 0 && fileUploadRef.current) {
        newlyUploadedFiles = await fileUploadRef.current.uploadStagedFiles();
      }

      // 2. Combine existing files + newly uploaded files
      const allFiles = [...existingFiles, ...newlyUploadedFiles];
      const photos = allFiles.filter(f => f.type.startsWith('image/')).map(f => f.downloadURL);
      const documents = allFiles.filter(f => !f.type.startsWith('image/')).map(f => f.downloadURL);

      // 3. Upload voice message if exists
      let uploadedVoiceMessage: string | null = null;
      if (voiceMessage) {
        if (featureFlags.useMocks) {
          uploadedVoiceMessage = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        } else if (voiceMessage.startsWith('https://firebasestorage.googleapis.com')) {
          uploadedVoiceMessage = voiceMessage;
        } else {
          try {
            const response = await fetch(voiceMessage);
            const blob = await response.blob();
            const fileName = `voice_${Date.now()}.m4a`;
            const storageRef = ref(storage, `service-requests/${user!.id}/${Date.now()}/${fileName}`);
            await uploadBytes(storageRef, blob);
            uploadedVoiceMessage = await getDownloadURL(storageRef);
          } catch (error) {
            secureError('Error uploading voice message:', error);
          }
        }
      }

      // 4. Build service request document
      const serviceRequest: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        customerId: user!.id,
        trades: selectedTrades,
        description: descriptionStr,
        postcode: formData.postcode.trim(),
        urgency: formData.urgency,
        status: 'new',
        photos,
        documents,
        voiceMessage: uploadedVoiceMessage,
        searchKeywords: [
          ...selectedTrades.map(trade => trade.toLowerCase()),
          ...descriptionStr.toLowerCase().split(/\s+/).filter(word => word.length > 2),
          formData.postcode.trim()
        ].filter((word, index, arr) => arr.indexOf(word) === index),
        notesWords: descriptionStr.toLowerCase().split(/\s+/).filter(word => word.length > 2),
        descriptionLower: descriptionStr.toLowerCase()
      };

      // 5. Save to Firestore
      if (isEditMode && editRequestId) {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'serviceRequests', editRequestId), {
          ...serviceRequest,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'serviceRequests'), {
          ...serviceRequest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // 6. Reset & navigate
      if (!isEditMode) {
        setSelectedTrades([]);
        reset({ description: '', postcode: user?.postcode || '', urgency: 'medium' });
        setStagedFiles([]);
        setExistingFiles([]);
        setVoiceMessage(null);
      }

      showSuccessMessage(isEditMode ? 'Service request updated successfully!' : 'Service request posted successfully!');
      navigation.navigate('Dashboard');

    } catch (error) {
      secureError('Error posting service request:', error);
      showError('Submission Failed', 'Failed to post service request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---

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
              if (trades.length > 0 && errors.trades) {
                setErrors(prev => ({...prev, trades: ''}));
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
          <Text style={styles.helpText}>Describe the work you need done (min 10 characters) or record a voice message</Text>
          <View style={styles.notesContainer}>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Describe the work you need done..."
                  value={value}
                  onChangeText={(text: string) => {
                    onChange(text);
                    if (text.trim().length >= 10 && errors.description) {
                      setErrors(prev => ({...prev, description: ''}));
                    }
                  }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={[styles.textAreaInput, errors.description && styles.errorInput]}
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
              <AudioPlayer audioUrl={voiceMessage} style={styles.audioPlayer} />
              <TouchableOpacity style={styles.deleteButton} onPress={deleteVoiceMessage}>
                <X size={16} color="#dc2626" />
              </TouchableOpacity>
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
                placeholder="e.g. 2000"
                value={value}
                onChangeText={(text: string) => {
                  // Only allow digits, max 4
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
                  onChange(cleaned);
                  if (/^\d{4}$/.test(cleaned) && errors.postcode) {
                    setErrors(prev => ({...prev, postcode: ''}));
                  }
                }}
                keyboardType="numeric"
                maxLength={4}
                style={[styles.standardInput, errors.postcode && styles.errorInput]}
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
            <Text style={styles.label}>Urgency Level</Text>
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
              Photos & Documents ({totalFileCount}/{MAX_FILES})
            </Text>
          </View>
          <Text style={styles.helpText}>
            Upload up to {MAX_FILES} files (max {MAX_FILE_SIZE / (1024 * 1024)}MB each). Photos, PDFs, and documents accepted.
          </Text>
          
          <FileUpload
            ref={fileUploadRef}
            deferUpload={true}
            onFilesChange={setStagedFiles}
            onError={handleFileError}
            uploadPath="service-requests"
            multiple={true}
            maxFiles={MAX_FILES}
            maxFileSize={MAX_FILE_SIZE}
            currentFileCount={existingFiles.length + stagedFiles.length}
            text="Upload Photos/Files"
          />

          {/* Show existing files (edit mode) */}
          <FileList
            files={existingFiles}
            onRemove={removeExistingFile}
          />
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
      
      {loading && <ProjectLoader message="Uploading files and submitting request..." />}

      {/* Error Modal (cross-platform replacement for Alert.alert) */}
      <Modal visible={errorModal.visible} transparent animationType="fade" onRequestClose={() => setErrorModal(prev => ({...prev, visible: false}))}>
        <Pressable style={styles.modalOverlay} onPress={() => setErrorModal(prev => ({...prev, visible: false}))}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalIconCircle}>
                <AlertTriangle size={24} color="#DC2626" />
              </View>
            </View>
            <Text style={styles.modalTitle}>{errorModal.title}</Text>
            <Text style={styles.modalSubtitle}>{errorModal.message}</Text>
            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setErrorModal(prev => ({...prev, visible: false}))}
              activeOpacity={0.7}
            >
              <Text style={styles.modalDismissBtnText}>OK</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
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
    marginTop: 8,
    gap: 8,
  },
  audioPlayer: {
    flex: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Error Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconRow: { alignItems: 'center', marginBottom: 12 },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalDismissBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  modalDismissBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
