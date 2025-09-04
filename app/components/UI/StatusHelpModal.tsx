import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { TRADIE_STATUS_CONFIG, ServiceRequestStatus } from '../../types/serviceRequestStatus';
import { StatusBadge } from './StatusBadge';

interface StatusHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export function StatusHelpModal({ visible, onClose }: StatusHelpModalProps) {
  const statuses: ServiceRequestStatus[] = ['new', 'quoted', 'assigned', 'completed', 'cancelled', 'expired'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Request Statuses</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            {statuses.map((status) => {
              const config = TRADIE_STATUS_CONFIG[status];
              return (
                <View key={status} style={styles.statusItem}>
                  <StatusBadge status={status} userType="tradie" size="medium" />
                  <Text style={styles.description}>{config.description}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  statusItem: {
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 20,
  },
});