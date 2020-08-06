const R = require('ramda');
const schema = require('./schema');
const oauth = require('../../services/oauth');
const mfa = require('../../services/mfa');
const generate = require('../../services/generate');

/**
 * Middleware
 */
const sequential = require('../middleware/sequential');
const validator = require('../middleware/validator');
const authHeaderGetter = require('../middleware/authHeaderGetter');
const errorHandler = require('../middleware/errorHandler');

const handleTokenError = (data, res) => {
  if (data.error_description === 'mfa_token is expired') {
    res.status(401).json({
      error: 'MFATokenExpired',
      message: 'MFA token is expired, try getting a new token',
    });
    return true;
  } else if (data.error_description === 'Malformed mfa_token') {
    res.status(400).json({
      error: 'MFATokenMalformed',
      message: 'MFA token is malformed',
    });
    return true;
  }

  return false;
};

const challengeController = R.curry(async (config, req, res) => {
  const { accessToken: mfaToken } = req;

  let auths;
  try {
    // Get MFA authenticators.
    auths = await mfa.getAuths(config)(mfaToken);
  } catch (e) {
    if (e.response && e.response.body) {
      const data = e.response.body;

      if (handleTokenError(data, res)) return;
    }
    throw e;
  }

  if (auths.length === 0) {
    res.status(404).json({
      error: 'MFANotEnrolled',
      message: 'No MFA authenticators enrolled',
    });
    return;
  }

  // Select the first authenticator.
  const authId = auths[0].id;

  // Trigger a MFA challenge to be sent.
  const data = await mfa.challenge(config)(mfaToken, authId);

  res.status(200).json({ oob_code: data.oob_code });
});

const enrollController = R.curry(async (config, req, res) => {
  const { accessToken: mfaToken } = req;
  const { phone_number: phoneNum } = req.body;

  let data;
  try {
    data = await mfa.enroll(config)(mfaToken, phoneNum);
  } catch (e) {
    if (e.response && e.response.body) {
      const data = e.response.body;

      if (data.error_description === 'The phone number is invalid.') {
        res.status(400).json({
          error: 'InvalidPhoneNumber',
          message: 'Phone number is invalid',
        });
        return;
      }

      if (handleTokenError(data, res)) return;
    }
    throw e;
  }

  /*
  Expected response:
  {
    "oob_code": "Fe26.2*82d...",
    "recovery_codes": ["3FU5MVP321YXG6WE6N7A2XYZ"]
  }
   */
  res.status(200).json(data);
});

const verifyController = R.curry(async (config, req, res) => {
  const { accessToken: mfaToken } = req;
  const { oob_code: oobCode, binding_code: bindingCode } = req.body;

  let tokenData;
  try {
    tokenData = await oauth.mfaGrant(config)(mfaToken, oobCode, bindingCode);
  } catch (e) {
    if (e.response && e.response.body) {
      const data = e.response.body;

      if (data.error_description === 'Invalid binding_code.') {
        res.status(403).json({
          error: 'InvalidBindingCode',
          message: 'Binding code is invalid, try triggering a re-send',
        });
        return true;
      }

      if (handleTokenError(data, res)) return;
    }
    throw e;
  }

  /*
  Expected response:
  {
    "access_token": "eyJhbG...",
    "expires_in": 3600
  }
   */
  const cookieString = generate.tokenCookieString(config, tokenData);

  res.status(204).header('Set-Cookie', cookieString).end();
});

const recoverController = R.curry(async (config, req, res) => {
  const { accessToken: mfaToken } = req;
  const { recovery_code: recoveryCode } = req.body;

  let tokenData;
  try {
    tokenData = await oauth.mfaRecoveryGrant(config)(mfaToken, recoveryCode);
  } catch (e) {
    if (e.response && e.response.body) {
      const data = e.response.body;

      if (data.error_description === 'MFA Authorization rejected.') {
        res.status(401).json({
          error: 'InvalidRecoveryCode',
          message: 'Recovery code is invalid',
        });
        return;
      }

      if (handleTokenError(data, res)) return;
    }
    throw e;
  }

  /*
  Expected response:
  {
    "access_token": "eyJhbG...",
    "expires_in": 3600
  }
   */
  const cookieString = generate.tokenCookieString(config, tokenData);

  res.status(200).header('Set-Cookie', cookieString).json({
    recovery_code: tokenData.recovery_code,
  });
});

module.exports = config => ({
  challenge: sequential(
    validator(schema.challenge),
    authHeaderGetter({
      error: 'MFATokenMissing',
      message: 'MFA token is missing',
    }),
    challengeController(config),
    errorHandler(),
  ),
  enroll: sequential(
    validator(schema.enroll),
    authHeaderGetter({
      error: 'MFATokenMissing',
      message: 'MFA token is missing',
    }),
    enrollController(config),
    errorHandler(),
  ),
  verify: sequential(
    validator(schema.verify),
    authHeaderGetter({
      error: 'MFATokenMissing',
      message: 'MFA token is missing',
    }),
    verifyController(config),
    errorHandler(),
  ),
  recover: sequential(
    validator(schema.recover),
    authHeaderGetter({
      error: 'MFATokenMissing',
      message: 'MFA token is missing',
    }),
    recoverController(config),
    errorHandler(),
  ),
});
