# Rollout On Premise Reference Implementation
## Overview 
Rollout's patching process for live native iOS apps involves downloading patches from the cloud to mobile devices. To ensure the authenticity of patches Rollout incorporates a security mechanism which is built upon asymmetric key pairs (private / public keys). Rollout's SDK is bundled with a certificate that contains a public key (which is extracted at runtime) to verify that the patch was signed with the corresponding private key.

For increased security, Rollout's on-premise signing service allows enterprise customers to use their own public/private key pair instead of Rollout's own keys. This means that only the client can sign patches before they are pushed to live devices. This also gives the client full control over the approval process of releasing a patch to live devices.

> More about Rollout's security can be found [here](https://rollout.io/security/)

This project provides a reference implementation for the on-premise signing service that a client needs to install / implement in order to support signing patches with their own keys. The service should create an HTTP endpoint, accessible by Rollout servers. Rollout servers will send request with payload and response URL. The service will sign the payload and send back the signature to the response URL. Signed responses are validated and released to devices.

## Installation

### Install node
Download Nodejs from https://nodejs.org/en/download/ and install on your machine.

### Clone from git and install dependencies

Clone Rollout's sign service from the following git repository

 - `$ git clone https://github.com/rollout/onprem-private-key-reference-implementation.git`
 - `$ cd onprem-private-key-reference-implementation`
 - `$ npm install` to install all dependecies

## Quick start 
Start the signer service:

```bash
npm start
```

Verify the service responds by sending sign request to the service
 
```bash
node rollout/simulate_rollout_signing_request.js http://localhost:4000/rollout/sign ./keys/535110d5fb598c7a01635d108ab69e54/certificate.cert
```

OR

```bash
npm run simulate
```

The command creates sample Rollout configuration which is sent to a signing url with the given certificate.
You can use it with different signing service implementation by replacing the url and the certificate arguments.
Make sure to run this script only after the remote signining service is up and running.

## Test the signer service implementation

Run intergration tests (uses `mocha`)

```bash
npm test
```
 
## More on the Sign Service

The signer service will recieve the following JSON to be `POST`ed to `/rollout/sign` `HTTP` endpoint (the request is sent by Rollout servers)

```javascript
{
  "data": "", // The data to be signed by the service, it is a stringified JSON
  "certificateMd5": "535110d5fb598c7a01635d108ab69e54", // `md5` value generated of the certificate registered via Rollout dashboard. Ususally act as a key to the private key in a local map.
  "responseURL": "https://app.rollout.io/api/app-versions/:appId/signing_data/:transactionId" // The url which you should send the result too.
}
```

After receiving the request, the signer:

1. Verifies the incoming certificate `md5` points to existing key (reply with error if not)
2. Sign the payload on `data` with the private key that matches `md5` of the certificate in the request
3. Send response with the signed data by `POST`ing to the `responseURL` given in the request

## Creating and installing new private keys
### Installing new private keys

The reference implementation of the signer service looks for the private keys in the directory `keys`. The directory should contain a subdirectory which name is `md5` of the certificate associated with the private key. See example in the project structure.

### Creating new private key and certificate
Run the bash commands to create certificate and private key pairs using `openssl`. Place them in the right directory structure using `md5` command (available on mac)

## On Mac

 1. Create /tmp/certificate.cert and /tmp/private.pem by running

  ```bash
  openssl req  -nodes -new -x509  -keyout /tmp/private.pem -out /tmp/certificate.cert
  ```

 2. Answer the questions on the command prompt for generating the certificate.
 3. Save `md5` in a variable, by running

  ```bash
  certificate_md5=$(cat /tmp/certificate.cert | grep -v -- '-----BEGIN CERTIFICATE-----'  | grep -v -- '-----END CERTIFICATE-----' | tr -d '\n'| md5)
  echo $certificate_md5
  ```

 4. Create the `<project_dir>/keys/<md5>` folder

  ```bash
  mkdir ./keys/$certificate_md5
  ```

 5. Move certificate and private key into `<project_dir>/keys/<certificate_md5>` folder

  ```bash
  mv /tmp/private.pem /tmp/certificate.cert ./keys/$certificate_md5/
  ```

## On Linux 

1. Create /tmp/certificate.cert and /tmp/private.pem by running:

  ```bash
  openssl req  -nodes -new -x509  -keyout /tmp/private.pem -out /tmp/certificate.cert
  ```

2. Answer the questions on the command prompt for generating the certificate.

3. Save md5 in a variable, by running:

  ```bash
  certificate_md5=$(cat /tmp/certificate.cert | grep -v -- '-----BEGIN CERTIFICATE-----'  | grep -v -- '-----END CERTIFICATE-----' | tr -d '\n'|  md5sum  | awk '{print $1}')
  echo $certificate_md5
  ```

4. Create the `<project_dir>/keys/<md5>` folder

  ```bash
  mkdir ./keys/$certificate_md5
  ```

5. Move certificate and private key into `<project_dir>/keys/<certificate_md5>` folder

  ```bash
  mv /tmp/private.pem /tmp/certificate.cert ./keys/$certificate_md5/
  ```

When complete you should have private key in `private.pem` and certificate ready in `certificate.cert`
