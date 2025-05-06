import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  clientId: '1037406003641-06neo4a41bh84equ3tafo5dgl2ftvopm.apps.googleusercontent.com',
  redirectUri: window.location.origin + '/setup',
  scope: 'openid profile email https://www.googleapis.com/auth/spreadsheets',
};
