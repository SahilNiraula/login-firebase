// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAFAjWPBCfQ9q1yJO-wpmBENZQ7UVptI5c",
    authDomain: "login-form-74432.firebaseapp.com",
    projectId: "login-form-74432",
    storageBucket: "login-form-74432.firebasestorage.app",
    messagingSenderId: "202987316765",
    appId: "1:202987316765:web:e80eb6f2fd504c9d91c8f4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Make sure loading overlay is hidden on page load
document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.style.display = 'none';
    }
});

// DOM Elements
// Auth container elements
const authContainer = document.getElementById('authContainer');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const resetForm = document.getElementById('resetForm');
const forgotPassword = document.getElementById('forgotPassword');
const backToLogin = document.getElementById('backToLogin');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const resetMessage = document.getElementById('resetMessage');

// Dashboard elements
const dashboardContainer = document.getElementById('dashboardContainer');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');
const userId = document.getElementById('userId');
const lastLogin = document.getElementById('lastLogin');
const userData = document.getElementById('userData');

// Loading overlay
const loadingOverlay = document.getElementById('loadingOverlay');

// Tab switching functionality
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    resetForm.classList.add('hidden');
});

registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    resetForm.classList.add('hidden');
});

forgotPassword.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    resetForm.classList.remove('hidden');
});

backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Show loading overlay
function showLoading() {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.classList.add('hidden');
    loadingOverlay.style.display = 'none';
}

// Display message
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'form-message ' + type;
    setTimeout(() => {
        element.className = 'form-message';
    }, 5000);
}

// Register form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Simple validation
    if (!name || !email || !password || !confirmPassword) {
        showMessage(registerMessage, 'Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage(registerMessage, 'Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage(registerMessage, 'Password must be at least 6 characters', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Store additional user info in Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });
        
        showMessage(registerMessage, 'Registration successful! Redirecting...', 'success');
        
        // Reset form
        registerForm.reset();
        
    } catch (error) {
        console.error("Registration error:", error);
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email is already in use.';
        }
        
        showMessage(registerMessage, errorMessage, 'error');
    } finally {
        hideLoading();
    }
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simple validation
    if (!email || !password) {
        showMessage(loginMessage, 'Please enter both email and password', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Sign in with Firebase Auth
        await signInWithEmailAndPassword(auth, email, password);
        
        // Update last login timestamp in Firestore
        const user = auth.currentUser;
        if (user) {
            await setDoc(doc(db, "users", user.uid), {
                lastLogin: serverTimestamp()
            }, { merge: true });
        }
        
        showMessage(loginMessage, 'Login successful! Redirecting...', 'success');
        
        // Reset form
        loginForm.reset();
        
    } catch (error) {
        console.error("Login error:", error);
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Invalid email or password.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed login attempts. Please try again later.';
        }
        
        showMessage(loginMessage, errorMessage, 'error');
    } finally {
        hideLoading();
    }
});

// Password reset form submission
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    
    if (!email) {
        showMessage(resetMessage, 'Please enter your email address', 'error');
        return;
    }
    
    showLoading();
    
    try {
        await sendPasswordResetEmail(auth, email);
        showMessage(resetMessage, 'Password reset email sent. Check your inbox.', 'success');
        resetForm.reset();
    } catch (error) {
        console.error("Password reset error:", error);
        let errorMessage = 'Failed to send password reset email.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        }
        
        showMessage(resetMessage, errorMessage, 'error');
    } finally {
        hideLoading();
    }
});

// Logout functionality
logoutBtn.addEventListener('click', async () => {
    showLoading();
    
    try {
        await signOut(auth);
        console.log("User signed out");
    } catch (error) {
        console.error("Logout error:", error);
    } finally {
        hideLoading();
    }
});

// Authentication state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        console.log("User is signed in:", user.uid);
        
        // Show dashboard, hide auth forms
        authContainer.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
        
        // Update dashboard UI with user info
        userEmail.textContent = user.email;
        userId.textContent = user.uid;
        
        try {
            // Get additional user data from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Format and display last login time
                if (userData.lastLogin) {
                    const lastLoginDate = userData.lastLogin.toDate();
                    lastLogin.textContent = lastLoginDate.toLocaleString();
                } else {
                    lastLogin.textContent = 'First login';
                }
                
                // Example of displaying user data
                document.getElementById('userData').innerHTML = `
                    <p>Name: ${userData.name || 'Not set'}</p>
                    <p>Account Created: ${userData.createdAt ? userData.createdAt.toDate().toLocaleString() : 'Unknown'}</p>
                `;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        // User is signed out
        console.log("User is signed out");
        
        // Show auth forms, hide dashboard
        authContainer.classList.remove('hidden');
        dashboardContainer.classList.add('hidden');
        
        // Reset to login tab
        loginTab.click();
    }
});

// Sample data for demonstration (you would normally fetch this from your database)
function loadSampleData() {
    // This is just a placeholder for where you would load real data from Firestore
    // In a real app, you might fetch this when the user logs in
    const sampleUserData = {
        tasks: [
            { id: 1, title: 'Complete project', dueDate: '2023-04-20' },
            { id: 2, title: 'Review documentation', dueDate: '2023-04-22' },
            { id: 3, title: 'Update website', dueDate: '2023-04-25' }
        ],
        stats: {
            completedTasks: 5,
            pendingTasks: 3,
            totalProjects: 2
        }
    };
    
    return sampleUserData;
}