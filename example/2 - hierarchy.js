'use strict'

const fastify = require('fastify')()

const aclFactory = require('..')

const hierarchyAcl = aclFactory({ hierarchy: ['user', 'admin', 'superuser'] })

const credentials = {
  id: 'bc965eb1-a8a4-4320-9172-726e9a7e83c9',
  username: 'cread',
  roles: 'admin'
}

fastify.decorateRequest('session', { credentials })

fastify.register(async (fastifyScope) => {
  fastifyScope.register(
    hierarchyAcl,
    {
      allowedRoles: ['user']
    }
  )
  // 200, because 'admin' > 'user' in hierarchy
  fastifyScope.get('/user', (_request, reply) => reply.send('/user'))
})

fastify.register(async (fastifyScope) => {
  fastifyScope.register(
    hierarchyAcl,
    {
      allowedRoles: ['admin']
    }
  )
  // 200
  fastifyScope.get('/admin', (_request, reply) => reply.send('/admin'))
})

fastify.register(async (fastifyScope) => {
  fastifyScope.register(
    hierarchyAcl,
    {
      allowedRoles: ['superuser']
    }
  )
  // 403
  fastifyScope.get('/superuser', (_request, reply) => reply.send('/superuser'))
})

fastify.listen(8080, err => {
  if (err) throw err
  console.log('listening on %s', fastify.server.address().port)
})
