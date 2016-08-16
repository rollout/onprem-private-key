/**
 * Created by kfirerez on 15/08/2016.
 */
'use strict';

const q = require('q');
const NodeRSA = require('node-rsa');
const request = require('request');
const privateKeys = require('./privateKeys');

class Signer {
  constructor(req) {
    if (!req || !req.params || !req.body) {
      let err = new Error();
      err.message = 'Request is invalid';
      err.code = 400;
      throw err;
    }
    this.req = req;
    this.data = req.body.data;
    this.certificateMd5 = req.body.certificateMd5;
    this.callback = req.body.callback;
  }
  
  verify() {
    var err;
    if (!this.data) {
      err = new Error();
      err.message = 'Missing data to sign';
      err.code = 400;
      return q.reject(err);
    }
    if (!privateKeys || !this.certificateMd5 || !privateKeys[this.certificateMd5]) {
      console.log(privateKeys[this.certificateMd5]);
      err = new Error();
      err.message = 'Certificate is not valid';
      err.code = 403;
      return q.reject(err);
    }
    if (!this.callback) {
      err = new Error();
      err.message = 'Callback is missing';
      err.code = 400;
      return q.reject(err);
    }
    
    return q.resolve();
  }
  
  sign() {
    let keyInfo = privateKeys[this.certificateMd5];
    if (!keyInfo.nodeRSAObj) {
      console.log(`Creating nodeRSA obj`);
      keyInfo.nodeRSAObj = new NodeRSA(keyInfo.value, {
        environment: 'node',
        signingAlgorithm: 'sha256'
      });
    }
    
    var signature = keyInfo.nodeRSAObj.sign(this.data, 'base64');
    sendSignature(signature, this.certificateMd5, this.callback);
    
    return q.resolve();
  }
}

/******************** Private functions ***********************/
function sendSignature(signature, certificateMd5, url) {
  let responseJson = {
    signature: signature,
    certificateMd5: certificateMd5
  };
  q.nfcall(request, {
    uri: url,
    method: 'POST',
    json: true,
    body: responseJson
  })
    .then(res => {
      console.log(res.statusCode);
    })
    .catch(err => {
      console.error(err);
    })
    .done();
}

module.exports = Signer;