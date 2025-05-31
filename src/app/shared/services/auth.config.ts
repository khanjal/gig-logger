import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  requireHttps: true,
  strictDiscoveryDocumentValidation: false,
  clientId: '1037406003641-06neo4a41bh84equ3tafo5dgl2ftvopm.apps.googleusercontent.com',
  redirectUri: window.location.origin + '/setup',
  scope: 'openid https://www.googleapis.com/auth/spreadsheets',
  responseType: 'code',
  showDebugInformation: true,
  oidc: true,
  requestAccessToken: false,
  disableAtHashCheck: true,
  customQueryParams: {
    access_type: 'offline',
    prompt: 'consent'
  }
};
