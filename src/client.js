/* global ethereum:true */
/* global web3:true */

'use strict'

const createContractEvent = require('@drizzle-utils/contract-event-stream')
const createNewBlock = require('@drizzle-utils/new-block-stream')

const Web3 = require('web3')
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
      this.ipfs = new IpfsClient('https://ipfs.infura.io:5001')
    } else {
      this.ipfs = ipfsConn
    }

    // Get smart contract connection
    if (contract === null) {
      const network = await this.web3.eth.net.getId()

      try {
        contract = EthAvatarContract.networks[network].address
      } catch (error) {
        throw new ContractNotFoundError('Contract not found on current network')
      }
    }

    this.contract = new this.web3.eth.Contract(EthAvatarContract.abi, contract)
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
        const err = new Web3NotAllowedError(error)
        err.stack = error.stack

        throw err
      }
    }

    // Get Ethereum address
    const accounts = await this.web3.eth.getAccounts()
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
      const hash = await this.contract.methods.getIPFSHash(address).call()

      // Cancel if avatar is not set
      if (hash === '') {
        return
      }

      // Get avatar data from IPFS
      let data
      for await (const result of this.ipfs.get(hash)) {
        let chunks = Buffer.from([])
        for await (const chunk of result.content) {
          chunks = Buffer.concat([chunks, chunk.slice()])
        }

        data = JSON.parse(chunks.toString())
        break
      }

      // Get avatar image from IPFS
      let image
      for await (const result of this.ipfs.get(data.imageHash)) {
        let chunks = Buffer.from([])
        for await (const chunk of result.content) {
          chunks = Buffer.concat([chunks, chunk.slice()])
        }

        image = chunks
        break
      }

      // Return image
      return image
    } catch (error) /* istanbul ignore next */ {
      const err = new GetAvatarError(error.message)
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
    const address = await this._address()

    // Set avatar
    try {
      // Set avatar image to IPFS

      let imageHash
      for await (const imageResult of this.ipfs.add(buffer)) {
        imageHash = imageResult.cid.toString()
        break
      }

      // Set avatar data to IPFS
      const dataBuffer = Buffer.from(JSON.stringify({ imageHash: imageHash }))
      let dataHash
      for await (const dataResult of this.ipfs.add(dataBuffer)) {
        dataHash = dataResult.cid.toString()
        break
      }

      // Set avatar hash to contract
      await this.contract.methods.setIPFSHash(dataHash).send({ from: address })

      return
    } catch (error) /* istanbul ignore next */ {
      const err = new SetAvatarError(error.message)
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
    const address = await this._address()

    // Remove avatar
    try {
      await this.contract.methods.setIPFSHash('').send({ from: address })

      return
    } catch (error) /* istanbul ignore next */ {
      const err = new RemoveAvatarError(error.message)
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
        const newBlock$ = createNewBlock({ web3: this.web3, pollingInterval: 200 }).observable
        const contractEvent = createContractEvent({ abi: this.contract._jsonInterface, address: this.contract._address, web3: this.web3, newBlock$: newBlock$ })

        // Watch for changes
        contractEvent.subscribe(event => {
          if (event.event === 'DidSetIPFSHash' && event.returnValues.hashAddress === address) {
            const result = { hashAddress: event.returnValues.hashAddress, hash: event.returnValues.hash }
            callback(result)
          }
        })
      })
  }
}

module.exports = EthAvatar
