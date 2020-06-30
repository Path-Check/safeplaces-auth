const timeout = require('./timeout');

async function userGetter(data) {
  await timeout(0);
  return data;
}

module.exports = userGetter;
