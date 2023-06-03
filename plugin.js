// FIXME: Rename file to index.js

import createDebug from 'debug';
import fp from 'fastify-plugin'
import UrlPattern from 'url-pattern'

import { checkRoles } from './lib/auth.js'
import { HttpError } from './lib/util.js'

const debug = createDebug('fastify-acl-auth:auth');

/** @typedef {string|ReadonlyArray<string>} Roles */

/**
 * @callback ActualRolesCallback
 * @param {import('fastify').FastifyRequest} request
 * @returns {Promise<Roles>|Roles|undefined}
 */

/**
 * @typedef HookFactoryOptions
 * @property {ActualRolesCallback} actualRoles
 * @property {Roles} [allowedRoles]
 * @property {ReadonlyArray<string>} [pathExempt]
 * @property {number} [httpErrorCode]
 */

/**
 * @param {FastifyAclAuthOptions} options
 * @returns {import('fastify').preHandlerHookHandler}
 */
function createPreHandlerHook (options) {
  debug('hookOptions: %j', options)

  const {
    actualRoles,
    allowedRoles,
    httpErrorCode = 403,
  } = options;

  const urlPatterns = (options.pathExempt || []).map(pathPattern => new UrlPattern(pathPattern))

  const pathExempt = urlPatterns
    ? /** @type {(path: string) => boolean} */ (path) => urlPatterns.some(urlPattern => urlPattern.match(path))
    : undefined;

  /** @type {import('fastify').preHandlerHookHandler} */
  return async function (request, reply) {
    debug(`hook called for ${request.url}`)

    const actual = await actualRoles(request) || [];

    /** @type {boolean} */
    let isAuthorized;

    if (pathExempt && pathExempt(request.url)) {
      debug('options.pathExempt does match URL, overriding isAuthorized (setting to true)')
      isAuthorized = true
    } else {
      isAuthorized = checkRoles(actual, allowedRoles || [], options)
    }

    debug('actual: %j', actual)
    debug('allowed: %j', allowedRoles)
    debug('isAuthorized: %j', isAuthorized)

    if (!isAuthorized) {
      return reply.send(new HttpError(httpErrorCode));
    }
  }
}

/** @typedef {HookFactoryOptions & import('./lib/auth.js').CheckRolesOptions} FastifyAclAuthOptions */

/** @typedef {import('fastify').FastifyPluginAsync<FastifyAclAuthOptions>} FastifyAclAuthPlugin */

/**
 * @param {FastifyAclAuthOptions} options
 * @returns {FastifyAclAuthPlugin}
 */
export function fastifyAclAuth (options) {
  debug('aclFactory() called')

  const instanceOptions = { all: false, ...options };

  debug('instanceOptions: %j', instanceOptions)

  /** @type {import('fastify').FastifyPluginAsync<FastifyAclAuthOptions>} */
  const plugin = async (fastify, pluginOptions) => {
    debug('plugin() called')

    fastify.addHook('preHandler', createPreHandlerHook({
      ...instanceOptions,
      ...pluginOptions,
    }))
  };

  return fp(plugin, { fastify: '>=4.0.0' })
}
