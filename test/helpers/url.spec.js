/* eslint-env mocha */
/* eslint no-new: 0 */
/* eslint dot-notation: 0 */
/* global ethavatar:true */

'use strict'

const assert = require('chai').assert

const fetch = require('cross-fetch')

const Web3 = require('web3')
const IpfsClient = require('ipfs-http-client')

const EthAvatar = require('../../src/client.js')
const UrlHelper = require('../../src/helpers/url.js')

describe('UrlHelper', function () {
  this.timeout(60000)

  before(function () {
    const web3Connection = new Web3('http://127.0.0.1:8545/')
    const ipfsConnection = IpfsClient('https://ipfs.infura.io:5001')

    global.web3 = web3Connection
    global.ipfs = ipfsConnection

    global.ethavatar = new EthAvatar()
  })

  describe('#toUrl()', function () {
    it('should post avatar to URL', async function () {
      const tokenResponse = await fetch('https://webhook.site/token', { method: 'POST' })
      const tokenData = await tokenResponse.json()
      const token = tokenData.uuid

      const urlHelper = new UrlHelper(ethavatar)
      await urlHelper.toUrl('https://webhook.site/' + token)

      const requestsResponse = await fetch('https://webhook.site/token/' + token + '/requests')
      const requestsData = await requestsResponse.json()
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

      const response = await fetch(url)
      const data = await response.arrayBuffer()

      const expected = Buffer.from(data)
      const actual = await ethavatar.get()

      assert(Buffer.compare(expected, actual) === 0, 'Avatar is not correctly uploaded from URL')
    })
  })
})
