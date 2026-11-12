const fs = require('fs');
const path = require('path');
const Item = require('../models/Item');
const Category = require('../models/Category');

/**
 * @desc    Create a new rental item listing
 * @route   POST /api/items
 * @access  Private (Owner / Admin)
 */
const createItem = async (req, res) => {
  try {
    const { title, description, category, pricePerDay, depositAmount } = req.body;

    // 1. Validate required fields
    if (!title || !description || !category || pricePerDay === undefined || depositAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, category, pricePerDay, and depositAmount.',
      });
    }

    // 2. Validate that the specified category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'The selected category does not exist.',
      });
    }

    // 3. Process uploaded images (if any)
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => `/uploads/items/${file.filename}`);
    }

    // 4. Create Item document with logged-in user as owner
    const item = await Item.create({
      owner: req.user._id,
      category,
      title: title.trim(),
      description: description.trim(),
      images,
      pricePerDay: Number(pricePerDay),
      depositAmount: Number(depositAmount),
      isAvailable: true,
    });

    // Populate category & owner details for response
    await item.populate('category', 'name');
    await item.populate('owner', 'name email phone');

    return res.status(201).json({
      success: true,
      message: 'Item listed successfully for rental',
      item,
    });
  } catch (error) {
    console.error('Create Item Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating item listing',
    });
  }
};

/**
 * @desc    Get all items with search, category filter, price range & pagination
 * @route   GET /api/items
 * @access  Public
 */
const getAllItems = async (req, res) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      isAvailable,
      sort,
      page = 1,
      limit = 9,
    } = req.query;

    // Build dynamic MongoDB query filter
    const query = {};

    // 1. Search keyword in title or description (case-insensitive regex)
    if (keyword && keyword.trim() !== '') {
      query.$or = [
        { title: { $regex: keyword.trim(), $options: 'i' } },
        { description: { $regex: keyword.trim(), $options: 'i' } },
      ];
    }

    // 2. Category filter
    if (category) {
      query.category = category;
    }

    // 3. Price per day filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerDay = {};
      if (minPrice !== undefined && minPrice !== '') {
        query.pricePerDay.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        query.pricePerDay.$lte = Number(maxPrice);
      }
    }

    // 4. Availability filter
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    // 5. Sorting options
    let sortOption = { createdAt: -1 }; // default: newest first
    if (sort === 'price-asc') {
      sortOption = { pricePerDay: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { pricePerDay: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    // 6. Pagination calculation
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * pageSize;

    // Execute query with count
    const totalItems = await Item.countDocuments(query);
    const items = await Item.find(query)
      .populate('category', 'name')
      .populate('owner', 'name email phone')
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: pageNum,
      items,
    });
  } catch (error) {
    console.error('Get All Items Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching items',
    });
  }
};

/**
 * @desc    Get single item details by ID
 * @route   GET /api/items/:id
 * @access  Public
 */
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('category', 'name description')
      .populate('owner', 'name email phone address');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    return res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Get Item By ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching item details',
    });
  }
};

/**
 * @desc    Get all items listed by the currently logged-in Owner
 * @route   GET /api/items/my-items
 * @access  Private (Owner / Admin)
 */
const getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user._id })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error('Get My Items Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your items',
    });
  }
};

/**
 * @desc    Update item listing
 * @route   PUT /api/items/:id
 * @access  Private (Owner of the item / Admin)
 */
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Verify ownership or admin privileges
    if (
      item.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update this item',
      });
    }

    const {
      title,
      description,
      category,
      pricePerDay,
      depositAmount,
      isAvailable,
    } = req.body;

    if (title) item.title = title.trim();
    if (description) item.description = description.trim();
    if (category) item.category = category;
    if (pricePerDay !== undefined) item.pricePerDay = Number(pricePerDay);
    if (depositAmount !== undefined) item.depositAmount = Number(depositAmount);
    if (isAvailable !== undefined) item.isAvailable = isAvailable === 'true' || isAvailable === true;

    // Append new uploaded images if provided
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/items/${file.filename}`);
      item.images = [...item.images, ...newImages];
    }

    await item.save();
    await item.populate('category', 'name');
    await item.populate('owner', 'name email phone');

    return res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      item,
    });
  } catch (error) {
    console.error('Update Item Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating item',
    });
  }
};

/**
 * @desc    Delete item listing and remove its uploaded images
 * @route   DELETE /api/items/:id
 * @access  Private (Owner of the item / Admin)
 */
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Verify ownership or admin privileges
    if (
      item.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to delete this item',
      });
    }

    // Clean up associated image files from disk
    if (item.images && item.images.length > 0) {
      item.images.forEach((imgRelPath) => {
        const fullPath = path.join(__dirname, '..', imgRelPath);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (err) {
            console.error('Error deleting image file:', err.message);
          }
        }
      });
    }

    await item.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Item listing deleted successfully',
    });
  } catch (error) {
    console.error('Delete Item Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting item',
    });
  }
};

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  getMyItems,
  updateItem,
  deleteItem,
};

