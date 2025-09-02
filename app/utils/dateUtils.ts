export const DATE_FORMAT_OPTIONS = {
  day: '2-digit' as const,
  month: '2-digit' as const,
  year: 'numeric' as const
};

export const formatDate = (date: any): string => {
  if (!date) return 'Not set';
  
  try {
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('en-AU', DATE_FORMAT_OPTIONS);
    }
    
    // Handle regular Date object or string
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Not set';
    }
    
    return dateObj.toLocaleDateString('en-AU', DATE_FORMAT_OPTIONS);
  } catch (error) {
    return 'Not set';
  }
};