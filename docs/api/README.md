# SafePlaces Information Security API

## Authentication

Resources for controlling a user's stage of authentication.

After becoming cleared by the login endpoint, a user is classified
as _stage-1_ authenticated. When multi-factor authentication is
enabled and required, the user must pass _stage-2_ authentication
in order to successfully gain access to protected resources.

- <code><a href="login.md">POST /auth/login</a></code>
- <code><a href="logout.md">GET /auth/logout</a></code>
- <code><a href="register.md">POST /auth/register</a></code>

## Multi-factor Authentication

Resources for navigating the multi-factor authentication flow
in order to complete the standard authentication process.

All of the following endpoints are protected and only accessible
to _stage-1_ authenticated users. Completing the multi-factor
authentication challenge elevates the user to _stage-2_, thereby
granting access to the resources authorized by their role.

- <code><a href="mfa/enroll.md">POST /auth/mfa/enroll</a></code>
- <code><a href="mfa/challenge.md">POST /auth/mfa/challenge</a></code>
- <code><a href="mfa/verify.md">POST /auth/mfa/verify</a></code>

## User Management

Resources for provisioning and managing users to the SafePlaces
application.

All of the following endpoints are protected and only accessible
to authenticated super administrators.

- <code><a href="users/get.md">POST /auth/users/get</a></code>
- <code><a href="users/list.md">POST /auth/users/list</a></code>
- <code><a href="users/create.md">POST /auth/users/create</a></code>
- <code><a href="users/delete.md">POST /auth/users/delete</a></code>
- <code><a href="users/assign-role.md">POST /auth/users/assign-role</a></code>
