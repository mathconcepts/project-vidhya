/**
 * Shared framer-motion animation variants.
 * Import these across all GATE pages for consistent animations.
 */
import type { Variants } from 'framer-motion';

/** Standard element entrance: fade in + slide up */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/** Parent container that staggers children */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

/** Celebration bounce for correct answers */
export const celebration: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

/** Scale tap feedback for buttons */
export const tapScale = { scale: 0.97 };

/** Encouraging messages on correct answer */
export const CORRECT_MESSAGES = [
  'Nice work!',
  "You're on fire!",
  'Keep going!',
  'Nailed it!',
  'Brilliant!',
  'Spot on!',
  'Well done!',
];

/** Supportive messages on incorrect answer */
export const INCORRECT_MESSAGES = [
  'Almost there!',
  'Good try — review the solution',
  "You'll get it next time!",
  'Keep practicing!',
  'Learning from mistakes is progress!',
];

export function getRandomMessage(correct: boolean): string {
  const messages = correct ? CORRECT_MESSAGES : INCORRECT_MESSAGES;
  return messages[Math.floor(Math.random() * messages.length)];
}
