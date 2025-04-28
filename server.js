const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const app = express();

// Add this before your routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const garagePartsRoute = require('./routes/garageParts');
const salesRoute = require('./routes/sales');
const adminsRoute = require('./routes/admins');

app.use('/api/garage-parts', garagePartsRoute);
app.use('/api/sales', salesRoute);
app.use('/api/admins', adminsRoute);


app.get('/', (req, res) => {
  res.send('Garage Inventory Backend API');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
