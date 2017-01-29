'use strict';
const rolloutServer = require('./rolloutServer');
const RolloutMock = require('./rolloutMock');
const rp = require('request-promise-native');

const signServiceURL = process.argv[2];
const certificateFilePath = process.argv[3];

if (process.argv.length !== 4) {
  console.log(`Usage: node simulate_rollout_signing_request.js  <signing_endpoint> <certificate_file>
    signing_endpoint - the endpoint to request signing from
    certificate_file - path to public certificate `);
  process.exit(1);
} else {
  console.log(`* Checking signing service at "${signServiceURL}" using certificate: "${certificateFilePath}"`);
}

/**
 * The script creates an express server and sends sign request to the sign service,
 * which is expected to run on port 4000, it waits for response from the service and\
 * validates it.
 *
 * This flow is what Rollout servers do when using on-premise sign services installed and maintaned
 * by Rollout's customers
 */

const rollout = new RolloutMock(certificateFilePath);
const handleSignerResponse = function (req, res) {
  const signature = req.body.signature;

  return rollout.verifySignature(signature)
  .then(result => {
    if (!result) {
      res.status(500);
      console.error(`❌  Failed to verify response from sign service with, signature: ${signature}`);
      process.exit(1);
    }
    res.sendStatus(200);
    console.error('🎉  Sign service operates correctly!');
    process.exit(0);
  });
};

rolloutServer.init({ handleSignerResponse })
  .then(() => rolloutServer.start())
  .then(() => rp({
    uri: signServiceURL,
    method: 'POST',
    json: true,
    body: rollout.getDataForSigning(),
    rejectUnauthorized: false
  }))
  .catch(error => {
    console.error(error.toString());
    process.exit(1);
  });
