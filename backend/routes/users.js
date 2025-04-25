const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const usersController = require('../controllers/usersController');

// Get all users (admin only)
router.get('/', authenticate, isAdmin, usersController.getUsers);

// Get user profile
router.get('/profile', authenticate, usersController.getUserProfile);

// Get a single user by ID (admin only)
router.get('/:id', authenticate, isAdmin, usersController.getUserById);

// Update user profile
router.put('/profile', authenticate, usersController.updateUserProfile);

// Update a user (admin only)
router.put('/:id', authenticate, isAdmin, usersController.updateUser);

// Change user role (admin only)
router.post('/:id/role', authenticate, isAdmin, usersController.changeUserRole);

// Assign user to department (admin only)
router.post('/:id/department', authenticate, isAdmin, usersController.assignUserToDepartment);

module.exports = router;
