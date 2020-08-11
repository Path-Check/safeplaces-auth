# Architectural Separation

## Module System

The security system used by SafePlaces is separated into a few distinct
components. The central consumer of the security features is the **SafePlaces
Backend** server. It uses the **SafePlaces Information Security** (SafePlaces
Auth) module for the following purposes:

- Handling login requests
- Handling logout requests
- Supplying the multi-factor authentication flow, including enrolling
  authenticators, initiating challenges, and verifying codes
- Verifying requests to protected resources
- Managing users, including their retrieval, creation, deletion, and
  modification
- Supplying the user onboarding flow, including setting an initial password and
  enrolling in multi-factor authentication
- Providing self-service functionality to users such as creating password reset
  tickets

However, the SafePlaces Infosec module is sufficiently separated from the
backend server so that a health authority may easily replace it with their own
implementation. Specifically, the SafePlaces Infosec module seeks to cover the
_entry_ and _exit_ points of the authentication and authorization process.

<!-- Add diagram -->

For example, the login endpoint—covering the entry—issues an access token to the
client, which is used for subsequent requests to protected resources. Whenever
the client attempts to operate on a protected resource, the auth module—serving
as a gateway to these resources–verifies the access token and determines whether
to deny or allow the request. Similarly, the last stage of the process, user
logout, is handled by the auth module by clearing and/or disabling its access
token.

Clearly, _every client-facing aspect of security_ is managed by this auth
module, resulting in its high flexibility. The functionality of the underlying
server is irrelevant to the Infosec module.

Lastly, the user management system is also provided by this module, though the
functionality may appear much different should a health authority use their own
identity provider. For example, they may already have their own interface to the
identity manager.

## Token Issuance vs. Validation

An important aspect to note is that the SafePlaces Infosec module _never issues
access tokens_. By relying on the structure of JSON Web Tokens (JWTs), Auth0
issues access tokens signed by their **private key**. Auth0 then exposes a
publicly accessible endpoint that allows SafePlaces Infosec to fetch the
**public key**.

With RS256 asymmetric signing, only Auth0 can _issue_ access tokens; however,
SafePlaces Infosec is able to _verify_ the access tokens by checking their
expiration date and signature using the public key. The auth module fetches the
JSON Web Key Set (JWKS)—the set of public keys used to verify JWTs—by requesting
the JSON object located at `{{AUTH0_BASE_URL}}/.well-known/jwks.json`. The base
URL variable is described in the [Provisioning Auth0](provisioning-auth0.md)
section.

---

[⟵ Back to home page](../README.md)
