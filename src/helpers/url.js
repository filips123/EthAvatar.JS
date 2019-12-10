'use strict'

const axios = require('axios')
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

      let data = ''
      for (var i = 0, len = formData._streams.length; i < len; i++) {
        if (typeof formData._streams[i] !== 'function') {
          data += formData._streams[i] + '\r\n'
        }
      }

      await axios({
        url: url,
        method: 'POST',
        headers: formData.getHeaders(),
        data: data
      })
    } catch (error) /* istanbul ignore next */ {
      const err = new PostUrlError(error)
      err.stack = error.stack

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
      const response = await axios({
        url: url,
        method: 'GET',
        responseType: 'arraybuffer'
      })
      const data = response.data ? response.data : response.request.responseText

      avatar = Buffer.from(data)
    } catch (error) /* istanbul ignore next */ {
      const err = new GetUrlError(error)
      err.stack = error.stack

      throw err
    }

    await this.ethavatar.set(avatar)
  }
}

module.exports = UrlHelper
