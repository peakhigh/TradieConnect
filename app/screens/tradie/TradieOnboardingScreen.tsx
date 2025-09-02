import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Container } from '../../components/UI/Container';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';
import { theme } from '../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { PersonalDetailsStep } from './onboarding/PersonalDetailsStep';
import { BusinessDetailsStep } from './onboarding/BusinessDetailsStep';
import { ContractorDetailsStep } from './onboarding/ContractorDetailsStep';
import { InsuranceDetailsStep } from './onboarding/InsuranceDetailsStep';
import InterestsStep from './onboarding/InterestsStep';
import { OnboardingSuccessStep } from './onboarding/OnboardingSuccessStep';
import { useAuth } from '../../context/AuthContext';

interface OnboardingData {
  personalDetails: {
    firstName: string;
    lastName: string;
    email: string;
    businessType: 'business' | 'sole_trader';
  };
  businessDetails: {
    abn: string;
    businessName: string;
    streetAddress: string;
    suburb: string;
    state: string;
    postcode: string;
  };
  contractorDetails: {
    licenceNumber: string;
    nameOnLicence: string;
    licenceClass: string;
    licenceExpiry: Date;
  };
  insuranceDetails: {
    policyNumber: string;
    policyHolderName: string;
    expiryDate: Date;
    liabilityLimit: string;
  };
  interests: {
    interestedSuburbs: string[];
    interestedTrades: string[];
  };
}

const steps = [
  { id: 1, title: 'Personal', shortTitle: 'Personal' },
  { id: 2, title: 'Business', shortTitle: 'Business' },
  { id: 3, title: 'Contractor', shortTitle: 'License' },
  { id: 4, title: 'Insurance', shortTitle: 'Insurance' },
  { id: 5, title: 'Interests', shortTitle: 'Interests' },
];

interface TradieOnboardingScreenProps {
  isEditMode?: boolean;
  existingData?: any;
  onComplete?: () => void;
}

export default function TradieOnboardingScreen({ 
  isEditMode = false, 
  existingData = null, 
  onComplete 
}: TradieOnboardingScreenProps) {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Initialize with existing data if in edit mode
  const getInitialData = (): OnboardingData => {
    if (isEditMode && existingData) {
      return {
        personalDetails: {
          firstName: existingData.firstName || '',
          lastName: existingData.lastName || '',
          email: existingData.email || '',
          businessType: existingData.businessType || 'sole_trader'
        },
        businessDetails: {
          abn: existingData.abn || '',
          businessName: existingData.businessName || '',
          streetAddress: existingData.businessAddress?.streetAddress || '',
          suburb: existingData.businessAddress?.suburb || '',
          state: existingData.businessAddress?.state || '',
          postcode: existingData.businessAddress?.postcode || ''
        },
        contractorDetails: {
          licenceNumber: existingData.licenceDetails?.licenceNumber || '',
          nameOnLicence: existingData.licenceDetails?.nameOnLicence || '',
          licenceClass: existingData.licenceDetails?.licenceClass || '',
          licenceExpiry: existingData.licenceDetails?.licenceExpiry ? 
            (existingData.licenceDetails.licenceExpiry.toDate ? existingData.licenceDetails.licenceExpiry.toDate() : new Date(existingData.licenceDetails.licenceExpiry)) 
            : new Date()
        },
        insuranceDetails: {
          policyNumber: existingData.insuranceDetails?.policyNumber || '',
          policyHolderName: existingData.insuranceDetails?.policyHolderName || '',
          expiryDate: existingData.insuranceDetails?.expiryDate ? 
            (existingData.insuranceDetails.expiryDate.toDate ? existingData.insuranceDetails.expiryDate.toDate() : new Date(existingData.insuranceDetails.expiryDate)) 
            : new Date(),
          liabilityLimit: existingData.insuranceDetails?.liabilityLimit || ''
        },
        interests: {
          interestedSuburbs: existingData.interestedSuburbs || [],
          interestedTrades: existingData.interestedTrades || []
        }
      };
    }
    
    return {
      personalDetails: {
        firstName: '',
        lastName: '',
        email: '',
        businessType: 'sole_trader'
      },
      businessDetails: {
        abn: '',
        businessName: '',
        streetAddress: '',
        suburb: '',
        state: '',
        postcode: ''
      },
      contractorDetails: {
        licenceNumber: '',
        nameOnLicence: '',
        licenceClass: '',
        licenceExpiry: new Date()
      },
      insuranceDetails: {
        policyNumber: '',
        policyHolderName: '',
        expiryDate: new Date(),
        liabilityLimit: ''
      },
      interests: {
        interestedSuburbs: [],
        interestedTrades: []
      }
    };
  };
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(getInitialData());

  const updateData = React.useCallback((stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
  }, []);

  const handleNext = async () => {
    // Validate current step data
    const currentData = getCurrentStepData();
    console.log('Current step:', currentStep, 'Data:', currentData);
    const isValid = validateCurrentStep(currentData);
    console.log('Validation result:', isValid);
    
    if (!isValid) {
      // Trigger error display for current step
      console.log('Setting validation trigger from', validationTrigger, 'to', validationTrigger + 1);
      setValidationTrigger(prev => prev + 1);
      return; // Don't proceed if validation fails
    }

    // Save data if on step 5
    if (currentStep === 5) {
      await saveOnboardingData();
      if (isEditMode && onComplete) {
        onComplete();
        return;
      }
    }

    // Reset validation trigger when moving to next step
    setValidationTrigger(0);
    
    if (currentStep === 1 && onboardingData.personalDetails.businessType === 'sole_trader') {
      setCurrentStep(3); // Skip business details for sole traders
    } else if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const [validationTrigger, setValidationTrigger] = useState(0);

  const { user, refreshUser } = useAuth();
  
  const saveOnboardingData = async () => {
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase');
      
      console.log('Saving onboarding data for user:', user.id);
      const userDocRef = doc(db, 'users', user.id);
      const updateData = {
        firstName: onboardingData.personalDetails.firstName,
        lastName: onboardingData.personalDetails.lastName,
        email: onboardingData.personalDetails.email,
        businessType: onboardingData.personalDetails.businessType,
        ...(onboardingData.personalDetails.businessType === 'business' ? {
          abn: onboardingData.businessDetails?.abn || '',
          businessName: onboardingData.businessDetails?.businessName || '',
          businessAddress: {
            streetAddress: onboardingData.businessDetails?.streetAddress || '',
            suburb: onboardingData.businessDetails?.suburb || '',
            state: onboardingData.businessDetails?.state || '',
            postcode: onboardingData.businessDetails?.postcode || '',
          }
        } : {}),
        licenceDetails: {
          licenceNumber: onboardingData.contractorDetails.licenceNumber,
          nameOnLicence: onboardingData.contractorDetails.nameOnLicence,
          licenceClass: onboardingData.contractorDetails.licenceClass,
          licenceExpiry: onboardingData.contractorDetails.licenceExpiry,
        },
        insuranceDetails: {
          policyNumber: onboardingData.insuranceDetails.policyNumber,
          policyHolderName: onboardingData.insuranceDetails.policyHolderName,
          expiryDate: onboardingData.insuranceDetails.expiryDate,
          liabilityLimit: onboardingData.insuranceDetails.liabilityLimit,
        },
        interestedSuburbs: onboardingData.interests.interestedSuburbs,
        interestedTrades: onboardingData.interests.interestedTrades,
        onboardingCompleted: true,
        updatedAt: new Date(),
      };

      console.log('Update data:', updateData);
      await updateDoc(userDocRef, updateData);
      console.log('Onboarding data saved successfully');
      
      // Refresh user data in context
      await refreshUser();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  const getCurrentStepData = () => {
    switch (currentStep) {
      case 1: return onboardingData.personalDetails;
      case 2: return onboardingData.businessDetails;
      case 3: return onboardingData.contractorDetails;
      case 4: return onboardingData.insuranceDetails;
      case 5: return onboardingData.interests;
      default: return {};
    }
  };

  const validateCurrentStep = (data: any) => {
    let isValid = true;
    let errorMessage = '';

    switch (currentStep) {
      case 1:
        if (!data.firstName?.trim()) {
          errorMessage = 'First name is required';
          isValid = false;
        } else if (!data.lastName?.trim()) {
          errorMessage = 'Last name is required';
          isValid = false;
        } else if (!data.email?.trim()) {
          errorMessage = 'Email is required';
          isValid = false;
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(data.email)) {
          errorMessage = 'Please enter a valid email address';
          isValid = false;
        } else if (!data.businessType) {
          errorMessage = 'Business type is required';
          isValid = false;
        }
        break;
      case 2:
        if (!data.abn) {
          errorMessage = 'ABN is required';
          isValid = false;
        } else if (!data.businessName) {
          errorMessage = 'Business name is required';
          isValid = false;
        } else if (!data.streetAddress) {
          errorMessage = 'Street address is required';
          isValid = false;
        } else if (!data.suburb) {
          errorMessage = 'Suburb is required';
          isValid = false;
        } else if (!data.state) {
          errorMessage = 'State is required';
          isValid = false;
        } else if (!data.postcode) {
          errorMessage = 'Postcode is required';
          isValid = false;
        }
        break;
      case 3:
        if (!data.licenceNumber) {
          errorMessage = 'Licence number is required';
          isValid = false;
        } else if (!data.nameOnLicence) {
          errorMessage = 'Name on licence is required';
          isValid = false;
        } else if (!data.licenceClass) {
          errorMessage = 'Licence class is required';
          isValid = false;
        } else if (!data.licenceExpiry) {
          errorMessage = 'Licence expiry is required';
          isValid = false;
        }
        break;
      case 4:
        if (!data.policyNumber) {
          errorMessage = 'Policy number is required';
          isValid = false;
        } else if (!data.policyHolderName) {
          errorMessage = 'Policy holder name is required';
          isValid = false;
        } else if (!data.expiryDate) {
          errorMessage = 'Expiry date is required';
          isValid = false;
        } else if (!data.liabilityLimit) {
          errorMessage = 'Liability limit is required';
          isValid = false;
        }
        break;
      case 5:
        if (!data.interestedSuburbs?.length) {
          errorMessage = 'Please select at least one suburb';
          isValid = false;
        } else if (!data.interestedTrades?.length) {
          errorMessage = 'Please select at least one trade';
          isValid = false;
        }
        break;
      default:
        isValid = true;
    }



    return isValid;
  };

  const handlePrevious = () => {
    // Reset validation trigger when moving to previous step
    setValidationTrigger(0);
    
    if (currentStep === 3 && onboardingData.personalDetails.businessType === 'sole_trader') {
      setCurrentStep(1); // Skip business details for sole traders
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => {
    const visibleSteps = onboardingData.personalDetails.businessType === 'sole_trader' 
      ? steps.filter(step => step.id !== 2)
      : steps;

    return (
      <View style={styles.stepIndicator}>
        {visibleSteps.map((step, index) => {
          let displayStep = step.id;
          if (onboardingData.personalDetails.businessType === 'sole_trader' && step.id > 2) {
            displayStep = step.id - 1;
          }
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isCompleted && styles.stepCircleCompleted
              ]}>
                <Text style={[
                  styles.stepNumber,
                  (isActive || isCompleted) && styles.stepNumberActive
                ]}>
                  {displayStep}
                </Text>
              </View>
              <Text style={[
                styles.stepTitle,
                isActive && styles.stepTitleActive
              ]}>
                {Platform.OS === 'web' ? step.title : step.shortTitle}
              </Text>
              {index < visibleSteps.length - 1 && <View style={styles.stepConnector} />}
            </View>
          );
        })}
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalDetailsStep
            data={onboardingData.personalDetails}
            onUpdate={(data) => updateData({ personalDetails: data })}
            shouldValidate={validationTrigger > 0 && currentStep === 1}
          />
        );
      case 2:
        return (
          <BusinessDetailsStep
            data={onboardingData.businessDetails}
            onUpdate={(data) => updateData({ businessDetails: data })}
            shouldValidate={validationTrigger > 0 && currentStep === 2}
            key={`step2-${validationTrigger}`}
          />
        );
      case 3:
        return (
          <ContractorDetailsStep
            data={onboardingData.contractorDetails}
            onUpdate={(data) => updateData({ contractorDetails: data })}
            shouldValidate={validationTrigger > 0 && currentStep === 3}
            key={`step3-${validationTrigger}`}
          />
        );
      case 4:
        return (
          <InsuranceDetailsStep
            data={onboardingData.insuranceDetails}
            onUpdate={(data) => updateData({ insuranceDetails: data })}
            shouldValidate={validationTrigger > 0 && currentStep === 4}
            key={`step4-${validationTrigger}`}
          />
        );
      case 5:
        return (
          <InterestsStep
            formData={onboardingData.interests}
            updateFormData={(data) => updateData({ interests: data })}
            shouldValidate={validationTrigger > 0 && currentStep === 5}
            key={`step5-${validationTrigger}`}
            onNext={handleNext}
            onPrev={handlePrevious}
            onSave={saveOnboardingData}
          />
        );
      case 6:
        return <OnboardingSuccessStep onboardingData={onboardingData} />;
      default:
        return null;
    }
  };

  if (currentStep === 6) {
    return (
      <Container style={styles.container}>
        {renderCurrentStep()}
      </Container>
    );
  }

  return (
    <Container style={styles.container}>
      {renderStepIndicator()}
      
      <View style={styles.content}>
        {renderCurrentStep()}
      </View>

      <View style={styles.navigation}>
        {currentStep > 1 && (
          <Button
            title="Previous"
            onPress={handlePrevious}
            variant="outline"
            style={styles.navButton}
          />
        )}
        <Button
          title={currentStep === 5 ? "Complete" : "Next"}
          onPress={handleNext}
          style={styles.navButton}
        />
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  stepCircleActive: {
    backgroundColor: theme.colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: theme.colors.success,
  },
  stepNumber: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  stepNumberActive: {
    color: theme.colors.text.inverse,
  },
  stepTitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  stepTitleActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  stepConnector: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 1,
    backgroundColor: theme.colors.border.light,
    zIndex: -1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
  },
  navButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
});