const index = require('../src/index');

describe('index', () => {
  it('exports the necessary modules', () => {
    expect(index).toHaveProperty('Enforcer');
    expect(index).toHaveProperty('Issuer');
    expect(index).toHaveProperty('strategies');
    expect(index.strategies).toHaveProperty('Auth0');
    expect(index.strategies).toHaveProperty('SymJWT');
  });
});
