# Rollout On Premise Reference Implementation
## Installation

**Install node**
Download node.js from https://nodejs.org/en/download/ and install on your machine.

**Clone from git and install dependencies**
Clone Rollout's signer from the following git repository
 - `git clone https://github.com/rollout/node-rsa-signer.git`
 - `cd node-rsa-signer`
 - `npm install` to install all dependecies

### Runing from project root 
run:
**npm start**

## Testing
**npm test**

## More on the Signer
The project is a node.js project that use express as the web framework.

1. `npm start` is actually run app.js which initiate application variables and modules and start the server (in www/bin)
1. app.js register a router (entry point) for all requests that will be `http://<this domain>/rollout`
1. Entry point (in routes/rollout.js) 
1. Call for signing configuration send to `http://<this domain>/rollout/sign` with method=`POST` and body is: 

```json
{
  "data": {
   //Data that we like to sign with the private key
  },
  "certificateMd5": "d1ff47188bb9ffedd3572e8d2322bc7e", //md5 value generated from running md5 on the certificate registered on rollout dashboard. Ususally act as a key to the private key in a local map.
  "responseURL": "http://localhost:8090/" //The url which you should send the result too.
}
```

1. Signer verify the incoming certificate md5 points to a valid public key (reply with error if not)
1. Signer sign the incoming data and send it to the responseURL given in the request.

### Project structure
```c
|-- bin
|   `-- www // execution script
|-- modules
|   |-- privateKeys.js //  private key moddule data 
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
|-- README.md
|-- app.js // define application configurations and load the various middleware and routes
`-- package.json //  node dependencies test and start scripts
```
### Create private key and Certificate
You can create private key and certificate in one line using openssl

 - run the command: `openssl req  -nodes -new -x509  -keyout private_key.pem -out certificate.cert`
 - Answer the questions on the command prompt for generating the certificate.
 
On complete you should have private key in `private_key.pem` and certificate ready in `certificate.cert`
Please note that when loading certificate to Rollout dashboard you should omit the certificate header and footer (e.g. `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`)
