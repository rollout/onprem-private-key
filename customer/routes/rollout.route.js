'use strict';

const express = require('express');
const router = express.Router();

const Signer = require('../modules/signer');

/**
 * route handler for POSTing rollout's configuration for signing. The request JSON body includes:
 *  1. data - the actual configuration that need signing and will be sent in the future to rollout SDK on the various devices.
 *  2. certificateMd5 - a md5 representation of the certificate that was entered to rollout's system via the dashboard
 *  3. responseURL - a URL on Rollout's domain that will receive the response with the signed configuration. This endpoint accept JSON response as follow:
 *    a. signature - the data above after signed with your private key.
 *    b. certificateMd5 - the md5 represents the certificate you have registered in Rollout.
 *
 *  Note that we call a chain of actions (represented here as promises): Verify -> response to caller only if data is valid -> Sign -> response to caller only if error occurred.
 */
router.post('/sign', (req, res) => {
  let signer = new Signer(req);
  signer.verify()
    .then(signer.loadArtifacts.bind(signer))
    .then(() => {
      console.log('Received sign request', req.body);
    })
    .then(signer.sign.bind(signer))
    .then(() => {
      // Note that this response is just to tell the caller that request received and validated. The actual signed data will be sent via the responseUrl callback
      res.status(200).send();
    })
    .catch(err => {
      err = err || new Error();
      err.message = err.message || 'Failed to sign configuration';
      err.code = err.code || 400;
      res.status(err.code).send(err.message);
      console.error(`Error while signing configuration. Code=${err.code}, Message=${err.message}`);
    })
    .done();
});

router.all('*', (req, res) => {
  res.status(404).send();
});

module.exports = router;
