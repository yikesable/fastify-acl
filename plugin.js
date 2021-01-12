'use strict'

const fp = require('fastify-plugin').default
const debug = require('debug')('fastify-acl-auth:plugin')
const UrlPattern = require('url-pattern')

const { checkRoles } = require('./lib/auth')
const { getRoles } = require('./lib/util')

/**
 * @typedef HookFactoryOptions
 * @property {import('./lib/util').RoleArgument} [actualRoles]
 * @property {import('./lib/util').RoleArgument} [allowedRoles]
 * @property {string[]} [pathExempt]
 */

/** @typedef {HookFactoryOptions & import('./lib/auth').CheckRolesOptions} FastifyAclAuthOptions */

/** @type {FastifyAclAuthOptions}  */
const defaults = {
  actualRoles: request =>
    // @ts-ignore
    (((request || {}).session || {}).credentials || {}).roles || [],
  all: false
}

/**
 * @param {FastifyAclAuthOptions} options
 * @returns {import('fastify').preHandlerHookHandler}
 */
const hookFactory = (options) => {
  const {
    actualRoles,
    allowedRoles
  } = options;

  const urlPatterns = (options.pathExempt || []).map(pathPattern => new UrlPattern(pathPattern))

  /**
   * @param {string} path
   * @returns {boolean}
   */
  const pathExempt = (path) => urlPatterns.some(urlPattern => urlPattern.match(path));

  /** @type {import('fastify').preHandlerHookHandler} */
  return async function (request, reply) {
    debug(`hook called for ${request.url}`)

    const [actual, allowed] = await Promise.all([
      getRoles(actualRoles, request),
      getRoles(allowedRoles, request)
    ]);

    let isAuthorized;

    if (pathExempt && pathExempt(request.url)) {
      debug('options.pathExempt does match URL, overriding isAuthorized (setting to true)')
      isAuthorized = true
    }

    if (isAuthorized === undefined) {
      isAuthorized = await checkRoles(actual, allowed, options)
    }

    debug('actual: %j', actual)
    debug('allowed: %j', allowed)
    debug('isAuthorized: %j', isAuthorized)

    // TODO: Make code configurable. Maybe throw an error object instead?
    return isAuthorized ? undefined : reply.code(403).send()
  }
}

/**
 * @param {FastifyAclAuthOptions} [options]
 * @returns {import('fastify').FastifyPluginAsync}
 */
const pluginFactory = function (options = {}) {
  debug('pluginFactory() called')
  const instanceOptions = {
    ...defaults,
    ...options
  };

  debug('instanceOptions: %j', instanceOptions)

  /** @type {import('fastify').FastifyPluginAsync} */
  const plugin = async function (fastify, options) {
    debug('plugin() called')

    const pluginOptions = {
      ...instanceOptions,
      ...options
    };

    debug('pluginOptions: %j', pluginOptions)

    fastify.addHook('preHandler', hookFactory(pluginOptions))
  };

  return fp(plugin, { fastify: '>=3.0.0' })
}

module.exports = pluginFactory
