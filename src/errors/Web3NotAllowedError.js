/* istanbul ignore file */

'use strict'

class Web3NotAllowedError extends Error {
  constructor (...args) {
    super(...args)

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

module.exports = Web3NotAllowedError
