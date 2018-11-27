#!/usr/bin/env node

'use strict'

const Web3 = require('web3')
const IpfsAPI = require('ipfs-api')

const program = require('commander')
const settings = require('user-settings').file('.ethavatar')

const URL = require('url')

const EthAvatar = require('./client.js')
const FileHelper = require('./helpers/file.js')

const { version } = require('../package.json')

let config = (optional) => {
  if (typeof optional.web3 === 'string') {
    settings.set('web3', optional.web3)
  } else if (optional.web3 === true) {
    settings.unset('web3')
  }

  if (typeof optional.ipfs === 'string') {
    settings.set('ipfs', optional.ipfs)
  } else if (optional.ipfs === true) {
    settings.unset('ipfs')
  }

  let web3Conn = typeof settings.get('web3') !== 'undefined' ? settings.get('web3') : 'Not set'
  let ipfsConn = typeof settings.get('ipfs') !== 'undefined' ? settings.get('ipfs') : 'Not set'

  process.stdout.write('Current Web3 connection: ' + web3Conn)
  process.stdout.write('Current IPFS connection: ' + ipfsConn)
}

let get = (required, optional) => {
  let web3Connection
  let ipfsConnection
  let address

  if (typeof optional.web3 === 'string') {
    let web3Provider = new Web3.providers.HttpProvider(optional.web3)
    web3Connection = new Web3(web3Provider)
  } else if (typeof settings.get('web3') !== 'undefined') {
    let web3Provider = new Web3.providers.HttpProvider(settings.get('web3'))
    web3Connection = new Web3(web3Provider)
  } else {
    process.stderr.write('Web3 connection not specified!')
    process.exit(1)
  }

  if (typeof optional.ipfs === 'string') {
    let ipfsURL = new URL(optional.ipfs)
    ipfsConnection = IpfsAPI(ipfsURL.hostname, ipfsURL.port, {protocol: ipfsURL.protocol})
  } else if (typeof settings.get('ipfs') !== 'undefined') {
    let ipfsURL = new URL(settings.get('ipfs'))
    ipfsConnection = IpfsAPI(ipfsURL.hostname, ipfsURL.port, {protocol: ipfsURL.protocol})
  } else {
    ipfsConnection = IpfsAPI('ipfs.infura.io', '5001', {protocol: 'https'})
  }

  if (typeof optional.address === 'string') {
    address = optional.address
  } else {
    address = web3Connection.eth.accounts[0]
  }

  const ethavatar = new EthAvatar(web3Connection, ipfsConnection)
  const fileHelper = new FileHelper(ethavatar)

  try {
    fileHelper.toFile(required, address)
  } catch (error) {
    process.stderr.write(error.message)
    process.exit(1)
  }

  process.stdout.write(`Avatar of address ${address} has been written to file ${required}`)
  process.exit(0)
}

let set = (required, optional) => {
  let web3Connection
  let ipfsConnection

  if (typeof optional.web3 === 'string') {
    let web3Provider = new Web3.providers.HttpProvider(optional.web3)
    web3Connection = new Web3(web3Provider)
  } else if (typeof settings.get('web3') !== 'undefined') {
    let web3Provider = new Web3.providers.HttpProvider(settings.get('web3'))
    web3Connection = new Web3(web3Provider)
  } else {
    process.stderr.write('Web3 connection not specified!')
    process.exit(1)
  }

  if (typeof optional.ipfs === 'string') {
    let ipfsURL = new URL(optional.ipfs)
    ipfsConnection = IpfsAPI(ipfsURL.hostname, ipfsURL.port, {protocol: ipfsURL.protocol})
  } else if (typeof settings.get('ipfs') !== 'undefined') {
    let ipfsURL = new URL(settings.get('ipfs'))
    ipfsConnection = IpfsAPI(ipfsURL.hostname, ipfsURL.port, {protocol: ipfsURL.protocol})
  } else {
    ipfsConnection = IpfsAPI('ipfs.infura.io', '5001', {protocol: 'https'})
  }

  const ethavatar = new EthAvatar(web3Connection, ipfsConnection)
  const fileHelper = new FileHelper(ethavatar)

  try {
    fileHelper.fromFile(required)
  } catch (error) {
    process.stderr.write(error.message)
    process.exit(1)
  }

  process.stdout.write(`Avatar of address ${web3Connection.eth.accounts[0]} from file ${required} has been uploaded to blockchain`)
  process.exit(0)
}

program
  .version(version)
  .description('JavaScript API for EthAvatar')

program
  .command('config')
  .description('Set Web3 and IPFS connection')
  .option('--web3 [optional]', 'Web3 Conenction')
  .option('--ipfs [optional]', 'IPFS Conenction')
  .action(config)

program
  .command('get <filename>')
  .description('Get avatar of address to file')
  .option('--web3 [optional]', 'Web3 Conenction')
  .option('--ipfs [optional]', 'IPFS Conenction')
  .option('--address [optional]', 'Ethereum address')
  .action(get)

program
  .command('set <filename>')
  .description('Set avatar of address from file')
  .option('--web3 [optional]', 'Web3 Conenction')
  .option('--ipfs [optional]', 'IPFS Conenction')
  .action(set)

if (process.argv.length === 2) {
  process.stdout.write(program.helpInformation())
} else {
  program.parse(process.argv)
}
