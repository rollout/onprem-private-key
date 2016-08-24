/**
 * Created by kfirerez on 15/08/2016.
 */
'use strict';

const q = require('q');
const NodeRSA = require('node-rsa');
const request = require('request');
const privateKeys = require('./privateKeys');

/**
 * Signer is responsible to sign configurations accorind to the information it gets from the request.
 */
class Signer {
  constructor(req) {
    if (!req || !req.body) {
      let err = new Error();
      err.message = 'Request is invalid';
      err.code = 400;
      throw err;
    }
    this.data = req.body.data;
    this.certificateMd5 = req.body.certificateMd5;
    this.responseURL = req.body.responseURL;
  }
  
  /**
   * Verify the integrity of the input information. Check that we have data, certificateMd5 and responseUrl
   * @return { a promise which resolved to empty response on success or error object on failure }
   */
  verify() {
    var err;
    if (!this.data) {
      err = new Error();
      err.message = 'Missing data to sign';
      err.code = 400;
      return q.reject(err);
    }
    if (!privateKeys || !this.certificateMd5 || !privateKeys[this.certificateMd5]) {
      err = new Error();
      err.message = 'Certificate is not valid';
      err.code = 403;
      return q.reject(err);
    }
    if (!this.responseURL) {
      err = new Error();
      err.message = 'responseURL is missing';
      err.code = 400;
      return q.reject(err);
    }
    
    return q.resolve();
  }
  
  /**
   * Sign the configuration with the private key corresponds to the certificateMd5.
   * Call to send the signature once the signing is done.
   * If you need to do some other actions before signing (for example update some git), this is one place to do it.
   * @return { a promise which is resolved as empty response on success }
   */
  sign() {
    let keyInfo = privateKeys[this.certificateMd5];
    if (!keyInfo.nodeRSAObj) {
      console.log(`Creating nodeRSA obj`);
      keyInfo.nodeRSAObj = new NodeRSA(keyInfo.value, {
        environment: 'node',
        signingAlgorithm: 'sha256'
      });
    }
    
    try {
      this.signature = keyInfo.nodeRSAObj.sign(this.data, 'base64');
      this.sendSignature();
    } catch (e) {
      return q.reject(e);
    }
    
    return q.resolve();
  }
  
  /**
   * Send the resulted signed configuration (this.signature) to the given responseURL
   */
  sendSignature() {
    let responseJson = {
      signature: this.signature,
      certificateMd5: this.certificateMd5
    };
    q.nfcall(request, {
      uri: this.responseURL,
      method: 'POST',
      json: true,
      body: responseJson
    })
      .then(res => {
        res = res.length ? res[0] : res;
        console.log(`configuration response status: ${res.statusCode}`);
      })
      .catch(err => {
        err = err || `failed to send signed configuration to ${this.responseURL}`;
        console.error(err);
      })
      .done();
  }
}

module.exports = Signer;