const R = require('ramda');
const sequential = require('../middleware/sequential');
const errorHandler = require('../middleware/errorHandler');
const generate = require('../../services/generate');

const controller = R.curry((config, req, res) => {
  const cookieString = generate.cookieString({
    name: 'access_token',
    value: 'deleted',
    path: '/',
    expires: new Date(1970, 1, 1),
    httpOnly: true,
    sameSite: !!config.cookie.sameSite,
    secure: !!config.cookie.secure,
    domain: config.cookie.domain,
  });

  res.status(204).header('Set-Cookie', cookieString).end();
});

module.exports = config => sequential(controller(config), errorHandler());
