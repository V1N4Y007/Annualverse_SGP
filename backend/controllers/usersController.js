const { db, admin, ROLES } = require('../firebase-admin');

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    const userData = userDoc.data();
    
    // Get department info if user has one
    let departmentData = null;
    if (userData.departmentId) {
      const departmentDoc = await db.collection('departments').doc(userData.departmentId).get();
      if (departmentDoc.exists) {
        departmentData = {
          id: departmentDoc.id,
          ...departmentDoc.data()
        };
      }
    }
    
    res.json({
      id: userDoc.id,
      ...userData,
      department: departmentData,
      createdAt: userData.createdAt ? userData.createdAt.toDate() : null
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// Get a single user by ID (admin only)
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Get department info if user has one
    let departmentData = null;
    if (userData.departmentId) {
      const departmentDoc = await db.collection('departments').doc(userData.departmentId).get();
      if (departmentDoc.exists) {
        departmentData = {
          id: departmentDoc.id,
          ...departmentDoc.data()
        };
      }
    }
    
    // Get reports uploaded by this user
    const reportsSnapshot = await db.collection('reports')
      .where('uploadedBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    const recentReports = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
    }));
    
    res.json({
      id: userDoc.id,
      ...userData,
      department: departmentData,
      recentReports,
      createdAt: userData.createdAt ? userData.createdAt.toDate() : null
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { displayName, departmentId } = req.body;
    const userRef = db.collection('users').doc(req.user.uid);
    
    // Validate department if provided
    if (departmentId) {
      const departmentDoc = await db.collection('departments').doc(departmentId).get();
      if (!departmentDoc.exists) {
        return res.status(404).json({ error: 'Department not found' });
      }
    }
    
    // Update user data
    const updateData = {};
    
    if (displayName) {
      updateData.displayName = displayName;
      
      // Also update the displayName in Firebase Auth
      await admin.auth().updateUser(req.user.uid, { displayName });
    }
    
    if (departmentId !== undefined) {
      updateData.departmentId = departmentId || null;
    }
    
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await userRef.update(updateData);
    
    // Get updated user data
    const updatedUserDoc = await userRef.get();
    
    res.json({
      id: updatedUserDoc.id,
      ...updatedUserDoc.data(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
};

// Update a user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { displayName, email, role, departmentId, isActive } = req.body;
    
    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate department if provided
    if (departmentId) {
      const departmentDoc = await db.collection('departments').doc(departmentId).get();
      if (!departmentDoc.exists) {
        return res.status(404).json({ error: 'Department not found' });
      }
    }
    
    // Validate role if provided
    if (role && !Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Update user data in Firestore
    const updateData = {};
    
    if (displayName) updateData.displayName = displayName;
    if (role) updateData.role = role;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    updateData.updatedBy = req.user.uid;
    
    await db.collection('users').doc(userId).update(updateData);
    
    // Update user in Firebase Auth if needed
    if (displayName || email) {
      const authUpdateData = {};
      if (displayName) authUpdateData.displayName = displayName;
      if (email) authUpdateData.email = email;
      
      await admin.auth().updateUser(userId, authUpdateData);
    }
    
    res.json({
      id: userId,
      ...userDoc.data(),
      ...updateData,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Change user role (admin only)
exports.changeUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    if (!role || !Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user role
    await db.collection('users').doc(userId).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid
    });
    
    res.json({
      id: userId,
      role,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({ error: 'Failed to change user role' });
  }
};

// Assign user to department (admin only)
exports.assignUserToDepartment = async (req, res) => {
  try {
    const userId = req.params.id;
    const { departmentId } = req.body;
    
    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate department if provided
    if (departmentId) {
      const departmentDoc = await db.collection('departments').doc(departmentId).get();
      if (!departmentDoc.exists) {
        return res.status(404).json({ error: 'Department not found' });
      }
    }
    
    // Update user's department
    await db.collection('users').doc(userId).update({
      departmentId: departmentId || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid
    });
    
    res.json({
      id: userId,
      departmentId: departmentId || null,
      message: departmentId ? 'User assigned to department' : 'User removed from department'
    });
  } catch (error) {
    console.error('Error assigning user to department:', error);
    res.status(500).json({ error: 'Failed to assign user to department' });
  }
};
