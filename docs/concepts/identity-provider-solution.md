# Identity Provider Solution

The SafePlaces application employs Auth0 as its primary identity provider. In
software-as-a-service (SaaS) deployments provided by PathCheck, a single, parent
Auth0 tenant is reserved for the identity needs of all health authorities
subscribing to the service.

In this case, each health authority uses their own Auth0 **connection**, which
is often a database. These databases are provided by Auth0, and each contains
the users of SafePlaces under that health authority.

The Auth0 developer plan is used because it enables the feature of role
management within the Auth0 tenant.

PathCheck encourages health authorities that are self-hosting the SafePlaces
application to also use Auth0 because it is supported by the backend out-of-the
box.

---

[⟵ Back to home page](../README.md)
