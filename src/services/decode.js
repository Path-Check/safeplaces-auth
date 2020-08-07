const jwt = require('jsonwebtoken');

module.exports = token => jwt.decode(token);
