'use strict'

const debug = require('debug')('fastify-acl-auth:auth')

const util = require('./util.js')

const implementation = async function (rawActual, rawAllowed, rawOptions) {
  debug('auth implementation called')

  const options = {
    any: true,
    all: false,
    ...rawOptions
  };

  const actual = await util.getRoles(rawActual)
  const allowed = await util.getRoles(rawAllowed)

  if (options.hierarchy) {
    let lowestAllowedIndex = 50
    let highestActualIndex = -1
    for (const actualRole of actual) {
      const i = options.hierarchy.indexOf(actualRole)
      if (i >= 0 && i > highestActualIndex) {
        highestActualIndex = i
      }
    }
    for (const allowedRole of allowed) {
      const i = options.hierarchy.indexOf(allowedRole)
      if (i >= 0 && i < lowestAllowedIndex) {
        lowestAllowedIndex = i
      }
    }
    return (highestActualIndex >= lowestAllowedIndex)
  }
  const intersection = allowed.filter(item => actual.includes(item))
  if (options.all) {
    return (intersection.length === allowed.length)
  }
  return (options.any && intersection.length > 0)
}

module.exports = {
  isAuthorized: implementation
}
