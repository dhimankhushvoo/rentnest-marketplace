const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getAllUsers,
  updateUserRole,
  deleteUser,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes in this file are restricted to platform Admins only
router.use(protect, authorize('admin'));

// Analytics endpoint for charts & KPI cards
router.get('/analytics', getDashboardAnalytics);

// User management endpoints
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;

