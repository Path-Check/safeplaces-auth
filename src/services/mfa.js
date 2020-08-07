const R = require('ramda');
const superagent = require('superagent');

/**
 * Filters out authenticators that do not use OOB codes or the SMS channel.
 */
const filterAuths = R.filter(
  R.whereEq({
    authenticator_type: 'oob',
    oob_channel: 'sms',
  }),
);

/**
 * Gets a user's enrolled authenticators.
 *
 * @param config A configuration object for Auth0 and other settings.
 * @param mfaToken The multifactor authentication token.
 */
const getAuths = R.curry((config, mfaToken) => {
  const { auth0 } = config;

  return superagent
    .get(`${auth0.baseUrl}/mfa/authenticators`)
    .set('Authorization', `Bearer ${mfaToken}`)
    .then(res => res.body)
    .then(filterAuths); // Filter out unacceptable methods of authentication.
});

/**
 * Enrolls a user with MFA.
 *
 * @param config A configuration object for Auth0 and other settings.
 * @param mfaToken The multifactor authentication token.
 * @param phoneNum An E.164-compliant phone number.
 */
const enroll = R.curry((config, mfaToken, phoneNum) => {
  const { auth0 } = config;

  return superagent
    .post(`${auth0.baseUrl}/mfa/associate`)
    .set('Authorization', `Bearer ${mfaToken}`)
    .send({
      authenticator_types: ['oob'],
      oob_channels: ['sms'],
      phone_number: phoneNum,
    })
    .then(res => res.body)
    .then(R.pick(['recovery_codes', 'oob_code']));
});

/**
 * Triggers a MFA challenge to be sent.
 *
 * @param config A configuration object for Auth0 and other settings.
 * @param mfaToken The multifactor authentication token.
 * @param authId The ID of the authenticator.
 */
const challenge = R.curry((config, mfaToken, authId) => {
  const { auth0 } = config;

  return superagent
    .post(`${auth0.baseUrl}/mfa/challenge`)
    .send({
      client_id: auth0.clientId,
      client_secret: auth0.clientSecret,
      challenge_type: 'oob',
      mfa_token: mfaToken,
      authenticator_id: authId,
    })
    .then(res => res.body);
});

module.exports = {
  getAuths,
  challenge,
  enroll,
};
