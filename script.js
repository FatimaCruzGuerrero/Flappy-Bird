(() => {
    // Inicialización del Canvas
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d', { alpha: false });
    const scoreEl = document.getElementById('score');
    const overlay = document.getElementById('overlay');

    // Parámetros
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const GROUND_HEIGHT = 80;
    const PIPE_WIDTH = 64;
    const PIPE_GAP = 150;
    const PIPE_SPACING = 210;
    const PIPE_SPEED = 4.2;
    const BIRD_SIZE = 28;
    const GRAVITY = 0.45;
    const FLAP_STRENGTH = -8.6;

    // Variables
    let bird, pipes, frame, score, running, gameOver;

    // Score
    const lastScoreEl = document.getElementById('lastScore');
    const highScoreEl = document.getElementById('highScore');

    let lastScore = parseInt(localStorage.getItem('lastScore')) || 0;
    let highScore = parseInt(localStorage.getItem('highScore')) || 0;

    lastScoreEl.textContent = lastScore;
    highScoreEl.textContent = highScore;

    // Sonidos
    const flapSound = new Audio("audios/sfx_wing.wav");
    flapSound.volume = 0.4;
    const hitSound = new Audio("audios/sfx_hit.wav");
    hitSound.volume = 0.4;

    function reset() {
        bird = { x: 90, y: HEIGHT / 2, vy: 0, w: BIRD_SIZE, h: BIRD_SIZE, rotation: 0 };
        pipes = [];
        frame = 0;
        score = 0;
        running = false;
        gameOver = false;
        scoreEl.textContent = score;
        overlay.classList.add('hidden');
        draw();
    }

    function start() {
        running = true;
        gameOver = false;
        pipes = [];
        for (let i = 0; i < 4; i++) addPipe(WIDTH + i * PIPE_SPACING);
        requestAnimationFrame(loop);
    }

    function addPipe(x) {
        const minTop = 60;
        const maxTop = HEIGHT - GROUND_HEIGHT - PIPE_GAP - 60;
        const top = Math.floor(minTop + Math.random() * (Math.max(maxTop - minTop, 1)));
        pipes.push({ x: x, top: top, passed: false });
    }

    function flap() {
        flapSound.currentTime = 0;
        flapSound.play();
        if (!running) start();
        if (gameOver) return;
        bird.vy = FLAP_STRENGTH;
    }

    function collideRect(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function update() {
        frame++;
        bird.vy += GRAVITY;
        bird.y += bird.vy;
        bird.rotation = Math.max(Math.min(bird.vy / 15, 0.9), -0.8);

        // Movimiento de tubos
        for (let i = 0; i < pipes.length; i++) {
            pipes[i].x -= PIPE_SPEED;

            // Reiniciar tubo que sale de la pantalla
            if (pipes[i].x + PIPE_WIDTH < 0) {
                const maxX = pipes.reduce((m, p) => Math.max(m, p.x), 0);
                pipes[i] = {
                    x: maxX + PIPE_SPACING,
                    top: Math.floor(60 + Math.random() * (HEIGHT - GROUND_HEIGHT - PIPE_GAP - 120)),
                    passed: false
                };
            }

            // Contar puntuación
            if (!pipes[i].passed && pipes[i].x + PIPE_WIDTH < bird.x) {
                pipes[i].passed = true;
                score++;
                scoreEl.textContent = score;
            }
        }

        // Colisiones
        for (let i = 0; i < pipes.length; i++) {
            const p = pipes[i];
            const bottomY = p.top + PIPE_GAP;

            if (collideRect(bird.x, bird.y, bird.w, bird.h, p.x, 0, PIPE_WIDTH, p.top) ||
                collideRect(bird.x, bird.y, bird.w, bird.h, p.x, bottomY, PIPE_WIDTH, HEIGHT - GROUND_HEIGHT - bottomY)) {
                endGame();
            }
        }

        // Colisión con suelo
        if (bird.y + bird.h > HEIGHT - GROUND_HEIGHT) {
            bird.y = HEIGHT - GROUND_HEIGHT - bird.h;
            endGame();
        }
        // Cuando llega al techo
        if (bird.y < 0) {
            bird.y = 0;
            bird.vy = 0;
        }
    }

    function endGame() {
        hitSound.currentTime = 0;
        hitSound.play();

        if (gameOver) return;
        gameOver = true;
        running = false;

        lastScore = score;
        if (score > highScore) highScore = score;

        // Guardar en localStorage
        localStorage.setItem('lastScore', lastScore);
        localStorage.setItem('highScore', highScore);

        // Actualizar marcadores
        lastScoreEl.textContent = lastScore;
        highScoreEl.textContent = highScore;

        showGameOver();
    }

    function showGameOver() {
        const finalScoreEl = document.getElementById('finalScore');
        finalScoreEl.textContent = score; // muestra el puntaje actual
        overlay.classList.remove('hidden'); // muestra el overlay
    }

    function loop() {
        if (running) update();
        draw();
        if (!gameOver) requestAnimationFrame(loop);
    }

    function draw() {
        // Fondo cielo
        ctx.fillStyle = '#9be3f3';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Nubes
        for (let i = 0; i < 3; i++) {
            const nx = (frame * 0.2 + i * 160) % (WIDTH + 80) - 40;
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            roundedRect(ctx, nx, 40 + i * 18, 56, 22, 12);
        }

        // Tubos
        for (let i = 0; i < pipes.length; i++) {
            const p = pipes[i];

            // Colores del tubo
            const mainGreen = '#3cb44a';
            const darkGreen = '#2e8b3c';
            const lightGreen = '#58d05a';
            const edgeGreen = '#1c5f2b';

            // Tubo superior
            // Cuerpo principal
            ctx.fillStyle = mainGreen;
            ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);

            // Borde superior claro (pixelado)
            ctx.fillStyle = lightGreen;
            ctx.fillRect(p.x, 0, PIPE_WIDTH, 4);

            // Borde inferior oscuro
            ctx.fillStyle = edgeGreen;
            ctx.fillRect(p.x, p.top - 4, PIPE_WIDTH, 4);

            // Sombra lateral derecha
            ctx.fillStyle = darkGreen;
            ctx.fillRect(p.x + PIPE_WIDTH - 4, 0, 4, p.top);

            // Parte que sobresale
            ctx.fillStyle = mainGreen;
            ctx.fillRect(p.x - 4, p.top - 10, PIPE_WIDTH + 8, 10);
            ctx.fillStyle = edgeGreen;
            ctx.fillRect(p.x - 4, p.top - 10, PIPE_WIDTH + 8, 2);
            ctx.fillStyle = lightGreen;
            ctx.fillRect(p.x - 4, p.top - 4, PIPE_WIDTH + 8, 2);

            // Tubo inferior
            // Cuerpo principal
            ctx.fillStyle = mainGreen;
            ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_WIDTH, HEIGHT - GROUND_HEIGHT - (p.top + PIPE_GAP));

            // Borde superior claro
            ctx.fillStyle = lightGreen;
            ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_WIDTH, 4);

            // Borde inferior oscuro
            ctx.fillStyle = edgeGreen;
            ctx.fillRect(p.x, HEIGHT - GROUND_HEIGHT - 4, PIPE_WIDTH, 4);

            // Sombra lateral derecha
            ctx.fillStyle = darkGreen;
            ctx.fillRect(p.x + PIPE_WIDTH - 4, p.top + PIPE_GAP, 4, HEIGHT - GROUND_HEIGHT - (p.top + PIPE_GAP));

            // Parte que sobresale
            ctx.fillStyle = mainGreen;
            ctx.fillRect(p.x - 4, p.top + PIPE_GAP, PIPE_WIDTH + 8, 10);
            ctx.fillStyle = edgeGreen;
            ctx.fillRect(p.x - 4, p.top + PIPE_GAP, PIPE_WIDTH + 8, 2);
            ctx.fillStyle = lightGreen;
            ctx.fillRect(p.x - 4, p.top + PIPE_GAP + 8, PIPE_WIDTH + 8, 2);
        }

        // Suelo pixelado
        const groundY = HEIGHT - GROUND_HEIGHT;

        // Base
        ctx.fillStyle = '#d4c574';
        ctx.fillRect(0, groundY, WIDTH, GROUND_HEIGHT);

        // Bloques oscuros
        ctx.fillStyle = '#bda85d';
        for (let x = 0; x < WIDTH; x += 16) {
            ctx.fillRect(x, groundY + GROUND_HEIGHT - 12, 16, 12);
        }

        // Césped
        ctx.fillStyle = '#5fa85b';
        for (let x = 0; x < WIDTH; x += 8) {
            const height = 6 + Math.sin(x * 0.4) * 2;
            ctx.fillRect(x, groundY - height, 8, height);
        }

        // Contorno
        ctx.fillStyle = '#3b6c3a';
        ctx.fillRect(0, groundY, WIDTH, 2);

        // Detalles tipo piedra
        ctx.fillStyle = '#a79249';
        for (let i = 0; i < 20; i++) {
            const rx = Math.random() * WIDTH;
            const ry = groundY + Math.random() * (GROUND_HEIGHT - 14);
            ctx.fillRect(rx, ry, 3, 3);
        }

        // Patrón de suelo
        ctx.fillStyle = '#e3d58f';
        for (let x = 0; x < WIDTH; x += 20) {
            ctx.fillRect(x, groundY + 8, 10, 6);
        }

        // Bloques del camino (animación)
        ctx.fillStyle = '#9b8b46';
        for (let i = 0; i < 16; i++) {
            const bx = (i * 40 + (frame * 0.8 % 40));
            ctx.fillRect(bx, groundY + GROUND_HEIGHT - 24, 24, 6);
        }

        // Pájaro
        ctx.save();
        const cx = bird.x + bird.w / 2;
        const cy = bird.y + bird.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate(bird.rotation);

        // Cuerpo
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.w * 0.6, bird.h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ala animada
        const flap = Math.sin(frame * 0.3) * 6;
        ctx.fillStyle = '#f7b500';
        ctx.beginPath();
        ctx.ellipse(-bird.w * 0.1, flap - 2, bird.w * 0.4, bird.h * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pico
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.moveTo(bird.w / 2, -bird.h * 0.1);
        ctx.lineTo(bird.w / 2, bird.h * 0.1);
        ctx.lineTo(bird.w * 0.9, 0);
        ctx.closePath();
        ctx.fill();

        // Ojo
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(bird.w * 0.2, -bird.h * 0.2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupila
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(bird.w * 0.22, -bird.h * 0.2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Cola
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(-bird.w / 2, -bird.h * 0.3);
        ctx.lineTo(-bird.w / 2, bird.h * 0.3);
        ctx.lineTo(-bird.w * 0.9, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function roundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
    }

    window.addEventListener('keydown', e => {
        if ((e.code === 'Space' || e.code === 'ArrowUp') && gameOver) {
            e.preventDefault();
            reset();
        } else if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            flap(); 
        }
    });

    canvas.addEventListener('mousedown', () => flap());
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        flap();
    }, { passive: false });

    // Configuración inicial
    const ratio = window.devicePixelRatio || 1;
    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    reset();
    draw();
})();