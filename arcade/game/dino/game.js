// ============================================
// DINO GAME - Khánh Như Edition
// Optimized for Mobile-First Experience
// ============================================

// Game Configuration - Balanced for fun gameplay
const CONFIG = {
    // Physics
    GRAVITY: 0.6,
    JUMP_FORCE: -12,
    DOUBLE_JUMP_FORCE: -10,

    // Player
    PLAYER_WIDTH: 45,
    PLAYER_HEIGHT: 55,
    DUCK_HEIGHT: 30,

    // Game balance
    BASE_SPEED: 5,
    MAX_SPEED: 12,
    SPEED_INCREMENT: 0.001,

    // Spawning
    MIN_OBSTACLE_GAP: 800,
    MAX_OBSTACLE_GAP: 1500,
    DIAMOND_CHANCE: 0.25,

    // Ground - Raised higher to accommodate overlay controls
    GROUND_HEIGHT: 120
};

// Game State
let canvas, ctx;
let gameRunning = false;
let score = 0;
let highScore = 0;
let gameSpeed = CONFIG.BASE_SPEED;

// Player
let player = {
    x: 60,
    y: 0,
    width: CONFIG.PLAYER_WIDTH,
    height: CONFIG.PLAYER_HEIGHT,
    velocityY: 0,
    jumping: false,
    ducking: false,
    canDoubleJump: true,
    animFrame: 0
};

// Game objects
let obstacles = [];
let diamonds = [];
let clouds = [];
let particles = [];

// Timing
let lastTime = 0;
let nextObstacleDistance = 0;

// Touch state
let jumpPressed = false;
let duckPressed = false;

// ============================================
// INITIALIZATION
// ============================================

function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // High DPI canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load highscore
    highScore = parseInt(localStorage.getItem('arcade_dino_highscore') || 0);
    document.getElementById('high-score').textContent = highScore;

    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Canvas touch/click (for desktop and fallback)
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });

    // Mobile button controls
    setupMobileControls();

    // Start/restart buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);

    // Initialize clouds
    initClouds();
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Store logical dimensions
    canvas.logicalWidth = rect.width;
    canvas.logicalHeight = rect.height;
}

function setupMobileControls() {
    const jumpBtn = document.getElementById('jump-btn');
    const duckBtn = document.getElementById('duck-btn');

    // Jump button
    jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        jumpBtn.classList.add('pressed');
        handleJump();
    }, { passive: false });

    jumpBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        jumpBtn.classList.remove('pressed');
    }, { passive: false });

    // Duck button
    duckBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        duckBtn.classList.add('pressed');
        duckPressed = true;
        player.ducking = true;
    }, { passive: false });

    duckBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        duckBtn.classList.remove('pressed');
        duckPressed = false;
        player.ducking = false;
    }, { passive: false });

    // Mouse fallback for buttons
    jumpBtn.addEventListener('mousedown', () => handleJump());
    duckBtn.addEventListener('mousedown', () => { player.ducking = true; });
    duckBtn.addEventListener('mouseup', () => { player.ducking = false; });
    duckBtn.addEventListener('mouseleave', () => { player.ducking = false; });
}

function initClouds() {
    clouds = [];
    for (let i = 0; i < 4; i++) {
        clouds.push({
            x: Math.random() * 800,
            y: 20 + Math.random() * 60,
            size: 15 + Math.random() * 25,
            speed: 0.3 + Math.random() * 0.5
        });
    }
}

// ============================================
// INPUT HANDLING
// ============================================

function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameRunning) {
            startGame();
        } else {
            handleJump();
        }
    } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        player.ducking = true;
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowDown') {
        player.ducking = false;
    }
}

function handleCanvasClick() {
    if (!gameRunning) return;
    handleJump();
}

function handleCanvasTouchStart(e) {
    e.preventDefault();
    if (!gameRunning) return;
    handleJump();
}

function handleJump() {
    if (!gameRunning) return;

    if (!player.jumping) {
        // First jump
        player.velocityY = CONFIG.JUMP_FORCE;
        player.jumping = true;
        player.canDoubleJump = true;
        createJumpParticles();
        SoundManager.playJump();
    } else if (player.canDoubleJump) {
        // Double jump
        player.velocityY = CONFIG.DOUBLE_JUMP_FORCE;
        player.canDoubleJump = false;
        createJumpParticles();
        SoundManager.playJump();
    }
}

// ============================================
// GAME CONTROL
// ============================================

function startGame() {
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');

    // Reset game state
    score = 0;
    gameSpeed = CONFIG.BASE_SPEED;
    obstacles = [];
    diamonds = [];
    particles = [];
    nextObstacleDistance = 500;

    // Reset player
    const groundY = canvas.logicalHeight - CONFIG.GROUND_HEIGHT - CONFIG.PLAYER_HEIGHT;
    player = {
        x: 60,
        y: groundY,
        width: CONFIG.PLAYER_WIDTH,
        height: CONFIG.PLAYER_HEIGHT,
        velocityY: 0,
        jumping: false,
        ducking: false,
        canDoubleJump: true,
        animFrame: 0
    };

    document.getElementById('current-score').textContent = '0';

    gameRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;

    // Update highscore
    let isNewHighscore = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('arcade_dino_highscore', highScore);
        document.getElementById('high-score').textContent = highScore;
        isNewHighscore = true;
    }

    // Show game over overlay
    document.getElementById('final-score').textContent = 'Điểm: ' + score;
    const message = document.getElementById('highscore-message');
    if (isNewHighscore) {
        message.innerHTML = '<span class="new-highscore">🎉 Kỷ lục mới!</span>';
    } else {
        message.textContent = 'Kỷ lục: ' + highScore;
    }
    document.getElementById('gameover-overlay').classList.remove('hidden');
}

// ============================================
// GAME LOGIC
// ============================================

function gameLoop(currentTime) {
    if (!gameRunning) return;

    const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2); // Cap at 2x speed
    lastTime = currentTime;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    const width = canvas.logicalWidth;
    const height = canvas.logicalHeight;
    const groundY = height - CONFIG.GROUND_HEIGHT;

    // Increase speed gradually
    gameSpeed = Math.min(CONFIG.MAX_SPEED, gameSpeed + CONFIG.SPEED_INCREMENT * dt);

    // Update player
    updatePlayer(dt, groundY);

    // Update obstacles
    updateObstacles(dt, width);

    // Update diamonds
    updateDiamonds(dt, width);

    // Update clouds
    updateClouds(dt, width);

    // Update particles
    updateParticles(dt);

    // Spawn obstacles
    spawnObstacles(width, height);

    // Check collisions
    checkCollisions();

    // Update score display
    document.getElementById('current-score').textContent = score;
}

function updatePlayer(dt, groundY) {
    // Duck height adjustment
    if (player.ducking && !player.jumping) {
        player.height = CONFIG.DUCK_HEIGHT;
    } else {
        player.height = CONFIG.PLAYER_HEIGHT;
    }

    // Apply gravity
    player.velocityY += CONFIG.GRAVITY * dt;
    player.y += player.velocityY * dt;

    // Ground collision
    const playerGroundY = groundY - player.height;
    if (player.y >= playerGroundY) {
        player.y = playerGroundY;
        player.velocityY = 0;
        player.jumping = false;
        player.canDoubleJump = true;
    }

    // Animation
    if (!player.jumping) {
        player.animFrame = (player.animFrame + 0.15 * dt) % 2;
    }
}

function updateObstacles(dt, width) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed * dt;

        // Score when passed
        if (!obs.passed && obs.x + obs.width < player.x) {
            obs.passed = true;
            score += 10;
        }

        // Remove off-screen
        if (obs.x < -100) {
            obstacles.splice(i, 1);
        }
    }
}

function updateDiamonds(dt, width) {
    for (let i = diamonds.length - 1; i >= 0; i--) {
        const d = diamonds[i];
        d.x -= gameSpeed * dt * 0.9;
        d.floatOffset = Math.sin(performance.now() / 200 + d.x) * 5;

        // Remove off-screen
        if (d.x < -50) {
            diamonds.splice(i, 1);
        }
    }
}

function updateClouds(dt, width) {
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed * dt;
        if (cloud.x < -60) {
            cloud.x = width + 60;
            cloud.y = 20 + Math.random() * 60;
        }
    });
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.2 * dt;
        p.life -= 0.03 * dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function spawnObstacles(width, height) {
    nextObstacleDistance -= gameSpeed;

    if (nextObstacleDistance <= 0) {
        const groundY = height - CONFIG.GROUND_HEIGHT;
        const types = ['cactus', 'cactus', 'rock', 'bird']; // More ground obstacles
        const type = types[Math.floor(Math.random() * types.length)];

        let obs = { x: width + 20, type, passed: false };

        if (type === 'bird') {
            // Bird at different heights
            const heights = [groundY - 80, groundY - 50, groundY - 110];
            obs.y = heights[Math.floor(Math.random() * heights.length)];
            obs.width = 40;
            obs.height = 30;
        } else if (type === 'cactus') {
            obs.y = groundY - 45;
            obs.width = 25;
            obs.height = 45;
        } else {
            obs.y = groundY - 30;
            obs.width = 35;
            obs.height = 30;
        }

        obstacles.push(obs);

        // Spawn diamond occasionally
        if (Math.random() < CONFIG.DIAMOND_CHANCE) {
            diamonds.push({
                x: width + 150 + Math.random() * 100,
                y: groundY - 80 - Math.random() * 40,
                collected: false,
                floatOffset: 0
            });
        }

        // Set next obstacle distance based on speed
        const minGap = CONFIG.MIN_OBSTACLE_GAP - (gameSpeed - CONFIG.BASE_SPEED) * 30;
        const maxGap = CONFIG.MAX_OBSTACLE_GAP - (gameSpeed - CONFIG.BASE_SPEED) * 40;
        nextObstacleDistance = minGap + Math.random() * (maxGap - minGap);
    }
}

function checkCollisions() {
    const playerBox = {
        x: player.x + 8,
        y: player.y + 5,
        width: player.width - 16,
        height: player.height - 10
    };

    // Check obstacle collisions
    for (const obs of obstacles) {
        const obsBox = {
            x: obs.x + 5,
            y: obs.y + 5,
            width: obs.width - 10,
            height: obs.height - 10
        };

        if (boxCollision(playerBox, obsBox)) {
            SoundManager.playGameOver();
            gameOver();
            return;
        }
    }

    // Check diamond collection
    for (let i = diamonds.length - 1; i >= 0; i--) {
        const d = diamonds[i];
        if (d.collected) continue;

        const diamondBox = {
            x: d.x - 12,
            y: d.y + d.floatOffset - 12,
            width: 24,
            height: 24
        };

        if (boxCollision(playerBox, diamondBox)) {
            d.collected = true;
            score += 50;
            SoundManager.playCollect();
            createCollectParticles(d.x, d.y);
            diamonds.splice(i, 1);
        }
    }
}

function boxCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

// ============================================
// PARTICLES
// ============================================

function createJumpParticles() {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 2,
            color: '#a8e6cf',
            size: 3 + Math.random() * 3,
            life: 1
        });
    }
}

function createCollectParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#00CED1',
            size: 3 + Math.random() * 4,
            life: 1
        });
    }
}

// ============================================
// DRAWING - Enhanced Graphics
// ============================================

// Background elements (initialized once)
let mountains = [];
let trees = [];
let bgInitialized = false;

function initBackground(width, height) {
    if (bgInitialized) return;

    // Create mountains
    mountains = [
        { x: width * 0.1, width: 120, height: 80, color: '#a8d5ba' },
        { x: width * 0.3, width: 150, height: 100, color: '#90c4a8' },
        { x: width * 0.55, width: 180, height: 120, color: '#7ab896' },
        { x: width * 0.8, width: 130, height: 90, color: '#a8d5ba' }
    ];

    // Create trees
    trees = [];
    for (let i = 0; i < 8; i++) {
        trees.push({
            x: i * 100 + Math.random() * 50,
            scale: 0.6 + Math.random() * 0.4
        });
    }

    bgInitialized = true;
}

function draw() {
    const width = canvas.logicalWidth;
    const height = canvas.logicalHeight;
    const groundY = height - CONFIG.GROUND_HEIGHT;

    initBackground(width, height);
    ctx.clearRect(0, 0, width, height);

    // Sky gradient - beautiful sunset/day colors
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(0.3, '#98d4e8');
    skyGrad.addColorStop(0.6, '#b8e6dc');
    skyGrad.addColorStop(1, '#d4f0e0');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, groundY);

    // Sun with rays
    drawSun(width - 55, 40);

    // Clouds - fluffy style
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    clouds.forEach(c => drawFluffyCloud(c.x, c.y, c.size));

    // Mountains in background
    mountains.forEach(m => drawMountain(m, groundY));

    // Trees in background
    const treeOffset = (performance.now() / 100 * gameSpeed) % 100;
    trees.forEach((tree, i) => {
        const tx = ((tree.x - treeOffset) % (width + 100)) - 50;
        drawTree(tx, groundY, tree.scale);
    });

    // Ground gradient
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, '#7CB342');
    groundGrad.addColorStop(0.3, '#689F38');
    groundGrad.addColorStop(1, '#558B2F');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, CONFIG.GROUND_HEIGHT);

    // Ground texture - grass tufts
    const grassOffset = (performance.now() / 40 * gameSpeed) % 30;
    for (let x = -grassOffset; x < width + 30; x += 30) {
        drawGrassTuft(x, groundY);
    }

    // Ground line
    ctx.strokeStyle = '#5a8f2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Diamonds
    diamonds.forEach(d => {
        if (!d.collected) {
            drawDiamond(d.x, d.y + d.floatOffset);
        }
    });

    // Obstacles
    obstacles.forEach(obs => drawObstacle(obs, groundY));

    // Player
    drawPlayer(groundY);
}

function drawSun(x, y) {
    // Sun glow
    const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, 50);
    glowGrad.addColorStop(0, 'rgba(255, 236, 179, 0.8)');
    glowGrad.addColorStop(0.5, 'rgba(255, 236, 179, 0.3)');
    glowGrad.addColorStop(1, 'rgba(255, 236, 179, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(x - 50, y - 50, 100, 100);

    // Sun rays
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + performance.now() / 5000;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30);
        ctx.lineTo(x + Math.cos(angle) * 45, y + Math.sin(angle) * 45);
        ctx.stroke();
    }

    // Sun body
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    // Sun highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - 6, y - 6, 10, 0, Math.PI * 2);
    ctx.fill();
}

function drawFluffyCloud(x, y, size) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y - size * 0.3, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 1.2, y - size * 0.1, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 1.6, y + size * 0.1, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawMountain(m, groundY) {
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.moveTo(m.x, groundY);
    ctx.lineTo(m.x + m.width / 2, groundY - m.height);
    ctx.lineTo(m.x + m.width, groundY);
    ctx.closePath();
    ctx.fill();

    // Snow cap
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(m.x + m.width / 2, groundY - m.height);
    ctx.lineTo(m.x + m.width / 2 - 15, groundY - m.height + 20);
    ctx.lineTo(m.x + m.width / 2 + 15, groundY - m.height + 20);
    ctx.closePath();
    ctx.fill();
}

function drawTree(x, groundY, scale) {
    const h = 35 * scale;
    const w = 25 * scale;

    // Trunk
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x + w / 2 - 3 * scale, groundY - h * 0.4, 6 * scale, h * 0.4);

    // Foliage layers
    ctx.fillStyle = '#4a7c23';
    ctx.beginPath();
    ctx.moveTo(x, groundY - h * 0.3);
    ctx.lineTo(x + w / 2, groundY - h);
    ctx.lineTo(x + w, groundY - h * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#5a8f2a';
    ctx.beginPath();
    ctx.moveTo(x + 3 * scale, groundY - h * 0.5);
    ctx.lineTo(x + w / 2, groundY - h * 0.85);
    ctx.lineTo(x + w - 3 * scale, groundY - h * 0.5);
    ctx.closePath();
    ctx.fill();
}

function drawGrassTuft(x, groundY) {
    ctx.fillStyle = '#5a8f2a';
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x + 4, groundY - 8);
    ctx.lineTo(x + 8, groundY);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 6, groundY);
    ctx.lineTo(x + 12, groundY - 10);
    ctx.lineTo(x + 18, groundY);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 14, groundY);
    ctx.lineTo(x + 18, groundY - 6);
    ctx.lineTo(x + 22, groundY);
    ctx.fill();
}

function drawDiamond(x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Glow
    ctx.shadowColor = '#00CED1';
    ctx.shadowBlur = 10;

    // Diamond shape
    ctx.fillStyle = '#00CED1';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(4, -4);
    ctx.lineTo(0, 0);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawObstacle(obs, groundY) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';

    if (obs.type === 'cactus') {
        ctx.fillStyle = '#064e3b'; // Very dark green for contrast

        // Use path for complex shape to stroke it properly
        const x = obs.x, y = obs.y;

        // Draw logic simplified for visual clarity but keeping the shape structure
        ctx.beginPath();
        // Main body
        ctx.rect(x + 8, y, 9, obs.height);
        // Left arm
        ctx.rect(x, y + 12, 6, 18);
        // Right arm
        ctx.rect(x + 19, y + 20, 6, 14);

        ctx.fill();
        ctx.stroke();

    } else if (obs.type === 'rock') {
        ctx.fillStyle = '#1f2937'; // Dark gray/black
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + 8, obs.y);
        ctx.lineTo(obs.x + 25, obs.y + 5);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner detail
        ctx.fillStyle = '#4b5563';
        ctx.beginPath();
        ctx.moveTo(obs.x + 20, obs.y + obs.height);
        ctx.lineTo(obs.x + 22, obs.y + 8);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();

    } else if (obs.type === 'bird') {
        const x = obs.x, y = obs.y;
        const wingFlap = Math.sin(performance.now() / 80) * 8;

        // Body
        ctx.fillStyle = '#9a3412'; // Darker orange/brown
        ctx.beginPath();
        ctx.ellipse(x + 18, y + 15, 16, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Wings
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 12);
        ctx.lineTo(x - 5, y + wingFlap);
        ctx.lineTo(x + 15, y + 12);
        ctx.fill();
        ctx.stroke();

        // Beak
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(x + 32, y + 13);
        ctx.lineTo(x + 42, y + 15);
        ctx.lineTo(x + 32, y + 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + 28, y + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(x + 29, y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPlayer(groundY) {
    const x = player.x;
    const y = player.y;

    ctx.save();

    if (player.ducking && !player.jumping) {
        // Ducking dino - horizontal
        ctx.fillStyle = '#4CAF50';

        // Body
        ctx.beginPath();
        ctx.ellipse(x + 25, y + 18, 25, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(x + 48, y + 15, 12, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + 52, y + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(x + 53, y + 12, 2, 0, Math.PI * 2);
        ctx.fill();

    } else {
        // Standing/running/jumping dino
        ctx.fillStyle = '#4CAF50';

        // Body
        ctx.beginPath();
        ctx.ellipse(x + 22, y + 32, 18, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(x + 35, y + 12, 14, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillRect(x + 40, y + 6, 12, 10);

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + 40, y + 9, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(x + 41, y + 9, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#388E3C';
        if (player.jumping) {
            // Jumping pose
            ctx.fillRect(x + 12, y + 48, 8, 10);
            ctx.fillRect(x + 28, y + 48, 8, 10);
        } else {
            // Running animation
            const legOffset = Math.floor(player.animFrame) * 8 - 4;
            ctx.fillRect(x + 12, y + 48, 8, 10 + legOffset);
            ctx.fillRect(x + 28, y + 48, 8, 10 - legOffset);
        }

        // Tail
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 25);
        ctx.lineTo(x - 12, y + 35);
        ctx.lineTo(x + 5, y + 42);
        ctx.closePath();
        ctx.fill();

        // Spikes
        ctx.fillStyle = '#388E3C';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 15 + i * 10, y + 10);
            ctx.lineTo(x + 20 + i * 10, y - 2);
            ctx.lineTo(x + 25 + i * 10, y + 10);
            ctx.closePath();
            ctx.fill();
        }
    }

    ctx.restore();
}

// Start the game
init();
