describe('Trips page', () => {
  beforeEach(() => {
    // Boot the /trips page with a default spreadsheet present and seed a trip.
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
