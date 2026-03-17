describe('Mock auth flow', () => {
  it('logs in programmatically and sets session/local storage', () => {
    cy.login();

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('token')).to.equal('fake-jwt-token');
      expect(win.localStorage.getItem('rg-is-authenticated')).to.equal('true');
      expect(win.localStorage.getItem('rg-authenticated-user-id')).to.equal('e2e-user');
    });
  });
});
