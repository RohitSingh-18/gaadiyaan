import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

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

// Modal elements
const modal = document.getElementById('forgotPasswordModal');
const modalClose = modal.querySelector('.modal-close');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const sendResetLink = document.getElementById('sendResetLink');
const resetEmail = document.getElementById('resetEmail');
const resetError = document.getElementById('resetError');
const resetSuccess = document.getElementById('resetSuccess');

// Show modal
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'block';
    resetEmail.value = '';
    resetError.style.display = 'none';
    resetSuccess.style.display = 'none';
});

// Close modal
modalClose.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Handle password reset
sendResetLink.addEventListener('click', async () => {
    const email = resetEmail.value;
    resetError.style.display = 'none';
    resetSuccess.style.display = 'none';
    
    if (!email) {
        resetError.textContent = 'Please enter your email address';
        resetError.style.display = 'block';
        return;
    }

    try {
        sendResetLink.disabled = true;
        sendResetLink.textContent = 'Sending...';
        
        await sendPasswordResetEmail(auth, email);
        
        resetSuccess.textContent = 'Password reset link sent! Check your email.';
        resetSuccess.style.display = 'block';
        
        // Close modal after 3 seconds
        setTimeout(() => {
            modal.style.display = 'none';
        }, 3000);
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send reset link. Please try again.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        }
        
        resetError.textContent = errorMessage;
        resetError.style.display = 'block';
    } finally {
        sendResetLink.disabled = false;
        sendResetLink.textContent = 'Send Reset Link';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Your existing Firebase login code here
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Set login state in localStorage
            localStorage.setItem('isLoggedIn', 'true');
            
            // Redirect to home page
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Login error:', error);
            document.getElementById('loginError').textContent = error.message;
            document.getElementById('loginError').style.display = 'block';
        }
    });
});