export type ServiceRequestStatus = 
  | 'new'            // Just posted, accepting quotes
  | 'quoted'         // Has quotes, customer reviewing
  | 'assigned'       // Customer accepted a quote
  | 'completed'      // Work finished
  | 'cancelled'      // Cancelled by customer
  | 'expired';       // No activity for 30+ days

export interface StatusDisplay {
  label: string;
  color: string;
  icon: string;
  description: string;
}

export const CUSTOMER_STATUS_CONFIG: Record<ServiceRequestStatus, StatusDisplay> = {
  new: {
    label: 'New',
    color: '#3b82f6',
    icon: 'clock',
    description: 'Waiting for quotes from tradies'
  },
  quoted: {
    label: 'Quoted',
    color: '#f59e0b',
    icon: 'file-text',
    description: 'Review and compare quotes'
  },
  assigned: {
    label: 'Assigned',
    color: '#10b981',
    icon: 'user-check',
    description: 'Tradie assigned, work in progress'
  },
  completed: {
    label: 'Completed',
    color: '#16a34a',
    icon: 'check-circle',
    description: 'Job finished successfully'
  },
  cancelled: {
    label: 'Cancelled',
    color: '#dc2626',
    icon: 'x-circle',
    description: 'Request cancelled'
  },
  expired: {
    label: 'Expired',
    color: '#6b7280',
    icon: 'clock-x',
    description: 'No activity for 30+ days'
  }
};

export const TRADIE_STATUS_CONFIG: Record<ServiceRequestStatus, StatusDisplay> = {
  new: {
    label: 'Available',
    color: '#16a34a',
    icon: 'target',
    description: 'Can submit quote'
  },
  quoted: {
    label: 'Quoted',
    color: '#f59e0b',
    icon: 'clock',
    description: 'Quote submitted, awaiting response'
  },
  assigned: {
    label: 'Active Job',
    color: '#10b981',
    icon: 'hammer',
    description: 'Your quote was accepted, work in progress'
  },
  completed: {
    label: 'Completed',
    color: '#16a34a',
    icon: 'check-circle',
    description: 'Job completed successfully'
  },
  cancelled: {
    label: 'Cancelled',
    color: '#dc2626',
    icon: 'x-circle',
    description: 'Customer cancelled request'
  },
  expired: {
    label: 'Expired',
    color: '#6b7280',
    icon: 'archive',
    description: 'Opportunity expired'
  }
};

export const getStatusConfig = (status: ServiceRequestStatus, userType: 'customer' | 'tradie'): StatusDisplay => {
  return userType === 'customer' ? CUSTOMER_STATUS_CONFIG[status] : TRADIE_STATUS_CONFIG[status];
};

export const getNextStatuses = (currentStatus: ServiceRequestStatus, userType: 'customer' | 'tradie'): ServiceRequestStatus[] => {
  if (userType === 'customer') {
    switch (currentStatus) {
      case 'new': return ['cancelled'];
      case 'quoted': return ['assigned', 'cancelled'];
      case 'assigned': return ['completed', 'cancelled'];
      default: return [];
    }
  } else {
    switch (currentStatus) {
      case 'assigned': return ['completed'];
      default: return [];
    }
  }
};