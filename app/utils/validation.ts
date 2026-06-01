export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateRequired(value: any, fieldName: string): string | null {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateMinLength(value: string, min: number, fieldName: string): string | null {
  if (value && value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 12) {
    return 'Please enter a valid phone number';
  }
  return null;
}

export function validatePostcode(postcode: string): string | null {
  if (!/^\d{4}$/.test(postcode)) {
    return 'Please enter a valid 4-digit postcode';
  }
  return null;
}

export function validateAmount(amount: number, min = 0): string | null {
  if (isNaN(amount) || amount < min) {
    return `Amount must be at least $${min.toFixed(2)}`;
  }
  return null;
}
