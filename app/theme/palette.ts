/**
 * Color Palette — Change this file to swap the entire app's look.
 * All colors are defined here and consumed by theme.ts.
 * 
 * Current: "Professional Navy" — BuildOn-inspired dark navy sidebar, clean whites, blue accents.
 * 
 * To change the theme: just swap the values below. Nothing else needs to change.
 */

export const palette = {
  // --- Brand / Accent ---
  primary: '#0A2E5A',         // Dark navy blue
  primaryDark: '#081F3E',     // Darker navy (hover/pressed)
  primaryLight: '#E0F2FE',    // Light blue (backgrounds, badges)

  secondary: '#0E7490',       // Teal (secondary actions, links)
  secondaryDark: '#155E75',
  secondaryLight: '#ECFEFF',

  // --- Semantic ---
  success: '#059669',         // Green (money, completed)
  successLight: '#D1FAE5',
  warning: '#D97706',         // Amber (urgency, alerts)
  warningLight: '#FEF3C7',
  error: '#DC2626',           // Red (errors, cancel, destructive)
  errorLight: '#FEE2E2',

  // --- Surfaces ---
  background: '#F8FAFC',      // Light content area
  surface: '#FFFFFF',         // Cards, panels
  surfaceSecondary: '#F1F5F9', // Secondary surface (inputs, sections)
  surfaceTertiary: '#E2E8F0', // Tertiary (hover states, card backgrounds)

  // --- Sidebar / Dark UI ---
  sidebarBg: '#0A2E5A',      // Navy blue (same as primary)
  sidebarSurface: '#0F3D6E', // Slightly lighter navy
  sidebarBorder: '#1E4377',  // Borders in dark UI
  sidebarText: 'rgba(255, 255, 255, 0.75)', // Muted white text
  sidebarTextActive: '#FFFFFF',
  sidebarAccent: '#E0F2FE',  // Active item highlight background

  // --- Text ---
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textDisabled: '#D1D5DB',

  // --- Borders ---
  borderLight: '#E2E8F0',
  borderMedium: '#CBD5E1',
  borderDark: '#94A3B8',
  borderFocus: '#0A2E5A',

  // --- Status ---
  statusActive: '#0A2E5A',
  statusCompleted: '#059669',
  statusPending: '#D97706',
  statusCancelled: '#DC2626',
};
