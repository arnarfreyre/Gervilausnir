// firebase-config.js
// Initialize Firebase (add this to your HTML before other scripts)
const firebaseConfig = {
  apiKey: "AIzaSyBd9oEmkAgT7pFJ9hGsKkVPAaQpPTxCiQs",
  authDomain: "platformer1-71780.firebaseapp.com",
  projectId: "platformer1-71780",
  storageBucket: "platformer1-71780.firebasestorage.app",
  messagingSenderId: "347667129808",
  appId: "1:347667129808:web:17d7c3560c7559d8d9c5d5",
  measurementId: "G-ZVQ7C2TL27"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

db.collection('test').add({
    message: 'Hello Firebase!',
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
})
.then((docRef) => {
    console.log('✅ Firebase connected successfully! Test document ID:', docRef.id);
    // Clean up test document
    docRef.delete();
})
.catch((error) => {
    console.error('❌ Firebase connection error:', error);
    console.error('Make sure Firestore is enabled in your Firebase project');
});