const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initOverdueJob } = require('./jobs/overdueJob');

// Load environment variables from .env file (always relative to server.js)
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to Database
connectDB();

const app = express();

// ============================================
// Core Middlewares
// ============================================
// Enable Cross-Origin Resource Sharing (for React frontend)
app.use(cors());

// Parse incoming JSON payloads in request body
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve uploaded static files (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// API Routes
// ============================================
// Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'RentNest API is running smoothly!',
    version: '1.0.0',
  });
});

// Authentication routes (Register, Login, Me)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Category routes
const categoryRoutes = require('./routes/categoryRoutes');
app.use('/api/categories', categoryRoutes);

// Item routes
const itemRoutes = require('./routes/itemRoutes');
app.use('/api/items', itemRoutes);

// Rental lifecycle routes
const rentalRoutes = require('./routes/rentalRoutes');
app.use('/api/rentals', rentalRoutes);

// Deposit tracking routes
const depositRoutes = require('./routes/depositRoutes');
app.use('/api/deposits', depositRoutes);

// Review & rating routes
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

// Dispute handling routes
const disputeRoutes = require('./routes/disputeRoutes');
app.use('/api/disputes', disputeRoutes);

// Admin analytics & user management routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Cloud Database Seeding Route (One-click cloud database setup)
const seedData = require('./seeder');
app.get('/api/seed-database', async (req, res) => {
  try {
    const result = await seedData(false);
    return res.status(200).json({
      success: true,
      message: 'MongoDB Atlas Cloud Database seeded successfully!',
      data: result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// 404 Not Found Fallback Handler
// ============================================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot find route: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================
// Global Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 RentNest Server running on port ${PORT}`);
  console.log(`📡 Base URL: http://localhost:${PORT}`);

  // Initialize automated background overdue detection cron job
  initOverdueJob();
});
