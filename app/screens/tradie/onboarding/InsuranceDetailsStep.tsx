import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '../../../components/UI/Input';
import { DatePicker } from '../../../components/UI/DatePicker';
import { theme } from '../../../theme/theme';

interface InsuranceDetailsData {
  policyNumber: string;
  policyHolderName: string;
  expiryDate: Date;
  liabilityLimit: string;
}

interface InsuranceDetailsStepProps {
  data: InsuranceDetailsData;
  onUpdate: (data: InsuranceDetailsData) => void;
  shouldValidate?: boolean;
}

export const InsuranceDetailsStep: React.FC<InsuranceDetailsStepProps> = ({ data, onUpdate, shouldValidate }) => {
  const { control, watch, formState: { errors }, trigger } = useForm({
    defaultValues: data,
    mode: 'all'
  });

  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  React.useEffect(() => {
    const subscription = watch((value) => {
      onUpdate(value as InsuranceDetailsData);
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
      <Text style={styles.title}>Insurance Details</Text>
      <Text style={styles.subtitle}>Provide your insurance information</Text>

      <Controller
        control={control}
        name="policyNumber"
        rules={{ required: 'Policy number is required' }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label="Policy Number *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter your policy number"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="policyHolderName"
        rules={{ required: 'Policy holder name is required' }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label="Name of Policy Holder *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter policy holder name"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="expiryDate"
        rules={{ required: 'Expiry date is required' }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <DatePicker
            label="Expiry Date *"
            value={value}
            onDateChange={onChange}
            placeholder="Select expiry date"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="liabilityLimit"
        rules={{ required: 'Liability limit is required' }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label="Liability Limit *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g., $1,000,000"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />
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
});