# Verify a multi-factor authenticator

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

```json
{
  "oob_code": "Fe26.2*82dcca*be8149...",
  "binding_code": "158902"
}
```

Note: although `oob_code` looks similar to `mfa_token`, they are _not_ equal.

## Default Response

The user was successfully verified using two factors and is now logged in.
The access token was sent in the `Set-Cookie` response header. The cookie cannot be accessed by JavaScript.

```http request
Status: 204 No Content
```

## Error Response

The OOB is malformed.

```http request
Status: 400 Bad Request
```

```json
{
  "error": "MalformedOOBCode",
  "message": "OOB code is malformed"
}
```

<br/>

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
