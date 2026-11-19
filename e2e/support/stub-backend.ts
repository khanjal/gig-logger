import type { BrowserContext, Route } from '@playwright/test';

// Mirrors src/environments/environment.ts (gigLoggerApi) - the dev build is what ng serve runs.
export const API_BASE = 'https://gig-api.raptorsheets.com/dev';
// Not ng serve's default 4200, so a dev server left running from another checkout is never
// mistaken for this one. playwright.config.ts serves on this port.
export const E2E_PORT = 4201;
export const APP_ORIGIN = `http://localhost:${E2E_PORT}`;

// Mirrors AUTH_CONSTANTS and SESSION_CONSTANTS in src/app/shared/constants.
const ACCESS_TOKEN_COOKIE = 'ACCESS_TOKEN';
const IS_AUTHENTICATED_KEY = 'rg-is-authenticated';
const AUTHENTICATED_USER_ID_KEY = 'rg-authenticated-user-id';

const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export const E2E_USER = { sub: 'e2e-user', name: 'E2E User', email: 'e2e@example.test' };
export const E2E_SHEET = { id: 'e2e-sheet-id', name: 'E2E Test Sheet' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': APP_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Sheet-Id, UserId',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/** Fulfils a cross-origin request, answering the CORS preflight as well. */
export async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: CORS_HEADERS });
    return;
  }
  await route.fulfill({ status, headers: CORS_HEADERS, contentType: 'application/json', body: JSON.stringify(body) });
}

/**
 * Signs the app in without Google: the access-token cookie is what AuthGoogleService checks
 * first, so with it present no token exchange or refresh happens.
 *
 * On localhost the app cannot clear or replace this cookie: SecureCookieStorageService writes
 * with `Domain=localhost`, which Chromium rejects. A sign-out or token-refresh spec must
 * assert on something other than the cookie.
 */
export async function signIn(context: BrowserContext): Promise<void> {
  await context.addCookies([{ name: ACCESS_TOKEN_COOKIE, value: 'e2e-access-token', url: APP_ORIGIN }]);
  await context.addInitScript(([authKey, userKey, userId]) => {
    localStorage.setItem(authKey, 'true');
    localStorage.setItem(userKey, userId);
  }, [IS_AUTHENTICATED_KEY, AUTHENTICATED_USER_ID_KEY, E2E_USER.sub]);
}

/**
 * Stubs every request that leaves the dev server, for every page in the context. Anything not
 * stubbed here, or by the test through page.route (page routes win over context routes), is
 * aborted - a test can never reach a real backend by accident.
 */
export async function stubBackend(context: BrowserContext): Promise<void> {
  await context.route(url => !url.href.startsWith(APP_ORIGIN), route => {
    // ApiService turns an aborted call into null, so a missing stub otherwise shows up only
    // as a confusing locator timeout. Google and font requests are expected to be aborted.
    if (route.request().url().startsWith(API_BASE)) {
      console.warn(`[e2e] No stub for ${route.request().method()} ${route.request().url()} - aborted`);
    }
    return route.abort();
  });
  await context.route(GOOGLE_USERINFO_URL, route => fulfillJson(route, E2E_USER));
  await context.route(`${API_BASE}/sheets/health`, route => fulfillJson(route, { status: 'healthy' }));
  await context.route(`${API_BASE}/files/list`, route => fulfillJson(route, [E2E_SHEET]));
}
