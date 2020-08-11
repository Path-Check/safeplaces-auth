# Provisioning Auth0

To set up a clean-slate Auth0 account for full compatibility with the SafePlaces
Infosec module, you must set up several services provided by the identity
provider.

When creating an Auth0 **tenant**, you should take note of the provided **base
URL**, which is used for all requests made to Auth0. This usually looks like
`https://your-tenant.us.auth0.com`. The important aspect is that the URL ends
with `auth0.com`—there should be no trailing slash or path name following the
domain, as the SafePlaces Auth module appends them automatically when needed.
This base URL should be saved in the `AUTH0_BASE_URL` environment variable.

## Connections

An Auth0 **connection**, usually a database, stores the credentials and metadata
of users. Specifically, SafePlaces Infosec utilizes the Resource-Owner Password
Grant (ROPG) flow with support for **realms**. From Auth0:

> Realms allow you to keep separate user directories and specify which one to
> use to the token endpoint. For example, you may have an application where both
> employees and customers can log in but their credentials are kept in separate
> user directories.

Separating users into realms also provides the benefit of allowing for reuse of
the same username between different deployments. Since each user is namespaced
into their own realm, there will not be any conflict between two users from
different realms.

When creating an Auth0 database, it is recommended to use only lowercase,
alphanumeric characters and, optionally, dashes. This is because the database
(realm) name will be consumed by the application and SafePlaces Infosec module
as an environment variable. This is described in further detail in the
[Applications](#applications) section.

Moreover, the "Disable Sign Ups" option should be checked to prevent bad actors
from creating authorized accounts to the SafePlaces application. The creation of
new user accounts should be performed by authorized personnel directly within
the Auth0 administrator dashboard or using the SafePlaces User Management
system.

## APIs

An Auth0 **API** represents the service or collection of services that is
protected by Auth0. When a client makes a login request to the SafePlaces
backend, the SafePlaces Infosec module authorizes the client _for_ this API.
This means that the API determines the attributes of the JSON Web Token issued
for the client.

When setting up an API in Auth0, the important options to tweak are the
expiration of the access token and the usage of role-based access control
(RBAC). SafePlaces requires RBAC to be enabled and recommends the token
expiration to be set to 3600 seconds, or 1 hour. For the signing algorithm,
select RS256 (RSA signature with SHA-256).

Also make sure that the API identifier is a valid, canonical URL with the HTTP
protocol and a trailing slash. This API identifier should be set as the
`AUTH0_API_AUDIENCE` environment variable consumed by SafePlaces Auth.

## Applications

An Auth0 **application** represents the client that accesses the API. The
SafePlaces Infosec module poses itself as the application by providing the
correct client ID and client secret corresponding to the application. The Auth0
application connects to a **connection** that stores the users of the
application. This connection is commonly referred to as the _user database_.

When setting up an application in Auth0, it is important to specify its type as
a "Regular Web Application". Once created, Auth0 will provide the application's
ID and secret. These should be saved in the `AUTH0_CLIENT_ID` and
`AUTH0_CLIENT_SECRET` environment variables, respectively, and should not be
exposed publicly.

These credentials are required because the SafePlaces Infosec module utilizes
the Resource-Owner Password Grant (ROPG) flow to communicate with the identity
provider _on behalf of_ the user. Precisely, the SafePlaces Frontend application
sends the user's login credentials to the SafePlaces server, which forwards them
along with other environment-specific metadata to Auth0. To enable this
negotiation flow, one needs to click on "Show Advanced Settings" at the bottom
of the Auth0 application settings, click on "Grant Types", and finally uncheck
all boxes except for "Password" and "MFA". The multi-factor authentication (MFA)
grant type will be used so that users can self-service their authenticators via
the SafePlaces application.

As an added layer of security, the application should only be allowed to access
the database it is assigned to. This is especially important in the SafePlaces
SaaS deployment model, as each health authority deployment should have its own
user database. Consequently, each deployment should set the proper `AUTH0_REALM`
environment variable so that SafePlaces Auth may specify the correct user
database when authenticating clients. The environment variable is identical to
the name of the Auth0 database, so a sensible database name would be one that is
unambiguous and easy to type. To ensure this, go to the "Connections" tab in the
Auth0 application and check/uncheck the databases that you want the application
to have access to.

## Roles

In Auth0, a number of **roles** can be defined and assigned to users. The
purpose of delegating the role management to Auth0 is so that the user role may
be implanted in their signed access token (described in the
[Custom Rules](#custom-rules) section). Thus, the access token issued by Auth0
can be forwarded, unmodified, to the end-user.

### Policy Definitions

SafePlaces Auth supports fine-grained access control policies based on a number
of attributes, including the user role. For policy definition and enforcement,
it employs the custom-built [XPolicy](https://github.com/xpolicy/xpolicy)
package.

For example, a policy that allows an admin to access any resource except user
management may contain rules like the following:

```javascript
new Policy({
  // --excerpted--
  subject: Eq('admin'),
  resource: Not(StartsWith('/auth/users')),
  action: {
    method: Any(),
  },
  // --excerpted--
});
```

Detailed usage information is documented thoroughly in the repository README.
The importance of this access-control scheme is that it allows health
authorities to define extremely specific policies tailored to their needs, and
to tightly control access to resources.

### Permission Levels

SafePlaces uses three roles to closely manage the permissions of users:
**contact tracer**, **admin**, and **super admin**. These are named
`contact_tracer`, `admin`, and `super_admin`, respectively.

The following are the three roles, ordered from having the least to most
permissions:

| **Role**       | **Description**                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Contact Tracer | A health authority contact tracer, the primary user of the SafePlaces web application to perform contact tracing tasks. |
| Admin          | A health authority admin who can perform elevated actions in SafePlaces such as publishing.                             |
| Super Admin    | A health authority super admin who can manage the accounts of all users, including other super admins.                  |

The built-in policy definition in SafePlaces Backend defines a contact tracer as
being able to perform all actions except publishing cases, modifying an
organization's configuration, and managing users. An admin is allowed to perform
all actions except managing users, and a super admin is allowed to perform any
action.

After the rules have been created on Auth0, they must be assigned to the users.
Although the SafePlaces Infosec module can handle the scenario of a single user
possessing multiple roles, making sure that every user only possesses a _single
role_ can prevent unexpected behavior. Certain functions in the module are
designed to sort and assume the role with the highest permission level, but
there are no guarantees.

## Custom Rules

By default, Auth0 does not include a user's role in their access token. To
achieve this, one needs to create a **custom rule**. SafePlaces Auth relies on a
custom rule that pre-processes the JWT claims before they are consumed by Auth0
for issuing an access token. The rule obtains a user's assigned roles and
creates a new claim under a _specific namespace_ in which the array of roles are
stored.

This namespace—usually a URL containing the protocol, domain, and no trailing
slash—prevents collisions with other JWT claims. See the
[Adding Roles to Access Tokens](appendix.md#adding-roles-to-access-tokens)
section in the appendix for the script and for more information.

---

[⟵ Back to home page](../README.md)
