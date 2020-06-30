const timeout = require('./timeout');

function Strategy(decoded) {
  this.decoded = decoded;

  this.validate = jest.fn(async () => {
    await timeout(0);
    return this.decoded;
  });
}

module.exports = Strategy;
