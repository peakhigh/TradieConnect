import { Platform, Dimensions } from 'react-native';

export function isWeb(): boolean {
  return Platform.OS === 'web';
}

export function isNotWeb(): boolean {
  return Platform.OS !== 'web';
}

export function isDev(): boolean {
  return process.env.NODE_ENV === 'development' || __DEV__;
}

export function isMobileOrWebMobile(): boolean {
  if (Platform.OS === 'web') {
    return Dimensions.get('window').width < 500;
  }
  return true;
}

export function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

export function formatCurrency(amount: number, currency = 'AUD'): string {
  return `$${amount.toFixed(2)}`;
}

export function formatMobileNumber(mobile: string): string {
  if (!mobile) return '';
  const digits = mobile.replace(/\D/g, '');
  // Australian mobile: 04XX XXX XXX
  if (digits.length === 10 && digits.startsWith('04')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  // With +61
  if (digits.length === 11 && digits.startsWith('61')) {
    return `+61 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return mobile;
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
