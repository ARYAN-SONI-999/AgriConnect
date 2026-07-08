/**
 * AgriConnect Animations
 * Handles scroll reveal interactions and navbar styling
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initNavbarScroll();
});

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-up');
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    };
    
    const revealOptions = {
        threshold: 0.15, // Trigger when 15% of element is visible
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(revealCallback, revealOptions);
    
    revealElements.forEach(el => {
        observer.observe(el);
    });
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
            navbar.style.padding = '10px 0'; // Sharpen height
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.9)';
            navbar.style.boxShadow = 'var(--shadow-sm)';
            navbar.style.padding = '15px 0';
        }
    });
}
