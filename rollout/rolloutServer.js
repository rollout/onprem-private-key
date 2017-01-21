const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const app = express()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }));

module.exports = {
  init: function (deps) {
    const { handleSignerResponse } = deps;
    return Promise.resolve(app.post(config.RESPONSE_ENDPOINT, handleSignerResponse));
  },
  start: function () {
    return new Promise((resolve, reject) => app.listen(config.PORT, () => {
      console.log('* Waiting for response from signing service on', config.RESPONSE_ENDPOINT);
      resolve(app);
    }));
  }
};
