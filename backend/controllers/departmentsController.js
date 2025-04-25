const { db, admin } = require('../firebase-admin');

// Get all departments
exports.getDepartments = async (req, res) => {
  try {
    const snapshot = await db.collection('departments').orderBy('name').get();
    const departments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Get a single department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const departmentDoc = await db.collection('departments').doc(req.params.id).get();
    
    if (!departmentDoc.exists) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Count reports in this department
    const reportsSnapshot = await db.collection('reports')
      .where('departmentId', '==', req.params.id)
      .get();
    
    // Count users in this department
    const usersSnapshot = await db.collection('users')
      .where('departmentId', '==', req.params.id)
      .get();
    
    res.json({
      id: departmentDoc.id,
      ...departmentDoc.data(),
      reportsCount: reportsSnapshot.size,
      usersCount: usersSnapshot.size
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

// Create a new department (admin only)
exports.createDepartment = async (req, res) => {
  try {
    const { name, description, code } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    // Check if a department with the same name or code already exists
    const existingDeptSnapshot = await db.collection('departments')
      .where('name', '==', name)
      .get();
    
    if (!existingDeptSnapshot.empty) {
      return res.status(400).json({ error: 'A department with this name already exists' });
    }
    
    if (code) {
      const existingCodeSnapshot = await db.collection('departments')
        .where('code', '==', code)
        .get();
      
      if (!existingCodeSnapshot.empty) {
        return res.status(400).json({ error: 'A department with this code already exists' });
      }
    }
    
    // Create new department
    const departmentData = {
      name,
      description: description || '',
      code: code || '',
      createdBy: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('departments').add(departmentData);
    
    res.status(201).json({
      id: docRef.id,
      ...departmentData
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

// Update a department (admin only)
exports.updateDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const { name, description, code } = req.body;
    
    // Check if department exists
    const departmentDoc = await db.collection('departments').doc(departmentId).get();
    
    if (!departmentDoc.exists) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // If name is being changed, check if the new name already exists
    if (name && name !== departmentDoc.data().name) {
      const existingDeptSnapshot = await db.collection('departments')
        .where('name', '==', name)
        .get();
      
      if (!existingDeptSnapshot.empty) {
        return res.status(400).json({ error: 'A department with this name already exists' });
      }
    }
    
    // If code is being changed, check if the new code already exists
    if (code && code !== departmentDoc.data().code) {
      const existingCodeSnapshot = await db.collection('departments')
        .where('code', '==', code)
        .get();
      
      if (!existingCodeSnapshot.empty) {
        return res.status(400).json({ error: 'A department with this code already exists' });
      }
    }
    
    // Update department
    const updateData = {};
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (code !== undefined) updateData.code = code;
    
    updateData.updatedBy = req.user.uid;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('departments').doc(departmentId).update(updateData);
    
    res.json({
      id: departmentId,
      ...departmentDoc.data(),
      ...updateData,
      message: 'Department updated successfully'
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

// Delete a department (admin only)
exports.deleteDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    // Check if department exists
    const departmentDoc = await db.collection('departments').doc(departmentId).get();
    
    if (!departmentDoc.exists) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Check if there are reports in this department
    const reportsSnapshot = await db.collection('reports')
      .where('departmentId', '==', departmentId)
      .limit(1)
      .get();
    
    if (!reportsSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Cannot delete department with existing reports. Please delete or reassign reports first.' 
      });
    }
    
    // Check if there are users in this department
    const usersSnapshot = await db.collection('users')
      .where('departmentId', '==', departmentId)
      .get();
    
    // Update users to remove department reference
    const batch = db.batch();
    usersSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        departmentId: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });
    });
    
    await batch.commit();
    
    // Now delete the department
    await db.collection('departments').doc(departmentId).delete();
    
    res.json({ 
      message: 'Department deleted successfully',
      usersUpdated: usersSnapshot.size
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

// Get reports for a department
exports.getDepartmentReports = async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    // Check if department exists
    const departmentDoc = await db.collection('departments').doc(departmentId).get();
    
    if (!departmentDoc.exists) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Apply access control based on user role
    let reportsRef = db.collection('reports').where('departmentId', '==', departmentId);
    
    if (req.userData.role === 'faculty') {
      // Faculty can only see public reports
      reportsRef = reportsRef.where('isPublic', '==', true);
    } else if (req.userData.role === 'department_head' && req.userData.departmentId !== departmentId) {
      // Department heads of other departments can only see public reports
      reportsRef = reportsRef.where('isPublic', '==', true);
    }
    
    const snapshot = await reportsRef.orderBy('createdAt', 'desc').get();
    
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
    }));
    
    res.json({
      department: {
        id: departmentId,
        ...departmentDoc.data()
      },
      reports
    });
  } catch (error) {
    console.error('Error fetching department reports:', error);
    res.status(500).json({ error: 'Failed to fetch department reports' });
  }
};

// Get users in a department
exports.getDepartmentUsers = async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    // Check if department exists
    const departmentDoc = await db.collection('departments').doc(departmentId).get();
    
    if (!departmentDoc.exists) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Check permission - department heads should only access their own department's users
    if (req.userData.role === 'department_head' && req.userData.departmentId !== departmentId) {
      return res.status(403).json({ error: 'You do not have permission to view users from this department' });
    }
    
    const snapshot = await db.collection('users')
      .where('departmentId', '==', departmentId)
      .get();
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
    }));
    
    res.json({
      department: {
        id: departmentId,
        ...departmentDoc.data()
      },
      users
    });
  } catch (error) {
    console.error('Error fetching department users:', error);
    res.status(500).json({ error: 'Failed to fetch department users' });
  }
};
