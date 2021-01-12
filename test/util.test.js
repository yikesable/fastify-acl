'use strict'

const tap = require('tap')

const util = require('../lib/util')

const roles = ['a', 'b', 'c']

/** @type {import('fastify').FastifyRequest} */
// @ts-ignore
const fakeRequest = {};

tap.test('util.test.js', async t => {
  t.plan(4)
  t.same(await util.getRoles(roles, fakeRequest), roles)
  t.same(await util.getRoles('a', fakeRequest), ['a'])
  t.same(await util.getRoles(() => ['a', 'b', 'c'], fakeRequest), roles)
  t.same(await util.getRoles(async () => ['a', 'b', 'c'], fakeRequest), roles)
})
