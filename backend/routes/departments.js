const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const departmentsController = require('../controllers/departmentsController');

// Get all departments
router.get('/', authenticate, departmentsController.getDepartments);

// Get a single department by ID
router.get('/:id', authenticate, departmentsController.getDepartmentById);

// Create a new department (admin only)
router.post('/', authenticate, isAdmin, departmentsController.createDepartment);

// Update a department (admin only)
router.put('/:id', authenticate, isAdmin, departmentsController.updateDepartment);

// Delete a department (admin only)
router.delete('/:id', authenticate, isAdmin, departmentsController.deleteDepartment);

// Get reports for a department
router.get('/:id/reports', authenticate, departmentsController.getDepartmentReports);

// Get users in a department
router.get('/:id/users', authenticate, departmentsController.getDepartmentUsers);

module.exports = router;
