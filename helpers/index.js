const browser = require("./browser");
const mongoose = require("./mongoose");
const constants = require("./constants");

const action = require("./action");
const crawler = require('./crawler')
const webSocketService = require("./web-socket");

const helper = {
  browser,
  mongoose,
  constants,
  webSocketService,
  action,
  crawler
};

module.exports = helper;
