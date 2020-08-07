const R = require('ramda');
const WError = require('../../utils/werror');
const sequential = require('../middleware/sequential');
const validator = require('../middleware/validator');
const errorHandler = require('../middleware/errorHandler');
const schema = require('./schema');
const oauth = require('../../services/oauth');
const generate = require('../../services/generate');

const controller = R.curry(async (config, req, res) => {
  const { username, password } = req.body;

  let tokenData;
  try {
    tokenData = await oauth.passwordOnlyGrant(config)(username, password);
  } catch (e) {
    if (e.response && e.response.body) {
      const data = e.response.body;
      if (data.error === 'mfa_required') {
        // Multi-factor authentication is required.
        res.status(401).json({
          error: 'MFARequired',
          error_description: 'Multifactor authentication required',
          mfa_token: data.mfa_token,
        });
        return;
      } else if (data.error === 'invalid_grant') {
        // The credentials were invalid.
        res.status(401).json({
          error: 'InvalidCredentials',
          error_description: 'Wrong username or password',
        });
        return;
      } else {
        // An unknown error occurred.
        throw new WError({
          name: 'Auth0Error',
          message: 'an error occurred with Auth0',
          data: { res: data },
        });
      }
    }

    throw e;
  }

  const cookieString = generate.tokenCookie(config, tokenData);
  res.status(200).header('Set-Cookie', cookieString).json({
    id: '',
  });
});

module.exports = config =>
  sequential(validator(schema), controller(config), errorHandler());
