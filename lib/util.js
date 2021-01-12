'use strict'

/** @typedef {string[]|string|((request: import('fastify').FastifyRequest) => Promise<string|string[]>|string|string[])} RoleArgument */

/**
 * @param {RoleArgument|undefined} obj
 * @param {import('fastify').FastifyRequest} [context]
 * @returns {Promise<string[]>}
 */
const getRoles = async (obj, context) => {
  if (Array.isArray(obj)) return obj
  if (typeof obj === 'string') return [obj]
  if (context && typeof obj === 'function') return getRoles(await obj(context));
  return []
}

module.exports = {
  getRoles
};
