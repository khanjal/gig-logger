// src/app/shared/utils/user-id.util.ts

import { SESSION_CONSTANTS } from '@constants/session.constants';

/**
 * Extracts the current user ID from localStorage or generates a new one if needed.
 */
export function getCurrentUserId(): string {
  // Priority 1: Check localStorage for stored authenticated user ID
  const storedUserId = localStorage.getItem(SESSION_CONSTANTS.AUTHENTICATED_USER_ID);
  if (storedUserId) {
    return storedUserId;
  }
  // Fallback: Use stored/generated anonymous user ID
  let userId = localStorage.getItem(SESSION_CONSTANTS.USER_ID);
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(SESSION_CONSTANTS.USER_ID, userId);
  }
  return userId;
}

function generateUserId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}
