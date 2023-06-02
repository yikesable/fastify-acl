'use strict'

const fastify = require('fastify')()

const aclFactory = require('..')

const credentials = {
  id: 'bc965eb1-a8a4-4320-9172-726e9a7e83c9',
  username: 'cread',
  roles: 'vendor',
}

fastify.decorateRequest('session', { credentials })

fastify.register(async (fastifyScope) => {
  fastifyScope.register(
    aclFactory(
      {
        allowedRoles: ['customer'],
      }
    )
  )
  // 403
  fastifyScope.get('/customers', (_request, reply) => reply.send('/customers'))
})

fastify.register(async (fastifyScope) => {
  fastifyScope.register(
    aclFactory(
      {
        allowedRoles: ['vendor'],
      }
    )
  )
  // 200
  fastifyScope.get('/vendors', (_request, reply) => reply.send('/vendors'))
})

fastify.listen(8080, err => {
  if (err) throw err
  console.log('listening on %s', fastify.server.address().port)
})
