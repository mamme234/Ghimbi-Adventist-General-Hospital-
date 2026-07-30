// ============================================
   AUTHENTICATION MODULE
// ============================================

class AuthManager {
    constructor() {
        this.tokenKey = 'auth_token';
        this.userKey = 'user_data';
        this.rememberKey = 'remember_me';
        this.api = window.api || null;
    }

    // ============================================
    // LOGIN METHODS
    // ============================================
    
    async login(credentials) {
        try {
            // Validate input
            if (!credentials.email || !credentials.password) {
                throw new Error('Email and password are required');
            }

            // Show loading state
            this.showLoading(true);

            // Attempt login via API
            let response;
            if (this.api) {
                response = await this.api.post('/auth/login', credentials);
            } else {
                // Demo login (for development)
                response = await this.demoLogin(credentials);
            }

            if (response.success) {
                // Store tokens
                this.setToken(response.token);
                this.setUser(response.user);
                
                // Remember me
                if (credentials.remember) {
                    localStorage.setItem(this.rememberKey, 'true');
                } else {
                    localStorage.removeItem(this.rememberKey);
                }

                // Redirect based on role
                this.redirectUser(response.user.role);
                
                return { success: true, user: response.user };
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message);
            return { success: false, error: error.message };
        } finally {
            this.showLoading(false);
        }
    }

    // Demo login (for development/testing)
    async demoLogin(credentials) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const demoUsers = {
            'admin@medicare.com': {
                password: 'admin123',
                user: {
                    id: '1',
                    name: 'Admin User',
                    email: 'admin@medicare.com',
                    role: 'admin',
                    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=2563eb&color=fff',
                    hospital: 'MediCare Main Hospital'
                }
            },
            'doctor@medicare.com': {
                password: 'doctor123',
                user: {
                    id: '2',
                    name: 'Dr. Sarah Johnson',
                    email: 'doctor@medicare.com',
                    role: 'doctor',
                    avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=7c3aed&color=fff',
                    department: 'Cardiology',
                    specialization: 'Cardiologist'
                }
            },
            'patient@medicare.com': {
                password: 'patient123',
                user: {
                    id: '3',
                    name: 'John Doe',
                    email: 'patient@medicare.com',
                    role: 'patient',
                    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=22c55e&color=fff',
                    patientId: 'P-2024-001'
                }
            },
            'reception@medicare.com': {
                password: 'reception123',
                user: {
                    id: '4',
                    name: 'Jane Smith',
                    email: 'reception@medicare.com',
                    role: 'receptionist',
                    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=f59e0b&color=fff',
                    department: 'Reception'
                }
            }
        };

        const userData = demoUsers[credentials.email];
        if (userData && userData.password === credentials.password) {
            return {
                success: true,
                token: 'demo_token_' + Date.now(),
                user: userData.user
            };
        } else {
            return {
                success: false,
                message: 'Invalid email or password'
            };
        }
    }

    // ============================================
    // TOKEN MANAGEMENT
    // ============================================
    
    setToken(token) {
        if (token) {
            localStorage.setItem(this.tokenKey, token);
            sessionStorage.setItem(this.tokenKey, token);
        }
    }

    getToken() {
        return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
    }

    removeToken() {
        localStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.tokenKey);
    }

    // ============================================
    // USER MANAGEMENT
    // ============================================
    
    setUser(user) {
        if (user) {
            localStorage.setItem(this.userKey, JSON.stringify(user));
            sessionStorage.setItem(this.userKey, JSON.stringify(user));
        }
    }

    getUser() {
        const data = localStorage.getItem(this.userKey) || sessionStorage.getItem(this.userKey);
        return data ? JSON.parse(data) : null;
    }

    removeUser() {
        localStorage.removeItem(this.userKey);
        sessionStorage.removeItem(this.userKey);
    }

    // ============================================
    // CHECK AUTH STATUS
    // ============================================
    
    isAuthenticated() {
        return !!this.getToken();
    }

    getCurrentUser() {
        return this.getUser();
    }

    getUserRole() {
        const user = this.getUser();
        return user ? user.role : null;
    }

    // ============================================
    // LOGOUT
    // ============================================
    
    logout() {
        // Clear tokens and user data
        this.removeToken();
        this.removeUser();
        localStorage.removeItem(this.rememberKey);
        
        // Clear any other session data
        sessionStorage.clear();
        
        // Redirect to login
        window.location.href = '/patient-login.html';
    }

    // ============================================
    // REDIRECT BASED ON ROLE
    // ============================================
    
    redirectUser(role) {
        const redirectMap = {
            'patient': '/patient-dashboard.html',
            'doctor': '/doctor-dashboard.html',
            'admin': '/admin-dashboard.html',
            'super-admin': '/super-admin-dashboard.html',
            'receptionist': '/receptionist-dashboard.html',
            'nurse': '/nurse-dashboard.html',
            'pharmacist': '/pharmacist-dashboard.html',
            'laboratory': '/laboratory-dashboard.html',
            'radiology': '/radiology-dashboard.html',
            'finance': '/finance-dashboard.html',
            'hr': '/hr-dashboard.html',
            'ambulance': '/ambulance-dashboard.html'
        };

        const url = redirectMap[role] || '/index.html';
        window.location.href = url;
    }

    // ============================================
    // QR CODE LOGIN
    // ============================================
    
    async loginWithQR(qrCode) {
        try {
            this.showLoading(true);
            
            let response;
            if (this.api) {
                response = await this.api.post('/auth/qr-login', { qrCode });
            } else {
                // Demo QR login
                await new Promise(resolve => setTimeout(resolve, 1000));
                response = {
                    success: true,
                    token: 'qr_token_' + Date.now(),
                    user: {
                        id: '5',
                        name: 'QR User',
                        email: 'qr@medicare.com',
                        role: 'patient',
                        qrId: qrCode
                    }
                };
            }

            if (response.success) {
                this.setToken(response.token);
                this.setUser(response.user);
                this.redirectUser(response.user.role);
                return { success: true };
            } else {
                throw new Error(response.message || 'QR login failed');
            }
        } catch (error) {
            console.error('QR Login error:', error);
            this.showError(error.message);
            return { success: false, error: error.message };
        } finally {
            this.showLoading(false);
        }
    }

    // ============================================
    // PASSWORD RESET
    // ============================================
    
    async resetPassword(email) {
        try {
            if (!email) {
                throw new Error('Email is required');
            }

            this.showLoading(true);

            let response;
            if (this.api) {
                response = await this.api.post('/auth/reset-password', { email });
            } else {
                await new Promise(resolve => setTimeout(resolve, 1500));
                response = {
                    success: true,
                    message: 'Password reset link sent to your email'
                };
            }

            if (response.success) {
                this.showSuccess(response.message || 'Password reset instructions sent');
                return { success: true };
            } else {
                throw new Error(response.message || 'Password reset failed');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            this.showError(error.message);
            return { success: false, error: error.message };
        } finally {
            this.showLoading(false);
        }
    }

    // ============================================
    // CHANGE PASSWORD
    // ============================================
    
    async changePassword(currentPassword, newPassword) {
        try {
            if (!currentPassword || !newPassword) {
                throw new Error('All fields are required');
            }

            if (newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            this.showLoading(true);

            let response;
            if (this.api) {
                response = await this.api.post('/auth/change-password', {
                    currentPassword,
                    newPassword
                });
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
                response = {
                    success: true,
                    message: 'Password changed successfully'
                };
            }

            if (response.success) {
                this.showSuccess(response.message || 'Password changed successfully');
                return { success: true };
            } else {
                throw new Error(response.message || 'Password change failed');
            }
        } catch (error) {
            console.error('Change password error:', error);
            this.showError(error.message);
            return { success: false, error: error.message };
        } finally {
            this.showLoading(false);
        }
    }

    // ============================================
    // UI HELPERS
    // ============================================
    
    showLoading(show) {
        const loader = document.getElementById('loadingOverlay');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;

        container.appendChild(toast);

        // Auto dismiss
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
            width: 100%;
        `;
        document.body.appendChild(container);
        return container;
    }

    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // ============================================
    // SESSION TIMEOUT
    // ============================================
    
    startSessionTimer(timeoutMinutes = 30) {
        let timeoutId;
        const timeoutMs = timeoutMinutes * 60 * 1000;

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                this.logout();
                this.showToast('Session expired. Please login again.', 'warning');
            }, timeoutMs);
        };

        // Reset timer on user activity
        const events = ['click', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });

        resetTimer();

        // Return cleanup function
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
            clearTimeout(timeoutId);
        };
    }

    // ============================================
    // AUTO LOGIN (Remember Me)
    // ============================================
    
    async autoLogin() {
        const remember = localStorage.getItem(this.rememberKey);
        const token = this.getToken();
        const user = this.getUser();

        if (remember && token && user) {
            // Verify token with server
            try {
                if (this.api) {
                    const response = await this.api.get('/auth/verify');
                    if (response.success) {
                        return { success: true, user };
                    }
                } else {
                    // Demo auto-login
                    return { success: true, user };
                }
            } catch (error) {
                console.error('Auto-login failed:', error);
                this.logout();
            }
        }
        return { success: false };
    }
}

// ============================================
// TOAST STYLES (injected if not present)
// ============================================
(function injectToastStyles() {
    if (document.getElementById('toastStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'toastStyles';
    styles.textContent = `
        .toast {
            background: white;
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: flex;
            justify-content: space-between;
            align-items: center;
            animation: slideInNotification 0.4s ease forwards;
            border-left: 4px solid #2563eb;
            min-width: 300px;
        }
        
        .toast.toast-success {
            border-left-color: #22c55e;
        }
        .toast.toast-error {
            border-left-color: #ef4444;
        }
        .toast.toast-warning {
            border-left-color: #f59e0b;
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #1e293b;
        }
        
        .toast-content i {
            font-size: 20px;
        }
        
        .toast-success .toast-content i {
            color: #22c55e;
        }
        .toast-error .toast-content i {
            color: #ef4444;
        }
        .toast-warning .toast-content i {
            color: #f59e0b;
        }
        .toast-info .toast-content i {
            color: #2563eb;
        }
        
        .toast-close {
            background: transparent;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 16px;
            padding: 4px 8px;
            border-radius: 8px;
            transition: background 0.3s ease;
        }
        
        .toast-close:hover {
            background: #f1f5f9;
        }
        
        .toast.fade-out {
            animation: slideOutNotification 0.4s ease forwards;
        }
        
        .toast + .toast {
            margin-top: 8px;
        }
    `;
    document.head.appendChild(styles);
})();

// ============================================
// EXPORT
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

// Create global instance
const auth = new AuthManager();

// ============================================
// AUTO-INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Check for auto-login
    auth.autoLogin().then(result => {
        if (result.success) {
            const user = auth.getUser();
            if (user) {
                // Update UI with user info
                const userAvatar = document.querySelector('.user-avatar');
                const userName = document.querySelector('.user-name');
                
                if (userAvatar) {
                    userAvatar.src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;
                    userAvatar.alt = user.name;
                }
                
                if (userName) {
                    userName.textContent = user.name;
                }
                
                // Show logout button
                const logoutBtn = document.querySelector('.logout-btn');
                if (logoutBtn) {
                    logoutBtn.style.display = 'flex';
                }
            }
        }
    });

    // Setup logout buttons
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            auth.logout();
        });
    });
});
