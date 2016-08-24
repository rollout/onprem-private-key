'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const q = require('q');
const exec = require('child_process').exec;
const request = require('request');
/**
 * This class mimic Rollout behaviour.
 * It does the following:
 *  1. Load certificate file and create it's hash
 *  2. Load hot patch configuration and prepare the body of the request to the remote signing service
 *  3. Send the request for signing the hot patch configuration and waits for the response
 *  4. Once response is arrived it verifies the result, print the outcome and exit.
 */
class RolloutMock {
  constructor(signingEndpoint, certificateFilePath) {
    this.signingEndpoint = signingEndpoint;
    this.certificateFilePath = certificateFilePath;
  }
  
  /**
   * Load certificate and create certificate hash. Load hotpatch and create body. Extract public key from certificate for later use.
   */
  initArtifacts() {
    //Load certificate file, create certificateMd5 and extract public key
    this.certificate = fs.readFileSync(path.resolve(this.certificateFilePath), 'utf8');
    this.certificateMd5 = crypto.createHash('md5').update(this.certificate).digest('hex');
    
    //Load hotpatch configuration and create body
    this.hotPatch = require('./hotPatch');
    this.body = {
      "data": this.hotPatch,
      "certificateMd5": this.certificateMd5,
      "responseURL": `http://localhost:3000/api/app-versions/12345678/signing_data/987654`
    }
    
    //Extract public key from the certificate to use on the responseURL handler for verification of the signature
    return q.nfcall(exec, `openssl x509 -inform pem -in ${this.certificateFilePath} -pubkey -noout`)
      .spread((publicKey, stderr) => {
        this.publicKeyData = publicKey;
        console.log(`Extracted public key from certificate located at ${this.certificateFilePath}: ${this.publicKeyData}`);
      });
  }
  
  /**
   * Send the configuration to the remote signing url for signing by Rollout's customer private key.
   * @return promise with the response from the remote signer service.
   */
  sendConfigurationToSigningService() {
    return q.nfcall(request, {
      uri: this.signingEndpoint,
      method: 'POST',
      json: true,
      body: this.body
    });
  }
}

module.exports = RolloutMock;