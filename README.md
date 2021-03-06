![EthAvatar Logo][icon-logo]

EthAvatar.JS
============

[![Stable Version][icon-stable-version]][link-package]
[![Unstable Version][icon-unstable-version]][link-package]
[![Downloads][icon-downloads]][link-package]
[![License][icon-license]][link-license]
[![Node.js][icon-nodejs]][link-nodejs]
[![Build Status][icon-travis]][link-travis]

EthAvatar.JS is a JavaScript API for EthAvatar.

## Description

### About EthAvatar

[**EthAvatar**][link-ethavatar] associates an avatar of your choice with an Ethereum address that you own. It is using [**IPFS**][link-ipfs] and [**Ethereum**][link-ethereum] [Smart Sontract][link-contract] to store avatars of addresses.

The avatar image is stored on IPFS and is bound to your address via an Ethereum smart contract.

### Features

* **Visual Verification:** When sending ether to an exchange for instance, instead of being paranoid if you've pasted the correct address, wallets that support Eth Avatar will be able to fetch the exchange logo as a forms of visual verification. The same also works the other way around when transferring from the exchange to your own wallet.
* **Token Branding:** Tokens and contracts will be able to associate branding artwork to their addresses, allowing it to be possibly visible on EtherScan and exchanges once they support Eth Avatar.
* **Personal Use:** It's fun to associate avatars with your personal addresses and be able to visually differentiate between them in your wallets.

### TODO

* [x] ~~Command line program~~
* [x] ~~Watching for contract events~~
* [x] ~~Deleting avatars~~
* [x] ~~Uploading avatars from files or URLs~~
* [x] ~~Better tests~~
* [ ] Support for JavaScript fronted frameworks

## Installation

### Using NPM or Yarn

EthAvatar.JS requires [*Node.js*][link-nodejs] and [*NPM*][link-npm] or [*Yarn*][link-yarn]. It works with *Node.js 10 or later*, but it is recommended to use supported and maintained versions. Note that if you want to use it with *Node.js 12 or later*, you must use *Yarn* instead of *NPM* (because of [Truffle and Web3 bug][link-truffle-bug]).

You could globally install EthAvatar.JS to get command line interface:

```bash
npm install -g ethavatar // Using NPM
yarn global add ethavatar // Using Yarn
```

You could also install EthAvatar.JS locally, so you could use it in your application:

```bash
npm install --save ethavatar // Using NPM
yarn add ethavatar // Using Yarn
```

### Using CDN

If you want to use EthAvatar.JS in browser, you could include scripts from one of our CDNs in your HTML website:

```html
<!-- Normal Versions -->
<script src="https://cdn.jsdelivr.net/npm/ethavatar/dist/index.js"></script>
<script src="https://unpkg.com/ethavatar/dist/index.js"></script>

<!-- Minified Versions -->
<script src="https://cdn.jsdelivr.net/npm/ethavatar/dist/index.min.js"></script>
<script src="https://unpkg.com/ethavatar/dist/index.min.js"></script>
```

## Usage

### In Command Line

Command line program allows you to get and set avatars using files.

First you should specify Web3 and IPFS connection using `ethavatar config`:

```bash
$ ethavatar config --web3 http://127.0.0.1:8545/
$ ethavatar config --ipfs https://ipfs.infura.io:5001/
```

Program will save them in `~/.ethavatar` file. Web3 connection is required and all providers are supported. IPFS connection is optional and it uses Infura IPFS API by default.

You can get avatar to file using `ethavatar get <filename>`:

```bash
$ ethavatar get avatar.jpg # Save avatar of current address to file avatar.jpg
$ ethavatar get avatar.jpg --address 0x0000000000000000000000000000000000000000 # Save avatar of address 0x0000000000000000000000000000000000000000 to file avatar.jpg
```

You can set avatar using `ethavatar set <filename>`:

```bash
$ ethavatar set avatar.jpg # Uplaod avatar of current address from fileavatar.jpg
```

### In Applications

#### Instantiation

The whole class is asynchronous, so you would need to use promises or `async`/`await` in your application.

First, include this library and instantiate the class in your file:

```js
const EthAvatar = require('ethavatar')
const ethavatar = new EthAvatar()
```

Class is using injected Web3 provider (like Mist or MetaMask) and Infura IPFS API. It is using official smart contract for detected network.
You could also change them when instantiating the class:

```js
/// Load Web3 and IPFS
const Web3 = require('web3')
const IpfsAPI = require('ipfs-api')

// Load EthAvatar
const EthAvatar = require('ethavatar')

// Use local Web3 Provider
const web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545/')
const web3Connection = new Web3(web3Provider)

/// Use Infura IPFS API
const ipfsConnection = IpfsAPI('ipfs.infura.io', '5001', {protocol: 'https'})

// Use custom contract address
const contractAddress = '0x96fc5a0b46e9e4b5d114c42d4daeaa1c2517078a'

const ethavatar = new EthAvatar(
  web3Connection,
  ipfsConnection,
  contractAddress
)
```

#### Getting Avatars

You should use method `get()` to get avatar of address. It uses current address as default, but you could specify any other address:

```js
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
```

The avatar is returned as `buffer`, so you could directly write it to file.

#### Setting Avatars

You should use `set()` to set avatar of address. It's parameter must be `buffer` of avatar, so it is possible to upload it from a file:

```js
let avatar = Buffer.from(['00', '01', '03', '04', '05', '06', '07', '08', '09'])

ethavatar.set(avatar)
  .then((avatar) => {
    console.log('Avatar uploaded!')

  }).catch((error) => {
    console.error(error.message)
  })
```

#### Deleting Avatars

You should use `remove()` to remove avatar of address. It doesn't have any parameters and you could only remove avatar of your address:

```js
ethavatar.remove()
  .then(() => {
    console.log('Avatar removed!')

  }).catch((error) => {
    console.error(error.message)
  })
```

#### Watching Changes

You can also watch for avatar changes of specific address. It uses current address as default, but you could specify any other address:

```js
ethavatar.watch((result => {
  console.log('User address: ' + result.hashAddress)
  console.log('IPFS hash: ' + result.hash)
}, '0xe12Aa5FB5659bb0DB3f488e29701fE303bcBAf65')
```

#### File Operations

File operations are possible with `FileHelper` class:

```js
const FileHelper = require('ethavatar').fileHelper
const fileHelper = new FileHelper(ethavatar)
```

You can then save avatar directly to file:

```js
fileHelper.toFile('avatar.png', '0xe12Aa5FB5659bb0DB3f488e29701fE303bcBAf65')
  .then((avatar) => {
    console.log('Avatar saved!')

  }).catch((error) => {
    console.error(error.message)
  })
```

You can also upload avatar from file:

```js
fileHelper.fromFile('avatar.png')
  .then((avatar) => {
    console.log('Avatar uploaded!')

  }).catch((error) => {
    console.error(error.message)
  })
```

#### URL operations

URL operations are possible with `UrlHelper` class:

```js
const UrlHelper = require('ethavatar').urlHelper
const urlHelper = new UrlHelper(ethavatar)
```

You can then post avatar as multipart form data:

```js
urlHelper.toUrl('https://example.com/', '0xe12Aa5FB5659bb0DB3f488e29701fE303bcBAf65')
  .then((avatar) => {
    console.log('Avatar downloaded!')

  }).catch((error) => {
    console.error(error.message)
  })
```

The request will have ``multipart/form-data`` content type and include `address` and `avatar` form values.

You can also get avatar from URL:

```js
urlHelper.fromUrl('https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg')
  .then((avatar) => {
    console.log('Avatar uploaded!')

  }).catch((error) => {
    console.error(error.message)
  })
```

#### Other Examples

You could also look to [`example.js`][link-example] or [API documentation][link-documentation]. Source code of [console application][link-console] is also great way to learn how this works.

## Built With
* [Ethereum][link-ethereum]
* [Truffle Framework][link-truffle]
* [Web3][link-web3]
* [IPFS][link-ipfs]

## Contributing
Please read [`CONTRIBUTING.md`][link-contributing] for details.

## Versioning
This project uses [SemVer][link-semver] for versioning. For the versions available, see the [tags on this repository][link-tags].

## License
This project is licensed under the MIT license. See the [`LICENSE`][link-license-file] file for details.

[icon-logo]: https://screenshotscdn.firefoxusercontent.com/images/ea73525d-a516-4795-b5f3-8ad967d9a324.png

[icon-stable-version]: https://img.shields.io/npm/v/ethavatar/latest.svg?style=flat-square&label=Stable+Version
[icon-unstable-version]: https://img.shields.io/npm/v/ethavatar/beta.svg?style=flat-square&label=Unstable+Version
[icon-downloads]: https://img.shields.io/npm/dt/ethavatar.svg?style=flat-square&label=Downloads
[icon-license]: https://img.shields.io/npm/l/ethavatar.svg?style=flat-square&label=License
[icon-nodejs]: https://img.shields.io/node/v/ethavatar.svg?style=flat-square&label=Node.js
[icon-travis]: https://img.shields.io/travis/com/filips123/EthAvatar.JS.svg?style=flat-square&label=Build+Status

[link-ethavatar]: https://github.com/gitcoinco/ethavatar/
[link-contract]: https://etherscan.io/address/0x4FbF2f1613Cc86314b22AE10Ae95D19cF2990824/
[link-ethereum]: https://ethereum.org/
[link-truffle]: http://truffleframework.com/
[link-web3]: https://github.com/ethereum/web3.js/
[link-ipfs]: https://ipfs.io/
[link-nodejs]: https://nodejs.org/
[link-npm]: https://www.npmjs.com/
[link-yarn]: https://yarnpkg.com/
[link-semver]: https://semver.org/
[link-license]: https://choosealicense.com/licenses/mit/

[link-package]: https://www.npmjs.com/package/ethavatar/
[link-travis]: https://travis-ci.com/filips123/EthAvatar.JS/

[link-tags]: https://github.com/filips123/ethavatar.js/tags/
[link-license-file]: https://github.com/filips123/ethavatar.js/blob/master/LICENSE/
[link-example]: https://github.com/filips123/ethavatar.js/blob/master/example.js/
[link-documentation]: https://ethavatar.js.org/
[link-console]: https://github.com/filips123/EthAvatar.JS/blob/master/src/console.js/
[link-contributing]: https://github.com/filips123/ethavatar.js/blob/master/CONTRIBUTING.md

[link-truffle-bug]: https://github.com/trufflesuite/truffle/issues/2070
