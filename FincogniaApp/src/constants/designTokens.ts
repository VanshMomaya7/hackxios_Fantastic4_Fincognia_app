/**
 * Design Tokens - Converted from designClaude.json
 * Single source of truth for all design system values
 */

// Colors
export const colors = {
  primary: {
    blue: '#0066FF',
  },
  accent: {
    cyan: '#00D4FF',
    brightGreen: '#00FF9D',
    purple: '#A855F7',
    pink: '#EC4899',
  },
  neutral: {
    white: '#FFFFFF',
    background: '#F8F9FB',
    lightGray: '#F3F4F6',
    mediumGray: '#9CA3AF',
    darkGray: '#6B7280',
    black: '#1F2937',
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    positive: '#10B981', // Green for positive values
    negative: '#1F2937', // Dark for negative values (not red to avoid alarm)
  },
  border: {
    light: '#E5E7EB',
    subtle: '#F3F4F6',
  },
};

// Typography
export const typography = {
  fontFamily: {
    primary: 'System', // React Native uses system font by default
  },
  size: {
    display: 34,
    h1: 28,
    h2: 22,
    h3: 17,
    body: 15,
    caption: 13,
    small: 11,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    display: 1.2,
    h1: 1.3,
    h2: 1.3,
    h3: 1.4,
    body: 1.5,
    caption: 1.4,
    small: 1.4,
  },
  color: {
    primary: colors.neutral.black,
    secondary: colors.neutral.darkGray,
    tertiary: colors.neutral.mediumGray,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  screenPadding: 20,
  cardPadding: 20,
  listItemSpacing: 16,
  sectionSpacing: 32,
  elementSpacing: 12,
};

// Border Radius
export const borderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Components - Buttons
export const buttonStyles = {
  primary: {
    minHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: borderRadius.medium,
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
  },
  secondary: {
    borderRadius: borderRadius.medium,
  },
  text: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
};

// Components - Cards
export const cardStyles = {
  standard: {
    borderRadius: borderRadius.large,
    padding: spacing.cardPadding,
  },
  elevated: {
    borderRadius: borderRadius.xl,
  },
  glass: {
    borderRadius: borderRadius.xl,
  },
};

// Components - Inputs
export const inputStyles = {
  textField: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: borderRadius.medium,
    fontSize: typography.size.body,
  },
  search: {
    borderRadius: borderRadius.medium,
  },
};

// Components - Lists
export const listStyles = {
  transactionItem: {
    minHeight: 64,
    paddingVertical: 14,
    iconSize: 42,
    chevronSize: 20,
  },
};

// Components - Navigation
export const navigationStyles = {
  header: {
    height: 60,
  },
  tabBar: {
    height: 48,
  },
};

// Components - Badges
export const badgeStyles = {
  status: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 7,
    fontSize: typography.size.small,
    fontWeight: typography.weight.semiBold,
  },
};

// Animations
export const animations = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  },
};

// Touch Targets
export const touchTargets = {
  minimum: 44,
};

// Chart Colors
export const chartColors = {
  primary: colors.primary.blue,
  secondary: colors.accent.pink,
  bar: colors.accent.brightGreen,
};

