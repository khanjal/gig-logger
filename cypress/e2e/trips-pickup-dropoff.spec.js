describe('Trips - pickup/dropoff display and DB verification', () => {
  const today = new Date().toISOString().slice(0, 10);

  const makeTripWithTimes = () => ({
    rowId: 10,
    date: today,
    service: 'TestRide',
    region: 'Zone A',
    number: 1,
    key: `${today}-testride-1`,
    place: 'Times Place',
    type: 'Passenger',
    pickupTime: '07:30',
    dropoffTime: '08:00',
    pay: 10,
    tip: 0,
    total: 10,
    distance: 5,
    saved: false,
    action: 'ADD'
  });

  beforeEach(() => {
    cy.bootVisit('/trips', {
      seedTrips: true,
      trips: [makeTripWithTimes()]
    });
  });

  it('shows pickup and dropoff times in the trip card', () => {
    cy.contains("Today's Trips (1)").should('exist');

    // card should display pickup and dropoff times (accept padded or non-padded)
    cy.contains(/07:30|7:30/).should('exist');
    cy.contains(/08:00|8:00/).should('exist');
  });

  it('verifies the times are persisted in IndexedDB trips store', () => {
    // read the trips object store from the browser's IndexedDB
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
            // trips store not present
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
        const found = rows.find(r => r.key === `${today}-testride-1`);
        expect(found).to.exist;
        expect(found.pickupTime).to.equal('07:30');
        expect(found.dropoffTime).to.equal('08:00');
      });
    });
  });
});
