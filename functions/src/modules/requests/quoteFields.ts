import { https } from 'firebase-functions';
import { Timestamp } from 'firebase-admin/firestore';

export interface QuoteFieldsInput {
  totalPrice: number;
  materialsCost?: number;
  laborCost?: number;
  timelineDays: number;
  estimatedStartDate?: string;
  estimatedCompletionDate?: string;
  notes?: string;
}

const isAmount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;

function toTimestamp(value: string | undefined): Timestamp | null {
  const date = value ? new Date(value) : null;
  return date && !isNaN(date.getTime()) ? Timestamp.fromDate(date) : null;
}

/**
 * Validate the pricing a tradie sends with submitQuote/editQuote and turn it
 * into the fields stored on the quote. Callable data is untyped JSON, so a
 * string or negative price must be refused before anything is written.
 */
export function parseQuoteFields(data: QuoteFieldsInput) {
  const { totalPrice, materialsCost, laborCost, timelineDays, notes } = data;
  if (!isAmount(totalPrice) || totalPrice <= 0 ||
      !isAmount(timelineDays) || timelineDays <= 0 ||
      (materialsCost != null && !isAmount(materialsCost)) ||
      (laborCost != null && !isAmount(laborCost))) {
    throw new https.HttpsError('invalid-argument', 'Missing or invalid quote fields');
  }
  return {
    totalPrice,
    materialsCost: materialsCost ?? null,
    laborCost: laborCost ?? null,
    timelineDays,
    estimatedStartDate: toTimestamp(data.estimatedStartDate),
    estimatedCompletionDate: toTimestamp(data.estimatedCompletionDate),
    notes: typeof notes === 'string' && notes ? notes : null,
  };
}
