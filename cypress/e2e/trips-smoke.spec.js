describe('Trips smoke tests', () => {
  it('shows seeded trips on the trips page', () => {
    cy.bootVisit('/trips', { seedTrips: true });

    // Wait for todays trips header and ensure it shows the sample row
    cy.get('#todaysTrips', { timeout: 10000 }).should('be.visible');

    // The seeded sample uses rowId: 2 and place 'Test Place'
    cy.get('[id="2"]', { timeout: 5000 }).should('exist').and('contain.text', 'Test Place');
  });

  it('displays trip quick view details when expanded', () => {
    cy.bootVisit('/trips', { seedTrips: true });

    // Click the first visible expansion toggle on the page
    cy.get('button[aria-expanded]', { timeout: 7000 }).filter(':visible').first().click({ force: true });

    // After expansion, assert that the details panel exists
    cy.get('.p-3.bg-surface-2', { timeout: 7000 }).should('exist');
  });
});
