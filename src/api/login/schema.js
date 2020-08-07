const ow = require('ow');

module.exports = ow.object.exactShape({
  username: ow.string,
  password: ow.string,
});
