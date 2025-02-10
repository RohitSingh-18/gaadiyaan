import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore,
    getDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Initialize Firebase with your config
const firebaseConfig = {
    apiKey: "AIzaSyCwnuce6MccySFnJSpJO4XzAGzwY2wRTmE",
    authDomain: "gaadyaan.firebaseapp.com",
    databaseURL: "https://gaadyaan-default-rtdb.firebaseio.com",
    projectId: "gaadyaan",
    storageBucket: "gaadyaan.firebasestorage.app",
    messagingSenderId: "525025701510",
    appId: "1:525025701510:web:f863fbe1e2cd2f4b986b07"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const verificationRequired = document.getElementById('verificationRequired');
const resendVerification = document.getElementById('resendVerification');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Clear any existing data
        localStorage.clear();
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            loginError.style.display = 'none';
            verificationRequired.style.display = 'block';
            return;
        }

        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        // Store essential user data in localStorage
        const userProfile = {
            uid: user.uid,
            email: user.email,
            name: userData.name,
            userType: userData.userType
        };

        // If user is a dealer, fetch additional info from MySQL
        if (userData.userType === 'dealer') {
            try {
                const response = await fetch(`https://gaadiyaan-api-x18f.onrender.com/api/users/dealer/${encodeURIComponent(user.email)}`);
                const dealerData = await response.json();
                
                if (dealerData.success && dealerData.dealer) {
                    // Merge dealer info with user profile
                    Object.assign(userProfile, {
                        dealer_id: dealerData.dealer.dealer_id,
                        dealership_name: dealerData.dealer.dealership_name,
                        phone: dealerData.dealer.phone
                    });
                }
            } catch (error) {
                console.error('Error fetching dealer info:', error);
                // Continue with login even if dealer info fetch fails
            }
        }

        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('isLoggedIn', 'true');

        // Always redirect to homepage first
        window.location.href = '../index.html';

    } catch (error) {
        console.error(error);
        loginError.textContent = 'Invalid email or password';
        loginError.style.display = 'block';
        verificationRequired.style.display = 'none';
    }
});

// Handle resend verification email
resendVerification.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        alert('Verification email sent! Please check your inbox.');
    } catch (error) {
        console.error(error);
        loginError.textContent = 'Error sending verification email. Please try again.';
        loginError.style.display = 'block';
    }
});