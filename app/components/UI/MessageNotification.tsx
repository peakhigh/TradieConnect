import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MessageNotificationProps {
  unreadCount: number;
  onPress: () => void;
}

export const MessageNotification: React.FC<MessageNotificationProps> = ({
  unreadCount,
  onPress
}) => {
  if (unreadCount === 0) return null;

  return (
    <TouchableOpacity style={styles.messageNotification} onPress={onPress}>
      <Text style={styles.messageTitle}>
        You have {unreadCount} new message{unreadCount > 1 ? 's' : ''}
      </Text>
      <Text style={styles.messageSubtitle}>
        Tap to view messages
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  messageNotification: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  messageTitle: {
    color: '#1e40af',
    fontWeight: '600',
    marginBottom: 4,
  },
  messageSubtitle: {
    color: '#2563eb',
    fontSize: 14,
  },
});