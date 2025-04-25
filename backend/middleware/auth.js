const { admin, auth, db, ROLES } = require('../firebase-admin');

/**
 * Middleware to authenticate requests with Firebase ID tokens
 */
const authenticate = async (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  // Extract the token
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Set the user on the request
    req.user = decodedToken;
    
    // Get additional user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (userDoc.exists) {
      req.userData = userDoc.data();
      req.userData.role = req.userData.role || ROLES.FACULTY; // Default role
    } else {
      // Create a user document if it doesn't exist
      const newUserData = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || '',
        role: ROLES.FACULTY, // Default role
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('users').doc(decodedToken.uid).set(newUserData);
      req.userData = newUserData;
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Middleware to check if user has admin role
 */
const isAdmin = (req, res, next) => {
  if (!req.userData || req.userData.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

/**
 * Middleware to check if user has department head role
 */
const isDepartmentHead = (req, res, next) => {
  if (!req.userData || (req.userData.role !== ROLES.DEPARTMENT_HEAD && req.userData.role !== ROLES.ADMIN)) {
    return res.status(403).json({ error: 'Forbidden: Department Head access required' });
  }
  next();
};

/**
 * Middleware to check if user has access to specific department
 */
const hasDepartmentAccess = (req, res, next) => {
  const departmentId = req.params.departmentId || req.body.departmentId;
  
  if (!departmentId) {
    return res.status(400).json({ error: 'Department ID is required' });
  }
  
  // Admin has access to all departments
  if (req.userData.role === ROLES.ADMIN) {
    return next();
  }
  
  // Department head has access to their department
  if (req.userData.role === ROLES.DEPARTMENT_HEAD && req.userData.departmentId === departmentId) {
    return next();
  }
  
  return res.status(403).json({ error: 'Forbidden: You do not have access to this department' });
};

module.exports = {
  authenticate,
  isAdmin,
  isDepartmentHead,
  hasDepartmentAccess
};
