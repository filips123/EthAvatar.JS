'use strict'

// Load EthAvatar module
const EthAvatar = require('ethavatar')

// Instantiate EthAvatar with current Web3 provider and Infura IPFS API
const ethavatar = new EthAvatar()

// Get avatar of current address
ethavatar.get()
  .then((avatar) => {
    if (typeof avatar === 'undefined') {
      throw new Error('Avatar of address not set')
    } else {
      return avatar
    }

  }).then((avatar) => {
    // Load FileSystem module
    const fs = require('fs')

    // Write avatar to file
    fs.writeFile(
      'avatar.jpg',
      avatar,
      'binary',
      (err) => {
        if (err) {
          throw err
        }
      }
    )

  }).catch((error) => {
    console.error(error.message)
  })
