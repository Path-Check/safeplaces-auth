# Assign a role to a user

Assigns a role to a user, thereby modifying the user's permissions and access
to certain protected resources.

```http request
POST /auth/users/assign-role
```

| Name   | Type   | In   | Description                                          |
| ------ | ------ | ---- | ---------------------------------------------------- |
| `id`   | string | body |                                                      |
| `role` | string | body | One of: `contact_tracer`, `admin`, and `super_admin` |

### Examples

```json
{
  "id": "a0f853d6-4c28-4384-9853-bec18293bfa9",
  "role": "admin"
}
```

### Default Response

```http request
Status: 204 No Content
```

The role was successfully assigned to the user.

### Error Response

The user does not exist.

```http request
Status: 404 Not Found
```

```json
{
  "error": "UserNotFound",
  "message": "User not found"
}
```

<br/>

Role assignment is a two-step process of deleting existing roles
from a user and assigning the new role. If one of these steps fails, an error
is thrown.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "IDPError",
  "message": "Unable to remove existing roles from user"
}
```

```json
{
  "error": "IDPError",
  "message": "Unable to assign role to user"
}
```
