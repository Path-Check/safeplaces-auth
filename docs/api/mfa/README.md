# Multi-factor Authentication API

After becoming cleared by the login endpoint, a user receives a token designating them as _factor-1_ authenticated.
When multi-factor authentication is enabled and required, the user must pass _factor-2_ authentication in order to
successfully gain access to protected resources.

All the multi-factor authentication endpoints are protected and only accessible to _factor-1_ authenticated users.
Completing the multi-factor authentication challenge elevates the user to _factor-2_, thereby granting access to the
resources authorized by their role.

See [SafePlaces Multi-factor Authentication Flow](../mfa-flow.md) for a walkthrough of the login flow.

## Resources

- <code><a href="enroll.md">POST /auth/mfa/enroll</a></code>
- <code><a href="challenge.md">POST /auth/mfa/challenge</a></code>
- <code><a href="verify.md">POST /auth/mfa/verify</a></code>
- <code><a href="recover.md">POST /auth/mfa/recover</a></code>

## General Errors

See [Multi-factor Authentication Errors](errors.md) for some general
errors that can occur when accessing the MFA endpoints.

---

[Home](../../README.md) › [SafePlaces Information Security API](../README.md)
› Multi-factor Authentication API
