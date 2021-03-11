var express = require("express");
var router = express.Router();
const helper = require("../helpers");

router.get("/", async function (req, res, next) {
  res.send("respond with a resource");
  const { search, type } = req.query;
  if (search && type) helper.action.crawlAction(req.app, search, type);
});

module.exports = router;
