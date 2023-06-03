import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import fastify from 'fastify';

import { fastifyAclAuth } from '../index.js';

const fastifyAclAuthPlugin = fastifyAclAuth({ actualRoles: () => 'user' });

describe('plugin.test.js', () => {
  it('should get actual route when accessing user', async () => {
    const fastifyInstance = fastify();

    fastifyInstance.register(async fastifyScope => {
      fastifyScope.register(fastifyAclAuthPlugin, { allowedRoles: 'user' });
      fastifyScope.get('/user', () => '/user');
    });

    const response = await fastifyInstance.inject({
      method: 'GET',
      url: '/user',
    });

    assert.equal(response.body, '/user', 'body should be /user');
  });

  it('should get 403 when accessing admin', async () => {
    const fastifyInstance = fastify();

    fastifyInstance.register(async fastifyScope => {
      fastifyScope.register(fastifyAclAuthPlugin, { allowedRoles: 'admin' });
      fastifyScope.get('/admin', () => '/admin');
    });

    const response = await fastifyInstance.inject({
      method: 'GET',
      url: '/admin',
    });

    assert.equal(response.statusCode, 403, 'admin should return 403');
    assert.notEqual(response.body, '/admin', 'body should not be /admin');
  });
});
