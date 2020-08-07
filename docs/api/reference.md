# API Reference

## Authentication

### Factor 1

- <code><a href="login.md">POST /auth/login</a></code>
- <code><a href="logout.md">GET /auth/logout</a></code>

### Factor 2

- <code><a href="mfa/enroll.md">POST /auth/mfa/enroll</a></code>
- <code><a href="mfa/challenge.md">POST /auth/mfa/challenge</a></code>
- <code><a href="mfa/verify.md">POST /auth/mfa/verify</a></code>
- <code><a href="mfa/recover.md">POST /auth/mfa/recover</a></code>

## User Management

### Self-Service

- <code><a href="register.md">POST /auth/register</a></code>
- <code><a href="reset-password.md">POST /auth/reset-password</a></code>

### Provisioning

- <code><a href="get.md">POST /auth/users/get</a></code>
- <code><a href="list.md">POST /auth/users/list</a></code>
- <code><a href="create.md">POST /auth/users/create</a></code>
- <code><a href="delete.md">POST /auth/users/delete</a></code>
- <code><a href="assign-role.md">POST /auth/users/assign-role</a></code>
- <code><a href="reset-password.md">POST /auth/users/reset-password</a></code>
- <code><a href="reset-mfa.md">POST /auth/users/reset-mfa</a></code>

* <code><a href="reflect.md">GET /auth/users/reflect</a></code>
