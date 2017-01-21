'use strict';

const q = require('q');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const request = require('request');

const ENCODING = 'utf8';
const SIGNING_ALGORITHM = 'sha256';
const SIGNATURE_FORMAT = 'base64';

/**
 * Signer is responsible to sign configurations according to the information it gets from a request.
 */
class Signer {
  constructor (req, requestMock) {
    if (!req || !req.body) {
      let err = new Error();
      err.message = 'Request is invalid';
      err.code = 400;
      throw err;
    }

    this._request = requestMock || request;

    this.data = req.body.data;
    this.certificateMd5 = req.body.certificateMd5;
    this.responseURL = req.body.responseURL;

    this.PRIVATE_KEY_PATH = path.resolve(path.join(__dirname, `/../../keys/${this.certificateMd5}/private.pem`));
  }

  /**
   * Verify the integrity of the input information. Check that we have data, certificateMd5 and responseUrl
   * @return { a promise which resolved to empty response on success or error object on failure }
   */
  verify () {
    var err;
    if (!this.data) {
      err = new Error();
      err.message = 'Missing data to sign';
      err.code = 400;
      return q.reject(err);
    }

    if (!this.responseURL) {
      err = new Error();
      err.message = 'responseURL is missing';
      err.code = 400;
      return q.reject(err);
    }

    if (!this.certificateMd5) {
      let err = new Error();
      err.message = 'certificateMd5 is missing';
      err.code = 400;
      return q.reject(err);
    }
    return q.resolve();
  }

  /**
   * Load the private key correponds to the given certificateMd5.
   * @return {*}
   */
  loadArtifacts () {
    console.log(`Loading private key from ${this.PRIVATE_KEY_PATH}`);
    return q.nfcall(fs.readFile, this.PRIVATE_KEY_PATH, 'utf8')
      .then(privateKeyData => {
        this.privateKeyData = privateKeyData;
      })
      .catch(err => {
        if (err.code === 'ENOENT') {
          let err = new Error();
          err.message = `Cannot find private key for certificateMd5: ${this.certificateMd5}`;
          err.code = 404;
          return q.reject(err);
        }
      });
  }

  /**
   * Sign the configuration with the private key corresponds to the certificateMd5.
   * Call to send the signature once the signing is done.
   * If you need to do some other actions before signing (for example update some git or store in db), this is one place to do it.
   * @return { a promise which is resolved as empty response on success }
   */
  sign () {
    return this.preSignHook()
      .then(() => {
        console.log('Signing data...');
        let signer = crypto.createSign(SIGNING_ALGORITHM);
        signer.update(this.data, ENCODING);
        this.signature = signer.sign(this.privateKeyData, SIGNATURE_FORMAT);
        this.sendSignature();
      })
      .then(this.postSignHook.bind(this));
  }

  /**
   * Send the signed configuration (this.signature) to the given responseURL
   */
  sendSignature () {
    console.log(`Sending signed response to ${this.responseURL}`);

    let responseJson = {
      signature: this.signature,
      certificateMd5: this.certificateMd5,
      data: this.data
    };

    return q.nfcall(request, {
      uri: this.responseURL,
      method: 'POST',
      json: true,
      body: responseJson,
      rejectUnauthorized: false
    })
      .then(res => {
        res = res.length ? res[0] : res;
        console.log(`Sent signature to ${this.responseURL}, response is: ${res.statusCode}`);
      })
      .catch(err => {
        err = err || `Failed to send signed configuration to ${this.responseURL}`;
        console.error(err);
      });
  }

  /**
   * Replace this empty implementation with some pre signing actions and logic that you would like to do.
   * @return Promise
   */
  preSignHook () {
    console.log('Pre signing hook logic here');
    return q.resolve();
  }

  /**
   * Replace this empty implementation with some post signing actions and logic that you would like to do.
   * @return Promise
   */
  postSignHook () {
    console.log('Post signing hook logic here');
    return q.resolve();
  }
}

module.exports = Signer;
