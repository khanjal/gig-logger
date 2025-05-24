import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {  // We use the authorization code flow with PKCE for enhanced security.
  // The frontend handles the initial auth and sends both the authorization code
  // and code verifier to our backend for token exchange.
  issuer: 'https://accounts.google.com',
  requireHttps: true,
  strictDiscoveryDocumentValidation: false,
  clientId: '1037406003641-06neo4a41bh84equ3tafo5dgl2ftvopm.apps.googleusercontent.com',
  redirectUri: window.location.origin + '/setup',
  postLogoutRedirectUri: window.location.origin + '/setup',
  scope: 'openid profile email https://www.googleapis.com/auth/spreadsheets',
  responseType: 'code',
  showDebugInformation: true,
  oidc: true,
  requestAccessToken: false, // Library only handles the initial auth code flow
  disableAtHashCheck: true
};
