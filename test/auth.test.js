import tap from 'tap'

import { checkRoles } from '../lib/auth.js'

tap.test('auth.test.js', t => {
  t.plan(10)
  t.true(checkRoles('admin', 'admin'), 'admin can access admin')
  t.false(checkRoles('user', 'admin'), 'user can\'t access admin')
  t.true(checkRoles(['user'], 'user'), '[user] can access user')
  t.true(checkRoles(['user'], ['user']), '[user] can access [user]')
  t.true(checkRoles('user', ['user']), 'user can access [user]')
  t.false(checkRoles(['a'], ['a', 'b'], { all: true }), 'all should cause a false return when not all roles are present')
  t.true(checkRoles(['b', 'a'], ['a', 'b'], { all: true }), 'all should cause a true return when all roles are present')
  t.true(checkRoles(['ham', 'b', 'x', 'a'], ['a', 'b'], { all: true }), 'all should cause a true return when all roles are present and user has more roles than are needed')
  t.false(checkRoles('admin', 'user'), 'admin can\'t access user')
  t.true(checkRoles('admin', 'user', { hierarchy: ['user', 'admin'] }), 'admin can access user with appropriate hierarchy')
})
