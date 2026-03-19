describe('Trips local CRUD (no sheet sync)', () => {
  const today = new Date().toISOString().slice(0, 10);

  const makeSeedTrip = () => ({
    rowId: 2,
    date: today,
    service: 'Uber',
    region: 'Zone 1',
    number: 1,
    key: `${today}-uber-1`,
    place: 'Test Place',
    type: 'Delivery',
    pickupTime: '08:00',
    dropoffTime: '08:20',
    pay: 12.5,
    tip: 2,
    bonus: 0,
    cash: 0,
    total: 14.5,
    distance: 3.2,
    saved: false,
    action: 'ADD'
  });

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

    cy.bootVisit('/trips', {
      seedTrips: true,
      trips: [makeSeedTrip()]
    });
  });

  const fillSearchField = (label, value) => {
    cy.contains('mat-label', label)
      .parents('mat-form-field')
      .find('input')
      .first()
      .click({ force: true })
      .clear({ force: true })
      .type(`${value}{enter}`, { force: true });
  };

  it('adds a trip locally via Next Stop', () => {
    cy.contains("Today's Trips (1)").should('exist');

    cy.get('button[title="More options"]').first().click({ force: true });
    cy.contains('button', 'Next Stop').click({ force: true });

    cy.contains("Today's Trips (2)", { timeout: 10000 }).should('exist');
  });

  it('adds a trip locally via the form Store button', () => {
    cy.contains("Today's Trips (1)").should('exist');

    fillSearchField('Service', 'Uber');
    fillSearchField('Place', 'UI Form Place');
    fillSearchField('Type', 'Delivery');

    cy.contains('button', 'Store').should('not.be.disabled').click({ force: true });

    cy.contains('Trip Stored to Device', { timeout: 10000 }).should('exist');
    cy.contains("Today's Trips (2)", { timeout: 10000 }).should('exist');
  });

  it('edits a trip locally via Edit/Update', () => {
    cy.contains('button', 'Edit').first().click({ force: true });

    cy.contains('Edit Trip - #2', { timeout: 10000 }).should('exist');

    cy.contains('mat-label', 'Note')
      .parents('mat-form-field')
      .find('input')
      .clear()
      .type('edited note');

    cy.contains('button', 'Update').click({ force: true });

    cy.contains('Trip Updated', { timeout: 10000 }).should('exist');
    cy.url({ timeout: 10000 }).should('include', '/trips');
  });

  it('deletes a local unsaved trip', () => {
    cy.contains("Today's Trips (1)").should('exist');

    cy.get('button[title="More options"]').first().click({ force: true });
    cy.contains('button', 'Delete').click({ force: true });

    cy.contains('button', 'Delete').last().click({ force: true });

    cy.contains('No Trips Today', { timeout: 10000 }).should('exist');
  });

  it('deletes and restores a previously saved trip', () => {
    const savedTrip = { ...makeSeedTrip(), saved: true, action: undefined };

    cy.bootVisit('/trips', {
      seedTrips: true,
      trips: [savedTrip]
    });

    cy.contains("Today's Trips (1)").should('exist');

    // Delete from kebab menu
    cy.get('button[title="More options"]').first().click({ force: true });
    cy.wait(200);
    cy.contains('button', 'Delete', { timeout: 10000 }).click({ force: true });
    cy.wait(200);
    cy.contains('button', 'Delete', { timeout: 10000 }).last().click({ force: true });

    // Saved trips should offer Restore after delete-marking
    cy.get('button[title="More options"]').first().click({ force: true });
    cy.wait(200);
    cy.contains('button', 'Restore', { timeout: 10000 }).click({ force: true });

    // After restore, menu should go back to Delete action
    cy.get('button[title="More options"]').first().click({ force: true });
    cy.wait(200);
    cy.contains('button', 'Delete', { timeout: 10000 }).should('exist');
  });
});
