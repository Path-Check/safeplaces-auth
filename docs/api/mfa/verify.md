# Verify multifactor authenticator

Confirms authentication with a second factor (using the code sent via SMS).

```http request
POST /auth/mfa/verify
```

| Name            | Type   | In     | Description                                            |
| --------------- | ------ | ------ | ------------------------------------------------------ |
| `authorization` | string | header | Uses the bearer authentication scheme with a MFA token |
| `oob_code`      | string | body   | Out-of-band code                                       |
| `binding_code`  | string | body   | Sent SMS code                                          |

### Examples

Note: although `oob_code` looks similar to `mfa_token`, they are _not_ equal.

```json
{
  "oob_code": "Fe26.2*82dcca*be8149...",
  "mfa_token": "Fe26.2*82dcca*be8149...",
  "binding_code": "158902"
}
```

### Default Response

```http request
Status: 204 No Content
```

The user was successfully verified using two factors and is now logged in.

The access token was sent in the `Set-Cookie` response header. The cookie cannot be accessed by JavaScript.

### Error Response

The binding code (sent via SMS) is invalid. Try re-entering
the code or triggering a re-send.

```http request
Status: 403 Forbidden
```

```json
{
  "error": "InvalidBindingCode",
  "message": "Invalid binding code, try triggering a re-send"
}
```
