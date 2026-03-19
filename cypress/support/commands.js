// Cypress support commands for app setup: auth + fake spreadsheet + seed data

function ensureLocalDbSchema(db) {
  let spreadsheetsStore;
  if (!db.objectStoreNames.contains('spreadsheets')) {
    spreadsheetsStore = db.createObjectStore('spreadsheets', { keyPath: 'id' });
  }
  if (spreadsheetsStore && !spreadsheetsStore.indexNames.contains('default')) {
    spreadsheetsStore.createIndex('default', 'default', { unique: false });
  }

  let shiftsStore;
  if (!db.objectStoreNames.contains('shifts')) {
    shiftsStore = db.createObjectStore('shifts', { keyPath: 'id', autoIncrement: true });
  }
  if (shiftsStore && !shiftsStore.indexNames.contains('date')) {
    shiftsStore.createIndex('date', 'date', { unique: false });
  }
  if (shiftsStore && !shiftsStore.indexNames.contains('service')) {
    shiftsStore.createIndex('service', 'service', { unique: false });
  }
  if (shiftsStore && !shiftsStore.indexNames.contains('number')) {
    shiftsStore.createIndex('number', 'number', { unique: false });
  }
  if (shiftsStore && !shiftsStore.indexNames.contains('key')) {
    shiftsStore.createIndex('key', 'key', { unique: false });
  }

  let tripsStore;
  if (!db.objectStoreNames.contains('trips')) {
    tripsStore = db.createObjectStore('trips', { keyPath: 'id', autoIncrement: true });
  }
  if (tripsStore && !tripsStore.indexNames.contains('date')) {
    tripsStore.createIndex('date', 'date', { unique: false });
  }
  if (tripsStore && !tripsStore.indexNames.contains('service')) {
    tripsStore.createIndex('service', 'service', { unique: false });
  }
  if (tripsStore && !tripsStore.indexNames.contains('number')) {
    tripsStore.createIndex('number', 'number', { unique: false });
  }
  if (tripsStore && !tripsStore.indexNames.contains('key')) {
    tripsStore.createIndex('key', 'key', { unique: false });
  }
}

function createIndexedStore(db, storeName, indexes) {
  let store;
  if (!db.objectStoreNames.contains(storeName)) {
    store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
  }
  if (!store) {
    return;
  }
  indexes.forEach((indexName) => {
    if (!store.indexNames.contains(indexName)) {
      store.createIndex(indexName, indexName, { unique: false });
    }
  });
}

function ensureSpreadsheetDbSchema(db) {
  createIndexedStore(db, 'addresses', ['address', 'saved']);
  createIndexedStore(db, 'deliveries', ['address', 'name']);
  createIndexedStore(db, 'daily', ['date']);
  createIndexedStore(db, 'expenses', ['rowId', 'date', 'saved']);
  createIndexedStore(db, 'monthly', ['month']);
  createIndexedStore(db, 'names', ['name', 'saved']);
  createIndexedStore(db, 'places', ['place', 'saved']);
  createIndexedStore(db, 'ratings', ['date', 'time']);
  createIndexedStore(db, 'regions', ['region', 'saved']);
  createIndexedStore(db, 'services', ['service', 'saved']);
  createIndexedStore(db, 'setup', ['name', 'saved']);
  createIndexedStore(db, 'shifts', ['rowId', 'date', 'service', 'number', 'key', 'saved']);
  createIndexedStore(db, 'trips', ['rowId', 'date', 'service', 'number', 'key', 'saved']);
  createIndexedStore(db, 'types', ['type', 'saved']);
  createIndexedStore(db, 'weekdays', ['day']);
  createIndexedStore(db, 'weekly', ['week', 'begin', 'end']);
  createIndexedStore(db, 'yearly', ['year']);
}

function navigateWithinApp(path) {
  const pathToAriaLabel = {
    '/trips': 'View trips',
    '/shifts': 'View shifts',
    '/metrics': 'View metrics',
    '/search': 'Search',
    '/stats': 'View statistics',
    '/expenses': 'View expenses',
    '/diagnostics': 'View diagnostics',
    '/setup': 'Open settings',
    '/': 'Go to home page'
  };

  const ariaLabel = pathToAriaLabel[path];
  if (ariaLabel) {
    return cy.get(`[aria-label="${ariaLabel}"]`).first().click({ force: true });
  }

  return cy.window().then((win) => {
    win.history.pushState({}, '', path);
    win.dispatchEvent(new PopStateEvent('popstate'));
  });
}

function recreateLocalDb(win) {
  return new Cypress.Promise((resolve) => {
    try {
      const deleteReq = win.indexedDB.deleteDatabase('localDB');
      deleteReq.onsuccess = () => {
        try {
          const openReq = win.indexedDB.open('localDB', 1);
          openReq.onupgradeneeded = () => {
            const db = openReq.result;
            try {
              ensureLocalDbSchema(db);
            } catch (e) {}
          };
          openReq.onsuccess = () => {
            try { openReq.result.close(); } catch (e) {}
            resolve();
          };
          openReq.onerror = () => resolve();
        } catch (e) {
          resolve();
        }
      };
      deleteReq.onerror = () => resolve();
      deleteReq.onblocked = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

// Simple login helper (sets cookie). Use setupApp() for full boot-time setup.
Cypress.Commands.add('login', (token) => {
  if (token) return cy.setCookie('ACCESS_TOKEN', token, { secure: true });
  return cy.fixture('token').then(t => cy.setCookie('ACCESS_TOKEN', t.token, { secure: true }));
});

// Write a spreadsheet record directly into localDB before app initializes
Cypress.Commands.add('addFakeSpreadsheet', (id = 'sheet-e2e', name = 'E2E Sheet') => {
  // This helper writes into IndexedDB via window context
  return cy.window().then((win) => {
    return new Cypress.Promise((resolve, reject) => {
      try {
        const openReq = win.indexedDB.open('localDB');
        openReq.onsuccess = () => {
          try {
            const db = openReq.result;
            const tx = db.transaction('spreadsheets', 'readwrite');
            const store = tx.objectStore('spreadsheets');
            store.put({ id, default: 'true', name, size: 0 });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('tx error'));
          } catch (err) {
            // if store not present, resolve silently
            resolve();
          }
        };
        openReq.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  });
});

// Seed trips into spreadsheetDB.trips
Cypress.Commands.add('seedTrips', (trips = []) => {
  return cy.window().then((win) => {
    return new Cypress.Promise((resolve, reject) => {
      try {
        const openReq = win.indexedDB.open('spreadsheetDB');
        openReq.onsuccess = () => {
          try {
            const db = openReq.result;
            const tx = db.transaction('trips', 'readwrite');
            const store = tx.objectStore('trips');
            store.clear();
            for (const t of trips) {
              // mark seeded rows as coming from spreadsheet unless explicitly overridden
              const row = Object.assign({ saved: true }, t);
              store.add(row);
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('tx error'));
          } catch (err) {
            resolve();
          }
        };
        openReq.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  });
});

// Seed shifts into spreadsheetDB.shifts
Cypress.Commands.add('seedShifts', (shifts = []) => {
  return cy.window().then((win) => {
    return new Cypress.Promise((resolve, reject) => {
      try {
        const openReq = win.indexedDB.open('spreadsheetDB');
        openReq.onsuccess = () => {
          try {
            const db = openReq.result;
            const tx = db.transaction('shifts', 'readwrite');
            const store = tx.objectStore('shifts');
            store.clear();
            for (const s of shifts) {
              const row = Object.assign({ saved: true }, s);
              store.add(row);
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('tx error'));
          } catch (err) {
            resolve();
          }
        };
        openReq.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  });
});

// Full setup: performs auth cookie + writes spreadsheet before app boot, and optionally seeds trips
Cypress.Commands.add('setupApp', (opts = {}) => {
  const tokenPromise = opts.token ? cy.wrap(opts.token) : cy.fixture('token').then(t => t.token);
  const userId = opts.userId || 'e2e-user';
  const sheetId = opts.sheetId || 'sheet-e2e';
  const sheetName = opts.sheetName || 'E2E Sheet';

  return tokenPromise.then((token) => {
    // Set cookie via Cypress API before visiting so cookie exists at page load
    const isHttps = !!Cypress.config('baseUrl') && Cypress.config('baseUrl').startsWith('https');
    const cookieOpts = isHttps ? { secure: true, sameSite: 'Strict', path: '/' } : { sameSite: 'Strict', path: '/' };
    cy.setCookie('ACCESS_TOKEN', token, cookieOpts);
    cy.setCookie('PKCE_verifier', opts.pkce || 'e2e-verifier', cookieOpts);

    // Visit root and set storage and create minimal DB stores during onBeforeLoad so Angular sees session/localStorage
    cy.visit('/', {
      onBeforeLoad(win) {
        try {
          win.sessionStorage.setItem('token', token);
          win.localStorage.setItem('rg-is-authenticated', 'true');
          win.localStorage.setItem('rg-authenticated-user-id', userId);
          // Ensure localDB has expected stores and indexes before app runs
          try {
            const req = win.indexedDB.open('localDB', 1);
            req.onupgradeneeded = () => {
              const db = req.result;
              try { ensureLocalDbSchema(db); } catch(e) {}
            };
          } catch (e) {}
        } catch (e) {
          // ignore
        }
      }
    });

    // Optionally seed trips (and shifts) after app load
    if (opts.seedTrips) {
      const today = new Date().toISOString().slice(0, 10);
      const sample = {
        rowId: 2,
        date: today,
        pay: 12.5,
        distance: 3.2,
        pickupTime: '08:00',
        place: opts.place || 'Test Place',
        saved: true
      };
      return cy.seedTrips(opts.trips || [sample]).then(() => {
        if (opts.seedShifts) {
          const shiftSample = {
            rowId: 1,
            date: today,
            service: opts.shiftService || 'E2E',
            number: 1,
            key: 'shift-e2e-1',
            saved: true
          };
          return cy.seedShifts(opts.shifts || [shiftSample]);
        }
        return cy.wrap(null);
      });
    }
  });
});

// Visit a specific path and inject boot-time state in onBeforeLoad so the target page
// initializes with auth + default spreadsheet present. Preferred for pages like /trips.
Cypress.Commands.add('bootVisit', (path = '/', opts = {}) => {
  const tokenPromise = opts.token ? cy.wrap(opts.token) : cy.fixture('token').then(t => t.token);
  const userId = opts.userId || 'e2e-user';
  const sheetId = opts.sheetId || 'sheet-e2e';
  const sheetName = opts.sheetName || 'E2E Sheet';
  const spreadsheetDbVersion = 3;

  return tokenPromise.then((token) => {
    // Ensure cookies are set before first visit so SecureCookieStorageService can read them
    const isHttps2 = !!Cypress.config('baseUrl') && Cypress.config('baseUrl').startsWith('https');
    const cookieOpts2 = isHttps2 ? { secure: true, sameSite: 'Strict', path: '/' } : { sameSite: 'Strict', path: '/' };
    cy.setCookie('ACCESS_TOKEN', token, cookieOpts2);
    cy.setCookie('PKCE_verifier', opts.pkce || 'e2e-verifier', cookieOpts2);

    // Start from a neutral static page so we can safely rebuild DBs before Angular opens Dexie connections.
    cy.visit('/offline.html');

    // Rebuild test DB state from scratch: empty spreadsheetDB schema + localDB default sheet.
    cy.window().then((win) => {
      const deleteDb = (name) => new Cypress.Promise((resolve) => {
        try {
          const delReq = win.indexedDB.deleteDatabase(name);
          delReq.onsuccess = () => resolve();
          delReq.onerror = () => resolve();
          delReq.onblocked = () => resolve();
        } catch (e) {
          resolve();
        }
      });

      const createLocalDb = () => new Cypress.Promise((resolve) => {
        try {
          const req = win.indexedDB.open('localDB', 1);
          req.onupgradeneeded = () => {
            const db = req.result;
            try { ensureLocalDbSchema(db); } catch (e) {}
          };
          req.onsuccess = () => {
            try {
              const db = req.result;
              const tx = db.transaction('spreadsheets', 'readwrite');
              const store = tx.objectStore('spreadsheets');
              store.put({ id: sheetId, default: 'true', name: sheetName, size: 0, source: 'e2e' });
              tx.oncomplete = () => {
                try { db.close(); } catch (e) {}
                resolve();
              };
              tx.onerror = () => {
                try { db.close(); } catch (e) {}
                resolve();
              };
            } catch (e) {
              try { req.result.close(); } catch (err) {}
              resolve();
            }
          };
          req.onerror = () => resolve();
        } catch (e) {
          resolve();
        }
      });

      const createSpreadsheetDb = () => new Cypress.Promise((resolve) => {
        try {
          const req = win.indexedDB.open('spreadsheetDB', spreadsheetDbVersion);
          req.onupgradeneeded = () => {
            const db = req.result;
            try { ensureSpreadsheetDbSchema(db); } catch (e) {}
          };
          req.onsuccess = () => {
            try { req.result.close(); } catch (e) {}
            resolve();
          };
          req.onerror = () => resolve();
        } catch (e) {
          resolve();
        }
      });

      return deleteDb('localDB')
        .then(() => deleteDb('spreadsheetDB'))
        .then(() => createLocalDb())
        .then(() => createSpreadsheetDb());
    }).then(() => {
      // Now load Angular with auth storage already set at boot.
      cy.visit('/', {
        onBeforeLoad(win) {
          try {
            win.sessionStorage.setItem('token', token);
            win.localStorage.setItem('rg-is-authenticated', 'true');
            win.localStorage.setItem('rg-authenticated-user-id', userId);
          } catch (e) {
            // ignore
          }
        }
      });
    }).then(() => {
      // Wait for the header to reflect authenticated + default sheet state.
      // Prefer waiting for the header trips link rather than an arbitrary delay.
      const headerTimeout = opts.headerTimeout || 10000;
      cy.get('[aria-label="View trips"]', { timeout: headerTimeout }).should('be.visible');

      if (opts.seedTrips) {
        const today = new Date().toISOString().slice(0, 10);
        const sample = {
          rowId: 2,
          date: today,
          pay: 12.5,
          distance: 3.2,
          pickupTime: '08:00',
          place: opts.place || 'Test Place',
          saved: true
        };
        // Seed trips first, then optionally seed shifts, then navigate within app
        return cy.seedTrips(opts.trips || [sample]).then(() => {
          if (opts.seedShifts) {
            const shiftSample = {
              rowId: 1,
              date: today,
              service: opts.shiftService || 'E2E',
              number: 1,
              key: 'shift-e2e-1',
              saved: true
            };
            return cy.seedShifts(opts.shifts || [shiftSample]).then(() => navigateWithinApp(path));
          }
          return navigateWithinApp(path);
        });
      } else {
        // Navigate within the already-loaded app after header is ready.
        return navigateWithinApp(path);
      }
    });
  });
});

