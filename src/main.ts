// Smooth scroll handling
document.querySelectorAll('a[href^="#"]').forEach((anchor: Element) => {
    anchor.addEventListener('click', function(this: HTMLAnchorElement, e: Event) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href')!);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

// Observe all sections
document.querySelectorAll('section').forEach((section) => {
    observer.observe(section);
});

// Handle mint button click
const mintButton = document.querySelector('a[href="#mint"]');
if (mintButton) {
    mintButton.addEventListener('click', async (e) => {
        e.preventDefault();
        // TODO: Implement minting functionality when smart contract is ready
        alert('Minting functionality coming soon!');
    });
} 