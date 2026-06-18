import { Platform } from 'react-native';
import { featureFlags } from '../utils/featureFlags';
import { showAlert } from '../components/UI/AlertProvider';

export default function useToast() {
  const showToast = (title: string, message?: string, duration?: number) => {
    if (featureFlags.skipToasts) return;
    // Cross-platform alert modal (works on iOS, Android, Web).
    if (Platform.OS === 'web') {
      console.log(`🔔 ${title}: ${message || ''}`);
    }
    showAlert(title, message || '');
  };

  return { showToast };
}
