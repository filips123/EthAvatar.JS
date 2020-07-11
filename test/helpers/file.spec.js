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
    const web3Connection = new Web3('http://127.0.0.1:8545/')
    const ipfsConnection = IpfsClient('https://ipfs.infura.io:5001')

    global.web3 = web3Connection
    global.ipfs = ipfsConnection

    global.ethavatar = new EthAvatar()
  })

  describe('#toFile()', function () {
    it('should download avatar to file', async function () {
      const avatar = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])
      await ethavatar.set(avatar)

      const fileHelper = new FileHelper(ethavatar)
      await fileHelper.toFile(path.join(os.tmpdir(), 'download.png'))

      const readFile = promisify(fs.readFile)
      const data = await readFile(path.join(os.tmpdir(), 'download.png'))

      const expected = avatar
      const actual = Buffer.from(data)

      assert(Buffer.compare(expected, actual) === 0, 'Avatar is not correctly downloaded to file')
    })
  })

  describe('#fromFile()', function () {
    it('should upload avatar from file', async function () {
      const avatar = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])

      const writeFile = promisify(fs.writeFile)
      await writeFile(
        path.join(os.tmpdir(), 'upload.png'),
        avatar,
        'binary'
      )

      const fileHelper = new FileHelper(ethavatar)
      await fileHelper.fromFile(path.join(os.tmpdir(), 'upload.png'))

      const expected = avatar
      const actual = await ethavatar.get()

      assert(Buffer.compare(expected, actual) === 0, 'Avatar is not correctly uploaded from file')
    })
  })
})
