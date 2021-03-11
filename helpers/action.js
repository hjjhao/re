const browser = require("./browser");
const constants = require("./constants");
const mongoose = require("./mongoose");
const broadcast = require("./broadcast");
const moment = require("moment");

const crawlAction = async (app, searchKey, type) => {
  const startTime = moment();
  console.log(startTime);
  try {
    for (let item of constants.priceRange) {
      try {
        const properties = await browser.main({
          searchKey,
          type,
          min: item,
          max: item,
          clients: app.locals.clients,
        });

        await Promise.all(
          properties.map((result) => mongoose.updateProperty(result))
        );
        const msg = `write ${item} to DB successfully`;
        console.log(msg);
        broadcast.broadcast(app.locals.clients, msg);
      } catch (error) {
        console.error(error);
        broadcast.broadcast(app.locals.clients, error);
      }
    }
    const endTime = moment();

    const msg = `Mission completed use ${endTime.diff(
      startTime,
      "minutes",
      true
    )}`;
    console.log(msg);
    broadcast.broadcast(app.locals.clients, msg);
  } catch (error) {
    const endTime = moment();
    console.error(error);
    broadcast.broadcast(app.locals.clients, error);
  }
};

module.exports = {
  crawlAction,
};
