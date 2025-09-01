import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { Input } from './Input';
import { theme } from '../../theme/theme';

interface AddressData {
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
}

interface AddressFormProps {
  control: Control<any>;
  prefix?: string;
  required?: boolean;
  hasSubmitted?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({ control, prefix = '', required = false, hasSubmitted = false }) => {
  const getFieldName = (field: string) => prefix ? `${prefix}.${field}` : field;
  const requiredSuffix = required ? ' *' : '';

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name={getFieldName('streetAddress')}
        rules={required ? { required: 'Street address is required' } : {}}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label={`Street Address${requiredSuffix}`}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter street address"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name={getFieldName('suburb')}
        rules={required ? { required: 'Suburb is required' } : {}}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <Input
            label={`Suburb${requiredSuffix}`}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter suburb"
            error={hasSubmitted ? error?.message : undefined}
          />
        )}
      />

      <View style={styles.row}>
        <View style={styles.stateField}>
          <Controller
            control={control}
            name={getFieldName('state')}
            rules={required ? { required: 'State is required' } : {}}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label={`State${requiredSuffix}`}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="NSW"
                error={hasSubmitted ? error?.message : undefined}
              />
            )}
          />
        </View>
        
        <View style={styles.postcodeField}>
          <Controller
            control={control}
            name={getFieldName('postcode')}
            rules={required ? { required: 'Postcode is required' } : {}}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label={`Postcode${requiredSuffix}`}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="2000"
                keyboardType="numeric"
                error={hasSubmitted ? error?.message : undefined}
              />
            )}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  stateField: {
    flex: 1,
  },
  postcodeField: {
    flex: 1,
  },
});