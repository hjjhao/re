const cheerio = require("cheerio");
const _ = require("lodash");

module.exports = {
  async crawl(content) {
    const $ = cheerio.load(content);
    let property = [];
    // updated here, get state and postcode from header instead of pass in params
    const stateAndPostcode = $("h1.results-heading").text().split(",")[1];
    let state;
    let postcode;
    if (stateAndPostcode) {
      state = stateAndPostcode.trim().split(" ")[0];
      postcode = stateAndPostcode.trim().split(" ")[1];
    }

    $(".tiered-results-container *[data-testid='ResidentialCard']").each(
      function (i, item) {
        const address = $(this)
          .find(".residential-card__details-link span")
          .first()
          .text();
        //   .split(",");
        const suburb = address.split(",")[address.split(",").length - 1].trim();
        // let unit;
        // let road;
        // if (
        //   address.split(",").length === 2 &&
        //   address.split(",")[0].split("/").length === 2
        // ) {
        //   unit = parseInt(address.split(",")[0].split("/")[0]);
        //   road = address.split(",")[0].split("/")[1];
        // } else {
        //   road = address.split(",")[0].split("/")[0];
        //   unit = 0;
        // }
        let road = address.split(",")[0].split("/")[0];
        if (!road) console.log(address);
        const price = $(this).find(".property-price").first().text();
        const bath = parseInt(
          $(this).find(".general-features__baths").first().text()
        );
        const bedroom = parseInt(
          $(this).find(".general-features__beds").first().text()
        );
        const parking = parseInt(
          $(this).find(".general-features__cars").first().text()
        );
        const land = $(this).find(".property-size__land").first().text().trim();
        const img = [$(this).find(".property-image__img").first().attr("src")];
        const propertyType = $(this)
          .find(".residential-card__property-type")
          .first()
          .text();
        const link =
          "https://www.realestate.com.au" +
          $(this)
            .find(".residential-card__address-heading a")
            .first()
            .attr("href");

        property.push(
          _.pickBy(
            {
              // unit,
              road,
              suburb,
              address,
              price,
              bedroom,
              bath,
              parking,
              land,
              img,
              propertyType,
              state,
              postcode,
              link,
            },
            _.identity
          )
        );
      }
    );
    return property;
  },
};
