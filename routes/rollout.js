/**
 * Created by kfirerez on 15/08/2016.
 */
'use strict';

const express = require('express');
const router = express.Router();

const Signer = require('../modules/Signer');

/* GET users listing. */
router.post('/sign', (req, res) => {
  let signer = new Signer(req);
  signer.verify()
    .then(signer.sign.bind(signer))
    .then(()=> {
      //Note that this response is not the signed data. Just response that the data was received and its valid
      res.status(200).send();
    })
    .catch( err => {
      err = err || new Error('Invalid data received');
      res.status(err.code || 400).send(err);
    })
    .done();
});

router.all('*', (req, res) => {
  res.status(403).send();
});

module.exports = router;
