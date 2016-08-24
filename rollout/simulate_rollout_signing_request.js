/**
 * Created by kfirerez on 23/08/2016.
 */
'use strict';

const q = require('q');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const NodeRSA = require('node-rsa');
const RolloutMock = require('./RolloutMock');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var signingEndpoint = process.argv[2];
var certificateFilePath = process.argv[3];
var rolloutMock = new RolloutMock(signingEndpoint, certificateFilePath);

if (process.argv.length !== 4) {
  console.log(`Usage: node simulate_rollout_signing_request.js  <signing_endpoint> <certificate_file>
    signing_endpoint - the endpoint to request signing from
    certificate_file - path to public certificate `);
  process.exit(1);
} else {
  console.log(`Running Rollout mock with signing url: "${signingEndpoint}"
   path to certificate: "${certificateFilePath}"`)
}

/**
 * This is the routes that is used as the responseURL in this demo.
 * The remote signer must send the signed configuration to this endpoint.
 */
app.post('/api/app-versions/12345678/signing_data/987654', function (req, res) {
  console.log(`Got response from remote signer with body: ${JSON.stringify(req.body)}`);
  let key = new NodeRSA(rolloutMock.publicKeyData, {
    environment: 'node',
    signingAlgorithm: 'sha256'
  });
  
  //Note that we are verifing the signature with the raw data we have sent.
  if(key.verify(rolloutMock.body.data, req.body.signature, 'base64', 'base64')){
    console.log(`----------------------  Success verification ----------------------
    Signature: ${req.body.signature} is verified with data: ${JSON.stringify(rolloutMock.body.data)}`);
    res.status(200).send();
    process.exit(0);
  } else {
    console.log(`---------------------- Failed verification ----------------------
    Failed to verify signature: ${req.body.signature} with data: ${JSON.stringify(rolloutMock.body.data)}`);
    res.status(400).send();
    process.exit(1);
  }
});

/**
 * Rollout mock server listens on port 3000
 */
app.listen(3000, function () {
  console.log('Response URL endpoint mimics Rollout is up and listening on port 3000!');
  q.resolve()
    .then(rolloutMock.initArtifacts.bind(rolloutMock))
    .then(rolloutMock.sendConfigurationToSigningService.bind(rolloutMock))
    .then(() => {
      console.log('Hot patch data sent for signing. Waiting for response from signing service...');
    })
    .done();
});
