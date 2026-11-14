
/* =====================================================
   GIDY NEGA — 3D SNAKE SCROLL ENGINE
   Version 1.0
   Scroll-controlled particle ribbon and 3D movement
===================================================== */

(() => {
    "use strict";

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    if (reducedMotion.matches) return;

    // Create the background animation canvas
    const canvas = document.createElement("canvas");
    canvas.id = "snakeCanvas";
    canvas.setAttribute("aria-hidden", "true");

    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        canvas.remove();
        return;
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    let scrollPosition = window.scrollY || 0;
    let framePending = false;

    // Particle settings
    const particleCount = window.innerWidth < 600 ? 280 : 650;
    const particles = [];

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            y: Math.random(),
            across: random(-0.9, 0.9),
            size: random(0.7, 2.2),
            alpha: random(0.25, 0.9)
        });
    }

    // Calculate the curved snake body
    function snakeCenter(y) {
        const phase = scrollPosition * 0.002;

        return (
            width * 0.5 +
            Math.sin(y / 170 + phase) * width * 0.20 +
            Math.sin(y / 310 - phase * 0.7) * width * 0.08
        );
    }

    // Calculate the snake body width
    function snakeWidth(y) {
        return width * (
            0.18 + Math.sin(y / 240) * 0.025
        );
    }

    // Resize the canvas
    function resizeCanvas() {
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        render();
    }

    // Draw the glowing snake ribbon
    function drawSnake() {
        const step = 8;

        ctx.beginPath();

        for (let y = -20; y <= height + 20; y += step) {
            const x = snakeCenter(y);
            const half = snakeWidth(y);

            if (y === -20) {
                ctx.moveTo(x - half, y);
            } else {
                ctx.lineTo(x - half, y);
            }
        }

        for (let y = height + 20; y >= -20; y -= step) {
            const x = snakeCenter(y);
            const half = snakeWidth(y);

            ctx.lineTo(x + half, y);
        }

        ctx.closePath();

        const gradient = ctx.createLinearGradient(
            0, 0, width, height
        );

        gradient.addColorStop(0, "rgba(255, 20, 35, 0.10)");
        gradient.addColorStop(0.5, "rgba(255, 0, 25, 0.20)");
        gradient.addColorStop(1, "rgba(255, 20, 35, 0.08)");

        ctx.fillStyle = gradient;
        ctx.fill();

        // Glowing blue outline
        ctx.save();

        ctx.shadowColor = "#4169ff";
        ctx.shadowBlur = 8;
        ctx.strokeStyle = "rgba(65, 105, 255, 0.85)";
        ctx.lineWidth = 2;

        ctx.stroke();

        ctx.restore();
    }

    // Draw particles inside the ribbon
    function drawParticles() {
        for (const particle of particles) {

            let y = (
                particle.y * (height + 100) -
                scrollPosition * 0.35
            ) % (height + 100);

            if (y < -50) {
                y += height + 100;
            }

            const center = snakeCenter(y);
            const half = snakeWidth(y);

            const x = center + particle.across * half;

            const depth = 1 - Math.abs(particle.across) * 0.35;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                particle.size * depth,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(255, ${Math.round(random(35, 85))}, 25, ${particle.alpha})`;

            ctx.shadowColor = "#ff251b";
            ctx.shadowBlur = 5;

            ctx.fill();
        }

        ctx.shadowBlur = 0;
    }

    // Animate website sections as visitors scroll
    function moveSections() {

        const sections = document.querySelectorAll(
            "main > section"
        );

        const mobile = window.innerWidth <= 800;

        const movement = mobile ? 12 : 34;

        sections.forEach((section, index) => {

            const rect = section.getBoundingClientRect();

            const distance =
                (rect.top + rect.height / 2 - height / 2) / height;

            const wave =
                Math.sin(
                    (scrollPosition / 450) +
                    index * 1.1 +
                    distance * 0.8
                );

            const x = wave * movement;

            const y = Math.cos(
                scrollPosition / 500 + index
            ) * (mobile ? 2 : 5);

            const rotate = wave * (mobile ? 0.35 : 1.2);

            const turn = mobile
                ? 0
                : Math.cos(scrollPosition / 650 + index) * 1.8;

            section.style.setProperty(
                "--snake-x", x.toFixed(2) + "px"
            );

            section.style.setProperty(
                "--snake-y", y.toFixed(2) + "px"
            );

            section.style.setProperty(
                "--snake-rotate", rotate.toFixed(2) + "deg"
            );

            section.style.setProperty(
                "--snake-turn", turn.toFixed(2) + "deg"
            );
        });
    }

    // Draw everything
    function render() {
        if (!ctx || width === 0 || height === 0) return;

        ctx.clearRect(0, 0, width, height);

        drawSnake();
        drawParticles();
        moveSections();
    }

    // Optimize scroll updates
    function requestRender() {
        if (framePending) return;

        framePending = true;

        requestAnimationFrame(() => {
            scrollPosition = window.scrollY || 0;

            render();

            framePending = false;
        });
    }

    window.addEventListener(
        "scroll",
        requestRender,
        { passive: true }
    );

    window.addEventListener(
        "resize",
        resizeCanvas,
        { passive: true }
    );

    // Initial setup
    resizeCanvas();
    requestRender();

})();
