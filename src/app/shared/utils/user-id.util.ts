// src/app/shared/utils/user-id.util.ts

import { AUTH_CONSTANTS } from '@constants/auth.constants';

/**
 * Extracts the current user ID from localStorage, access token, or generates a new one if needed.
 * @param getAccessToken Optional function to retrieve the access token (for services that use secure storage)
 */
export function getCurrentUserId(getAccessToken?: () => string | null): string {
  // Priority 1: Check localStorage for stored authenticated user ID
  const storedUserId = localStorage.getItem('authenticatedUserId');
  if (storedUserId) {
    return storedUserId;
  }
  // Priority 2: Try to parse access token from secure storage
  try {
    const accessToken = getAccessToken ? getAccessToken() : getAccessTokenFromCookie();
    if (accessToken) {
      const payload = parseJwtPayload(accessToken);
      if (payload?.sub) {
        localStorage.setItem('authenticatedUserId', payload.sub);
        return payload.sub;
      }
      if (payload?.email) {
        localStorage.setItem('authenticatedUserId', payload.email);
        return payload.email;
      }
      if (payload?.user_id) {
        localStorage.setItem('authenticatedUserId', payload.user_id);
        return payload.user_id;
      }
    }
  } catch {}
  // Fallback: Use stored/generated anonymous user ID
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem('userId', userId);
  }
  return userId;
}

function getAccessTokenFromCookie(): string | null {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === AUTH_CONSTANTS.ACCESS_TOKEN && value) {
        return decodeURIComponent(value);
      }
    }
  } catch {}
  return null;
}

function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function generateUserId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
