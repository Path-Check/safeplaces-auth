# Reset user password

Resets a user's password.

```http request
POST /auth/reset-password
```

| Name            | Type   | In     | Description                                                       |
| --------------- | ------ | ------ | ----------------------------------------------------------------- |
| `authorization` | string | header | Uses the bearer authentication scheme with a password reset token |
| `password`      | string | body   | New password in plaintext                                         |

Note: the password reset token is obtained when a super administrator creates a password reset ticket.
See more details in [Create password reset ticket](users/reset-password.md#default-response).

### Examples

```json
{
  "password": "xyz2020"
}
```

## Default Response

```http request
Status: 204 No Content
```

The user's password was successfully updated.

## Error Response

The provided password is too weak.

```http request
Status: 400 Bad Request
```

```json
{
  "error": "PasswordStrengthError",
  "message": "Password is too weak"
}
```

<br/>

The registration token is missing or invalid.

```http request
Status: 401 Unauthorized
```

```json
{
  "error": "Unauthorized",
  "message": "Missing password reset token"
}
```

```json
{
  "error": "Unauthorized",
  "message": "Invalid password reset token"
}
```
