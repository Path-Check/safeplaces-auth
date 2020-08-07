# Bypass multi-factor authentication with a recovery code

Bypasses multi-factor authentication by using the recovery code provided during account registration. The user is
automatically logged in after submitting the recovery code.

Note: the old recovery code is invalidated after a single use - the server
returns a new one so the user can write it down.

```http request
POST /auth/mfa/recover
```

| Name            | Type   | In     | Description                                            |
| --------------- | ------ | ------ | ------------------------------------------------------ |
| `authorization` | string | header | Uses the bearer authentication scheme with a MFA token |
| `recovery_code` | string | body   |                                                        |

### Examples

```json
{
  "recovery_code": "3FU5MVP321YXG6WE6N7A2XYZ"
}
```

## Default Response

The user was successfully verified using the recovery code and is now logged in.
The access token was sent in the `Set-Cookie` response header. The cookie cannot be accessed by JavaScript.

A new recovery code was sent in the response body and the old recovery code was invalidated.

```http request
Status: 200 OK
```

```json
{
  "recovery_code": "6ABCDR522PQHE3FJ9VBJ2020"
}
```

## Error Response

The binding code (sent via SMS) is invalid. Try re-entering the code or triggering a re-send.

```http request
Status: 401 Unauthorized
```

```json
{
  "error": "InvalidRecoveryCode",
  "message": "Recovery code is invalid"
}
```
