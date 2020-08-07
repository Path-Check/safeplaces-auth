# User Management Errors

The request is not authenticated correctly so the server
cannot give access to the specified resource.

```http request
Status: 401 Unauthorized
```

<br/>

The request is authenticated correctly and the server knows
the identity of the accessor. However, it refuses to fulfill
the request due to insufficient permissions.

```http request
Status: 403 Forbidden
```

<br/>

The user was not found in the database.

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

There was an error while trying to find the user in the database.

```http request
Status: 500 Internal Server Error
```

```json
{
  "error": "DBError",
  "message": "Unable to find user in DB"
}
```
