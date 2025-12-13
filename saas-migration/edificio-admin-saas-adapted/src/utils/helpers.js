/**
 * Utility helpers
 */

export function generateRandomId() {
  return Math.random().toString(36).substring(2, 15);
}

export function generateUuid() {
  return crypto.randomUUID();
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}
