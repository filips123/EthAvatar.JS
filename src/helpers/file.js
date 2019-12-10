'use strict'

const promisify = require('util').promisify

var fs
var available
try {
  fs = require('fs')
  available = true
} catch (error) /* istanbul ignore next */ {
  available = false
}

const BrowserError = require('../errors/BrowserError')

const DownloadFileError = require('../errors/DownloadFileError')
const UploadFileError = require('../errors/UploadFileError')

/**
 * File helper class for EthAvatar.
 *
 * @class
 */
class FileHelper {
  /**
   * Construct the file helper.
   *
   * @param {EthAvatar} [ethavatar] - Instance of EthAvatar object.
   *
   * @constructor
   */
  constructor (ethavatar) {
    if (available === false) /* istanbul ignore next */ {
      throw new BrowserError('Filesystem operations not available in browser')
    }

    this.ethavatar = ethavatar

    this.writeFile = promisify(fs.writeFile)
    this.readFile = promisify(fs.readFile)
  }

  /**
   * Download avatar to file.
   *
   * @param {string} [filename] - File name to get avatar.
   * @param {string} [address] - Address or ENS domain to get avatar (default is current Ethereum address).
   *
   * @return {void}
   *
   * @async
   */
  async toFile (filename, address = null) {
    address = await this.ethavatar._address(address)

    const avatar = await this.ethavatar.get(address)

    try {
      await this.writeFile(
        filename,
        avatar,
        'binary'
      )
    } catch (error) /* istanbul ignore next */ {
      const err = new DownloadFileError(error)
      err.stack = error.stack

      throw err
    }
  }

  /**
   * Upload avatar from file.
   *
   * @param {string} [filename] - File name of avatar.
   *
   * @return {void}
   *
   * @async
   */
  async fromFile (filename) {
    let data = null
    let avatar = null

    try {
      data = await this.readFile(filename)
      avatar = Buffer.from(data)
    } catch (error) /* istanbul ignore next */ {
      const err = new UploadFileError(error)
      err.stack = error.stack

      throw err
    }

    await this.ethavatar.set(avatar)
  }
}

module.exports = FileHelper
