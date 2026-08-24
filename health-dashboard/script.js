document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
    });

    // Circular Progress Ring Animation
    const rings = document.querySelectorAll('.circular-progress');
    
    // Simulate loading data
    setTimeout(() => {
        rings.forEach(ring => {
            const circle = ring.querySelector('.progress-ring__circle');
            const valueDisplay = ring.querySelector('.ring-value');
            
            const target = parseInt(ring.getAttribute('data-target'));
            const max = parseInt(ring.getAttribute('data-max'));
            
            // Circumference calculation
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = circumference;
            
            // Calculate offset based on percentage
            const percent = Math.min(target / max, 1);
            const offset = circumference - (percent * circumference);
            
            // Animate stroke
            circle.style.strokeDashoffset = offset;
            
            // Animate number
            animateValue(valueDisplay, 0, target, 1500);
        });
    }, 300); // Slight delay for effect

    // Simple number counter animation
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
});
