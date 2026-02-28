/**
 * Feature flags for the application
 * Set via environment variables (VITE_*) or defaults
 */

/** Enable emoji reactions on messages (👍 ❤️ 😂 😮 😢 🎉) */
export const ENABLE_EMOJI_REACTIONS = import.meta.env.VITE_ENABLE_EMOJI_REACTIONS !== 'false';

/** Enable message likes (binary like/unlike) */
export const ENABLE_MESSAGE_LIKES = import.meta.env.VITE_ENABLE_MESSAGE_LIKES !== 'false';
