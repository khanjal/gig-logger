import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  clientId: '1037406003641-06neo4a41bh84equ3tafo5dgl2ftvopm.apps.googleusercontent.com',
  redirectUri: window.location.origin + '/setup',
  scope: 'openid profile email https://www.googleapis.com/auth/spreadsheets',
  responseType: 'token id_token',
  clearHashAfterLogin: true,
  showDebugInformation: false,
  sessionChecksEnabled: false, // Disable session checks since Google doesn't support it
  timeoutFactor: 0.9, // Refresh token when 90% of lifetime has passed
  silentRefreshTimeout: 30000, // 30 seconds timeout for silent refresh
  disableAtHashCheck: false,
  requireHttps: true,
  useSilentRefresh: true, // Enable silent refresh
  silentRefreshShowIFrame: false // Don't show the iframe for silent refresh
};
