/* eslint-env mocha */
/* eslint no-new: 0 */
/* eslint dot-notation: 0 */
/* global ethavatar:true */

'use strict'

const promisify = require('util').promisify
const assert = require('chai').assert

const path = require('path')
const os = require('os')
const fs = require('fs')

const Web3 = require('web3')
const IpfsClient = require('ipfs-http-client')

const EthAvatar = require('../../src/client.js')
const FileHelper = require('../../src/helpers/file.js')

describe('FileHelper', function () {
  this.timeout(60000)

  before(function () {
    const web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545/')
    const web3Connection = new Web3(web3Provider)

    const ipfsConnection = IpfsClient('https://ipfs.infura.io:5001')

    global.web3 = web3Connection
    global.ipfs = ipfsConnection

    global.ethavatar = new EthAvatar()
  })

  describe('#toFile()', function () {
    it('should download avatar to file', async function () {
      let avatar = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])
      await ethavatar.set(avatar)

      const fileHelper = new FileHelper(ethavatar)
      await fileHelper.toFile(path.join(os.tmpdir(), 'download.png'))

      const readFile = promisify(fs.readFile)
      let data = await readFile(path.join(os.tmpdir(), 'download.png'))

      let expected = avatar
      let actual = Buffer.from(data)

      assert(Buffer.compare(expected, actual) === 0, 'Avatar is not correctly downloaded to file')
    })
  })

  describe('#fromFile()', function () {
    it('should upload avatar from file', async function () {
      let avatar = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])

      const writeFile = promisify(fs.writeFile)
      await writeFile(
        path.join(os.tmpdir(), 'upload.png'),
        avatar,
        'binary'
      )

      const fileHelper = new FileHelper(ethavatar)
      await fileHelper.fromFile(path.join(os.tmpdir(), 'upload.png'))

      let expected = avatar
      let actual = await ethavatar.get()

      assert(Buffer.compare(expected, actual) === 0, 'Avatar is not correctly uploaded from file')
    })
  })
})
