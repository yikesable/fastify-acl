import fastify from 'fastify'
import tap from 'tap'

import { fastifyAclAuth as plugin } from '../plugin.js'

/** @type {import('../plugin.js').ActualRolesCallback} */
const actualRoles = () => 'user';

tap.test('plugin.test.js', async t => {
  const defaultPlugin = plugin({ actualRoles })
  const fastifyInstance = fastify()

  t.ok(defaultPlugin, 'plugin exists')
  fastifyInstance.register(function (f, _o, n) {
    f.register(plugin({ allowedRoles: ['user'], actualRoles }))
    f.get('/user', async function () {
      return '/user'
    })
    n()
  })
  fastifyInstance.register(function (f, _o, n) {
    f.register(plugin({ allowedRoles: ['admin'], actualRoles }))
    f.get('/admin', async function () {
      return '/admin'
    })
    n()
  })
  await t.test('get /user', async t => {
    const response = await fastifyInstance.inject({
      method: 'GET',
      url: '/user',
    })
    t.is(response.body, '/user', 'body should be /user')
  })
  await t.test('get /admin', async t => {
    const response = await fastifyInstance.inject({
      method: 'GET',
      url: '/admin',
    })
    t.is(response.statusCode, 403, 'admin should return 403')
  })
})
