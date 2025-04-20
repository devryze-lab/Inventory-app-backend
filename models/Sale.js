const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  partId: { type: mongoose.Schema.Types.ObjectId, ref: 'GaragePart', required: true },
  quantitySold: { type: Number, required: true, min: 1 },
  totalBill: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sale', SaleSchema);
