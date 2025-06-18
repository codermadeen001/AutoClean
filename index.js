document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyB_Iigyq2UBUiJBA7-1Z9m2GFtCMHhj26M",
        authDomain: "icents.firebaseapp.com",
        projectId: "icents",
        storageBucket: "icents.appspot.com",
        messagingSenderId: "1042290287974",
        appId: "1:1042290287974:web:d3e680416891b17e6f54a7",
        measurementId: "G-WC4EE3KDFT"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Navbar scroll effect
    const navbar = document.getElementById('mainNav');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Handle Login Form Submit if form exists
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const loginBtn = document.getElementById('loginBtn');
            
            if (!emailInput || !passwordInput || !loginBtn) {
                createToast('Form elements not found', 'error');
                return;
            }

            const email = emailInput.value;
            const password = passwordInput.value;
            const originalBtnText = loginBtn.innerHTML;
            
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Signing In...';
            loginBtn.disabled = true;

            try {
             const response = await fetch('https://backend-carwash-mx6p.onrender.com/api/login', {
                //const response = await fetch('http://localhost:8000/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    
                    if (data.role === "admin") {
                        window.location.href = 'admin/index.html';
                    } else if (data.role === "client") {
                        window.location.href = 'client/index.html';
                    } else {
                        window.location.href = 'car_detailer/index.html';
                    }
                } else {
                    createToast(data.message, 'error');
                    loginBtn.innerHTML = originalBtnText;
                    loginBtn.disabled = false;
                }
            } catch (error) {
                createToast(error.message || 'Login failed', 'error');
                loginBtn.innerHTML = originalBtnText;
                loginBtn.disabled = false;
            }
        });
    }

    // Handle Forget Password if link exists
    const forgetPasswordLink = document.getElementById('forgetPassword');
    if (forgetPasswordLink) {
        forgetPasswordLink.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            if (!emailInput) {
                createToast("Email field not found", 'error');
                return;
            }
            
            const email = emailInput.value;
            if (!email) {
                createToast("Email is required", 'error');
                return;
            }
            
            const originalLinkText = forgetPasswordLink.innerHTML;
            forgetPasswordLink.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Sending...';
            
            try {
                const response = await fetch('https://backend-carwash-mx6p.onrender.com/api/password/reset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                createToast(data.message, data.success ? 'success' : 'error');
            } catch (error) {
                createToast('Failed to send reset link', 'error');
            } finally {
                forgetPasswordLink.innerHTML = originalLinkText;
            }
        });
    }

    // Handle Google Login if button exists
    const googleBtn = document.querySelector('.google-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            const originalBtnText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Connecting to Google...';
            this.disabled = true;

            try {
                const auth = firebase.auth();
                const googleProvider = new firebase.auth.GoogleAuthProvider();
                googleProvider.setCustomParameters({ prompt: "select_account" });
                
                const result = await auth.signInWithPopup(googleProvider);
                const userData = result.user;

                const data = {
                    userName: userData.displayName,
                    userEmail: userData.email,
                    userImgUrl: userData.photoURL
                };

    const response = await fetch('https://backend-carwash-mx6p.onrender.com/api/google/login', {

 // const response = await fetch('http://127.0.0.1:8000/api/google/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data),
                    credentials: 'include'
                });
console.log(data)
                const responseData = await response.json();

                if (responseData.success) {
                    localStorage.setItem('token', responseData.token);
                    if (responseData.role === "admin") {
                        window.location.href = 'admin/index.html';
                    } else if (responseData.role === "client") {
                        window.location.href = 'client/index.html';
                    } else {
                        window.location.href = 'car_detailer/index.html';
                    }
                } else {
                    createToast(responseData.message, 'error');
                    this.innerHTML = originalBtnText;
                    this.disabled = false;
                }
            } catch (error) {
                createToast('Google authentication failed: ' + error.message, 'error');
                this.innerHTML = originalBtnText;
                this.disabled = false;
            }
        });
    }

    // Handle Forgot Password Form if exists
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const resetBtn = document.getElementById('resetPasswordBtn');
            if (!resetBtn) return;
            
            const originalBtnText = resetBtn.innerHTML;
            resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Sending...';
            
            // Simulate password reset (replace with actual implementation)
            setTimeout(() => {
                createToast('Password reset link sent successfully', 'success');
                resetBtn.innerHTML = originalBtnText;
                const forgotModal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
                if (forgotModal) {
                    forgotModal.hide();
                }
            }, 2000);
        });
    }
});

// Utility functions
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'flex';
        setTimeout(() => {
            hideLoading();
        }, 180000);
    }
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}


      // Toast functionality
const createToast = (message, type) => {
    // Remove any existing toasts first
    const existingToasts = document.querySelectorAll('.toast-container');
    existingToasts.forEach(toast => toast.remove());

    // Create toast container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    
    // Add appropriate class based on type
    if (type === 'error') {
        toastContainer.innerHTML = `
            <div class="toast-header toast-error">
                <strong>Error</strong>
                <button type="button" class="toast-close">×</button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
    } else if (type === 'success') {
       toastContainer.innerHTML = `
            <div class="toast-header toast-success">
                <strong>Sucess</strong>
                <button type="button" class="toast-close">×</button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
    }

    // Add to document
    document.body.appendChild(toastContainer);

    // Add event listener to close button
    const closeButton = toastContainer.querySelector('.toast-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            toastContainer.remove();
        });
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toastContainer)) {
            toastContainer.remove();
        }
    }, 5000);
};


