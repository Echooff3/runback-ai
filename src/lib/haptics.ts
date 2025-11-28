/**
 * Utility for haptic feedback on mobile devices.
 * Uses the Vibration API when available.
 */

/**
 * Trigger a short haptic feedback vibration for button clicks.
 * Falls back silently on devices/browsers that don't support vibration.
 */
export function triggerHapticFeedback(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    // Short vibration pattern (10ms) for tactile feedback
    navigator.vibrate(10);
  }
}
