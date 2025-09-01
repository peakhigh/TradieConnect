import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '../../../components/UI/Input';
import { RadioGroup } from '../../../components/UI/RadioGroup';
import { theme } from '../../../theme/theme';

interface PersonalDetailsData {
  firstName: string;
  lastName: string;
  email: string;
  businessType: 'business' | 'sole_trader';
}

interface PersonalDetailsStepProps {
  data: PersonalDetailsData;
  onUpdate: (data: PersonalDetailsData) => void;
  shouldValidate?: boolean;
}

export const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({ data, onUpdate, shouldValidate }) => {
  const { control, watch, formState: { errors }, trigger } = useForm({
    defaultValues: data,
    mode: 'all'
  });

  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  React.useEffect(() => {
    const subscription = watch((value) => {
      onUpdate(value as PersonalDetailsData);
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
      <Text style={styles.title}>Personal Details</Text>
      <Text style={styles.subtitle}>Tell us about yourself</Text>

      <Controller
        control={control}
        name="firstName"
        rules={{ required: 'First name is required' }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label="First Name *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter your first name"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="lastName"
        rules={{ required: 'Last name is required' }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label="Last Name *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter your last name"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        rules={{ 
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address'
          }
        }}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label="Email Address *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter your email address"
            keyboardType="email-address"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="businessType"
        render={({ field: { onChange, value } }) => (
          <RadioGroup
            label="Business Type *"
            options={[
              { value: 'sole_trader', label: 'Sole Trader' },
              { value: 'business', label: 'Business Owner' }
            ]}
            value={value}
            onValueChange={onChange}
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