import { Platform } from 'react-native';

export const isWebDesktop = Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth > 768;