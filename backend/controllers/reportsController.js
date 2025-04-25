const { db, admin, storage } = require('../firebase-admin');
const { generatePdf } = require('../utils/pdfGenerator');

// Get all reports (filtered by user access)
exports.getReports = async (req, res) => {
  try {
    let reportsRef = db.collection('reports');
    const { departmentId, year, status } = req.query;
    
    // Filter by department if specified
    if (departmentId) {
      reportsRef = reportsRef.where('departmentId', '==', departmentId);
    }
    
    // Filter by year if specified
    if (year) {
      reportsRef = reportsRef.where('year', '==', parseInt(year));
    }
    
    // Filter by status if specified
    if (status) {
      reportsRef = reportsRef.where('status', '==', status);
    }
    
    // Apply access control filters based on user role
    if (req.userData.role === 'faculty') {
      // Faculty can see only public reports
      reportsRef = reportsRef.where('isPublic', '==', true);
    } else if (req.userData.role === 'department_head' && req.userData.departmentId) {
      // Department head can see their department's reports or public reports
      if (!departmentId) {
        // If no department filter was applied, filter by user's department or public
        const publicReportsRef = db.collection('reports').where('isPublic', '==', true);
        const departmentReportsRef = db.collection('reports').where('departmentId', '==', req.userData.departmentId);
        
        // Execute both queries
        const [publicSnapshot, departmentSnapshot] = await Promise.all([
          publicReportsRef.get(),
          departmentReportsRef.get()
        ]);
        
        // Combine results
        const publicReports = publicSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const departmentReports = departmentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter out duplicates
        const combinedReports = [...departmentReports];
        publicReports.forEach(report => {
          if (!combinedReports.some(r => r.id === report.id)) {
            combinedReports.push(report);
          }
        });
        
        return res.json(combinedReports);
      }
    }
    // Admin can see all reports (no additional filter needed)
    
    const snapshot = await reportsRef.orderBy('createdAt', 'desc').get();
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
    }));
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Get a single report by ID
exports.getReportById = async (req, res) => {
  try {
    const reportDoc = await db.collection('reports').doc(req.params.id).get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const reportData = reportDoc.data();
    
    // Check access control
    if (req.userData.role === 'faculty' && !reportData.isPublic) {
      return res.status(403).json({ error: 'You do not have access to this report' });
    }
    
    if (req.userData.role === 'department_head' && 
        req.userData.departmentId !== reportData.departmentId && 
        !reportData.isPublic) {
      return res.status(403).json({ error: 'You do not have access to this report' });
    }
    
    // Get department info
    const departmentDoc = await db.collection('departments').doc(reportData.departmentId).get();
    
    res.json({
      id: reportDoc.id,
      ...reportData,
      createdAt: reportData.createdAt ? reportData.createdAt.toDate() : null,
      department: departmentDoc.exists ? {
        id: departmentDoc.id,
        ...departmentDoc.data()
      } : null
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { title, description, departmentId, year, isPublic } = req.body;
    
    // Validate request
    if (!title || !description || !departmentId || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if the department exists
    const departmentDoc = await db.collection('departments').doc(departmentId).get();
    if (!departmentDoc.exists) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Check if user has access to this department
    if (req.userData.role === 'department_head' && req.userData.departmentId !== departmentId) {
      return res.status(403).json({ error: 'You can only create reports for your department' });
    }
    
    // Create new report
    const reportData = {
      title,
      description,
      departmentId,
      year: parseInt(year),
      isPublic: isPublic !== undefined ? isPublic : true,
      uploadedBy: req.user.uid,
      uploaderName: req.userData.displayName || req.user.email,
      status: req.userData.role === 'admin' ? 'approved' : 'pending', // Auto-approve for admin
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('reports').add(reportData);
    
    res.status(201).json({
      id: docRef.id,
      ...reportData
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

// Update a report
exports.updateReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { title, description, isPublic } = req.body;
    
    // Get the report
    const reportDoc = await db.collection('reports').doc(reportId).get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const reportData = reportDoc.data();
    
    // Check if user has access to update this report
    if (req.userData.role === 'department_head' && req.userData.departmentId !== reportData.departmentId) {
      return res.status(403).json({ error: 'You can only update reports from your department' });
    }
    
    // Update the report
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('reports').doc(reportId).update(updateData);
    
    res.json({
      id: reportId,
      ...reportData,
      ...updateData
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

// Delete a report
exports.deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    
    // Get the report
    const reportDoc = await db.collection('reports').doc(reportId).get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const reportData = reportDoc.data();
    
    // Check if user has access to delete this report
    if (req.userData.role === 'department_head' && req.userData.departmentId !== reportData.departmentId) {
      return res.status(403).json({ error: 'You can only delete reports from your department' });
    }
    
    // Delete the report
    await db.collection('reports').doc(reportId).delete();
    
    // Delete associated file if exists
    if (reportData.fileUrl) {
      try {
        const fileUrl = new URL(reportData.fileUrl);
        const filePath = decodeURIComponent(fileUrl.pathname.split('/o/')[1].split('?')[0]);
        await storage.bucket().file(filePath).delete();
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue even if file deletion fails
      }
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};

// Generate PDF for a report
exports.generateReportPdf = async (req, res) => {
  try {
    const reportId = req.params.id;
    
    // Get the report
    const reportDoc = await db.collection('reports').doc(reportId).get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const reportData = reportDoc.data();
    
    // Check access control
    if (req.userData.role === 'faculty' && !reportData.isPublic) {
      return res.status(403).json({ error: 'You do not have access to this report' });
    }
    
    if (req.userData.role === 'department_head' && 
        req.userData.departmentId !== reportData.departmentId && 
        !reportData.isPublic) {
      return res.status(403).json({ error: 'You do not have access to this report' });
    }
    
    // Get department info
    const departmentDoc = await db.collection('departments').doc(reportData.departmentId).get();
    const departmentData = departmentDoc.exists ? departmentDoc.data() : { name: 'Unknown Department' };
    
    // Generate PDF
    const reportWithDepartment = {
      ...reportData,
      department: departmentData,
      id: reportId
    };
    
    const pdfBuffer = await generatePdf(reportWithDepartment);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.pdf"`);
    
    // Send the PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// Get reports by department
exports.getReportsByDepartment = async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Check if the department exists
    const departmentDoc = await db.collection('departments').doc(departmentId).get();
    if (!departmentDoc.exists) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Check access control for department head
    if (req.userData.role === 'department_head' && 
        req.userData.departmentId !== departmentId) {
      // Department heads can only see public reports of other departments
      const snapshot = await db.collection('reports')
        .where('departmentId', '==', departmentId)
        .where('isPublic', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
      }));
      
      return res.json(reports);
    }
    
    // For admin or department head of this department or faculty viewing public reports
    let reportsRef = db.collection('reports').where('departmentId', '==', departmentId);
    
    if (req.userData.role === 'faculty') {
      reportsRef = reportsRef.where('isPublic', '==', true);
    }
    
    const snapshot = await reportsRef.orderBy('createdAt', 'desc').get();
    
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
    }));
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching department reports:', error);
    res.status(500).json({ error: 'Failed to fetch department reports' });
  }
};

// Get reports by year
exports.getReportsByYear = async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    
    if (isNaN(year)) {
      return res.status(400).json({ error: 'Invalid year format' });
    }
    
    let reportsRef = db.collection('reports').where('year', '==', year);
    
    // Apply access control filters
    if (req.userData.role === 'faculty') {
      reportsRef = reportsRef.where('isPublic', '==', true);
    } else if (req.userData.role === 'department_head' && req.userData.departmentId) {
      // Department head gets their department reports or public reports
      const deptReportsSnapshot = await db.collection('reports')
        .where('year', '==', year)
        .where('departmentId', '==', req.userData.departmentId)
        .get();
      
      const publicReportsSnapshot = await db.collection('reports')
        .where('year', '==', year)
        .where('isPublic', '==', true)
        .get();
      
      // Combine results
      const deptReports = deptReportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
      }));
      
      const publicReports = publicReportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
      }));
      
      // Filter out duplicates
      const combinedReports = [...deptReports];
      publicReports.forEach(report => {
        if (!combinedReports.some(r => r.id === report.id)) {
          combinedReports.push(report);
        }
      });
      
      return res.json(combinedReports);
    }
    
    const snapshot = await reportsRef.orderBy('createdAt', 'desc').get();
    
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
    }));
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports by year:', error);
    res.status(500).json({ error: 'Failed to fetch reports by year' });
  }
};

// Approve a report (admin only)
exports.approveReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    
    // Get the report
    const reportDoc = await db.collection('reports').doc(reportId).get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Update the report status
    await db.collection('reports').doc(reportId).update({
      status: 'approved',
      approvedBy: req.user.uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ message: 'Report approved successfully' });
  } catch (error) {
    console.error('Error approving report:', error);
    res.status(500).json({ error: 'Failed to approve report' });
  }
};

// Reject a report (admin only)
exports.rejectReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { reason } = req.body;
    
    // Get the report
    const reportDoc = await db.collection('reports').doc(reportId).get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Update the report status
    await db.collection('reports').doc(reportId).update({
      status: 'rejected',
      rejectedBy: req.user.uid,
      rejectionReason: reason || 'No reason provided',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ message: 'Report rejected successfully' });
  } catch (error) {
    console.error('Error rejecting report:', error);
    res.status(500).json({ error: 'Failed to reject report' });
  }
};
