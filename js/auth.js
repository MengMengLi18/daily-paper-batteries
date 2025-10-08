/**
 * Authentication Module
 * Handles password verification and session management for the application
 *
 * @module Auth
 * @requires auth-config.js
 */

const Auth = {
    /**
     * Calculate SHA-256 hash of a string
     *
     * @param {string} password - The password to hash
     * @returns {Promise<string>} The hexadecimal hash string
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Authenticate user with password
     *
     * @param {string} password - User input password
     * @param {boolean} remember - Whether to remember login for 7 days (default: true)
     * @returns {Promise<boolean>} True if authentication successful
     */
    async login(password, remember = true) {
        const inputHash = await this.hashPassword(password);

        if (inputHash === AUTH_CONFIG.passwordHash) {
            const now = Date.now();
            // Remember: 7 days, otherwise: 1 day
            const expireTime = remember
                ? now + AUTH_CONFIG.sessionDuration
                : now + 24 * 60 * 60 * 1000;

            localStorage.setItem(AUTH_CONFIG.storageKey, inputHash);
            localStorage.setItem(AUTH_CONFIG.storageExpireKey, expireTime.toString());

            console.log('Authentication successful');
            return true;
        }

        console.warn('Authentication failed: Invalid password');
        return false;
    },

    /**
     * Check if user is authenticated
     *
     * @returns {boolean} True if valid session exists
     */
    isAuthenticated() {
        const token = localStorage.getItem(AUTH_CONFIG.storageKey);
        const expireTime = localStorage.getItem(AUTH_CONFIG.storageExpireKey);

        if (!token || !expireTime) {
            return false;
        }

        const now = Date.now();
        if (now > parseInt(expireTime)) {
            // Session expired
            console.log('Session expired');
            this.logout();
            return false;
        }

        return token === AUTH_CONFIG.passwordHash;
    },

    /**
     * Logout user and redirect to login page
     */
    logout() {
        localStorage.removeItem(AUTH_CONFIG.storageKey);
        localStorage.removeItem(AUTH_CONFIG.storageExpireKey);
        console.log('Logged out');
        window.location.href = 'login.html';
    },

    /**
     * Require authentication (call on protected pages)
     * Redirects to login page if not authenticated
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            console.log('Authentication required, redirecting to login page');
            window.location.href = `login.html?redirect=${currentPage}`;
        }
    },

    /**
     * Get remaining session time in milliseconds
     *
     * @returns {number} Milliseconds until session expires
     */
    getSessionTimeLeft() {
        const expireTime = localStorage.getItem(AUTH_CONFIG.storageExpireKey);
        if (!expireTime) return 0;
        return Math.max(0, parseInt(expireTime) - Date.now());
    },

    /**
     * Format session time for display
     *
     * @returns {string} Human-readable time left (e.g., "5 days 3 hours" or "2 hours 45 min")
     */
    getSessionTimeLeftFormatted() {
        const ms = this.getSessionTimeLeft();
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
            return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
        } else {
            const minutes = Math.floor(ms / (60 * 1000));
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
    },

    /**
     * Get session expiration date
     *
     * @returns {Date|null} Expiration date or null if not authenticated
     */
    getSessionExpireDate() {
        const expireTime = localStorage.getItem(AUTH_CONFIG.storageExpireKey);
        if (!expireTime) return null;
        return new Date(parseInt(expireTime));
    }
};
