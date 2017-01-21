'use strict';

const q = require('q');
const fs = require('fs');
const path = require('path');
const express = require('express');
// const markdown = require('markdown').markdown;
const ghm = require('github-flavored-markdown');
const handlebars = require('hbs').handlebars;
const rolloutRoutes = require('./rollout.route');

const router = express.Router();
const p = path.resolve(path.join(__dirname, '../../README.md'));
const layout = path.resolve(path.join(__dirname, '../views/layout.hbs'));

router.get('/', function (req, res) {
  let readme;

  q.nfcall(fs.readFile, p, 'utf8')
    .then(content => {
      readme = ghm.parse(content);
      return q.nfcall(fs.readFile, layout, 'utf8');
    })
    .then(layout => {
      var template = handlebars.compile(layout);
      res.send(template({
        body: readme,
        title: 'Rollout.io on-premise sign service README'
      }));
    })
    .catch(error => {
      console.error(`Failed to read markdown located in: ${p}`, error);
      res.status(500).send('Failed to read README.md');
    })
    .done();
});

// All requests with prefix 'http://<this domain>/rollout/' will route to module rolloutRoutes for further processing.
router.use('/rollout', rolloutRoutes);

module.exports = router;
