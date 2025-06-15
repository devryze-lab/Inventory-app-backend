const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import and call cloudinary config
const connectCloudinary = require('./config/cloudinary');
connectCloudinary();

const app = express();

// CORS configuration (Allow all origins, basic headers)
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
const garagePartsRoute = require('./routes/garageParts');
const salesRoute = require('./routes/sales');
const adminsRoute = require('./routes/admins');

app.use('/api/garage-parts', garagePartsRoute);
app.use('/api/sales', salesRoute);
app.use('/api/admins', adminsRoute);

// Home Route
app.get('/', (req, res) => {
  res.send('Garage Inventory Backend API');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
