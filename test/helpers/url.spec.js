/* eslint-env mocha */
/* eslint no-new: 0 */
/* eslint dot-notation: 0 */
/* global ethavatar:true */

'use strict'

const assert = require('chai').assert

const axios = require('axios')

const Web3 = require('web3')
const IpfsAPI = require('ipfs-api')

const EthAvatar = require('../../src/client.js')
const UrlHelper = require('../../src/helpers/url.js')

describe('UrlHelper', function () {
  this.timeout(60000)

  before(function () {
    const web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545/')
    const web3Connection = new Web3(web3Provider)

    const ipfsConnection = IpfsAPI('ipfs.infura.io', '5001', { protocol: 'https' })

    global.web3 = web3Connection
    global.ipfs = ipfsConnection

    global.ethavatar = new EthAvatar()
  })

  describe('#toUrl()', function () {
    it('should post avatar to URL', async function () {
      let tokenResponse = await axios({
        url: 'https://webhook.site/token',
        method: 'POST'
      })
      let tokenData = tokenResponse.data ? tokenResponse.data : tokenResponse.request.responseText
      let token = tokenData.uuid

      const urlHelper = new UrlHelper(ethavatar)
      await urlHelper.toUrl('https://webhook.site/' + token)

      let requestsResponse = await axios({
        url: 'https://webhook.site/token/' + token + '/requests',
        method: 'GET'
      })
      let requestsData = requestsResponse.data ? requestsResponse.data : requestsResponse.request.responseText
      let request = requestsData['data'][requestsData.to - 1]['request']

      let expectedAddress = await ethavatar._address()
      let actualAddress = request.address.replace(/^\s*/, '')
      assert.strictEqual(actualAddress, expectedAddress, 'Default Ethereum address is not correct')

      let expectedAvatar = await ethavatar.get()
      let actualAvatar = Buffer.from(request.avatar.replace(/^\s*/, ''))

      assert(Buffer.compare(expectedAvatar, actualAvatar) === 0, 'Avatar is not correctly uploaded from URL')
    })
  })

  describe('#fromUrl()', function () {
    it('should set avatar from URL', async function () {
      let url = 'https://projects-static.raspberrypi.org/projects/minecraft-selfies/1ada2372088515811c63263ef3589ccf26509506/en/images/colour_map.png'

      const urlHelper = new UrlHelper(ethavatar)
      await urlHelper.fromUrl(url)

      let response = await axios({
        url: url,
        method: 'GET',
        responseType: 'arraybuffer'
      })
      let data = response.data ? response.data : response.request.responseText

      let expected = Buffer.from(data)
      let actual = await ethavatar.get()

      assert(Buffer.compare(expected, actual) === 0, 'Avatar is not correctly uploaded from URL')
    })
  })
})
