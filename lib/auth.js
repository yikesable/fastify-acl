import createDebug from 'debug';
import { ensureArray } from './util.js';

const debug = createDebug('fastify-acl-auth:auth');

/** @typedef {{ all?: boolean, hierarchy?: ReadonlyArray<string> }} CheckRolesOptions */

/**
 * @param {string|ReadonlyArray<string>} rawActual
 * @param {string|ReadonlyArray<string>} rawAllowed
 * @param {CheckRolesOptions} [options]
 * @returns {boolean}
 */
export function checkRoles (rawActual, rawAllowed, options = {}) {
  debug('auth implementation called');

  const {
    all,
    hierarchy,
  } = {
    all: false,
    ...options,
  };

  const actual = ensureArray(rawActual);
  const allowed = ensureArray(rawAllowed);

  if (hierarchy) {
    let lowestAllowedIndex = 50;
    let highestActualIndex = -1;
    for (const actualRole of actual) {
      const i = hierarchy.indexOf(actualRole);
      if (i >= 0 && i > highestActualIndex) {
        highestActualIndex = i;
      }
    }
    for (const allowedRole of allowed) {
      const i = hierarchy.indexOf(allowedRole);
      if (i >= 0 && i < lowestAllowedIndex) {
        lowestAllowedIndex = i;
      }
    }
    return (highestActualIndex >= lowestAllowedIndex);
  }
  const intersection = allowed.filter(item => actual.includes(item));

  return all
    ? (intersection.length === allowed.length)
    : intersection.length > 0;
}
