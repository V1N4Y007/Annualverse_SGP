const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isDepartmentHead } = require('../middleware/auth');
const reportsController = require('../controllers/reportsController');

// Get all reports (filtered by user access)
router.get('/', authenticate, reportsController.getReports);

// Get a single report by ID
router.get('/:id', authenticate, reportsController.getReportById);

// Create a new report
router.post('/', authenticate, isDepartmentHead, reportsController.createReport);

// Update a report
router.put('/:id', authenticate, isDepartmentHead, reportsController.updateReport);

// Delete a report
router.delete('/:id', authenticate, isDepartmentHead, reportsController.deleteReport);

// Generate PDF for a report
router.get('/:id/pdf', authenticate, reportsController.generateReportPdf);

// Get reports by department
router.get('/department/:departmentId', authenticate, reportsController.getReportsByDepartment);

// Get reports by year
router.get('/year/:year', authenticate, reportsController.getReportsByYear);

// Approve a report (admin only)
router.post('/:id/approve', authenticate, isAdmin, reportsController.approveReport);

// Reject a report (admin only)
router.post('/:id/reject', authenticate, isAdmin, reportsController.rejectReport);

module.exports = router;
