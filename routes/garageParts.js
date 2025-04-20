// routes/garageParts.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const GaragePart = require('../models/GaragePart');
const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST route
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, category, inventoryCount, retailPrice, sellingPrice, sold } = req.body;
    const newPart = new GaragePart({
      name, 
      category,
      inventoryCount, 
      retailPrice, 
      sellingPrice, 
      sold,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null
    });
    await newPart.save();
    res.status(201).json(newPart);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT route (update)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const updatedPart = await GaragePart.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    
    res.status(200).json(updatedPart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Keep other routes the same...

router.get('/', async (req, res) => {
  try {
    const parts = await GaragePart.find();
    res.status(200).json(parts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    await GaragePart.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Part deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
