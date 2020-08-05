# Send a multi-factor authentication challenge

Triggers a challenge code to be sent to the second factor
(e.g. the user's phone).

```http request
POST /auth/mfa/challenge
```

| Name            | Type   | In     | Description                                            |
| --------------- | ------ | ------ | ------------------------------------------------------ |
| `authorization` | string | header | Uses the bearer authentication scheme with a MFA token |

## Default Response

The challenge code was sent to the user's phone.

```http request
Status: 200 OK
```

```json
{
  "oob_code": "Fe26.2*82dcca*be8149..."
}
```

## Error Response

No MFA authenticators are enrolled for the user.

```http request
Status 404 Not Found
```

```json
{
  "error": "MFANotEnrolled",
  "message": "No MFA authenticators enrolled"
}
```
