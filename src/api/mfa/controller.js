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
      message: 'MFA token is malformed, try getting a new token',
    });
    return true;
  } else if (
    data.error_description ===
    'The mfa_token provided is invalid. Try getting a new token.'
  ) {
    res.status(401).json({
      error: 'MFATokenInvalid',
      message: 'MFA token is invalid, try getting a new token',
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
  const selectedAuth = auths[0];

  // Trigger a MFA challenge to be sent.
  let data;
  try {
    data = await mfa.challenge(config)(mfaToken, selectedAuth.id);
  } catch (e) {
    if (e.response && e.response.body) {
      const data = e.response.body;

      if (handleTokenError(data, res)) return;
    }
    throw e;
  }

  res.status(200).json({
    name: selectedAuth.name, // The user's obfuscated phone number.
    oob_code: data.oob_code, // An out-of-band code.
  });
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
      } else if (data.error_description === 'User is already enrolled.') {
        res.status(409).json({
          error: 'UserAlreadyEnrolled',
          message:
            'An MFA factor is already enrolled, try requesting a challenge for the existing factor',
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
    tokenData = await oauth.mfaOTPGrant(config)(mfaToken, oobCode, bindingCode);
  } catch (e) {
    if (e.response && e.response.body) {
      const data = e.response.body;

      if (data.error_description === 'Invalid binding_code.') {
        res.status(403).json({
          error: 'InvalidBindingCode',
          message: 'Binding code is invalid, try triggering a re-send',
        });
        return true;
      } else if (data.error_description === 'Malformed oob_code') {
        res.status(400).json({
          error: 'MalformedOOBCode',
          message: 'OOB code is malformed',
        });
        return true;
      }

      if (handleTokenError(data, res)) return;
    }
    throw e;
  }

  const cookieString = generate.tokenCookie(config, tokenData);

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

  const cookieString = generate.tokenCookie(config, tokenData);

  // Respond with a new recovery code.
  res.status(200).header('Set-Cookie', cookieString).json({
    recovery_code: tokenData.recovery_code,
  });
});

const tokenMissingObject = {
  error: 'MFATokenMissing',
  message: 'MFA token is missing',
};

module.exports = config => ({
  challenge: sequential(
    validator(schema.none),
    authHeaderGetter(tokenMissingObject),
    challengeController(config),
    errorHandler(),
  ),
  enroll: sequential(
    validator(schema.enroll),
    authHeaderGetter(tokenMissingObject),
    enrollController(config),
    errorHandler(),
  ),
  verify: sequential(
    validator(schema.verify),
    authHeaderGetter(tokenMissingObject),
    verifyController(config),
    errorHandler(),
  ),
  recover: sequential(
    validator(schema.recover),
    authHeaderGetter(tokenMissingObject),
    recoverController(config),
    errorHandler(),
  ),
});
