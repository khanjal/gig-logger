describe('Trips - quick UI and IndexedDB validation', () => {
  const today = new Date().toISOString().slice(0, 10);

  const makeSeedTrip = () => ({
    rowId: 20,
    date: today,
    service: 'QuickTest',
    region: 'Zone Q',
    number: 1,
    key: `${today}-quicktest-1`,
    place: 'Quick Place',
    type: 'Delivery',
    saved: false,
    action: 'ADD'
  });

  beforeEach(() => {
    cy.intercept('POST', '**/auth/refresh', {
      statusCode: 200,
      body: { accessToken: 'fake-jwt-token' }
    }).as('refresh');

    cy.bootVisit('/trips', {
      seedTrips: true,
      trips: [makeSeedTrip()]
    });
  });

  it('shows header trip count and DB row count match after Store', () => {
    cy.contains("Today's Trips (1)").should('exist');

    // Use the Store flow like existing tests: fill minimal fields and click Store
    cy.contains('mat-label', 'Service')
      .parents('mat-form-field')
      .find('input')
      .first()
      .click({ force: true })
      .clear()
      .type('QuickTest{enter}', { force: true });

    cy.contains('mat-label', 'Place')
      .parents('mat-form-field')
      .find('input')
      .first()
      .click({ force: true })
      .clear()
      .type('Quick Store Place{enter}', { force: true });

    cy.contains('mat-label', 'Type')
      .parents('mat-form-field')
      .find('input')
      .first()
      .click({ force: true })
      .clear()
      .type('Delivery{enter}', { force: true });

    cy.contains('button', 'Store').should('not.be.disabled').click({ force: true });

    cy.contains('Trip Stored to Device', { timeout: 10000 }).should('exist');

    // header should update to 2 trips
    cy.contains("Today's Trips (2)", { timeout: 10000 }).should('exist');

    // verify IndexedDB trips store has 2 rows
    cy.window().then((win) => {
      return new Cypress.Promise((resolve, reject) => {
        const req = win.indexedDB.open('spreadsheetDB');
        req.onerror = () => reject(req.error);
        req.onsuccess = (ev) => {
          const db = ev.target.result;
          let tx;
          try {
            tx = db.transaction('trips', 'readonly');
          } catch (e) {
            resolve(null);
            return;
          }
          const store = tx.objectStore('trips');
          const getAllReq = store.getAll();
          getAllReq.onsuccess = () => resolve(getAllReq.result);
          getAllReq.onerror = () => reject(getAllReq.error);
        };
      }).then((rows) => {
        expect(rows).to.be.an('array');
        // should have at least 2 rows (seed + stored)
        expect(rows.length).to.be.at.least(2);
      });
    });
  });
});
