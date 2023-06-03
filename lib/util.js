export class HttpError extends Error {
  /** @param {number} statusCode */
  constructor (statusCode) {
    super();
    /** @type {import('fastify').FastifyError["statusCode"]} */
    this.statusCode = statusCode;
  }
}

/**
 * @template T
 * @param {unknown} value
 * @returns {value is ReadonlyArray<T>|T[]}
 */
const isArrayLike = (value) => Array.isArray(value);

/**
 * @template T
 * @param {T[]|ReadonlyArray<T>|T} value
 * @returns {T[]}
 */
export const ensureArray = (value) =>
  isArrayLike(value)
    ? [...value]
    : [value];
