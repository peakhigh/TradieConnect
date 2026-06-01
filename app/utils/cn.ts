/**
 * Conditional class name utility for NativeWind/Tailwind.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 */

// Simple implementation without external deps (clsx + tailwind-merge can be added later)
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
