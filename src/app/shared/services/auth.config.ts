import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  // We use the authorization code flow where our backend server handles all token
  // exchange and refresh operations for security. This keeps tokens server-side
  // and avoids exposing sensitive credentials (like client_secret) to the client.
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  clientId: '1037406003641-06neo4a41bh84equ3tafo5dgl2ftvopm.apps.googleusercontent.com',
  redirectUri: window.location.origin + '/setup',
  scope: 'openid profile email https://www.googleapis.com/auth/spreadsheets',
  responseType: 'code',
  showDebugInformation: true,
  oidc: true,
  requestAccessToken: false, // Library only handles the initial auth code flow
  disableAtHashCheck: true
};
