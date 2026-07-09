/**
 * AgriConnect Validation & Security Utilities
 */
const Validation = {
    // Email validation - proper RFC-compliant regex
    validateEmail(email) {
        if (!email || email.length > 254) return false;
        const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
        return re.test(email);
    },

    // Mobile validation - accepts 10 digits or +91 format
    validateMobile(mobile) {
        if (!mobile) return false;
        const cleaned = mobile.replace(/[\s\-()]/g, '');
        return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
    },

    // Luhn algorithm for card number validation
    validateCard(cardNumber) {
        if (!cardNumber) return false;
        const num = cardNumber.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(num)) return false;
        let sum = 0;
        let alternate = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let n = parseInt(num[i], 10);
            if (alternate) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 === 0;
    },

    // Expiry date validation (MM/YY format)
    validateExpiry(expiry) {
        if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) return false;
        const [month, year] = expiry.split('/').map(Number);
        if (month < 1 || month > 12) return false;
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;
        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;
        return true;
    },

    // CVV validation (3 or 4 digits)
    validateCVV(cvv) {
        if (!cvv) return false;
        return /^\d{3,4}$/.test(cvv.trim());
    },

    // Password strength check
    validatePassword(password) {
        if (!password) return { valid: false, message: 'Password is required' };
        if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
        if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
        if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
        return { valid: true, message: '' };
    },

    // SHA-256 via Web Crypto API (async) - returns hex string
    async hashPasswordAsync(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hash));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // Sync hash for backward compat (Base64)
    hashPassword(password) {
        try {
            return btoa(password);
        } catch (e) {
            return password;
        }
    }
};
