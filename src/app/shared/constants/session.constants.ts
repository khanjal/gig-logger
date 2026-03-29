export const SESSION_CONSTANTS = {
  IS_AUTHENTICATED: 'rg-is-authenticated',
  AUTHENTICATED_USER_ID: 'rg-authenticated-user-id',
  USER_ID: 'rg-user-id',
  THEME_STORAGE_KEY: 'rg-theme-preference',
  POLLING_ENABLED: 'rg-polling-enabled',
  MOCK_LOCATION: 'rg-mock-location',
  // sessionStorage keys (keep existing values to avoid behavior changes)
  APP_LOADED_ONCE: 'app_loaded_once',
  AUTH_TOKEN: 'token',
  SW_PENDING_REFRESH: 'sw_pending_refresh',
  SW_ERROR_COUNT: 'sw_error_count',

  // misc / test keys
  DIAGNOSTIC_TEST: '__diagnostic_test__',
  APP_TEST_KEY: 'test'
} as const;
