/**
 * Created by kfirerez on 15/08/2016.
 */
'use strict';

const q = require('q');
const NodeRSA = require('node-rsa');
const request = require('request');
const fs = require('fs');
const path = require('path');
const eventEmitter = require('./roEventEmitter');

/**
 * Signer is responsible to sign configurations according to the information it gets from the request.
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
  loadArtifacts(){
    return q.nfcall(fs.readFile, path.resolve(`../keys/${this.certificateMd5}/private.pem`), 'utf8')
      .then(privateKeyData => {
        this.privateKeyData = privateKeyData;
      })
      .catch(err => {
        if( err.code === 'ENOENT'){
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
  sign() {
    return this.preSignHook()
      .then( () => {
        console.log(`Creating nodeRSA obj with signingAlgorithm sha256`);
        let nodeRSAObj = new NodeRSA(this.privateKeyData, {
          environment: 'node',
          signingAlgorithm: 'sha256'
        });
  
        try {
          this.signature = nodeRSAObj.sign(this.data, 'base64');
          this.sendSignature();
        } catch (e) {
          return q.reject(e);
        }
      })
      .then(this.postSignHook.bind(this));
  }
  
  /**
   * Send the resulted signed configuration (this.signature) to the given responseURL
   */
  sendSignature() {
    console.log(`sending data to ${this.responseURL} with signature ${this.signature}`);
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
        console.log(`sent data to ${this.responseURL} configuration response status: ${res.statusCode}`);
      })
      .catch(err => {
        err = err || `failed to send signed configuration to ${this.responseURL}`;
        console.error(err);
      });
  }
  
  /**
   * Replace this empty implementation with some pre signing actions and logic that you would like to do.
   * @return promise that is resolved immediately
   */
  preSignHook() {
    console.log('Pre signing hook logic here');
    eventEmitter.emit('pre_signing', {
      data : this.data,
      certificateMd5: this.certificateMd5,
      responseURL : this.responseURL
    });
    return q.resolve();
  }
  
  /**
   * Replace this empty implementation with some post signing actions and logic that you would like to do.
   * @return promise that is resolved immediately
   */
  postSignHook() {
    console.log('Post signing hook logic here');
    eventEmitter.emit('post_signing', {
      data : this.data,
      certificateMd5: this.certificateMd5,
      responseURL : this.responseURL,
      signature: this.signature
    });
    return q.resolve();
  }
}

module.exports = Signer;
