const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema for RentNest
 * Represents all platform actors: Renters, Owners, and Admins.
 * Simple structure that easily maps to an ER diagram entity.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: {
        values: ['renter', 'owner', 'admin'],
        message: '{VALUE} is not a valid role. Allowed: renter, owner, admin',
      },
      default: 'renter',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

/**
 * Mongoose Pre-save Hook:
 * Automatically runs before saving a User document.
 * Hashes plain-text password using bcrypt with a salt factor of 10.
 * Only runs if the password field was modified (or newly created).
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance Method:
 * Compares incoming plain-text password with hashed password in database.
 * Returns true if matching, false otherwise.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Clean JSON representation:
 * Ensures the password hash is NEVER accidentally sent back in API responses.
 */
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
