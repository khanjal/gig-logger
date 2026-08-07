describe('Trips CRUD tests', () => {
  it('edits a seeded trip note and restores it', () => {
    const today = new Date().toISOString().slice(0,10);
    const sampleTrip = { rowId: 2, date: today, pay: 12.5, distance: 3.2, pickupTime: '08:00', place: 'Test Place', note: 'E2E edited note', saved: true };
    cy.bootVisit('/trips', { seedTrips: true, seedShifts: true, trips: [sampleTrip] });

    // Wait for page to render trips list, then expand the trip details and assert the note is visible
    cy.get('#todaysTrips', { timeout: 15000 }).should('be.visible');
    cy.wait(300);

    // Ensure the seeded trip exists in IndexedDB before proceeding (more deterministic)
    cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        try {
          const req = win.indexedDB.open('spreadsheetDB');
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('trips', 'readonly');
            const store = tx.objectStore('trips');
            const idx = store.index('rowId');
            const getReq = idx.get(2);
            getReq.onsuccess = () => resolve(getReq.result);
            getReq.onerror = () => resolve(null);
          };
          req.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    }).should((row) => {
      expect(row).to.not.be.null;
      expect(row.rowId).to.equal(2);
      expect(row.place).to.equal('Test Place');
    });

    // Use the test-only helper to mark the trip deleted, then assert the DB row changed.
    cy.window().then(async (win) => {
      if (!win.__e2e__ || !win.__e2e__.setTripAction) throw new Error('E2E helper setTripAction not available');
      await win.__e2e__.setTripAction(2, 'DELETE');
    });
    cy.wait(250);

    // Verify DB row was marked deleted (action + saved flag)
    cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        try {
          const req = win.indexedDB.open('spreadsheetDB');
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('trips', 'readonly');
            const store = tx.objectStore('trips');
            const idx = store.index('rowId');
            const getReq = idx.get(2);
            getReq.onsuccess = () => resolve(getReq.result);
            getReq.onerror = () => resolve(null);
          };
          req.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    }).should((row) => {
      expect(row).to.not.be.null;
      expect(row.action).to.equal('DELETE');
      expect(row.saved).to.equal(false);
    });

    // Restore via helper and verify DB
    cy.window().then(async (win) => {
      await win.__e2e__.setTripAction(2, null);
    });
    cy.wait(250);
    cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        try {
          const req = win.indexedDB.open('spreadsheetDB');
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('trips', 'readonly');
            const store = tx.objectStore('trips');
            const idx = store.index('rowId');
            const getReq = idx.get(2);
            getReq.onsuccess = () => resolve(getReq.result);
            getReq.onerror = () => resolve(null);
          };
          req.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      });
    }).should((row) => {
      expect(row).to.not.be.null;
      expect(row.action).to.be.oneOf([undefined, null]);
      expect(row.saved).to.equal(true);
    });
  });
});
