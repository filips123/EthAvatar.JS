/* global web3:true */

'use strict'

const Web3 = require('web3')
const TruffleContract = require('truffle-contract')
const IpfsAPI = require('ipfs-api')

const EthAvatarContract = require('./EthAvatar.json')

class Web3ProviderNotFoundError extends Error {}
class DefaultAddressNotFoundError extends Error {}
class ContractNotFoundError extends Error {}
class GetAvatarError extends Error {}
class SetAvatarError extends Error {}

/**
 * Client class for EthAvatar.
 *
 * @class
 */
class EthAvatar {
  /**
   * Construct the class and set up Web3, IPFS and Smart Contract connections.
   *
   * @param {object} [web3Conn] - Connection to Web3 provider (default is current Web3 provider).
   * @param {object} [ipfsConn] - Connection to IPFS API (default is Infura API).
   * @param {string} [contract] - Smart contract address (default is deployed address).
   *
   * @constructor
   */
  constructor (web3Conn = null, ipfsConn = null, contract = null) {
    this._initialized = this._initialize(web3Conn, ipfsConn, contract)
  }

  async _initialize (web3Conn, ipfsConn, contract) {
    // Get Web3 connection
    if (web3Conn === null) {
      if (typeof web3 !== 'undefined') {
        this.web3 = new Web3(web3.currentProvider)
      } else {
        throw new Web3ProviderNotFoundError('Default Web3 provider not found')
      }
    } else {
      this.web3 = web3Conn
    }

    // Get IPFS connection
    if (ipfsConn === null) {
      this.ipfs = IpfsAPI('ipfs.infura.io', '5001', { protocol: 'https' })
    } else {
      this.ipfs = ipfsConn
    }

    // Get smart contract details
    this.contract = TruffleContract(EthAvatarContract)
    this.contract.setProvider(this.web3.currentProvider)

    // Get smart contract address
    let getContract = (address) => {
      if (address === null) {
        return this.contract.deployed()
      } else {
        return this.contract.at(address)
      }
    }

    // Instantiate smart contract
    try {
      this.instance = await getContract(contract)

      return this
    } catch (error) {
      let err = new ContractNotFoundError(error.message)
      err.stack = error.stack

      throw err
    }
  }

  /**
   * Get avatar of Ethereum address.
   *
   * @param {string} [address] - Address to get avatar (default is current Ethereum address).
   *
   * @return {buffer} - Buffer data of avatar.
   *
   * @async
   */
  async get (address = null) {
    await this._initialized

    // Get Ethereum address
    if (address === null) {
      if (typeof this.web3.eth.accounts[0] !== 'undefined') {
        address = this.web3.eth.accounts[0]
      } else /* istanbul ignore next */ {
        throw new DefaultAddressNotFoundError('Default Ethereum address not found')
      }
    }

    // Get avatar
    try {
      // Get avatar hash from contract
      let hash = await this.instance.getIPFSHash(address)

      // Cancel if avatar is not set
      if (hash === '') {
        return
      }

      // Get avatar data from IPFS
      let result = await this.ipfs.files.get(hash)
      let data = JSON.parse(Buffer.from(result[0].content).toString())

      // Get avatar image from IPFS
      let avatar = await this.ipfs.files.get(data.imageHash)
      let image = avatar[0].content

      // Return image
      return image
    } catch (error) /* istanbul ignore next */ {
      let err = new GetAvatarError(error.message)
      err.stack = error.stack

      throw err
    }
  }

  /**
   * Set avatar of Ethereum address.
   *
   * @param {buffer} buffer - Buffer data of avatar.
   *
   * @return {void}
   *
   * @async
   */
  async set (buffer) {
    await this._initialized

    // Get Ethereum address
    let address = null
    if (typeof this.web3.eth.accounts[0] !== 'undefined') {
      address = this.web3.eth.accounts[0]
    } else /* istanbul ignore next */ {
      throw new DefaultAddressNotFoundError('Default Ethereum address not found')
    }

    // Set avatar
    try {
      // Set avatar image to IPFS
      let imageHash = (await this.ipfs.files.add(buffer))[0].hash

      // Set avatar data to IPFS
      let dataBuffer = Buffer.from(JSON.stringify({ imageHash: imageHash }))
      let dataHash = (await this.ipfs.files.add(dataBuffer))[0].hash

      // Set avatar hash to contract
      await this.instance.setIPFSHash(dataHash, { from: address })

      return
    } catch (error) /* istanbul ignore next */ {
      let err = new SetAvatarError(error.message)
      err.stack = error.stack

      throw err
    }
  }
}

module.exports = EthAvatar
