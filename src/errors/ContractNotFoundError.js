/* istanbul ignore file */

'use strict'

class ContractNotFoundError extends Error {
  constructor (...args) {
    super(...args)

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

module.exports = ContractNotFoundError
