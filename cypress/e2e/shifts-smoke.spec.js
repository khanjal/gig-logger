describe('Shifts smoke tests', () => {
  it('shows seeded shifts on the shifts page', () => {
    cy.bootVisit('/shifts', { seedTrips: true, seedShifts: true }).then(() => {
      // Ensure we're on the shifts route (use history push to avoid nav click timing issues)
      cy.window().then((win) => {
        win.history.pushState({}, '', '/shifts');
        win.dispatchEvent(new PopStateEvent('popstate'));
      });
    });

    // Wait for the visible page header and then verify seeded shift exists
    cy.get('h1', { timeout: 15000 }).contains('Shifts').should('be.visible');
    // The seeded shift uses rowId: 1 and default service 'E2E'
    cy.get('[id="1"]', { timeout: 15000 }).should('exist').and('contain.text', 'E2E');
  });

  it('expands a shift and shows details', () => {
    cy.bootVisit('/shifts', { seedTrips: true, seedShifts: true }).then(() => {
      cy.window().then((win) => {
        win.history.pushState({}, '', '/shifts');
        win.dispatchEvent(new PopStateEvent('popstate'));
      });
    });

    cy.get('h1', { timeout: 15000 }).contains('Shifts').should('be.visible');
    cy.get('[id="1"]', { timeout: 15000 }).should('exist').within(() => {
      // Click the expansion button (uses aria-expanded attribute)
      cy.get('button[aria-expanded]', { timeout: 4000 }).first().click({ force: true });
      // After expansion, assert that the details pane exists
      cy.get('.p-3.bg-surface-2', { timeout: 5000 }).should('exist');
    });
  });
});
