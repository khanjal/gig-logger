import './commands';

// You can put global configuration and behavior that modifies Cypress here.
// For example, set default viewport for mobile-first testing:
beforeEach(() => {
  cy.viewport(390, 844); // common mobile-ish viewport
});
