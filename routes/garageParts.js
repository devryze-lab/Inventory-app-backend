const fs = require('fs');
const { promisify } = require('util');
const cloudinary = require('cloudinary').v2;
const express = require('express');
const multer = require('multer');
const GaragePart = require('../models/GaragePart');
const router = express.Router();

const unlinkAsync = promisify(fs.unlink);

const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
});

const upload = multer({ storage });


function extractPublicId(cloudinaryUrl) {
  try {

    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return null;
    

    let pathAfterUpload = urlParts.slice(uploadIndex + 1);
    
    if (pathAfterUpload[0] && pathAfterUpload[0].match(/^v\d+$/)) {
      pathAfterUpload = pathAfterUpload.slice(1);
    }
    
    const fullPath = pathAfterUpload.join('/');
    const publicId = fullPath.replace(/\.[^/.]+$/, '');
    
    console.log('Extracted public ID:', publicId);
    return publicId;
  } catch (error) {
    console.log('Error extracting public ID:', error);
    return null;
  }
}


async function safeDeleteCloudinaryImage(imageUrl, excludePartId = null) {
  if (!imageUrl) {
    return { deleted: false, reason: 'no_image_url' };
  }
  try {

    const query = { imageUrl: imageUrl };
    if (excludePartId) {
      query._id = { $ne: excludePartId };
    }
    
    const imageUsageCount = await GaragePart.countDocuments(query);
    
    if (imageUsageCount > 0) {
      console.log(`Image still used by ${imageUsageCount} other parts, skipping deletion:`, imageUrl);
      return { deleted: false, reason: 'still_in_use', usageCount: imageUsageCount };
    }
    
    const publicId = extractPublicId(imageUrl);
    if (!publicId) {
      console.log('❌ Could not extract public ID from URL:', imageUrl);
      return { deleted: false, reason: 'invalid_url' };
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️  Cloudinary deletion attempt for:', publicId);
    console.log('📋 Full Cloudinary response:', JSON.stringify(result, null, 2));
    
    if (result.result === 'ok') {
      console.log('✅ Image successfully deleted from Cloudinary:', publicId);
      return { deleted: true, publicId, result };
    } else if (result.result === 'not found') {
      console.log('⚠️ Image not found in Cloudinary (already deleted?):', publicId);
      return { deleted: false, reason: 'not_found', publicId, result };
    } else {
      console.log('❌ Cloudinary deletion failed:', result);
      return { deleted: false, reason: 'cloudinary_error', publicId, result };
    }
    
  } catch (error) {
    console.log('❌ Error deleting image from Cloudinary:', error.message);
    return { deleted: false, reason: 'error', error: error.message };
  }
}

// POST route
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, category, inventoryCount, retailPrice, sellingPrice, sold } = req.body;
    let image = null;
    
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'image',
          folder: 'garage_parts'
        });
        image = result.secure_url;
        
        await unlinkAsync(req.file.path);
      } catch (uploadError) {
        await unlinkAsync(req.file.path);
        throw uploadError;
      }
    }
    
    const newPart = new GaragePart({
      name, 
      category,
      inventoryCount, 
      retailPrice, 
      sellingPrice, 
      sold,
      imageUrl: image
    });
    
    await newPart.save();
    res.status(201).json(newPart);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT route
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    const existingPart = await GaragePart.findById(req.params.id);
    if (!existingPart) {
      return res.status(404).json({ error: 'Part not found' });
    }
    
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'image',
          folder: 'garage_parts'
        });
        updateData.imageUrl = result.secure_url;
        
        await unlinkAsync(req.file.path);
        
        // Safely delete old image (only if not used by other parts)
        if (existingPart.imageUrl) {
          const deleteResult = await safeDeleteCloudinaryImage(existingPart.imageUrl, req.params.id);
          console.log('Old image deletion result:', deleteResult);
        }
        
      } catch (uploadError) {
        await unlinkAsync(req.file.path);
        throw uploadError;
      }
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

// GET route
router.get('/', async (req, res) => {
  try {
    const parts = await GaragePart.find();
    res.status(200).json(parts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE route - Properly deletes card AND image
router.delete('/:id', async (req, res) => {
  try {
    const part = await GaragePart.findById(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }
    
    console.log(`🗑️ Deleting part: ${part.name} (ID: ${req.params.id})`);
    
    // Delete the part from database first
    await GaragePart.findByIdAndDelete(req.params.id);
    console.log('✅ Part deleted from database');
    
    // Then safely delete the image from Cloudinary (with reference check)
    if (part.imageUrl) {
      console.log(`🖼️ Attempting to delete image: ${part.imageUrl}`);
      const deleteResult = await safeDeleteCloudinaryImage(part.imageUrl);
      
      // deleteResult is now guaranteed to be an object with 'deleted' property
      if (deleteResult && deleteResult.deleted) {
        console.log('✅ Image successfully deleted from Cloudinary');
      } else {
        console.log(`⚠️ Image not deleted: ${deleteResult ? deleteResult.reason : 'unknown error'}`);
      }
    } else {
      console.log('ℹ️ No image to delete for this part');
    }
    
    res.status(200).json({ 
      message: 'Part deleted successfully',
      imageDeleted: part.imageUrl ? true : false
    });
  } catch (error) {
    console.log('❌ Error deleting part:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;