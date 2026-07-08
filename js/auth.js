/**
 * Auth Guard & Utilities
 */

function checkAuth(requiredRole) {
    const user = DB.getCurrentUser();

    if (!user) {
        // Redirect to specific login page based on role if trying to access protected area
        if (requiredRole === 'customer') window.location.href = 'customer-login.html';
        if (requiredRole === 'farmer') window.location.href = 'farmer-login.html';
        if (requiredRole === 'admin') window.location.href = 'admin-login.html';
        return;
    }

    if (requiredRole && user.role !== requiredRole) {
        showToast('Unauthorized access', 'error');
        window.location.href = '../index.html';
    }

    // Update UI headers if logged in
    updateAuthUI(user);
}

function updateAuthUI(user) {
    // Common function to update 'Login' button to 'Logout' or 'Profile'
    const authLinks = document.querySelector('.auth-links');
    if (authLinks) {
        authLinks.innerHTML = `
            <span>Welcome, ${user.name}</span>
            <a href="#" onclick="DB.logout()" class="btn btn-secondary" style="margin-left: 10px; padding: 5px 15px; font-size: 0.9rem;">Logout</a>
        `;
    }
}

/**
 * Trigger OTP Verification Dialog
 * Simulates SMS/WhatsApp OTP dispatch and checks code.
 */
async function triggerOTPVerification(username, password, role, onSuccess) {
    let user = null;

    try {
        // Try verifying credentials against Backend server first
        const res = await API.login(username, password, role);
        if (res && res.success) {
            user = res.user;
            // Update local cache password if needed
            const users = DB.getUsers() || [];
            const cachedUser = users.find(u => u.username === username && u.role === role);
            if (cachedUser) {
                cachedUser.password = password;
                localStorage.setItem(DB.USERS, JSON.stringify(users));
            }
        }
    } catch (e) {
        console.warn('API verification failed, trying local fallback:', e);
    }

    if (!user) {
        // Local verification fallback
        const users = DB.getUsers() || [];
        user = users.find(u => u.username === username && u.role === role && (u.password === password || u.password === btoa(password)));
    }

    if (!user) {
        showToast('Invalid credentials!', 'error');
        return;
    }

    // 2. Generate a random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Trigger SMS notification simulation showing the OTP
    if (window.showSimulatedSMS) {
        window.showSimulatedSMS('AGRI-CNCT', `Your OTP for AgriConnect sign-in is: ${otpCode}. Valid for 5 minutes.`);
    }

    // 4. Create and show OTP Modal overlay
    const modalId = 'otpModalOverlay';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(5px);
        z-index: 100000000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    modal.innerHTML = `
        <div class="card fade-in" style="background: white; width: 380px; padding: 30px; border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); text-align: center; font-family: sans-serif;">
            <span style="font-size: 3rem;">🔐</span>
            <h3 style="margin: 15px 0 10px; color: #2c3e50;">Enter Verification Code</h3>
            <p style="font-size: 0.88rem; color: #7f8c8d; margin-bottom: 20px; line-height: 1.5;">We have sent a 6-digit OTP to your registered mobile number via SMS and WhatsApp.<br><strong style="color: #11998e; font-size: 0.95rem;">Test OTP Code: ${otpCode}</strong></p>
            
            <div style="margin-bottom: 20px;">
                <input type="text" id="otpInputField" placeholder="••••••" maxlength="6" style="width: 150px; padding: 12px; font-size: 1.5rem; text-align: center; border: 2px solid #ddd; border-radius: 8px; letter-spacing: 5px; outline: none; transition: border 0.3s;" />
            </div>

            <button id="verifyOtpBtn" class="btn btn-primary" style="width: 100%; border: none; padding: 12px; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; background: linear-gradient(135deg, #11998e, #38ef7d); color: white;">Verify & Login</button>
            
            <div style="margin-top: 15px; font-size: 0.82rem; color: #95a5a6;">
                Didn't receive it? <a href="#" id="resendOtpBtn" style="color: #11998e; font-weight: 600; text-decoration: none;">Resend OTP</a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Focus input field
    setTimeout(() => {
        const input = document.getElementById('otpInputField');
        if (input) input.focus();
    }, 100);

    // Event Listeners
    document.getElementById('verifyOtpBtn').addEventListener('click', () => {
        const inputCode = document.getElementById('otpInputField').value.trim();
        if (inputCode === otpCode) {
            modal.remove();
            
            // Save to session/local storage
            localStorage.setItem(DB.CURRENT_USER, JSON.stringify(user));
            
            // Trigger WhatsApp greeting simulated notification
            if (window.showSimulatedWhatsApp) {
                window.showSimulatedWhatsApp('AgriConnect Support', `Hello ${user.name}, you have successfully signed into your ${role} account!`);
            }
            
            onSuccess(user);
        } else {
            showToast('Invalid OTP. Please check the code and try again.', 'error');
        }
    });

    document.getElementById('resendOtpBtn').addEventListener('click', (e) => {
        e.preventDefault();
        triggerOTPVerification(username, password, role, onSuccess);
    });
}

