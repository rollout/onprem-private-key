/**
 * Created by kfirerez on 16/08/2016.
 */
'use strict';

const http = require('http');
const q = require('q');
const chai = require('chai');
const request = require('request');
const expect = chai.expect;
const NodeRSA = require('node-rsa');
const privateKeys = require('../modules/privateKeys');

/************************** Privates & Utils **************************/
var _handleRequest = function (headers, rawBody) {
  //Override this method for each response
  console.log(`headers: ${JSON.stringify(headers)}`);
  console.log(`body: ${rawBody}`);
}

var handleRequest = _handleRequest;

function createServer() {
  let server = http.createServer(function (req, res) {
    
    console.dir(req.param);
    
    switch (req.method) {
      case 'POST':
        console.log("POST");
        var body = '';
        req.on('data', function (data) {
          body += data;
        });
        req.on('end', function () {
          handleRequest(req.headers, body);
        });
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('post received');
        break;
      case 'GET':
        console.log("GET");
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('Request received successfully');
    }
  });
  
  server.listen(8090, '127.0.0.1');
  console.log('Listening at http://127.0.0.1:8090');
  
  return q.resolve(server);
}

/*********************** Tests *********************************/
describe('On premise signer reference implementation', function () {
  this.timeout(60000);
  
  before(function (done) {
    createServer()
      .then(function () {
        done();
      })
      .catch(function (err) {
        done(err);
      })
      .done();
  });
  
  afterEach(function () {
    handleRequest = _handleRequest;
  });
  
  it('expect remote signer to reply with valid signed object', function (done) {
    var certificateMd5 = "d1ff47188bb9ffedd3572e8d2322bc7e";
    var payloadData = {
      "one": 1,
      "two": 2
    };
    var nodeRSAInstance = new NodeRSA(privateKeys[certificateMd5].value, {
      environment: 'node',
      signingAlgorithm: 'sha256'
    });
  
    var localResponseHandler = function (headers, rawBody) {
      var body = JSON.parse(rawBody);
      expect(body.signature).to.be.defined;
      expect(body.certificateMd5).to.be.equal(certificateMd5);
      var signed = nodeRSAInstance.sign(payloadData, 'base64');
      expect(body.signature).to.be.equal(signed);
      done();
    };
    handleRequest = localResponseHandler;
    
    q.nfcall(request, {
      uri: 'http://localhost:4000/rollout/sign',
      method: 'POST',
      json: true,
      body: {
        "data": payloadData,
        "certificateMd5": certificateMd5,
        "responseURL": "http://localhost:8090/"
      }
    })
      .then(res => {
      })
      .catch(err => {
        console.error(err);
      })
      .done();
  });
  
  it('expect remote signer to reply with 403 certificateMd5 is not valid', function (done) {
    var certificateMd5 = "other";
    var payloadData = {
      "one": 1,
      "two": 2
    };
    
    q.nfcall(request, {
      uri: 'http://localhost:4000/rollout/sign',
      method: 'POST',
      json: true,
      body: {
        "data": payloadData,
        "certificateMd5": certificateMd5,
        "responseURL": "http://localhost:8090/"
      }
    })
      .then(res => {
        expect(res[0].statusCode).to.be.equal(403);
        done();
      })
      .catch(err => {
        console.error(`error: ${err}`);
        done(err);
      })
      .done();
  });
  
});