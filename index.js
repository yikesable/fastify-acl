// TODO: Extract exmaple from README to a standalone file which is then injected into the README using remark-cli and remark-usage

import createDebug from 'debug';
import fp from 'fastify-plugin';
import UrlPattern from 'url-pattern';

import { checkRoles } from './lib/auth.js';
import { HttpError } from './lib/util.js';

// TODO: Replace with a bunyan-adaptor based setup
const debug = createDebug('fastify-acl-auth:auth');

/** @typedef {string|ReadonlyArray<string>} Roles */

/**
 * @callback RolesCallback
 * @param {import('fastify').FastifyRequest} request
 * @returns {Promise<Roles>|Roles|undefined}
 */

/**
 * @typedef FastifyAclBaseOptions
 * @property {number} [httpErrorCode]
 * @property {ReadonlyArray<string>} [pathExempt]
 */

/**
 * @typedef FastifyAclFactoryOnlyOptions
 * @property {RolesCallback} actualRoles
 * @property {boolean} [all]
 * @property {ReadonlyArray<string>} [hierarchy]
 */

/**
 * @typedef FastifyAclPluginOnlyOptions
 * @property {RolesCallback} [actualRoles]
 * @property {Roles} allowedRoles
 */

/** @typedef {FastifyAclBaseOptions & FastifyAclFactoryOnlyOptions} FastifyAclOptions */
/** @typedef {FastifyAclBaseOptions & FastifyAclPluginOnlyOptions} FastifyAclPluginOptions */

/** @typedef {import('fastify').FastifyPluginAsync<FastifyAclPluginOptions>} FastifyAclPlugin */

/**
 * @param {FastifyAclOptions & FastifyAclPluginOptions} options
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
 * @param {FastifyAclOptions} options
 * @returns {FastifyAclPlugin}
 */
export function fastifyAcl (options) {
  debug('aclFactory() called');

  /** @satisfies {FastifyAclOptions} */
  const instanceOptions = { all: false, ...options };

  debug('instanceOptions: %j', instanceOptions);

  /** @type {import('fastify').FastifyPluginAsync<FastifyAclPluginOptions>} */
  const plugin = async (fastify, pluginOptions) => {
    debug('plugin() called');

    fastify.addHook('preHandler', createPreHandlerHook({
      ...instanceOptions,
      ...pluginOptions,
    }));
  };

  return fp(plugin, { fastify: '>=4.0.0' });
}
