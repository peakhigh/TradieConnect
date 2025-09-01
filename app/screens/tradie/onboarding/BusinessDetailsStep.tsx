import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '../../../components/UI/Input';
import { AddressForm } from '../../../components/UI/AddressForm';
import { theme } from '../../../theme/theme';

interface BusinessDetailsData {
  abn: string;
  businessName: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
}

interface BusinessDetailsStepProps {
  data: BusinessDetailsData;
  onUpdate: (data: BusinessDetailsData) => void;
  shouldValidate?: boolean;
}

export const BusinessDetailsStep: React.FC<BusinessDetailsStepProps> = ({ data, onUpdate, shouldValidate }) => {
  const { control, watch, formState: { errors }, trigger } = useForm({
    defaultValues: data,
    mode: 'all'
  });

  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  React.useEffect(() => {
    const subscription = watch((value) => {
      onUpdate(value as BusinessDetailsData);
    });
    return () => subscription.unsubscribe();
  }, [watch, onUpdate]);

  React.useEffect(() => {
    if (shouldValidate && !hasSubmitted) {
      setHasSubmitted(true);
      trigger();
    }
  }, [shouldValidate, hasSubmitted, trigger]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Business Details</Text>
      <Text style={styles.subtitle}>Tell us about your business</Text>

      <Controller
        control={control}
        name="abn"
        rules={{ 
          required: 'ABN is required',
          pattern: {
            value: /^\d{11}$/,
            message: 'ABN must be 11 digits'
          }
        }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label="ABN *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="12345678901"
            keyboardType="numeric"
            maxLength={11}
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="businessName"
        rules={{ required: 'Business name is required' }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label="Business Name *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter your business name"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Text style={styles.sectionTitle}>Business Address</Text>
      <AddressForm control={control} required hasSubmitted={hasSubmitted} />
    </View>
  );
};

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
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
});