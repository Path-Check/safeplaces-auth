# Create a user

Creates a user in the identity provider and the backend database.

```http request
POST /auth/users/create
```

| Name              | Type   | In   | Description                                                                         |
| ----------------- | ------ | ---- | ----------------------------------------------------------------------------------- |
| `email`           | string | body |                                                                                     |
| `role`            | string | body | One of: `contact_tracer`, `admin`, and `super_admin`                                |
| `organization_id` | string | body |                                                                                     |
| `redirect_url`    | string | body | URI of the registration page, where the user redirected after verifying their email |

### Examples

```json
{
  "email": "admin@example.com",
  "role": "admin",
  "organization_id": "1",
  "redirect_url": "https://example.com/register"
}
```

## Default Response

The user was successfully created and a registration URL was sent in the
response body.

Note: the registration URL verifies the user's email and then redirects them
to the URL specified in `redirect_url`, a field specified in the request body.

The user will be redirected to `redirect_url` with the URL query parameter `t` appended
to the end of the URL. The `t` query parameter contains the registration token needed
to complete the [user registration process](../register.md).

The token expires _5 days_ after issuance.

```http request
Status: 201 Created
```

```json
{
  "registration_url": "https://example.com/email-verification?ticket=abc",
  "id": "a0f853d6-4c28-4384-9853-bec18293bfa9"
}
```

## Error Response

A user with the given email already exists.

```http request
Status: 409 Conflict
```

```json
{
  "error": "UserConflict",
  "message": "User already exists"
}
```

<br/>

The server performs many validations at different steps of the user creation process
and throws an error if an anomaly is detected.

The response body will include the error name in the `name` field and a description in the `message`
field.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "IDPError",
  "message": "Unable to assign role to user"
}
```
