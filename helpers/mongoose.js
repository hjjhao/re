const mongoose = require("mongoose");
require("dotenv").config();

const options = { useNewUrlParser: true, useUnifiedTopology: true };

const propertySchema = mongoose.Schema(
  {
    unit: { type: Number, required: false },
    road: { type: String, required: false },
    suburb: { type: String, required: false },
    address: { type: String, require: true },
    state: { type: String, required: true },
    postcode: { type: Number, required: false },
    land: { type: String, required: false },
    propertyType: { type: String, required: false },
    link: { type: String, require: false },
    crawlerResults: [{ type: mongoose.Schema.Types.ObjectId, ref: "" }],
  },
  {
    timestamps: true,
  }
);

const propertyCrawlerSchema = mongoose.Schema(
  {
    unit: { type: Number, required: false },
    road: { type: String, required: false },
    suburb: { type: String, required: false },
    address: { type: String, require: true },
    state: { type: String, required: true },
    postcode: { type: Number, required: false },
    hiddenPrice: { type: [Number], required: true },
    price: { type: String, required: true },
    bath: { type: Number, required: false },
    bedroom: { type: Number, required: false },
    parking: { type: Number, required: false },
    land: { type: String, required: false },
    img: [{ type: String, required: false }],
    propertyType: { type: String, required: false },
    link: { type: String, require: false },
  },
  {
    timestamps: true,
  }
);
const crawlerModel = mongoose.model("Crawler", propertyCrawlerSchema);
const propertyModel = mongoose.model("Property", propertySchema);
// const Property = mongoose.model({});

module.exports = {
  connect() {
    mongoose.connect(process.env.DB, options);
    mongoose.connection.on("connected", () =>
      console.log("Successfully connect to DB")
    );
    mongoose.connection.on("error", () => {
      console.error("connection error");
    });
  },

  async updateProperty(property) {
    const propertyDoc = new crawlerModel(property);
    const result = await propertyDoc.save();
    const propertyInPropertyCollection = await propertyModel.findOne({
      address: property.address,
      state: property.state,
    });
    //   console.log(propertyInPropertyCollection);
    if (propertyInPropertyCollection) {
      //mongoose.model.updateMany must await
      await propertyModel.updateOne(
        {
          address: property.address,
          state: property.state,
        },
        { $push: { crawlerResults: mongoose.Types.ObjectId(result._id) } }
      );
      // console.log(test);
    } else {
      propertyModel.insertMany([
        {
          suburb: property.suburb,
          unit: property.unit,
          road: property.road,
          state: property.state,
          postcode: property.postcode,
          address: property.address,
          land: property.land,
          propertyType: property.propertyType,
          crawlerResults: [mongoose.Types.ObjectId(result._id)],
        },
      ]);
    }
  },
};
