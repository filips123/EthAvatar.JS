'use strict'

const fetch = require('cross-fetch')
const FormData = require('form-data')

const GetUrlError = require('../errors/GetUrlError')
const PostUrlError = require('../errors/PostUrlError')

/**
 * URL helper class for EthAvatar.
 *
 * @class
 */
class UrlHelper {
  /**
   * Construct the URL helper.
   *
   * @param {EthAvatar} [ethavatar] - Instance of EthAvatar object.
   *
   * @constructor
   */
  constructor (ethavatar) {
    this.ethavatar = ethavatar
  }

  /**
   * Post avatar to URL as FormData.
   *
   * @param {string} [url] - URL to get avatar.
   * @param {string} [address] - Address or ENS domain to get avatar (default is current Ethereum address).
   *
   * @return {void}
   *
   * @async
   */
  async toUrl (url, address = null) {
    address = await this.ethavatar._address(address)

    const avatar = await this.ethavatar.get(address)

    try {
      const formData = new FormData()
      formData.append('address', address)
      formData.append('avatar', avatar)

      const response = await fetch(url, { method: 'POST', body: formData })
      if (!response.ok) {
        const err = new PostUrlError('Posting to URL failed with status code ' + response.status)
        err.status = response.status

        throw err
      }
    } catch (error) /* istanbul ignore next */ {
      if (error instanceof PostUrlError) {
        throw error
      }

      const err = new PostUrlError(error)
      err.stack = error.stack
      err.status = 0

      throw err
    }
  }

  /**
   * Get avatar from URL.
   *
   * @param {string} [url] - URL of avatar.
   *
   * @return {void}
   *
   * @async
   */
  async fromUrl (url) {
    let avatar = null

    try {
      const response = await fetch(url)

      if (!response.ok) {
        const err = new GetUrlError('Getting from URL failed with status code ' + response.status)
        err.status = response.status

        throw err
      }

      const data = await response.arrayBuffer()
      avatar = Buffer.from(data)
    } catch (error) /* istanbul ignore next */ {
      if (error instanceof GetUrlError) {
        throw error
      }

      const err = new GetUrlError(error)
      err.stack = error.stack
      err.status = 0

      throw err
    }

    await this.ethavatar.set(avatar)
  }
}

module.exports = UrlHelper
