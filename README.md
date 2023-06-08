# @yikesable/fastify-acl

ACL-like authorization for [*fastify*](https://fastify.io) apps.

With `@yikesable/fastify-acl` you can secure routes with roles, like **admin**, **superuser**, or **user:write**.  Then you just tell the plugin how to determine which roles a user has, and you're set.  You can also:

* Specify any/all functionality (allow if user has any of these roles, allow if users has all of these roles, for example)
* Specify a hierarchy of roles ("admins" are clearly "users" too, so let them through without explicitly letting "admins" through, for example)

## Usage

**NOTE:** If you're not familiar with [scoping in *fastify*](https://www.fastify.io/docs/master/Plugins/) this plugin isn't going to make much sense to you.  I'd highly recommend making sure that you're solid with this concept before proceeding.

You can use `@yikesable/fastify-acl` in a few ways, ways that depend on how you want to structure your application and leverage *fastify*'s scoping.

### Example

```js
import createFastify from 'fastify'
import { fastifyAcl } from '../plugin.js'

const hierarchyAclPlugin = aclFactory({
  actualRoles: (_req) => 'admin',
  hierarchy: ['user', 'admin', 'superuser'],
})


fastify.register(async (fastifyScope, opts) => {
  fastifyScope.register(hierarchyAclPlugin, {
    allowedRoles: ['user']
  })

  // 200, because 'admin' > 'user' in hierarchy
  fastifyScope.get('/user', (_request, reply) => reply.send('/user'))
})

fastify.register(async (fastifyScope, opts) => {
  fastifyScope.register(hierarchyAclPlugin, {
    allowedRoles: ['admin']
  })

  // 200
  fastifyScope.get('/admin', (_request, reply) => reply.send('/admin'))
})

fastify.register(async (fastifyScope, opts, next) {
  fastifyScope.register(hierarchyAclPlugin, {
    allowedRoles: ['superuser']
  })

  // 403, because 'superuser' > 'admin' in hierarchy
  fastifyScope.get('/superuser', (_request, reply) => reply.send('/superuser'))
})

fastify.listen({ port: 8080 }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})

```

## API

`@yikesable/fastify-acl` exports a factory function; a function that _makes_ the plugin that you'll use.

```js
import { fastifyAcl } from '@yikesable/fastify-acl';
```

### `options`

`options` is a simple object with the following properties:

| Property | Default | Type | Notes |
| --- | --- | --- | --- |
| `actualRoles` | - | `[async] function` | Since `@yikesable/fastify-acl` is all about comparing what roles a user _actually_ has to what a route _allows_ then this property is pretty important.  Should be a sync or async function that's given the Fastify request and which returns a `string`, an array of `string`:s or `undefined`. |
| `allowedRoles` | `[]` | `string[]`, `string`  | ^ that whole thing.  Except this property tells `@yikesable/fastify-acl` which roles are _allowed_ for a route or routes. ([scoping!!!](https://www.fastify.io/docs/latest/Plugins/)) |
| `all` | `false` | `boolean` | If `true`, will pass if `actualRoles` contains _ALL_ of the roles in `allowedRoles`, else error return a HTTP `httpErrorCode`. |
| `hierarchy` | `undefined` | `Array` | An `Array` that specifies the privilege hierarchy of roles in order of ascending privilege. For instance, suppose we have `hierarchy: ['user', 'admin', 'superuser']`, `allowedRoles : ['admin']`, and `actualRoles: ['superuser']` configured for a route.  A user with the `superuser` role will be able to access that route because the `superuser` role is of higher privilege than the `user` and `admin` roles, as specified in the hierarchy. |
| `httpErrorCode` | `403` | `number` | The error code to use when the authorization fails. |
| `pathExempt` | `undefined` | `Array` | An `Array` that specifies the path patterns that should be exempt from enforcement; `['/login', '/callback**']` for example.  Uses the NPM module `url-pattern` internally for URL pattern matching. |

### `fastifyAcl(options): FastifyAclPlugin`

This will create a plugin for `@yikesable/fastify-acl`. It can be used with `fastify.register()` just like any other plugin.

```js
const fastifyAclPlugin = fastifyAcl({
  actualRoles: request => request.user?.role
});

fastify.register(fastifyAclPlugin, {
  allowedRoles: 'admin'
})
```

## See also

* [`@charlesread/fastify-acl-auth`](https://github.com/charlesread/fastify-acl-auth) – the original module this one is forked from
