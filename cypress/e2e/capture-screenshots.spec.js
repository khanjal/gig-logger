// Cypress spec: capture light/dark and narrow/wide screenshots for manifest
const viewports = [
  { name: 'narrow', width: 484, height: 950 },
  { name: 'wide', width: 1024, height: 890 }
];
const themes = ['light', 'dark'];

// Increase page load timeout for this spec
Cypress.config('pageLoadTimeout', 120000);

describe('Capture screenshots for manifest', () => {
  // Prevent the Google platform script from blocking load in CI.
  beforeEach(() => {
    try {
      cy.intercept('GET', 'https://apis.google.com/**', {
        statusCode: 200,
        body: ''
      });
    } catch (e) {}
  });

  themes.forEach((theme) => {
    viewports.forEach((v) => {
      it(`captures ${v.name}-${theme}`, () => {
        cy.viewport(v.width, v.height);

        cy.bootVisit('/', { themePreference: theme, headerTimeout: 30000 });

        // Disable animations for deterministic screenshots
        cy.document().then((doc) => {
          const style = doc.createElement('style');
          style.innerHTML = '* { transition-duration: 0s !important; animation-duration: 0s !important; }';
          doc.head.appendChild(style);
        });

        // Ensure web fonts (including Material Icons) have settled before capture.
        cy.document().then((doc) => {
          if (doc.fonts && doc.fonts.ready) {
            return cy.wrap(doc.fonts.ready);
          }
          return cy.wrap(null);
        });

        // Wait for app root to render
        cy.get('app-root', { timeout: 20000 }).should('exist');
        cy.wait(500);

        // Capture viewport screenshot; output to cypress/screenshots/
        cy.screenshot(`${v.name}-${theme}`, { capture: 'viewport' });
      });
    });
  });
});
