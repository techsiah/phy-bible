/* Copy this file to firebase-config.js and paste your real Firebase web config.

   Firebase console → Project settings → Your apps → Web app → SDK setup.
   Enable Authentication → Sign-in method → Anonymous, and create a Firestore
   database. Then deploy the rules:

     firebase deploy --only firestore:rules

   The API key is public by design; firestore.rules is what protects data.
*/
window.FIREBASE_CONFIG = {
  apiKey: 'AIza...',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef123456'
};
