# Rollout On Premise Reference Implementation
## Overview 
Rollout's patching process for live native iOS apps involves downloading patches from the cloud to mobile devices. To ensure the authenticity of patches Rollout incorporates a security mechanism which is built upon asymmetric key pairs (private / public keys). Rollout's SDK is bundled with a certificate that contains a public key (which is extracted at runtime) to verify that the patch was signed with the corresponding private key.

For increased security, Rollout's on-premise private key feature allows enterprise customers to use their own public/private key pair instead of Rollout's own keys. This means only the client can sign patches before they are pushed to live devices. This also gives the client full control over the approval process of releasing a patch to live devices.

More about Rollout's security can be found here: https://rollout.io/security/

This project provides a reference implementation for the on-premise signing service a client needs to install to support signing patches with their own keys. It creates an endpoint for responding to a request from Rollout's servers to sign a patch and release it to production.

## Installation

**Install node**
Download node.js from https://nodejs.org/en/download/ and install on your machine.

**Clone from git and install dependencies**
Clone Rollout's signer from the following git repository
 - `git clone https://github.com/rollout/onprem-private-key-reference-implementation.git`
 - `cd onprem-private-key-reference-implementation`
 - `npm install` to install all dependecies

### Quick start 
  Run customer signer:

```bash 
$ npm start
```
  Runs Rollout's customer code which is the signing remote service
 
```bash 
$ node rollout/simulate_rollout_signing_request.js http://localhost:4000/rollout/sign ./keys/535110d5fb598c7a01635d108ab69e54/certificate.cert // or npm run simulate
```

 Runs Rollout's mock which send sample configuration to remote signing url with the given certificate. 
 You can use it with different signing service implementation by replacing the url and the certificate arguments.
 Make sure to run this script only after the remote signining service is up and running.

  Test customer code
```bash
$ npm test
```
 Test the signing service (e.g. the customer part pf the service)
 
## More on the Signer
The project is a node.js project that use express as the web framework.

1. `npm start` is actually run customer/app.js which initiate application variables and modules and start the server (in customer/www/bin)
1. customer/app.js register a router (entry point) for all requests that will start with `http://<this domain>/rollout`
1. Entry point (in customer/routes/rollout.js) 
1. Call for signing configuration send to `http://<this domain>/rollout/sign` with method=`POST` and body is: 

```json
{
  "data": {
   //Data that we like to sign with the private key
  },
  "certificateMd5": "535110d5fb598c7a01635d108ab69e54", //md5 value generated from running md5 on the certificate registered on rollout dashboard. Ususally act as a key to the private key in a local map.
  "responseURL": "http://localhost:3000/api/app-versions/:appId/signing_data/:transactionId" //The url which you should send the result too.
}
```

1. Signer verify the incoming certificate md5 points to a valid public key (reply with error if not)
1. Signer sign the incoming data and send it to the responseURL given in the request.

``Note:`` 
In case you just want to test the result of your signed data sent to mocked rollout server you may provide the following responseUrl:
`http://<this domain>/rollout/dummyRollout/app-versions/:appId/signing_data/:transactionId` with method=`POST` and body as you expect to send to rollout.
 `:appId` and `:transactionId` are provided by rollout (and you may provide them with arbitrary values).
 The result (with this endpoint) will be shown on the console.

### Project structure
```c
|-- customer
    |-- bin
    |   `-- www // execution script
    |-- modules
    |   `-- signer.js //  sign configurations accorind to the information it gets from the request.
    |-- public
    |   `-- stylesheets
    |       `-- style.css 
    |-- routes
    |   |-- index.js // registers handler for showing the markup file on route /
    |   `-- rollout.js // register handler that sign data and send back to responseURL on route /sign
    |-- test
    |   |-- res
    |   |   |-- certificateMd5 
    |   |   |-- server.cert
    |   |   `-- server.pem
    |   `-- test.js
    |-- views 
    |   |-- error.hbs
    |   |-- index.hbs
    |   `-- layout.hbs
    |-- app.js // define application configurations and load the various middleware and routes
|-- keys
    |-- 535110d5fb598c7a01635d108ab69e54 //Certificate md5 - Folder holding corresponded certificate, private and public keys. Generated by `md5 certificate.cert` 
        |-- certificate.cert // certificate generated using `openssl req  -nodes -new -x509  -keyout private.key -out certificate.cert`
        |-- private.pem // private key generated using `openssl req  -nodes -new -x509  -keyout private.key -out certificate.cert`
        |-- public.pem // public key generated using `openssl x509 -inform pem -in certificate.cert -pubkey -noout > public.pem`
|-- node_modules //Node.js dependency libraries
|-- rollout //Mock which mimics rollout behaviour
    |-- hotPatch.js // Return an sample hot patch
    |-- RolloutMock.js // The class which do the logic of mimics Rollout.
    |-- simulate_rollout_signing_requet.js // Main controller that initiate rollout's mock
|-- README.md // This file
`-- package.json //  node dependencies test and start scripts
```
### Create private key and Certificate
You can create private key and certificate in one line using openssl

 - run the command: 

```bash
#1 Create /tmp/certificate.cert and /tmp/private.pem by running:
openssl req  -nodes -new -x509  -keyout /tmp/private.pem -out /tmp/certificate.cert
#2 Answer the questions on the command prompt for generating the certificate.
#3 save md5 in a variable, by running:
certificate_md5=$(cat /tmp/certificate.cert | grep -v -- '-----BEGIN CERTIFICATE-----'  | grep -v -- '-----END CERTIFICATE-----' | tr -d '\n'| md5)
echo $certificate_md5
#4 Create the <project_dir>/keys/<md5> folder
mkdir ./keys/$certificate_md5
#5 Move certificate and private key into <project_dir>/keys/<certificate_md5> folder
mv /tmp/private.pem /tmp/certificate.cert ./keys/$certificate_md5/
```
On complete you should have private key in `private.pem` and certificate ready in `certificate.cert`
