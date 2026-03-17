describe('Trips page with mock auth', () => {
  beforeEach(() => {
    // Stub refresh endpoint to avoid 401s from fake token
    cy.intercept('POST', '**/auth/refresh', {
      statusCode: 200,
      body: { accessToken: 'fake-jwt-token' }
    }).as('refresh');

    // Stub OpenID discovery so the OAuth library doesn't fetch external docs
    cy.intercept('GET', 'https://accounts.google.com/.well-known/openid-configuration', { fixture: 'openid-config.json' }).as('discovery');

    // Stub Google userinfo to return a predictable profile when token is validated
    cy.intercept('GET', 'https://www.googleapis.com/oauth2/v3/userinfo', {
      statusCode: 200,
      body: { sub: 'e2e-user', name: 'E2E Tester', email: 'e2e@example.com' }
    }).as('userinfo');

        // Boot the /trips page with auth + default spreadsheet present and seed a trip
        cy.bootVisit('/trips', { seedTrips: true });
  });

  // If you prefer to run setup once for the suite (faster), use `before()` instead of `beforeEach()`
  // before(() => cy.setupApp({ seedTrips: true }));

  it('populates IndexedDB and shows trips', () => {
    // The app may or may not call token refresh depending on auth state; don't require it.

    // Check the page shows today's trips header
    cy.get('#todaysTrips').should('exist').and('contain.text', "Today's Trips");
    // Verify the quick view for the added trip is rendered
    cy.contains('Test Place').should('exist');
  });
});
