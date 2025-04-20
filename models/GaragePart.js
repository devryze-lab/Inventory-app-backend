const mongoose = require('mongoose');

const GaragePartSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  inventoryCount: { type: Number, default: 0 },
  retailPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  imageUrl: { type: String },
  sold: { type: Number, default: 0 }
});

module.exports = mongoose.model('GaragePart', GaragePartSchema);
