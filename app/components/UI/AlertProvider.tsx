import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * Cross-platform alert system.
 *
 * Replaces React Native's `Alert.alert()` which does not render reliably on
 * web. Renders the standard project Modal pattern (see modal-pattern.md) and
 * works identically on iOS, Android, and Web.
 *
 * Usage:
 *   const { showAlert } = useAlert();
 *   showAlert('Title', 'Message');
 *   showAlert('Delete?', 'This cannot be undone', [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'Delete', style: 'destructive', onPress: handleDelete },
 *   ]);
 */

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: AlertButtonStyle;
}

export type AlertTone = 'info' | 'success' | 'warning' | 'destructive';

interface AlertOptions {
  tone?: AlertTone;
}

interface AlertConfig {
  title: string;
  message?: string;
  buttons: AlertButton[];
  tone: AlertTone;
}

interface AlertContextValue {
  showAlert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => void;
}

const AlertContext = createContext<AlertContextValue>({
  showAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

/**
 * Imperative handle for code that runs outside React components/hooks.
 * Set by AlertProvider on mount. Prefer `useAlert()` inside components.
 */
let imperativeShowAlert: AlertContextValue['showAlert'] | null = null;

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) {
  if (imperativeShowAlert) {
    imperativeShowAlert(title, message, buttons, options);
  } else {
    console.warn('showAlert called before AlertProvider mounted:', title, message);
  }
}

// --- Visual config per tone ---

const TONE_CONFIG: Record<
  AlertTone,
  { icon: LucideIcon; circleBg: string; iconColor: string; confirmBg: string }
> = {
  info: { icon: Info, circleBg: '#EFF6FF', iconColor: '#2563EB', confirmBg: '#2563EB' },
  success: { icon: CheckCircle2, circleBg: '#D1FAE5', iconColor: '#059669', confirmBg: '#059669' },
  warning: { icon: AlertTriangle, circleBg: '#FEF3C7', iconColor: '#D97706', confirmBg: '#D97706' },
  destructive: { icon: AlertTriangle, circleBg: '#FEE2E2', iconColor: '#DC2626', confirmBg: '#DC2626' },
};

function inferTone(buttons: AlertButton[], explicit?: AlertTone): AlertTone {
  if (explicit) return explicit;
  if (buttons.some(b => b.style === 'destructive')) return 'destructive';
  return 'info';
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const visibleRef = useRef(false);

  const showAlert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
      const resolvedButtons: AlertButton[] =
        buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }];
      visibleRef.current = true;
      setConfig({
        title,
        message,
        buttons: resolvedButtons,
        tone: inferTone(resolvedButtons, options?.tone),
      });
    },
    []
  );

  // Expose the imperative handle for non-component callers.
  imperativeShowAlert = showAlert;

  const close = useCallback(() => {
    visibleRef.current = false;
    setConfig(null);
  }, []);

  const handlePress = useCallback(
    async (button: AlertButton) => {
      close();
      if (button.onPress) {
        try {
          await button.onPress();
        } catch (err) {
          // Swallow — handlers are responsible for their own error UI.
          console.error('Alert button handler error:', err);
        }
      }
    },
    [close]
  );

  const tone = config ? TONE_CONFIG[config.tone] : TONE_CONFIG.info;
  const Icon = tone.icon;

  // For 1-button alerts the single action uses the tone color.
  // For multi-button alerts: cancel buttons render as secondary (left),
  // everything else as primary/colored.
  const isSingle = config?.buttons.length === 1;

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        visible={!!config}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.modalOverlay} onPress={close}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIconCircle, { backgroundColor: tone.circleBg }]}>
                <Icon size={24} color={tone.iconColor} />
              </View>
            </View>

            {config?.title ? <Text style={styles.modalTitle}>{config.title}</Text> : null}
            {config?.message ? (
              <Text style={styles.modalSubtitle}>{config.message}</Text>
            ) : null}

            <View style={[styles.modalButtonRow, isSingle && styles.modalButtonColumn]}>
              {config?.buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const useSecondary = !isSingle && isCancel;
                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    style={[
                      styles.modalBtn,
                      useSecondary ? styles.modalGoBackBtn : { backgroundColor: tone.confirmBg },
                    ]}
                    onPress={() => handlePress(button)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={useSecondary ? styles.modalGoBackBtnText : styles.modalConfirmBtnText}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconRow: { alignItems: 'center', marginBottom: 12 },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtonRow: { flexDirection: 'row', gap: 12 },
  modalButtonColumn: { flexDirection: 'column' },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalGoBackBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  modalGoBackBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalConfirmBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
