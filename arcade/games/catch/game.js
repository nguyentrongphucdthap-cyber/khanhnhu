// ============================================
// CATCH GAME - Khánh Như Edition
// OPTIMIZED for Performance
// ============================================

const CONFIG = {
    BASKET_WIDTH: 70,
    BASKET_HEIGHT: 45,
    ITEM_SIZE: 35,
    BASE_FALL_SPEED: 2.5,
    MAX_FALL_SPEED: 5,
    SPAWN_INTERVAL_START: 1000,
    SPAWN_INTERVAL_MIN: 500,
    MAX_ITEMS: 8,        // Limit items on screen
    MAX_PARTICLES: 30    // Limit particles
};

const ITEMS = [
    { emoji: '🎁', points: 10, weight: 35, color: '#ef4444' },
    { emoji: '⭐', points: 25, weight: 25, color: '#fbbf24' },
    { emoji: '💎', points: 50, weight: 10, color: '#06b6d4' },
    { emoji: '🌸', points: 15, weight: 15, color: '#f472b6' },
    { emoji: '💝', points: 30, weight: 10, color: '#ec4899' },
    { emoji: '💣', points: -1, weight: 15, color: '#374151', isBomb: true }
];

// Rare Items Configuration
const RARE_ITEMS = [
    { id: 'pen_blue', img: 'img/1.png', name: '[5 Bút Xanh] Bút Gel Đệm Xốp Deli Ngòi ST 0.5mm', prob: 0.00001 },
    { id: 'pen_red', img: 'img/1.png', name: '[5 Bút Đỏ] Bút Gel Đệm Xốp Deli Ngòi ST 0.5mm', prob: 0.00001 },
    { id: 'pen_black', img: 'img/1.png', name: '[5 Bút Đen] Bút Gel Đệm Xốp Deli Ngòi ST 0.5mm', prob: 0.00001 },
    { id: 'pencils', img: 'img/2.png', name: 'Hộp 10 bút chì màu Hồng chuyển gradient', prob: 0.000009 },
    { id: 'vangogh', img: 'img/3.png', name: 'Bộ bút bi tranh Van Gogh', prob: 0.00002 },
    { id: 'sharpener', img: 'img/4.png', name: 'Gọt bút chì Deli', prob: 0.00004 },
    { id: 'mug', img: 'img/5.png', name: 'Cốc sứ Thỏ Hồng', prob: 0.000001 }
];

let rareImages = {};

function loadRareImages() {
    RARE_ITEMS.forEach(item => {
        if (!rareImages[item.img]) {
            const img = new Image();
            img.src = item.img;
            rareImages[item.img] = img;
        }
    });
}

let canvas, ctx;
let gameRunning = false;
let score = 0, highScore = 0, lives = 3;
let basket = { x: 0, y: 0, targetX: 0 };
let fallingItems = [];
let particles = [];
let lastSpawnTime = 0;
let spawnInterval = CONFIG.SPAWN_INTERVAL_START;
let difficulty = 1;
let shakeOffset = 0;

// Static background - drawn once
let bgCanvas, bgCtx;

// ============================================
// INITIALIZATION
// ============================================

function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    highScore = parseInt(localStorage.getItem('arcade_catch_highscore') || 0);
    document.getElementById('high-score').textContent = highScore;

    // Touch/Mouse controls
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('mousemove', handleMouse);

    // Keyboard
    document.addEventListener('keydown', handleKey);

    // Buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    canvas.logicalWidth = rect.width;
    canvas.logicalHeight = rect.height;

    basket.x = (rect.width - CONFIG.BASKET_WIDTH) / 2;
    basket.targetX = basket.x;
    basket.y = rect.height - 120; // Raised to avoid overlap with bottom edge inputs

    // Create static background
    createStaticBackground(rect.width, rect.height);
}

function createStaticBackground(width, height) {
    bgCanvas = document.createElement('canvas');
    bgCanvas.width = width;
    bgCanvas.height = height;
    bgCtx = bgCanvas.getContext('2d');

    // Sky gradient
    const skyGrad = bgCtx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#fce7f3');
    skyGrad.addColorStop(0.4, '#fbcfe8');
    skyGrad.addColorStop(0.7, '#f9a8d4');
    skyGrad.addColorStop(1, '#f472b6');
    bgCtx.fillStyle = skyGrad;
    bgCtx.fillRect(0, 0, width, height);

    // Simple clouds (static)
    bgCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    drawStaticCloud(bgCtx, width * 0.15, 40, 25);
    drawStaticCloud(bgCtx, width * 0.5, 55, 30);
    drawStaticCloud(bgCtx, width * 0.8, 35, 20);

    // Ground
    const groundY = height - 35;
    const grassGrad = bgCtx.createLinearGradient(0, groundY, 0, height);
    grassGrad.addColorStop(0, '#86efac');
    grassGrad.addColorStop(1, '#4ade80');
    bgCtx.fillStyle = grassGrad;
    bgCtx.fillRect(0, groundY, width, 35);

    // Simple flowers
    for (let fx = 15; fx < width; fx += 50) {
        drawStaticFlower(bgCtx, fx, groundY - 3);
    }
}

function drawStaticCloud(c, x, y, size) {
    c.beginPath();
    c.arc(x, y, size, 0, Math.PI * 2);
    c.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
    c.arc(x + size * 1.4, y, size * 0.6, 0, Math.PI * 2);
    c.fill();
}

function drawStaticFlower(c, x, y) {
    // Stem
    c.strokeStyle = '#22c55e';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y + 10);
    c.stroke();

    // Petals
    c.fillStyle = '#f472b6';
    c.beginPath();
    c.arc(x, y, 4, 0, Math.PI * 2);
    c.fill();

    // Center
    c.fillStyle = '#fef08a';
    c.beginPath();
    c.arc(x, y, 2, 0, Math.PI * 2);
    c.fill();
}

// ============================================
// INPUT HANDLING
// ============================================

function handleTouch(e) {
    e.preventDefault();
    if (!gameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.logicalWidth / rect.width);

    basket.targetX = x - CONFIG.BASKET_WIDTH / 2;
    basket.targetX = Math.max(0, Math.min(canvas.logicalWidth - CONFIG.BASKET_WIDTH, basket.targetX));
}

function handleMouse(e) {
    if (!gameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.logicalWidth / rect.width);

    basket.targetX = x - CONFIG.BASKET_WIDTH / 2;
    basket.targetX = Math.max(0, Math.min(canvas.logicalWidth - CONFIG.BASKET_WIDTH, basket.targetX));
}

function handleKey(e) {
    if (!gameRunning) return;

    const moveSpeed = 30;
    if (e.code === 'ArrowLeft') {
        basket.targetX = Math.max(0, basket.targetX - moveSpeed);
    } else if (e.code === 'ArrowRight') {
        basket.targetX = Math.min(canvas.logicalWidth - CONFIG.BASKET_WIDTH, basket.targetX + moveSpeed);
    }
}

// ============================================
// GAME CONTROL
// ============================================

function startGame() {
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');

    score = 0;
    lives = 3;
    difficulty = 1;
    fallingItems = [];
    particles = [];
    spawnInterval = CONFIG.SPAWN_INTERVAL_START;
    lastSpawnTime = performance.now();

    basket.x = (canvas.logicalWidth - CONFIG.BASKET_WIDTH) / 2;
    basket.targetX = basket.x;

    document.getElementById('current-score').textContent = '0';
    document.getElementById('lives').textContent = '3';

    gameRunning = true;
    SoundManager.playBGM('ZBwCqs2REtU');
    loadRareImages(); // Ensure images are loading
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    SoundManager.stopBGM();

    // Add score to Wallet
    const currentWallet = parseInt(localStorage.getItem('arcade_wallet_points') || 0);
    localStorage.setItem('arcade_wallet_points', currentWallet + score);

    let isNewHighscore = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('arcade_catch_highscore', highScore);
        document.getElementById('high-score').textContent = highScore;
        isNewHighscore = true;
    }

    document.getElementById('final-score').textContent = 'Điểm: ' + score;
    document.getElementById('highscore-message').innerHTML = isNewHighscore
        ? '<span class="new-highscore">🎉 Kỷ lục mới!</span>'
        : 'Kỷ lục: ' + highScore;
    document.getElementById('gameover-overlay').classList.remove('hidden');
}

// ============================================
// GAME LOGIC - OPTIMIZED
// ============================================

function gameLoop(currentTime) {
    if (!gameRunning) return;

    update(currentTime);
    draw();

    requestAnimationFrame(gameLoop);
}

function update(currentTime) {
    const width = canvas.logicalWidth;
    const height = canvas.logicalHeight;

    // Smooth basket movement
    basket.x += (basket.targetX - basket.x) * 0.25;

    // Increase difficulty slowly
    difficulty = 1 + Math.floor(score / 150) * 0.1;
    spawnInterval = Math.max(CONFIG.SPAWN_INTERVAL_MIN, CONFIG.SPAWN_INTERVAL_START - score * 1.5);

    // Spawn items - with limit
    if (currentTime - lastSpawnTime > spawnInterval && fallingItems.length < CONFIG.MAX_ITEMS) {
        spawnItem(width);
        lastSpawnTime = currentTime;
    }

    // Update falling items
    for (let i = fallingItems.length - 1; i >= 0; i--) {
        const item = fallingItems[i];
        item.y += item.speed;

        // Check collision with basket
        if (item.y + CONFIG.ITEM_SIZE > basket.y &&
            item.y < basket.y + CONFIG.BASKET_HEIGHT &&
            item.x > basket.x - 10 &&
            item.x < basket.x + CONFIG.BASKET_WIDTH + 10) {

            if (item.isBomb) {
                lives--;
                document.getElementById('lives').textContent = lives;
                createParticles(item.x, item.y, '#ef4444', 8);
                shakeScreen();

                if (lives <= 0) {
                    SoundManager.playGameOver();
                    gameOver();
                    return;
                } else {
                    SoundManager.playBad();
                }
            } else if (item.isRare) {
                // Rare Item Caught!
                SoundManager.playCollect(); // Or special sound
                showRewardPopup(item);
                fallingItems.splice(i, 1);
                return; // Stop update loop to pause
            } else {
                score += item.points;
                document.getElementById('current-score').textContent = score;
                createParticles(item.x, item.y, item.color, 6);
                SoundManager.playCollect();
            }

            fallingItems.splice(i, 1);
            continue;
        }

        // Remove if off screen
        if (item.y > height + 50) {
            fallingItems.splice(i, 1);
        }
    }

    // Update particles - simple physics
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.04;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Reset shake
    if (shakeOffset > 0) shakeOffset *= 0.8;
    if (shakeOffset < 0.5) shakeOffset = 0;
}

function spawnItem(width) {
    // Check for rare item spawn first
    const rareRoll = Math.random();
    // Accumulate probabilities roughly for single roll or iterate
    // Since probs are tiny and exclusive events ideally
    for (const rare of RARE_ITEMS) {
        if (Math.random() < rare.prob) { // Independent roll for each? Or single roll?
            // Given the tiny probability, independent rolls are fine and easiest.
            fallingItems.push({
                x: 25 + Math.random() * (width - 50),
                y: -CONFIG.ITEM_SIZE * 2, // Bigger
                isRare: true,
                imgSrc: rare.img,
                name: rare.name,
                points: 999, // Bonus points
                speed: CONFIG.BASE_FALL_SPEED * 1.5 // Fall faster? or slower? Let's say normal.
            });
            return; // Spawn only one thing
        }
    }

    const totalWeight = ITEMS.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    let selected = ITEMS[0];

    for (const item of ITEMS) {
        rand -= item.weight;
        if (rand <= 0) { selected = item; break; }
    }

    const fallSpeed = CONFIG.BASE_FALL_SPEED + difficulty * 0.4 + Math.random() * 0.3;

    fallingItems.push({
        x: 25 + Math.random() * (width - 50),
        y: -CONFIG.ITEM_SIZE,
        emoji: selected.emoji,
        points: selected.points,
        color: selected.color,
        isBomb: selected.isBomb || false,
        speed: fallSpeed
    });
}

function createParticles(x, y, color, count) {
    // Limit total particles
    const canAdd = CONFIG.MAX_PARTICLES - particles.length;
    const toAdd = Math.min(count, canAdd);

    for (let i = 0; i < toAdd; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            color,
            size: 3 + Math.random() * 4,
            life: 1
        });
    }
}

function shakeScreen() {
    shakeOffset = 6;
}

// ============================================
// DRAWING - OPTIMIZED
// ============================================

function draw() {
    const width = canvas.logicalWidth;
    const height = canvas.logicalHeight;

    // Apply shake
    ctx.save();
    if (shakeOffset > 0) {
        ctx.translate((Math.random() - 0.5) * shakeOffset, (Math.random() - 0.5) * shakeOffset);
    }

    // Draw static background (cached)
    ctx.drawImage(bgCanvas, 0, 0);

    // Particles
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Falling items - simple drawing
    ctx.font = `${CONFIG.ITEM_SIZE}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < fallingItems.length; i++) {
        const item = fallingItems[i];
        if (item.isRare && rareImages[item.imgSrc]) {
            // Draw Rare Image
            const img = rareImages[item.imgSrc];
            const size = CONFIG.ITEM_SIZE * 2.5; // Bigger
            ctx.save();
            ctx.shadowColor = 'gold';
            ctx.shadowBlur = 15;
            ctx.drawImage(img, item.x - size / 2, item.y - size / 2, size, size);
            ctx.restore();
        } else {
            ctx.fillText(item.emoji, item.x, item.y);
        }
    }

    // Basket
    drawBasket();

    ctx.restore();
}

function drawBasket() {
    const x = basket.x;
    const y = basket.y;
    const w = CONFIG.BASKET_WIDTH;
    const h = CONFIG.BASKET_HEIGHT;

    // Basket body
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 12, y + h);
    ctx.lineTo(x + w - 12, y + h);
    ctx.lineTo(x + w - 5, y);
    ctx.closePath();
    ctx.fill();

    // Basket rim
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x, y - 5, w, 8);

    // Weave lines
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
        const lineY = y + 10 + i * 12;
        ctx.beginPath();
        ctx.moveTo(x + 12, lineY);
        ctx.lineTo(x + w - 12, lineY);
        ctx.stroke();
    }

    // Handle
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 8, 18, Math.PI, 0);
    ctx.stroke();
}

// Reward Popup Handling
function showRewardPopup(item) {
    gameRunning = false; // Pause game
    const overlay = document.getElementById('reward-overlay');
    const imgEl = document.getElementById('reward-img');
    const nameEl = document.getElementById('reward-name');

    imgEl.src = item.imgSrc;
    nameEl.textContent = item.name;

    overlay.classList.add('visible');
    // Also add special sound effect?
}

function closeRewardPopup() {
    const overlay = document.getElementById('reward-overlay');
    overlay.classList.remove('visible');
    gameRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Make globally available
window.showRewardPopup = showRewardPopup;
window.closeRewardPopup = closeRewardPopup;

// Start
init();
