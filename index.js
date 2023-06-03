import createDebug from 'debug';
import fp from 'fastify-plugin';
import UrlPattern from 'url-pattern';

import { checkRoles } from './lib/auth.js';
import { HttpError } from './lib/util.js';

const debug = createDebug('fastify-acl-auth:auth');

/** @typedef {string|ReadonlyArray<string>} Roles */

/**
 * @callback RolesCallback
 * @param {import('fastify').FastifyRequest} request
 * @returns {Promise<Roles>|Roles|undefined}
 */

/**
 * @typedef FastifyAclAuthBaseOptions
 * @property {number} [httpErrorCode]
 * @property {ReadonlyArray<string>} [pathExempt]
 */

/**
 * @typedef FastifyAclAuthOnlyOptions
 * @property {RolesCallback} actualRoles
 * @property {boolean} [all]
 * @property {ReadonlyArray<string>} [hierarchy]
 */

/**
 * @typedef FastifyAclAuthPluginOnlyOptions
 * @property {RolesCallback} [actualRoles]
 * @property {Roles} allowedRoles
 */

/** @typedef {FastifyAclAuthBaseOptions & FastifyAclAuthOnlyOptions} FastifyAclAuthOptions */
/** @typedef {FastifyAclAuthBaseOptions & FastifyAclAuthPluginOnlyOptions} FastifyAclAuthPluginOptions */

/** @typedef {import('fastify').FastifyPluginAsync<FastifyAclAuthPluginOptions>} FastifyAclAuthPlugin */

/**
 * @param {FastifyAclAuthOptions & FastifyAclAuthPluginOptions} options
 * @returns {import('fastify').preHandlerHookHandler}
 */
function createPreHandlerHook (options) {
  debug('hookOptions: %j', options);

  const {
    actualRoles,
    allowedRoles,
    httpErrorCode = 403,
  } = options;

  const urlPatterns = (options.pathExempt || []).map(pathPattern => new UrlPattern(pathPattern));

  const pathExempt = urlPatterns
    ? /** @type {(path: string) => boolean} */ (path) => urlPatterns.some(urlPattern => urlPattern.match(path))
    : undefined;

  /** @type {import('fastify').preHandlerHookHandler} */
  return async function (request, reply) {
    debug(`hook called for ${request.url}`);

    const actual = await actualRoles(request) || [];

    /** @type {boolean} */
    let isAuthorized;

    if (pathExempt && pathExempt(request.url)) {
      debug('options.pathExempt does match URL, overriding isAuthorized (setting to true)');
      isAuthorized = true;
    } else {
      isAuthorized = checkRoles(actual, allowedRoles || [], options);
    }

    debug('actual: %j', actual);
    debug('allowed: %j', allowedRoles);
    debug('isAuthorized: %j', isAuthorized);

    if (!isAuthorized) {
      return reply.send(new HttpError(httpErrorCode));
    }
  };
}

/**
 * @param {FastifyAclAuthOptions} options
 * @returns {FastifyAclAuthPlugin}
 */
export function fastifyAclAuth (options) {
  debug('aclFactory() called');

  /** @satisfies {FastifyAclAuthOptions} */
  const instanceOptions = { all: false, ...options };

  debug('instanceOptions: %j', instanceOptions);

  /** @type {import('fastify').FastifyPluginAsync<FastifyAclAuthPluginOptions>} */
  const plugin = async (fastify, pluginOptions) => {
    debug('plugin() called');

    fastify.addHook('preHandler', createPreHandlerHook({
      ...instanceOptions,
      ...pluginOptions,
    }));
  };

  return fp(plugin, { fastify: '>=4.0.0' });
}
