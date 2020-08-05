const api = require('./api/routes');
const strategies = require('./guard/strategies');
const Guard = require('./guard/guard');

module.exports = {
  api,
  strategies,
  Guard,
};
