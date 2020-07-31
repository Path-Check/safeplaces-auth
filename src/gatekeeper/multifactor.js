const assert = require('assert');
const fetch = require('node-fetch');
const VError = require('verror');

class Multifactor {
  constructor(params) {
    assert.ok(params, 'multifactor params are required');

    const { baseUrl, clientId, clientSecret } = params;
    assert.ok(baseUrl, 'Auth0 base URL is required');
    assert.ok(clientId, 'Auth0 client ID is required');
    assert.ok(clientSecret, 'Auth0 client secret is required');

    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._baseUrl = baseUrl;
  }

  async listAuthenticators(mfaToken) {
    assert.ok(mfaToken, 'MFA token is required');

    const res = await fetch(`${this._baseUrl}/mfa/authenticators`, {
      method: 'GET',
      headers: { authorization: `Bearer ${mfaToken}` },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new VError(
        {
          name: 'Auth0Error',
          info: { res: data },
        },
        'unable to list authenticators',
      );
    }

    return data;
  }

  async requestChallenge(mfaToken, authenticatorId) {
    assert.ok(mfaToken, 'MFA token is required');

    const res = await fetch(`${this._baseUrl}/mfa/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mfa_token: mfaToken,
        client_id: this._clientId,
        challenge_type: 'oob',
        oob_channel: 'sms',
        authenticator_id: authenticatorId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new VError({ info: data }, 'unable to request challenge');
    }
    return data;
  }

  async enroll(mfaToken, phoneNum) {
    assert.ok(
      /^\+[1-9]\d{1,14}$/.test(phoneNum),
      `invalid phone number: ${phoneNum}`,
    );

    const res = await fetch(`${this._baseUrl}/mfa/associate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authenticator_types: ['oob'],
        oob_channels: ['sms'],
        phone_number: phoneNum,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new VError({ info: data }, 'unable to enroll phone number');
    }
    return data;
  }

  async confirmEnrollment(mfaToken, oobCode, bindingCode) {
    const params = new URLSearchParams({
      grant_type: 'http://auth0.com/oauth/grant-type/mfa-oob',
      mfa_token: mfaToken,
      oob_code: oobCode,
      binding_code: bindingCode,
      client_id: this._clientId,
      client_secret: this._clientSecret,
    });

    const res = await fetch(`${this._baseUrl}/oauth/token`, {
      method: 'POST',
      body: params,
      headers: {
        authorization: `Bearer ${mfaToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new VError({ info: data }, 'unable to confirm enrollment');
    }
    return data;
  }
}

module.exports = Multifactor;
