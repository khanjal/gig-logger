describe('Setup page with mock auth', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/auth/refresh', {
      statusCode: 200,
      body: { accessToken: 'fake-jwt-token' }
    }).as('refresh');

    cy.intercept('GET', 'https://accounts.google.com/.well-known/openid-configuration', { fixture: 'openid-config.json' }).as('discovery');

    cy.intercept('GET', 'https://www.googleapis.com/oauth2/v3/userinfo', {
      statusCode: 200,
      body: { sub: 'e2e-user', name: 'E2E Tester', email: 'e2e@example.com' }
    }).as('userinfo');

    cy.bootVisit('/setup');
  });

  it('shows the default spreadsheet on setup', () => {
    cy.contains('Current Spreadsheets').should('exist');
    cy.contains('E2E Sheet').should('exist');
    cy.get('[aria-label="View trips"]').should('be.visible');
  });
});
