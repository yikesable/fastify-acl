'use strict'

const getRoles = (obj, passthrough) => {
  if (Array.isArray(obj)) return obj
  if (typeof obj === 'string') return [obj]
  if (typeof obj === 'function') return obj(passthrough)
  return []
}

module.exports = {
  getRoles
};
