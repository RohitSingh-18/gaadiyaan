import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCwnuce6MccySFnJSpJO4XzAGzwY2wRTmE",
    authDomain: "gaadyaan.firebaseapp.com",
    projectId: "gaadyaan",
    storageBucket: "gaadyaan.firebasestorage.app",
    messagingSenderId: "525025701510",
    appId: "1:525025701510:web:f863fbe1e2cd2f4b986b07"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get form elements
const signupForm = document.querySelector('#signupForm');
const errorMessageDiv = document.querySelector('#errorMessage');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const buttonClicked = e.submitter;
    const role = buttonClicked.classList.contains('buyer-button') ? 'buyer' : 'dealer';
    const name = document.querySelector('input[type="text"]').value;
    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;
    const confirmPassword = document.querySelectorAll('input[type="password"]')[1].value;
    const termsChecked = document.querySelector('#terms').checked;

    // Clear previous errors
    errorMessageDiv.style.display = 'none';

    // Basic validation
    if (!termsChecked) {
        errorMessageDiv.textContent = 'Please agree to the Terms and Conditions';
        errorMessageDiv.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        errorMessageDiv.textContent = 'Passwords do not match';
        errorMessageDiv.style.display = 'block';
        return;
    }

    try {
        // Disable button and show loading state
        buttonClicked.disabled = true;
        buttonClicked.textContent = 'Creating Account...';

        // 1. Create auth user
        console.log('Creating auth user...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Auth user created:', user.uid);

        // 2. Create user document
        console.log('Creating user document...');
        const userData = {
            uid: user.uid,
            email: email,
            full_name: name,
            role: role,
            created_at: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', user.uid), userData);
        console.log('User document created');

        // 3. Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');

        // 4. Redirect
        const redirectPath = role === 'dealer' 
            ? '../dashboard/dealer/pages/portal.html' 
            : '../dashboard/client/user.html';
        
        window.location.href = redirectPath;

    } catch (error) {
        console.error('Signup error:', error);
        errorMessageDiv.textContent = error.message;
        errorMessageDiv.style.display = 'block';
        
        // Reset button
        buttonClicked.disabled = false;
        buttonClicked.textContent = role === 'buyer' ? 'I Am Buyer' : 'I Am Dealer';
    }
});

const handleSignupSuccess = async (userCredential) => {
    // Your existing signup success code
    
    // Set login state
    localStorage.setItem('isLoggedIn', 'true');
    
    // Redirect to home page
    window.location.href = '../index.html';
};