import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ServiceRequestStatus, getStatusConfig } from '../../types/serviceRequestStatus';
import { 
  Clock, FileText, UserCheck, Tool, CheckCircle, XCircle, 
  Target, Trophy, Hammer, Archive, ClockX 
} from 'lucide-react-native';

interface StatusBadgeProps {
  status: ServiceRequestStatus;
  userType: 'customer' | 'tradie';
  size?: 'small' | 'medium' | 'large';
}

const ICON_MAP = {
  clock: Clock,
  'file-text': FileText,
  'user-check': UserCheck,
  tool: Tool,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  target: Target,
  trophy: Trophy,
  hammer: Hammer,
  archive: Archive,
  'clock-x': ClockX
};

export function StatusBadge({ status, userType, size = 'medium' }: StatusBadgeProps) {
  const config = getStatusConfig(status, userType);
  const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP];
  
  const sizeConfig = {
    small: { padding: 4, fontSize: 10, iconSize: 10 },
    medium: { padding: 6, fontSize: 12, iconSize: 12 },
    large: { padding: 8, fontSize: 14, iconSize: 14 }
  };
  
  const { padding, fontSize, iconSize } = sizeConfig[size];

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.color + '20', borderColor: config.color, padding }
    ]}>
      <IconComponent size={iconSize} color={config.color} />
      <Text style={[styles.text, { color: config.color, fontSize }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  text: {
    fontWeight: '600',
  },
});