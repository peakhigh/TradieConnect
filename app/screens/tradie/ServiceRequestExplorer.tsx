import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SimpleButton as Button } from '../../components/UI/SimpleButton';

export default function ServiceRequestExplorer() {
  const [loading, setLoading] = useState(false);

  const handleUnlockRequest = (requestId: string) => {
    // TODO: Implement unlock logic with Firebase Cloud Function
    console.log('Unlocking request:', requestId);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Service Request Explorer</Text>
        <Text style={styles.subtitle}>
          Browse and unlock service requests for $0.50 each
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 How it works</Text>
          <Text style={styles.infoText}>
            • Browse available service requests{'\n'}
            • Unlock requests for $0.50 to see full details{'\n'}
            • Submit quotes to customers{'\n'}
            • Get paid when your quote is accepted
          </Text>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            🔍 Service request explorer coming soon!
          </Text>
          <Text style={styles.placeholderSubtext}>
            This feature will allow tradies to browse and unlock service requests.
          </Text>
        </View>

        <Button
          title="Refresh Requests"
          onPress={() => setLoading(true)}
          loading={loading}
          variant="outline"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  placeholder: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
