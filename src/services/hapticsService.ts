/**
 * Tactile mobile haptic feedback engine for TalentMatch ATS.
 * SSR-safe, gracefully degrades when navigator.vibrate is unsupported or denied.
 */

export const HAPTIC_PATTERNS = {
  tap: 8,
  select: 12,
  match: [15, 60, 25],
  accept: [15, 50, 20],
  reject: [20, 40, 20],
  copy: [12, 40, 15],
  error: [35, 50, 35],
  delete: [25, 45, 30],
} as const;

export type HapticType = keyof typeof HAPTIC_PATTERNS;

export function isHapticsSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  );
}

export function triggerHaptic(type: HapticType | number | number[]): boolean {
  if (!isHapticsSupported()) return false;
  try {
    const pattern = typeof type === 'string' ? HAPTIC_PATTERNS[type as HapticType] : type;
    if (!pattern) return false;
    return navigator.vibrate(pattern as unknown as VibratePattern);
  } catch {
    return false;
  }
}

export const haptics = {
  tap: () => triggerHaptic('tap'),
  select: () => triggerHaptic('select'),
  match: () => triggerHaptic('match'),
  accept: () => triggerHaptic('accept'),
  reject: () => triggerHaptic('reject'),
  copy: () => triggerHaptic('copy'),
  error: () => triggerHaptic('error'),
  delete: () => triggerHaptic('delete'),
  custom: (pattern: number | number[]): boolean => triggerHaptic(pattern),
};
