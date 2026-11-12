const User = require('../models/User');
const Item = require('../models/Item');
const Rental = require('../models/Rental');
const Deposit = require('../models/Deposit');
const Dispute = require('../models/Dispute');
const Category = require('../models/Category');

/**
 * @desc    Get comprehensive analytics & aggregations for Admin Dashboard charts
 * @route   GET /api/admin/analytics
 * @access  Private (Admin only)
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    // 1. KPI Cards: Total Counts
    const [
      totalUsers,
      totalItems,
      totalRentals,
      totalDisputes,
      pendingDisputes,
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Rental.countDocuments(),
      Dispute.countDocuments(),
      Dispute.countDocuments({ status: { $in: ['Open', 'Under Review'] } }),
    ]);

    // 2. User Breakdown by Role
    const userRoleCounts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. Rental Status Breakdown (For Recharts Pie/Donut Chart)
    const rentalStatusBreakdown = await Rental.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // 4. Financial Statistics (Gross volume, penalties, deposits)
    const financialStats = await Rental.aggregate([
      {
        $group: {
          _id: null,
          totalRentalVolume: { $sum: '$totalAmount' },
          totalLatePenalties: { $sum: '$penaltyAmount' },
        },
      },
    ]);

    const depositStats = await Deposit.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          totalRefunded: { $sum: '$refundAmount' },
          totalDeducted: { $sum: '$deductedAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // 5. Items by Category (For Recharts Bar/Pie Chart)
    const itemsByCategory = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          itemCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      {
        $unwind: '$categoryDetails',
      },
      {
        $project: {
          categoryName: '$categoryDetails.name',
          itemCount: 1,
          _id: 0,
        },
      },
      {
        $sort: { itemCount: -1 },
      },
    ]);

    // 6. Monthly Rental Trends (Last 6 Months for Recharts Area/Line Chart)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrends = await Rental.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          rentalCount: { $sum: 1 },
          revenueVolume: { $sum: '$totalAmount' },
          penaltyVolume: { $sum: '$penaltyAmount' },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          rentalCount: 1,
          revenueVolume: 1,
          penaltyVolume: 1,
          _id: 0,
        },
      },
    ]);

    // Month names formatter for clean chart display
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const formattedMonthlyTrends = monthlyTrends.map((item) => ({
      label: `${monthNames[item.month - 1]} ${item.year}`,
      rentalCount: item.rentalCount,
      revenueVolume: item.revenueVolume,
      penaltyVolume: item.penaltyVolume,
    }));

    // 7. Recent Transactions (Activity Feed)
    const recentRentals = await Rental.find()
      .populate('item', 'title pricePerDay')
      .populate('renter', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      summary: {
        totalUsers,
        totalItems,
        totalRentals,
        totalDisputes,
        pendingDisputes,
        grossRentalVolume: financialStats[0]?.totalRentalVolume || 0,
        grossLatePenalties: financialStats[0]?.totalLatePenalties || 0,
      },
      charts: {
        userRoles: userRoleCounts,
        rentalStatus: rentalStatusBreakdown,
        itemsByCategory,
        monthlyTrends: formattedMonthlyTrends,
        depositStats,
      },
      recentRentals,
    });
  } catch (error) {
    console.error('Get Dashboard Analytics Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while calculating analytics',
    });
  }
};

/**
 * @desc    Get all users with search, role filter & pagination (Admin only)
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const { keyword, role, page = 1, limit = 10 } = req.query;

    const query = {};
    if (role) {
      query.role = role;
    }
    if (keyword && keyword.trim() !== '') {
      query.$or = [
        { name: { $regex: keyword.trim(), $options: 'i' } },
        { email: { $regex: keyword.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * pageSize;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      totalUsers,
      totalPages: Math.ceil(totalUsers / pageSize),
      currentPage: pageNum,
      users,
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
    });
  }
};

/**
 * @desc    Update a user's role (Admin only)
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['renter', 'owner', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be renter, owner, or admin',
      });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role updated to '${role}' successfully`,
      user,
    });
  } catch (error) {
    console.error('Update User Role Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating role',
    });
  }
};

/**
 * @desc    Delete a user account (Admin only)
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account',
      });
    }

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getAllUsers,
  updateUserRole,
  deleteUser,
};

