'use strict';

var express = require('express');
var router = express.Router();
var markdown = require('markdown-js');
var fs = require('fs');
var path = require('path');
var q = require('q');

var readme;
/**
 * Lending page for this tool that represent the README.md
 */
router.get('/', function(req, res, next) {
  let p = path.resolve('README.md');
  q.nfcall(fs.readFile, p, 'utf8')
    .then( content => {
      readme = markdown.makeHtml(content);
      res.send(readme);
    })
    .catch(err => {
      console.error(`Failed to read markdown located in: ${p}`);
      res.status(500).send('Failed to read README.md');
    })
    .done();
});

module.exports = router;
