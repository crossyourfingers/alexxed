/**
 * Application constants
 * Source: specs/001-unified-minimal-ui/spec.md
 */

/** Maximum message length in characters (FR-B08) */
export const MAX_MESSAGE_LENGTH = 2000;

/** Number of days to show offline users (FR-F10) */
export const OFFLINE_FILTER_DAYS = 7;

/** Session retention period in days (FR-F08) */
export const SESSION_RETENTION_DAYS = 7;

/**
 * Default streaming schedule themes (FR-I02)
 * 7 recurring daily themes for the weekly schedule
 */
export const DEFAULT_SCHEDULE_THEMES = [
  { day: 1, theme: 'Stardew Valley', description: 'Cozy farming simulation' },
  { day: 2, theme: 'Farming Games', description: 'Various farming and life sims' },
  { day: 3, theme: 'Fantasy Adventure', description: 'Epic fantasy RPGs and adventures' },
  { day: 4, theme: 'Science Fiction', description: 'Sci-fi games and space exploration' },
  { day: 5, theme: 'Horror/Scary', description: 'Spooky and horror games' },
  { day: 6, theme: 'Puzzle/Platformer', description: 'Brain teasers and platforming challenges' },
  { day: 7, theme: 'Any Category', description: "Viewer's choice or mixed bag" },
] as const;

/**
 * Allowed emoji reactions (FR-D02)
 */
export const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'] as const;

/**
 * Day names for schedule display
 */
export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/**
 * Get the current day number (1-7, Monday=1)
 */
export function getCurrentDayNumber(): number {
  const day = new Date().getDay();
  // JavaScript: Sunday=0, Monday=1, ..., Saturday=6
  // We want: Monday=1, Tuesday=2, ..., Sunday=7
  return day === 0 ? 7 : day;
}
