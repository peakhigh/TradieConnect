import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Container } from '../components/UI/Container';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react-native';

interface FAQ {
  q: string;
  a: string;
  roles?: ('customer' | 'tradie')[];
}

const FAQS: FAQ[] = [
  {
    q: 'How do I post a service request?',
    a: 'Go to the Post tab, choose your trade, suburb and describe the job. You can attach photos and a voice message. Posting is free.',
    roles: ['customer'],
  },
  {
    q: 'How do quotes work?',
    a: 'Tradies who unlock your request can send you a quote. You\'ll see it in Messages as a quote card where you can Accept or decline. Accepting shares your address and phone with that tradie.',
    roles: ['customer'],
  },
  {
    q: 'What does it cost to unlock a request?',
    a: 'Unlocking a request costs $0.50, deducted from your wallet. This reveals the full details so you can submit a quote.',
    roles: ['tradie'],
  },
  {
    q: 'How do I get paid the signup bonus?',
    a: 'New tradies receive a $10 wallet bonus automatically when they finish onboarding. You can see it in your Wallet transaction history.',
    roles: ['tradie'],
  },
  {
    q: 'How do I recharge my wallet?',
    a: 'Open Wallet and tap Recharge. Choose an amount ($5 minimum) or enter a custom amount.',
    roles: ['tradie'],
  },
  {
    q: 'How are jobs completed and rated?',
    a: 'After the work is done, the customer marks the job complete and rates the tradie 1–5 stars. Ratings build the tradie\'s reputation.',
  },
  {
    q: 'How do I manage notifications?',
    a: 'Open Settings to toggle push, message, and quote notifications.',
  },
];

export default function HelpScreen() {
  const { user } = useAuth();
  const [open, setOpen] = useState<number | null>(0);

  const role = user?.userType === 'tradie' ? 'tradie' : 'customer';
  const faqs = FAQS.filter((f) => !f.roles || f.roles.includes(role as any));

  return (
    <Container scrollable={false} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <HelpCircle size={24} color={theme.colors.primary} />
          <Text style={styles.title}>Help & FAQ</Text>
        </View>

        {faqs.map((f, i) => {
          const expanded = open === i;
          return (
            <View key={i} style={styles.card}>
              <TouchableOpacity style={styles.qRow} onPress={() => setOpen(expanded ? null : i)} activeOpacity={0.7}>
                <Text style={styles.question}>{f.q}</Text>
                {expanded ? (
                  <ChevronUp size={18} color={theme.colors.text.secondary} />
                ) : (
                  <ChevronDown size={18} color={theme.colors.text.secondary} />
                )}
              </TouchableOpacity>
              {expanded && <Text style={styles.answer}>{f.a}</Text>}
            </View>
          );
        })}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>Email us at support@tradieconnect.com.au and we'll get back to you.</Text>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  qRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  question: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary, flex: 1, marginRight: 8 },
  answer: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20, paddingBottom: 14 },
  contactCard: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  contactTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.primary, marginBottom: 4 },
  contactText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19 },
});
