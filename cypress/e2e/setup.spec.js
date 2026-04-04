describe('Setup page', () => {
  beforeEach(() => {
    cy.bootVisit('/setup');
  });

  it('shows the default spreadsheet on setup', () => {
    cy.contains('Current Spreadsheets').should('exist');
    cy.contains('E2E Sheet').should('exist');
    cy.get('[aria-label="View trips"]').should('be.visible');
  });
});
