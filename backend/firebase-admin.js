const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin with environment variables
const serviceAccount = {
  type: process.env.FIREBASE_TYPE || "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
  token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

// Fallback to app initialization without service account if values are missing
let adminApp;
try {
  if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
  } else {
    // Initialize with application default credentials
    adminApp = admin.initializeApp();
    console.warn('Initialized Firebase Admin with default credentials (may not work in production)');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  // Initialize with a minimal config to allow the server to start
  adminApp = admin.initializeApp();
}

const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

// User roles enum
const ROLES = {
  ADMIN: 'admin',
  DEPARTMENT_HEAD: 'department_head',
  FACULTY: 'faculty'
};

module.exports = {
  admin,
  auth,
  db,
  storage,
  ROLES
};
