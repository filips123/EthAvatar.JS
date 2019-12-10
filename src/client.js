/* global ethereum:true */
/* global web3:true */

'use strict'

const Web3 = require('web3')
const TruffleContract = require('@truffle/contract')
const IpfsClient = require('ipfs-http-client')

const EthAvatarContract = require('./data/EthAvatar')

const Web3ProviderNotFoundError = require('./errors/Web3ProviderNotFoundError')
const ContractNotFoundError = require('./errors/ContractNotFoundError')

const InvalidAddressError = require('./errors/InvalidAddressError')
const Web3NotAllowedError = require('./errors/Web3NotAllowedError')
const DefaultAddressNotFoundError = require('./errors/DefaultAddressNotFoundError')

const GetAvatarError = require('./errors/GetAvatarError')
const SetAvatarError = require('./errors/SetAvatarError')
const RemoveAvatarError = require('./errors/RemoveAvatarError')

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
      // Modern dapp browsers
      if (typeof ethereum !== 'undefined') {
        this.web3 = new Web3(ethereum)
      // Legacy dapp browsers
      } else if (typeof web3 !== 'undefined') {
        this.web3 = new Web3(web3.currentProvider)
      // Other browsers
      } else {
        throw new Web3ProviderNotFoundError('Default Web3 provider not found')
      }
    } else {
      this.web3 = web3Conn
    }

    // Get IPFS connection
    if (ipfsConn === null) {
      this.ipfs = IpfsClient('https://ipfs.infura.io:5001')
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
    } catch (error) /* istanbul ignore next */ {
      let err = new ContractNotFoundError(error.message)
      err.stack = error.stack

      throw err
    }
  }

  async _address (address = null) {
    if (address) {
      if (this.web3.utils.isAddress(address)) {
        return address
      } else {
        try {
          address = await this.web3.eth.ens.getAddress(address)
        } catch (error) {
          if (error.message.includes('ENS is not supported on network')) {
            throw new InvalidAddressError('Provided address invalid and ENS not supported')
          }

          throw new InvalidAddressError('Provided address invalid and ENS domain not found')
        }

        return address
      }
    }

    // Enable Web3 provider (EIP-1102)
    if (typeof this.web3.currentProvider.enable !== 'undefined') {
      try {
        await this.web3.currentProvider.enable()
      } catch (error) /* istanbul ignore next */ {
        let err = new Web3NotAllowedError(error)
        err.stack = error.stack

        throw err
      }
    }

    // Get Ethereum address
    let accounts = await this.web3.eth.getAccounts()
    if (typeof accounts[0] !== 'undefined') {
      return accounts[0]
    } else /* istanbul ignore next */ {
      throw new DefaultAddressNotFoundError('Default Ethereum address not found')
    }
  }

  /**
   * Get avatar of Ethereum address.
   *
   * @param {string} [address] - Address or ENS domain to get avatar (default is current Ethereum address).
   *
   * @return {buffer} - Buffer data of avatar.
   *
   * @async
   */
  async get (address = null) {
    await this._initialized

    // Get address
    address = await this._address(address)

    // Get avatar
    try {
      // Get avatar hash from contract
      let hash = await this.instance.getIPFSHash(address)

      // Cancel if avatar is not set
      if (hash === '') {
        return
      }

      // Get avatar data from IPFS
      let result = await this.ipfs.get(hash)
      let data = JSON.parse(Buffer.from(result[0].content).toString())

      // Get avatar image from IPFS
      let avatar = await this.ipfs.get(data.imageHash)
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

    // Get address
    let address = await this._address()

    // Set avatar
    try {
      // Set avatar image to IPFS
      let imageHash = (await this.ipfs.add(buffer))[0].hash

      // Set avatar data to IPFS
      let dataBuffer = Buffer.from(JSON.stringify({ imageHash: imageHash }))
      let dataHash = (await this.ipfs.add(dataBuffer))[0].hash

      // Set avatar hash to contract
      await this.instance.setIPFSHash(dataHash, { from: address })

      return
    } catch (error) /* istanbul ignore next */ {
      let err = new SetAvatarError(error.message)
      err.stack = error.stack

      throw err
    }
  }

  /**
   * Remove avatar of Ethereum address.
   *
   * @return {void}
   *
   * @async
   */
  async remove () {
    await this._initialized

    // Get address
    let address = await this._address()

    // Remove avatar
    try {
      await this.instance.setIPFSHash('', { from: address })

      return
    } catch (error) /* istanbul ignore next */ {
      let err = new RemoveAvatarError(error.message)
      err.stack = error.stack

      throw err
    }
  }

  /**
   * Watch for avatar changes.
   *
   * @param {function} [callback] - Callback when event is received.
   * @param {string} [address] - Address or ENS domain to watch (default is current Ethereum address).
   *
   * @return {void}
   */
  watch (callback, address = null) {
    this._initialized
      .then(async () => {
        // Get address
        address = await this._address(address)

        // Get contract event
        const event = this.instance.DidSetIPFSHash

        // Watch for changes
        event((error, result) => {
          if (!error) {
            if (result.args.hashAddress === address) {
              callback(result.args)
            }
          }
        })
      })
  }
}

module.exports = EthAvatar
