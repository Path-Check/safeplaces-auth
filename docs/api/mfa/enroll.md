# Enroll multifactor authenticator

Enrolls in multifactor authentication after providing and confirming the possession
of a second factor (e.g. a phone).

```http request
POST /auth/mfa/enroll
```

| Name            | Type   | In     | Description                                                                    |
| --------------- | ------ | ------ | ------------------------------------------------------------------------------ |
| `authorization` | string | header | Uses the bearer authentication scheme with a MFA token                         |
| `phone_number`  | string | body   | [E.164-compliant](https://www.twilio.com/docs/glossary/what-e164) phone number |
| `binding_code`  | string | body   | Sent SMS code                                                                  |

### Examples

```json
{
  "phone_number": "+18001357890"
}
```

### Default Response

```http request
Status: 200 OK
```

```json
{
  "oob_code": "Fe26.2*82dcca*be8149...",
  "recovery_codes": [""]
}
```

## Error Response

The provided phone number is invalid.

```http request
Status: 400 Bad Request
```

```json
{
  "error": "InvalidPhoneNumber",
  "message": "Phone number is invalid"
}
```
