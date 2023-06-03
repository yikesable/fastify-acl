export class HttpError extends Error {
  /** @param {number} statusCode */
  constructor (statusCode) {
    super();
    /** @type {import('fastify').FastifyError["statusCode"]} */
    this.statusCode = statusCode;
  }
}

/**
 * @param {unknown} value
 * @returns {value is ReadonlyArray<any>|any[]}
 */
const isArrayOrReadonlyArray = (value) => Array.isArray(value);

/**
 * @template T
 * @param {T[]|ReadonlyArray<T>|T} value
 * @returns {T[]}
 */
export const ensureArray = (value) =>
  isArrayOrReadonlyArray(value)
    ? [...value]
    : [value];
