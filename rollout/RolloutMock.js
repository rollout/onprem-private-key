/**
 * This class mimics Rollout behaviour
 */

'use strict';

const fs = require('fs');
const pem = require('pem');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');
const hotPatch = require('./hotPatch');

/**
 * Extract public key for a certificate
 *
 * @param {String} certificate
 * @returns
 */
const getPublicKeyFromCertificate = function (certificate) {
  return new Promise((resolve, reject) => {
    pem.getPublicKey(certificate, (error, result) => {
      if (error) return reject(error);
      resolve(result.publicKey);
    });
  });
};

class RolloutMock {
  /**
   * Creates an instance of RolloutMock.
   *
   * @param {any} certificateFilePath path to public certificate file
   *
   * @memberOf RolloutMock
   */
  constructor (certificateFilePath) {
    this.certificateFilePath = certificateFilePath;
    this.certificate = fs.readFileSync(path.resolve(this.certificateFilePath), 'utf8');
    this.certificateMd5 = crypto.createHash('md5').update(this.certificate).digest('hex');
  }

   /**
   * Creates configuration for sending to a signing service
   *
   * @returns {object}
   *
   * @memberOf RolloutMock
   */
  getDataForSigning () {
    return {
      data: hotPatch,
      certificateMd5: this.certificateMd5,
      responseURL: config.RESPONSE_URL
    };
  }

  /**
   *
   * Verifies that the signature is created by a private key that matches the certificate
   * @param {String} signature to check
   * @returns {Promise} true/fakse
   *
   * @memberOf RolloutMock
   */
  verifySignature (signature) {
    const verifier = crypto.createVerify('sha256');
    verifier.update(hotPatch);
    return getPublicKeyFromCertificate(this.certificate)
    .then(publicKey => {
      this.publicKey = publicKey;
      return verifier.verify(this.publicKey, signature, 'base64');
    });
  }
}

module.exports = RolloutMock;
