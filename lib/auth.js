'use strict'

const debug = require('debug')('fastify-acl-auth:auth')

/** @typedef {{ all?: boolean, hierarchy?: string[] }} CheckRolesOptions */

/**
 * @param {string|string[]} rawActual
 * @param {string|string[]} rawAllowed
 * @param {CheckRolesOptions} [options]
 * @returns {boolean}
 */
const checkRoles = function (rawActual, rawAllowed, options = {}) {
  debug('auth implementation called')

  const {
    all,
    hierarchy
  } = {
    all: false,
    ...options
  };

  const actual = Array.isArray(rawActual) ? rawActual : [rawActual];
  const allowed = Array.isArray(rawAllowed) ? rawAllowed : [rawAllowed];

  if (hierarchy) {
    let lowestAllowedIndex = 50
    let highestActualIndex = -1
    for (const actualRole of actual) {
      const i = hierarchy.indexOf(actualRole)
      if (i >= 0 && i > highestActualIndex) {
        highestActualIndex = i
      }
    }
    for (const allowedRole of allowed) {
      const i = hierarchy.indexOf(allowedRole)
      if (i >= 0 && i < lowestAllowedIndex) {
        lowestAllowedIndex = i
      }
    }
    return (highestActualIndex >= lowestAllowedIndex)
  }
  const intersection = allowed.filter(item => actual.includes(item))

  return all
    ? (intersection.length === allowed.length)
    : intersection.length > 0
}

module.exports = {
  checkRoles
}
