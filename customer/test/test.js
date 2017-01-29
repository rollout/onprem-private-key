/* global describe it */
'use strict';
const fs = require('fs');
const pem = require('pem');
const path = require('path');
const chai = require('chai');
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');

const app = require('../app');
const request = require('supertest')(app);
const publicCertificate = fs.readFileSync(path.join(__dirname, '../../keys/535110d5fb598c7a01635d108ab69e54/certificate.cert'));

const getPublicKeyFromCertificate = function (certificate) {
  return new Promise((resolve, reject) => {
    pem.getPublicKey(certificate, (error, result) => {
      if (error) return reject(error);
      resolve(result.publicKey);
    });
  });
};

const expect = chai.expect;
describe('Sign service', function () {
  it('Should respond with 404', function (done) {
    request
    .post('/rollout')
    .send({
      data: 'some',
      certificateMd5: 'some'
    })
    .expect(404, done);
  });

  it('Should respond with 400 - no data', function (done) {
    request
      .post('/rollout/sign')
      .send({
        certificateMd5: 'some',
        responseURL: 'some'
      })
      .expect(400, done);
  });

  it('Should respond with 400 - no certificateMd5', function (done) {
    request
      .post('/rollout/sign')
      .send({
        data: 'some',
        responseURL: 'some'
      })
      .expect(400, done);
  });

  it('Should respond with 400 - no responseURL', function (done) {
    request
      .post('/rollout/sign')
      .send({
        data: 'some',
        certificateMd5: 'some'
      })
      .expect(400, done);
  });

  it('Should return signed data to defined responseURL', function (done) {
    const PORT = 5555;
    const data = 'somedata';
    const certificateMd5 = '535110d5fb598c7a01635d108ab69e54';
    const responseURL = `http://localhost:${PORT}/testing`;
    const verifier = crypto.createVerify('sha256');
    verifier.update(data);

    express().use(bodyParser.json())
    .post('/testing', function (req, res) {
      getPublicKeyFromCertificate(publicCertificate)
          .then(publicKey => verifier.verify(publicKey, req.body.signature, 'base64'))
          .then(result => {
            expect(req.body.certificateMd5).to.equal(certificateMd5);
            expect(req.body.data).to.deep.equal(data);
            expect(result).to.be.true;
            done();
          })
          .catch(done);
    })
    .listen(5555, function () {
      request
      .post('/rollout/sign')
      .send({
        data,
        certificateMd5,
        responseURL
      })
      .end((err, res) => {}); // eslint-disable-line handle-callback-err
    });
  });
});
