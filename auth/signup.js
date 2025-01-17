import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCwnuce6MccySFnJSpJO4XzAGzwY2wRTmE",
    authDomain: "gaadyaan.firebaseapp.com",
    databaseURL: "https://gaadyaan-default-rtdb.firebaseio.com",
    projectId: "gaadyaan",
    storageBucket: "gaadyaan.firebasestorage.app",
    messagingSenderId: "525025701510",
    appId: "1:525025701510:web:f863fbe1e2cd2f4b986b07"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Add initialization checks
console.log("Firebase App initialized:", app.name);
console.log("Firestore initialized:", db ? "Yes" : "No");

// Get DOM elements
const signupForm = document.getElementById('signupForm');
const buyerBtn = document.getElementById('buyerBtn');
const dealerBtn = document.getElementById('dealerBtn');
const errorMessage = document.getElementById('errorMessage');
const verificationMessage = document.getElementById('verificationMessage');

// Function to handle user registration
async function registerUser(userType) {
    console.log("Starting registration for userType:", userType);
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    // Form validation
    if (!name || !email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }

    if (!terms) {
        showError('Please accept the terms and conditions');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        console.log("Creating authentication user...");
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Auth user created successfully:", user.uid);

        // Send verification email
        await sendEmailVerification(user);
        console.log("Verification email sent");

        // Store additional user data in Firestore
        const userData = {
            name: name,
            email: email,
            userType: userType,
            createdAt: new Date().toISOString(),
            emailVerified: false
        };

        console.log("Attempting to create Firestore document for user:", user.uid);
        try {
            const userDocRef = doc(db, "users", user.uid);
            console.log("Document reference created:", userDocRef.path);
            await setDoc(userDocRef, userData);
            console.log("Firestore document created successfully");
        } catch (firestoreError) {
            console.error("Firestore Error Details:", {
                code: firestoreError.code,
                message: firestoreError.message,
                stack: firestoreError.stack
            });
            showError("Account created but profile setup failed. Please contact support.");
            throw firestoreError;
        }

        // Clear any existing user data from localStorage
        localStorage.clear();

        // Show verification message and hide form
        signupForm.classList.add('hide-form');
        verificationMessage.style.display = 'block';
        errorMessage.style.display = 'none';

    } catch (error) {
        console.error("Signup Error:", error);
        let errorMsg = 'An error occurred during registration';
        if (error.code === 'auth/email-already-in-use') {
            errorMsg = 'This email is already registered';
        } else if (error.code === 'auth/weak-password') {
            errorMsg = 'Password should be at least 6 characters';
        }
        showError(errorMsg);
    }
}

// Function to show error messages
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Event listeners for buttons
buyerBtn.addEventListener('click', () => registerUser('buyer'));
dealerBtn.addEventListener('click', () => registerUser('dealer'));