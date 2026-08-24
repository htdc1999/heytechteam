document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
    });

    const loginBtn = document.getElementById('login-btn');
    
    // Check if user is authenticated via cookie
    const isAuthenticated = document.cookie.includes('auth_token');

    if (!isAuthenticated) {
        loginBtn.style.display = 'inline-flex';
        // Initialize rings with 0
        initRings(0, 10000, 0, 60);
    } else {
        loginBtn.style.display = 'none';
        fetchFitData();
    }

    async function fetchFitData() {
        try {
            const response = await fetch('/api/fit-data');
            if (response.ok) {
                const data = await response.json();
                
                // Update rings
                initRings(data.steps, 10000, data.heartPoints, 60);
                
                // Update cards
                document.querySelector('.sleep-card .primary-val').textContent = data.sleep;
                document.querySelector('.hr-card .primary-val').textContent = data.heartRate;
                document.querySelector('.weight-card .primary-val').textContent = data.weight;
                
            } else {
                console.error("Failed to fetch data");
                loginBtn.style.display = 'inline-flex';
                initRings(0, 10000, 0, 60);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            initRings(0, 10000, 0, 60);
        }
    }

    function initRings(stepsValue, stepsMax, heartValue, heartMax) {
        const stepsRing = document.querySelector('.steps-ring');
        const heartRing = document.querySelector('.heart-ring');

        stepsRing.setAttribute('data-target', stepsValue);
        stepsRing.setAttribute('data-max', stepsMax);
        
        heartRing.setAttribute('data-target', heartValue);
        heartRing.setAttribute('data-max', heartMax);

        setTimeout(() => {
            const rings = document.querySelectorAll('.circular-progress');
            rings.forEach(ring => {
                const circle = ring.querySelector('.progress-ring__circle');
                const valueDisplay = ring.querySelector('.ring-value');
                
                const target = parseInt(ring.getAttribute('data-target'));
                const max = parseInt(ring.getAttribute('data-max'));
                
                const radius = circle.r.baseVal.value;
                const circumference = radius * 2 * Math.PI;
                
                circle.style.strokeDasharray = `${circumference} ${circumference}`;
                circle.style.strokeDashoffset = circumference;
                
                const percent = Math.min(target / max, 1);
                const offset = circumference - (percent * circumference);
                
                circle.style.strokeDashoffset = offset;
                
                animateValue(valueDisplay, 0, target, 1500);
            });
        }, 300);
    }

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
