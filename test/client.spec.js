/* eslint-env mocha */
/* eslint no-new: 0 */
/* eslint dot-notation: 0 */
/* global ethavatar:true */
/* global web3:true */
/* global ipfs:true */

'use strict'

const assert = require('chai').assert

const Web3 = require('web3')
const IpfsClient = require('ipfs-http-client')

const EthAvatar = require('../src/client.js')

describe('EthAvatar', function () {
  this.timeout(60000)

  before(function () {
    const web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545/')
    const web3Connection = new Web3(web3Provider)

    const ipfsConnection = IpfsClient('https://ipfs.infura.io:5001')

    global.web3 = web3Connection
    global.ipfs = ipfsConnection

    global.ethavatar = new EthAvatar()
  })

  describe('#_initialize()', function () {
    it('should construct using current privacy (EIP-1102) Web3 provider', async function () {
      global.ethereum = global.web3.currentProvider
      global.ethereum.enable = async () => {
        return true
      }

      new EthAvatar()

      delete global.ethereum
    })

    it('should construct using current Web3 provider', async function () {
      new EthAvatar()
    })

    it('should construct using specified Web3 provider', async function () {
      new EthAvatar(web3)
    })

    it('should not construct without Web3 provider', async function () {
      let web3Connection = global.web3
      delete global.web3

      try {
        await new EthAvatar()
      } catch (err) {
        assert.strictEqual(err.message, 'Default Web3 provider not found', 'Class incorrectly construct without Web3 provider')
      }

      global.web3 = web3Connection
    })

    it('should construct using Infura IPFS provider', async function () {
      new EthAvatar()
    })

    it('should construct using specified IPFS provider', async function () {
      new EthAvatar(null, ipfs)
    })

    it('should construct using deployed contract address', async function () {
      new EthAvatar()
    })

    it('should construct using specified contract address', async function () {
      let network = await web3.eth.net.getId()
      let contract = require('../src/data/EthAvatar.json')
      let address = contract['networks'][network]['address']

      new EthAvatar(null, null, address)
    })
  })

  describe('#_address()', function () {
    it('should use provided Ethereum address', async function () {
      let ethavatar = new EthAvatar()

      let expected = '0x76aECE9DBF73C831ef1CAbE0b748531bec9d054E'
      let actual = await ethavatar._address(expected)

      assert.strictEqual(actual, expected, 'Provided Ethereum address is not correct')
    })

    it('should use provided ENS domain', async function () {
      let ethavatar = new EthAvatar()
      ethavatar.web3 = new Web3('https://cloudflare-eth.com')

      let domain = 'ethereum.eth'

      let expected = await ethavatar.web3.eth.ens.getAddress(domain)
      let actual = await ethavatar._address(domain)

      assert.strictEqual(actual, expected, 'Provided ENS domain is not correct')
    })

    it('should use not ENS on unsupported network', async function () {
      let ethavatar = new EthAvatar()

      let domain = 'ethereum.eth'

      try {
        await ethavatar._address(domain)
      } catch (err) {
        assert.strictEqual(err.message, 'Provided address invalid and ENS not supported', 'Program incorrectly use ENS on unsupported network')
      }
    })

    it('should not use ENS on unexisting domain', async function () {
      let ethavatar = new EthAvatar()
      ethavatar.web3 = new Web3('https://cloudflare-eth.com')

      let domain = 'this-domain-does-not-exist-on-mainnet-because-it-is-only-for-testing-of-unexisting-domains.eth'

      try {
        await ethavatar._address(domain)
      } catch (err) {
        assert.strictEqual(err.message, 'Provided address invalid and ENS domain not found', 'Program incorrectly use unexisting domain')
      }
    })

    it('should enable privacy (EIP-1102) Web3 provider', async function () {
      global.ethereum = global.web3.currentProvider
      global.ethereum.enable = async () => {
        return true
      }

      let ethavatar = new EthAvatar()
      await ethavatar._address()

      delete global.ethereum
    })

    it('should get correct default Ethereum address', async function () {
      let ethavatar = new EthAvatar()

      let expected = (await web3.eth.getAccounts())[0]
      let actual = await ethavatar._address()

      assert.strictEqual(actual, expected, 'Default Ethereum address is not correct')
    })
  })

  describe('#get()', function () {
    before(async function () {
      let avatar = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])
      await ethavatar.set(avatar)
    })

    it('should not get avatar that not exists', async function () {
      let avatar = await ethavatar.get('0xA06d95Ec8a2c91cC3ED6d7F63C0f71F75Cc4EBf1')
      assert.strictEqual(typeof avatar, 'undefined', 'Avatar that not exists is not undefined')
    })

    it('should get existing avatar', async function () {
      let expected = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])
      let actual = await ethavatar.get()

      assert.instanceOf(actual, Buffer, 'Avatar is not instance of Buffer')
      assert(Buffer.compare(expected, actual) === 0, 'Avatar is not correctly get')
    })
  })

  describe('#set()', function () {
    it('should set avatar', async function () {
      let avatar = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])
      await ethavatar.set(avatar)

      let expected = avatar
      let actual = await ethavatar.get()

      assert(Buffer.compare(expected, actual) === 0, 'Avatar is not correctly set')
    })
  })

  describe('#remove()', function () {
    it('should remove avatar', async function () {
      await ethavatar.remove()

      let expected
      let actual = await ethavatar.get()

      assert.strictEqual(actual, expected, 'Avatar is not correctly removed')
    })
  })

  describe('#watch()', function () {
    it('should watch for avatar changes', async function () {
      ethavatar.watch(async (result) => {
        let expected = web3.eth.accounts[0]
        let actual = result.hashAddress

        assert.strictEqual(actual, expected, 'Watching address is not correct')
      })

      let avatar = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])
      await ethavatar.set(avatar)
    })
  })
})
