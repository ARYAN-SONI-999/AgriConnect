/**
 * AgriConnect Session Manager
 * Centralizes all user session storage operations.
 */
const Session = {
    USER_KEY: 'agri_current_user',
    
    // Get current logged-in user object (without password)
    get() {
        try {
            const raw = localStorage.getItem(this.USER_KEY);
            if (!raw) return null;
            const user = JSON.parse(raw);
            // Never expose password via session
            const { password, ...safeUser } = user;
            return safeUser;
        } catch {
            return null;
        }
    },

    // Save user to session (strips password before storing)
    set(user) {
        if (!user) return;
        const { password, ...safeUser } = user;
        localStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));
    },

    // Clear session (logout)
    clear() {
        localStorage.removeItem(this.USER_KEY);
    },

    // Check if user is logged in
    isLoggedIn() {
        return this.get() !== null;
    },

    // Check if user has a specific role
    hasRole(role) {
        const user = this.get();
        return user && user.role === role;
    }
};
window.Session = Session;
