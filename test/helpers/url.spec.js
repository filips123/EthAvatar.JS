/* eslint-env mocha */
/* eslint no-new: 0 */
/* eslint dot-notation: 0 */
/* global ethavatar:true */

'use strict'

const assert = require('chai').assert

const axios = require('axios')

const Web3 = require('web3')
const IpfsClient = require('ipfs-http-client')

const EthAvatar = require('../../src/client.js')
const UrlHelper = require('../../src/helpers/url.js')

describe('UrlHelper', function () {
  this.timeout(60000)

  before(function () {
    const web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545/')
    const web3Connection = new Web3(web3Provider)

    const ipfsConnection = IpfsClient('https://ipfs.infura.io:5001')

    global.web3 = web3Connection
    global.ipfs = ipfsConnection

    global.ethavatar = new EthAvatar()
  })

  describe('#toUrl()', function () {
    it('should post avatar to URL', async function () {
      const tokenResponse = await axios({
        url: 'https://webhook.site/token',
        method: 'POST'
      })
      const tokenData = tokenResponse.data ? tokenResponse.data : tokenResponse.request.responseText
      const token = tokenData.uuid

      const urlHelper = new UrlHelper(ethavatar)
      await urlHelper.toUrl('https://webhook.site/' + token)

      const requestsResponse = await axios({
        url: 'https://webhook.site/token/' + token + '/requests',
        method: 'GET'
      })
      const requestsData = requestsResponse.data ? requestsResponse.data : requestsResponse.request.responseText
      const request = requestsData['data'][requestsData.to - 1]['request']

      const expectedAddress = await ethavatar._address()
      const actualAddress = request.address.replace(/^\s*/, '')
      assert.strictEqual(actualAddress, expectedAddress, 'Default Ethereum address is not correct')

      const expectedAvatar = await ethavatar.get()
      const actualAvatar = Buffer.from(request.avatar.replace(/^\s*/, ''))

      assert(Buffer.compare(expectedAvatar, actualAvatar) === 0, 'Avatar is not correctly uploaded from URL')
    })
  })

  describe('#fromUrl()', function () {
    it('should set avatar from URL', async function () {
      const url = 'https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png'

      const urlHelper = new UrlHelper(ethavatar)
      await urlHelper.fromUrl(url)

      const response = await axios({
        url: url,
        method: 'GET',
        responseType: 'arraybuffer'
      })
      const data = response.data ? response.data : response.request.responseText

      const expected = Buffer.from(data)
      const actual = await ethavatar.get()

      assert(Buffer.compare(expected, actual) === 0, 'Avatar is not correctly uploaded from URL')
    })
  })
})
