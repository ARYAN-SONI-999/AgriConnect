/**
 * AgriConnect Main Script
 * Handles mobile navigation and dynamic interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initContactForm();
    initNewsletterForm();
});

function showCustomNotification(title, message, icon = '🎉', color = '#27ae60') {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.right = '30px';
    toast.style.backgroundColor = 'white';
    toast.style.color = '#333';
    toast.style.padding = '20px 25px';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
    toast.style.zIndex = '99999';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '15px';
    toast.style.borderLeft = `5px solid ${color}`;
    toast.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';

    toast.innerHTML = `
        <span style="font-size: 2rem;">${icon}</span>
        <div>
            <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-weight: 700;">${title}</h4>
            <p style="margin: 0; font-size: 0.85rem; color: #7f8c8d; line-height: 1.4;">${message}</p>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 100);

    setTimeout(() => {
        toast.style.transform = 'translateY(50px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 4500);
}

function initContactForm() {
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;

            showCustomNotification(
                'Message Sent!',
                `Thank you, ${name}. We'll respond shortly at ${email}.`,
                '📧',
                '#27ae60'
            );
            contactForm.reset();
        });
    }
}

function initNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                showCustomNotification(
                    'Subscribed Successfully!',
                    `Fresh harvest updates will be sent to: ${emailInput.value}`,
                    '🌾',
                    '#e67e22'
                );
                newsletterForm.reset();
            }
        });
    }
}

function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-item');

    if (menuBtn && navLinks) {
        // Toggle menu on button click
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });

        // Close menu when a link is clicked
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                menuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuBtn.contains(e.target) && navLinks.classList.contains('active')) {
                menuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    }
}
