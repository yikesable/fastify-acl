import assert from 'node:assert/strict';
import test from 'node:test';

import { checkRoles } from '../lib/auth.js'

test('checkRoles()', async t => {
  await t.test('basic', () => {
    assert.equal(checkRoles('admin', 'admin'), true, 'admin can access admin')
    assert.equal(checkRoles('user', 'admin'), false, "user can't access admin")
    assert.equal(checkRoles(['user'], 'user'), true, '[user] can access user')
    assert.equal(checkRoles(['user'], ['user']), true, '[user] can access [user]')
    assert.equal(checkRoles('user', ['user']), true, 'user can access [user]')
  })

  await t.test('all: true', () => {
    assert.equal(
      checkRoles(['a'], ['a', 'b'], { all: true }),
      false,
      'all should cause a false return when not all roles are present'
    )

    assert.equal(
      checkRoles(['b', 'a'], ['a', 'b'], { all: true }),
      true,
      'all should cause a true return when all roles are present'
    );

    assert.equal(
      checkRoles(['ham', 'b', 'x', 'a'], ['a', 'b'], { all: true }),
      true,
      'all should cause a true return when all roles are present and user has more roles than are needed'
    )
  });

  await t.test('hierarchy', () => {
    assert.equal(checkRoles('admin', 'user'), false, "admin can't access user")
    assert.equal(
      checkRoles('admin', 'user', { hierarchy: ['user', 'admin'] }),
      true,
      'admin can access user with appropriate hierarchy'
    )
  });
})
