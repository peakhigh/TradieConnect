import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '../../../components/UI/Input';
import { DatePicker } from '../../../components/UI/DatePicker';
import { theme } from '../../../theme/theme';

interface ContractorDetailsData {
  licenceNumber: string;
  nameOnLicence: string;
  licenceClass: string;
  licenceExpiry: Date;
}

interface ContractorDetailsStepProps {
  data: ContractorDetailsData;
  onUpdate: (data: ContractorDetailsData) => void;
  shouldValidate?: boolean;
}

export const ContractorDetailsStep: React.FC<ContractorDetailsStepProps> = ({ data, onUpdate, shouldValidate }) => {
  const { control, watch, formState: { errors }, trigger } = useForm({
    defaultValues: data,
    mode: 'all'
  });

  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  React.useEffect(() => {
    const subscription = watch((value) => {
      onUpdate(value as ContractorDetailsData);
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
      <Text style={styles.title}>Contractor Details</Text>
      <Text style={styles.subtitle}>Provide your licensing information</Text>

      <Controller
        control={control}
        name="licenceNumber"
        rules={{ required: 'Licence number is required' }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label="Licence Number *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter your licence number"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="nameOnLicence"
        rules={{ required: 'Name on licence is required' }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label="Name on Licence *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter name as it appears on licence"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="licenceClass"
        rules={{ required: 'Licence class is required' }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label="Licence Class *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g., Class 1, Class 2, etc."
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="licenceExpiry"
        rules={{ required: 'Licence expiry date is required' }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <DatePicker
            label="Licence Expiry Date *"
            value={value}
            onDateChange={onChange}
            placeholder="Select expiry date"
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