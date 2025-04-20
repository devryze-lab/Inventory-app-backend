const express = require('express');
const Sale = require('../models/Sale');
const GaragePart = require('../models/GaragePart');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { partId, quantitySold, totalBill, date } = req.body;
    const part = await GaragePart.findById(partId);
    part.inventoryCount -= quantitySold;
    part.sold += quantitySold;
    await part.save();

    const newSale = new Sale({ partId, quantitySold, totalBill, date });
    await newSale.save();
    res.status(201).json(newSale);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().populate('partId');
    res.status(200).json(sales);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.delete('/:id', async (req, res) => {
    try {
      await Sale.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Sale deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  router.delete('/', async (req, res) => {
    try {
      await Sale.deleteMany({});
      res.status(200).json({ message: 'All sales deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
    

module.exports = router;
