import { Platform } from 'react-native';

interface Column {
  key: string;
  label: string;
}

/**
 * Convert array of objects to CSV string.
 */
export function toCSV(data: any[], columns: Column[]): string {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      let val = row[c.key];
      if (val === null || val === undefined) val = '';
      if (val?.toDate) val = val.toDate().toISOString().split('T')[0];
      else if (val instanceof Date) val = val.toISOString().split('T')[0];
      else if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

/**
 * Download CSV — web: blob download, mobile: requires expo-sharing (add later).
 */
export async function downloadCSV(csvContent: string, filename = 'export') {
  const fullName = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fullName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Mobile: requires expo-file-system + expo-sharing
    // TODO: Implement when needed
    console.log('CSV download on mobile not yet implemented');
  }
}
