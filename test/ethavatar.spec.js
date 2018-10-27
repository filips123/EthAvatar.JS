/* eslint-disable */

'use strict'

const assert = require('chai').assert

const Web3 = require('web3')
const IpfsAPI = require('ipfs-api')

const EthAvatar = require('../src/index.js')

describe('EthAvatar', function () {
  this.timeout(15000)

  before(function () {
    const web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545/')
    const web3Connection = new Web3(web3Provider)

    const ipfsConnection = IpfsAPI('ipfs.infura.io', '5001', {protocol: 'https'})

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
      let contract = require ('../src/EthAvatar.json')
      let address = contract['networks'][web3.version.network]['address']

      new EthAvatar(null, null, address)
    })
  })

  describe('#get()', function () {
    before(async function () {
      let avatar = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])
      await ethavatar.set(avatar)
    })

    it('should enable privacy (EIP-1102) Web3 provider', async function () {
      global.ethereum = global.web3.currentProvider
      global.ethereum.enable = async () => {
        return true
      }

      let ethavatar = new EthAvatar()
      await ethavatar.get()

      delete global.ethereum
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
    it('should enable privacy (EIP-1102) Web3 provider', async function () {
      global.ethereum = global.web3.currentProvider
      global.ethereum.enable = async () => {
        return true
      }

      let avatar = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])
      let ethavatar = new EthAvatar()
      await ethavatar.set(avatar)

      delete global.ethereum
    })

    it('should set avatar', async function () {
      let avatar = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])
      await ethavatar.set(avatar)

      let expected = avatar
      let actual = await ethavatar.get()

      assert(Buffer.compare(expected, actual) === 0, 'Avatar is not correctly set')
    })
  })
})
