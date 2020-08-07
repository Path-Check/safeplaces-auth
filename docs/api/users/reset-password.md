# Create password reset ticket

Creates a password reset ticket for a user to reset their password.

```http request
POST /auth/users/reset-password
```

| Name           | Type   | In   | Description                    |
| -------------- | ------ | ---- | ------------------------------ |
| `id`           | string | body |                                |
| `redirect_url` | string | body | URI of the password reset page |

### Examples

```json
{
  "id": "a0f853d6-4c28-4384-9853-bec18293bfa9"
}
```

## Default Response

A password reset URL was sent in the response body.

The user will be directed to `redirect_url` with the URL query parameter `t` appended
to the end of the URL. The `t` query parameter contains the password reset token needed
to complete the [password reset process](../reset-password.md).

The token expires _5 days_ after issuance.

```http request
Status: 200 OK
```

```json
{
  "password_reset_url": "https://example.com/reset-password?t=eyJhbGciOiJ..."
}
```

## Error Response

The server encountered an unknown error and was not able to issue a password reset token.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "SigningError",
  "message": "Unable to issue password reset token"
}
```
