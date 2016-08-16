# Rollout On Premise Reference Implementation
## Installation

**Install node**
Download node.js from https://nodejs.org/en/download/ and install on your machine.

**Clone from git and install dependencies**
Clone Rollout's signer from the following git repository
 - `git clone myrepo`
 - `cd myrepo`
 - `npm install` to install all dependecies

### Runing from project root 
run:
**npm start**

## Testing
**npm test**

## More on the Signer
The project is a node.js project that use express as the web framework.
1. `npm start` is actually run app.js which initiate application variables and modules and start the server (in www/bin)
2. app.js register a router (entry point) for all requests that will be `http://<this domain>/rollout`
3. Entry point (in routes/rollout.js) 
4. Call for signing configuration send to `http://<this domain>/rollout/sign` with method=`POST` and body is: 
```json
{
      "data": {
       //Data that we like to sign with the private key
      },
      "certificateMd5": "d1ff47188bb9ffedd3572e8d2322bc7e", //md5 value generated from running md5 on the certificate registered on rollout dashboard. Ususally act as a key to the private key in a local map.
      "callback": "http://localhost:8090/" //The url which you should send the result too.
    }
```
5. Signer verify the incoming certificate md5 points to a valid public key (reply with error if not)
6. Signer sign the incoming data and send it to the callback given in the request.
