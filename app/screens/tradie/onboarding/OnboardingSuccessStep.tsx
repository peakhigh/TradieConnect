import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SimpleButton as Button } from '../../../components/UI/SimpleButton';
import { CheckCircle } from 'lucide-react-native';
import { theme } from '../../../theme/theme';
import { useAuth } from '../../../context/AuthContext';
import { runCloudFunction } from '../../../services/cloudFunctions';

interface OnboardingSuccessStepProps {
  onboardingData: any;
}

export const OnboardingSuccessStep: React.FC<OnboardingSuccessStepProps> = ({ onboardingData }) => {
  const { user, refreshUser } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoToDashboard = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);

    try {
      // Build the profile payload; the callable persists it, sets
      // onboardingCompleted, and credits the one-time $10 bonus server-side.
      const profile = {
        firstName: onboardingData.personalDetails.firstName,
        lastName: onboardingData.personalDetails.lastName,
        email: onboardingData.personalDetails.email,
        businessType: onboardingData.personalDetails.businessType,
        ...(onboardingData.personalDetails.businessType === 'business' && {
          abn: onboardingData.businessDetails.abn,
          businessName: onboardingData.businessDetails.businessName,
          businessAddress: {
            streetAddress: onboardingData.businessDetails.streetAddress,
            suburb: onboardingData.businessDetails.suburb,
            state: onboardingData.businessDetails.state,
            postcode: onboardingData.businessDetails.postcode,
          },
        }),
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
      };

      await runCloudFunction('completeOnboarding', { profile });

      // Pull the fresh user doc (onboardingCompleted + bonus). The navigator
      // re-routes to the dashboard automatically once onboardingCompleted flips.
      await refreshUser();
    } catch (e: any) {
      setError(e?.message || 'Something went wrong finishing onboarding. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={80} color={theme.colors.success} />
        </View>
        
        <Text style={styles.title}>Welcome to TradieConnect!</Text>
        <Text style={styles.subtitle}>
          Your profile has been successfully created. You can now start connecting with customers and growing your business.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What's Next?</Text>
          <Text style={styles.infoText}>
            • Browse available service requests{'\n'}
            • Unlock requests that match your skills{'\n'}
            • Submit competitive quotes{'\n'}
            • Build your reputation with great work
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title={submitting ? 'Finishing...' : 'Go to Dashboard'}
          onPress={handleGoToDashboard}
          loading={submitting}
          disabled={submitting}
          style={styles.button}
          size="large"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 500,
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  infoBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    width: '100%',
  },
  infoTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  button: {
    width: '100%',
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});