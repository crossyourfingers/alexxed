import { SenderError } from "spacetimedb/server";

export const MAX_MESSAGE_LENGTH = 2000;

export function validateName(name: string) {
  if (!name) throw new SenderError("Names must not be empty");
}

export function validateMessage(text: string) {
  if (!text) throw new SenderError("Messages must not be empty");
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new SenderError(
      `Message exceeds ${MAX_MESSAGE_LENGTH} character limit`,
    );
  }
}

// Simple hash function for demo - IN PRODUCTION, hash passwords client-side!
export function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
