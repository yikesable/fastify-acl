'use strict'

/** @typedef {ReadonlyArray<string>|string|((request: import('fastify').FastifyRequest) => Promise<string|ReadonlyArray<string>>|string|ReadonlyArray<string>)} RoleArgument */

/**
 * @param {RoleArgument|undefined} obj
 * @param {import('fastify').FastifyRequest} [context]
 * @returns {Promise<ReadonlyArray<string>>}
 */
const getRoles = async (obj, context) => {
  if (Array.isArray(obj)) return obj
  if (typeof obj === 'string') return [obj]
  if (context && typeof obj === 'function') return getRoles(await obj(context));
  return []
}

class HttpError extends Error {
  /** @param {number} code */
  constructor (code) {
    super();
    // See https://www.fastify.io/docs/v1.13.x/Reply/#errors
    this.status = code;
  }
}

module.exports = {
  getRoles,
  HttpError,
};
