const R = require('ramda');
const superagent = require('superagent');

const mfaGrant = R.curry(async (config, mfaToken, oobCode, bindingCode) => {
  const { auth0 } = config;

  const data = await superagent
    .post(`${auth0.baseUrl}/oauth/token`)
    .set('Authorization', `Bearer ${mfaToken}`)
    .send({
      grant_type: 'http://auth0.com/oauth/grant-type/mfa-oob',
      client_id: auth0.clientId,
      client_secret: auth0.clientSecret,
      mfa_token: mfaToken,
      oob_code: oobCode,
      binding_code: bindingCode,
    })
    .then(res => res.body);

  return R.pick(['access_token', 'expires_in'], data);
});

const fetchAccessToken = R.curry(async (config, username, password) => {
  const { auth0 } = config;

  const data = await superagent
    .post(`${auth0.baseUrl}/oauth/token`)
    .type('form')
    .send({
      grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
      audience: auth0.apiAudience,
      client_id: auth0.clientId,
      client_secret: auth0.clientSecret,
      realm: auth0.realm,
      scope: 'openid',
      username,
      password,
    })
    .then(res => res.body);

  return R.pick(['access_token', 'expires_in'], data);
});

module.exports = { fetchAccessToken, mfaGrant };
