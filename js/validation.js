/**
 * Validation Utilities
 * Ported from Python utils.py/test_basic.py
 */

const Validation = {
    /**
     * Validate email format
     * Python regex: r"[^@]+@[^@]+\.[^@]+"
     */
    validateEmail: (email) => {
        return /^[^@]+@[^@]+\.[^@]+$/.test(email);
    },

    /**
     * Validate 10-digit mobile number
     * Python regex: r"^\d{10}$"
     */
    validateMobile: (mobile) => {
        return /^\d{10}$/.test(mobile);
    },

    /**
     * Validate Card Number using Luhn Algorithm
     * Matches Python implementation
     */
    validateCard: (cardNum) => {
        // Remove spaces
        const cleanNum = cardNum.replace(/\s/g, '');

        // Python: if not card_num.isdigit() or len(card_num) != 16
        if (!/^\d{16}$/.test(cleanNum)) return false;

        let sum = 0;
        let shouldDouble = false;

        // Loop from right to left (end to start)
        // This is equivalent to Python's reverse() logic
        for (let i = cleanNum.length - 1; i >= 0; i--) {
            let digit = parseInt(cleanNum.charAt(i));

            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }

            sum += digit;
            shouldDouble = !shouldDouble;
        }

        return (sum % 10) === 0;
    },

    /**
     * Hash password
     * Simulates Python's hashlib.sha256
     * Uses btoa (Base64) for simple consistent "hashing" in frontend mock.
     * Note: Real production apps should use bcrypt/argon2 on backend.
     */
    hashPassword: (password) => {
        try {
            return btoa(password);
        } catch (e) {
            return password;
        }
    }
};
