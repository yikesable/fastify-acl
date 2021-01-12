'use strict'

const fp = require('fastify-plugin')
const debug = require('debug')('fastify-acl-auth:plugin')
const UrlPattern = require('url-pattern')

const auth = require('./lib/auth')
const util = require('./lib/util')

const defaults = {
  actualRoles: function (request) {
    let _return
    try {
      _return = request.session.credentials.roles
    } catch {
      _return = []
    }
    return _return
  },
  any: true,
  all: false
}

const hookFactory = function (_fastify, options) {
  const urlPatterns = (options.pathExempt || []).map(pathPattern => new UrlPattern(pathPattern))

  const pathExempt = (path) => urlPatterns.some(urlPattern => urlPattern.match(path));

  return async function (request, reply) {
    debug(`hook called for ${request.raw.originalUrl}`)
    try {
      const _actual = await util.getRoles(options.actualRoles, request)
      const _allowed = await util.getRoles(options.allowedRoles, request)
      let isAuthorized = await auth.isAuthorized(_actual, _allowed, options)
      if (options.pathExempt) {
        debug('options.pathExempt is set')
        if (pathExempt(request.raw.originalUrl)) {
          debug('options.pathExempt does match URL, overriding isAuthorized (setting to true)')
          isAuthorized = true
        }
      }
      debug('_actual: %j', _actual)
      debug('_allowed: %j', _allowed)
      debug('isAuthorized: %j', isAuthorized)
      if (!isAuthorized) {
        return reply.code(403).send()
      }
    } catch (err) {
      debug('ERROR: in hook: %s', err.message)
      return err
    }
  }
}

const pluginFactory = function (options) {
  debug('pluginFactory() called')
  const instanceOptions = Object.assign({}, defaults, options)
  debug('instanceOptions: %j', instanceOptions)
  return fp(
    async function (fastify, options) {
      debug('plugin() called')
      fastify.register(require('fastify-url-data'))
      const pluginOptions = Object.assign({}, instanceOptions, options)
      debug('pluginOptions: %j', pluginOptions)
      const hook = hookFactory(fastify, pluginOptions)
      fastify.addHook('preHandler', hook)
    },
    {
      fastify: '>=3.0.0'
    }
  )
}

module.exports = pluginFactory
