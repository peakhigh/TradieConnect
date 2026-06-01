import { Alert, Platform } from 'react-native';
import { featureFlags } from '../utils/featureFlags';

export default function useToast() {
  const showToast = (title: string, message?: string, duration?: number) => {
    if (featureFlags.skipToasts) return;
    // Simple alert-based toast for now. Can be replaced with Gluestack toast later.
    if (Platform.OS === 'web') {
      // On web, could use a toast library. For now, console + brief alert.
      console.log(`🔔 ${title}: ${message || ''}`);
    }
    Alert.alert(title, message || '');
  };

  return { showToast };
}
