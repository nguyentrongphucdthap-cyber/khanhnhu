// ============================================
// BẢO VỆ KHÁNH NHƯ - Arena Defense + Roguelike
// Tower Defense with Agents & Currency System
// ============================================

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // Player
    PLAYER_SPEED: 4,
    PLAYER_SIZE: 30,

    // Bullets
    BULLET_SPEED: 8,
    FIRE_RATE: 300,
    BULLET_DAMAGE: 1,
    BULLET_RANGE: 250,        // Increased for better mobile visibility
    BULLET_RANGE_MOBILE: 320, // Even higher for mobile devices

    // Khánh Như
    KN_HEALTH: 100,
    KN_SIZE: 40,

    // XP & Leveling
    BASE_XP_NEEDED: 50,
    XP_MULTIPLIER: 1.5,

    // Spawning (increased for better pacing)
    SPAWN_RATE_START: 3000,
    SPAWN_RATE_MIN: 800,

    // Bosses
    MINI_BOSS_TIME: 120,
    BOSS_TIME: 300,

    // Limits
    MAX_ENEMIES: 30,
    MAX_BULLETS: 60,
    MAX_PARTICLES: 40,
    MAX_AGENTS: 3,

    // Upgrade max level for "Supreme" status
    MAX_UPGRADE_LEVEL: 6
};

// Enemy types with images and gold drops
// Phase 1 (0-2 min): monster, monster2
// Phase 2 (2-4 min): monster3, monster4  
// Phase 3 (4+ min): monster5, monster2
// Special phase (boss wave): all 4 types
// NOTE: Speed balanced for gameplay
const ENEMIES = {
    // Phase 1 monsters
    monster1: { img: 'img/monster.png', hp: 1, speed: 1.0, xp: 8, gold: 4, damage: 4, width: 38, height: 38, phase: 1 },
    monster2: { img: 'img/monster2.png', hp: 1, speed: 0.9, xp: 10, gold: 5, damage: 5, width: 42, height: 42, phase: 1 },
    // Phase 2 monsters
    monster3: { img: 'img/monster3.png', hp: 2, speed: 1.1, xp: 12, gold: 6, damage: 6, width: 40, height: 40, phase: 2 },
    monster4: { img: 'img/monster4.png', hp: 1, speed: 1.4, xp: 8, gold: 4, damage: 3, width: 34, height: 34, phase: 2 },
    // Phase 3 monsters  
    monster5: { img: 'img/monster5.png', hp: 2, speed: 0.8, xp: 15, gold: 10, damage: 8, width: 46, height: 46, phase: 3 },
    // Bosses
    miniBoss: { img: 'img/miniboss1.png', hp: 25, speed: 0.5, xp: 100, gold: 50, damage: 15, width: 70, height: 70, isBoss: true },
    boss: { img: 'img/boss1.png', hp: 80, speed: 0.4, xp: 300, gold: 150, damage: 25, width: 90, height: 90, isBoss: true }
};

// Phase definitions - which monsters appear in each phase
const PHASES = {
    1: ['monster1', 'monster2'],      // 0-2 minutes
    2: ['monster3', 'monster4'],      // 2-4 minutes
    3: ['monster5', 'monster2'],      // 4+ minutes
    special: ['monster1', 'monster3', 'monster4', 'monster5'] // Boss wave
};

// Image cache with aspect ratios
const images = {};
const imageAspects = {}; // Store original aspect ratios
let imagesLoaded = false;

// Upgrades with level tracking
const UPGRADES = [
    {
        id: 'damage', icon: '⚔️', name: 'Sát thương', desc: '+20% damage',
        apply: (s) => s.bulletDamage *= 1.2, maxName: '⚔️ Tử Thần', maxDesc: 'Đạn đỏ hủy diệt!'
    },
    {
        id: 'speed', icon: '👟', name: 'Tốc độ', desc: '+15% speed',
        apply: (s) => s.playerSpeed *= 1.15, maxName: '👟 Thần Tốc', maxDesc: 'Nhanh như chớp!'
    },
    {
        id: 'firerate', icon: '🔥', name: 'Tốc bắn', desc: '+20% fire rate',
        apply: (s) => s.fireRate *= 0.8, maxName: '🔥 Liên Hoàn', maxDesc: 'Bắn không ngừng!'
    },
    {
        id: 'heal', icon: '💖', name: 'Hồi máu', desc: 'Hồi 30 HP',
        apply: (s) => s.knHealth = Math.min(s.knMaxHealth, s.knHealth + 30), maxName: '💖 Bất Tử', maxDesc: 'Hồi 50% HP!'
    },
    {
        id: 'multishot', icon: '🎯', name: 'Đa đạn', desc: '+1 đạn',
        apply: (s) => s.bulletCount = Math.min(7, s.bulletCount + 1), maxName: '🎯 Mưa Đạn', maxDesc: '7 đạn cùng lúc!'
    },
    {
        id: 'range', icon: '📏', name: 'Tầm xa', desc: '+25% range',
        apply: (s) => s.bulletRange *= 1.25, maxName: '📏 Vô Cực', maxDesc: 'Bắn cực xa!'
    },
    {
        id: 'pierce', icon: '💫', name: 'Xuyên giáp', desc: '+1 xuyên',
        apply: (s) => s.bulletPierce += 1, maxName: '💫 Xuyên Không', maxDesc: 'Xuyên 6 quái!'
    },
    {
        id: 'shield', icon: '🛡️', name: 'Giáp', desc: '+20 Max HP',
        apply: (s) => { s.knMaxHealth += 20; s.knHealth += 20; }, maxName: '🛡️ Thần Hộ', maxDesc: 'Giáp tối thượng!'
    }
];

// Agent types for purchase
const AGENT_TYPES = [
    { id: 'shooter', emoji: '🤖', name: 'Xạ Thủ', cost: 100, fireRate: 800, damage: 0.5, range: 150 },
    { id: 'sniper', emoji: '🎖️', name: 'Bắn Tỉa', cost: 200, fireRate: 1500, damage: 1.5, range: 300 },
    { id: 'rapid', emoji: '⚡', name: 'Súng Máy', cost: 150, fireRate: 300, damage: 0.3, range: 120 }
];

// ============================================
// GAME STATE
// ============================================

let canvas, ctx;
let gameRunning = false;
let gamePaused = false;

// Game stats
let stats = {};
let upgradeLevels = {}; // Track each upgrade level
let currentPhase = 1;

// Entities
let player = { x: 0, y: 0, angle: 0 };
let kn = { x: 0, y: 0 };
let enemies = [];
let bullets = [];
let particles = [];
let agents = []; // Helper agents

// Timing
let lastFireTime = 0;
let lastSpawnTime = 0;
let lastBossTime = 0;
let gameStartTime = 0;

// Input
let moveDir = { x: 0, y: 0 };
let joystickActive = false;
let firePressed = false;

// ============================================
// IMAGE LOADING
// ============================================

function loadImages() {
    const imagesToLoad = [
        { key: 'player', src: 'img/main.png' },
        { key: 'monster1', src: 'img/monster.png' },
        { key: 'monster2', src: 'img/monster2.png' },
        { key: 'monster3', src: 'img/monster3.png' },
        { key: 'monster4', src: 'img/monster4.png' },
        { key: 'monster5', src: 'img/monster5.png' },
        { key: 'miniBoss', src: 'img/miniboss1.png' },
        { key: 'boss', src: 'img/boss1.png' }
    ];

    let loaded = 0;

    imagesToLoad.forEach(item => {
        const img = new Image();
        img.onload = () => {
            loaded++;
            // Store aspect ratio for proper scaling
            imageAspects[item.key] = img.width / img.height;
            if (loaded === imagesToLoad.length) {
                imagesLoaded = true;
                console.log('All images loaded!');
            }
        };
        img.onerror = () => {
            console.error('Failed to load:', item.src);
            loaded++;
        };
        img.src = item.src;
        images[item.key] = img;
    });
}

// ============================================
// INITIALIZATION
// ============================================

// Cache DOM elements
let uiElements = {};

function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // Cache UI for performance
    uiElements = {
        score: document.getElementById('score'),
        level: document.getElementById('level'),
        timer: document.getElementById('timer'),
        gold: document.getElementById('gold'),
        xpBar: document.getElementById('xp-bar'),
        xpText: document.getElementById('xp-text'),
        knHealth: document.getElementById('kn-health')
    };

    // Load images first
    loadImages();

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Keyboard
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Joystick & Fire
    setupJoystick();
    setupFireButton();

    // Buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);

    // Shop button
    document.getElementById('shop-btn').addEventListener('click', toggleShop);
    document.getElementById('close-shop').addEventListener('click', toggleShop);
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Mobile scaling: 70% zoom to see more of the map
    const isMobile = window.innerWidth < 768; // Simple check for mobile width
    const scaleFactor = isMobile ? 0.7 : 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale context: include DPR and the zoom-out factor
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.scale(dpr * scaleFactor, dpr * scaleFactor);

    // Logical width is larger when scaled down (zoomed out)
    canvas.logicalWidth = rect.width / scaleFactor;
    canvas.logicalHeight = rect.height / scaleFactor;

    // Recenter entities based on new logical dimensions
    kn.x = canvas.logicalWidth / 2;
    kn.y = canvas.logicalHeight / 2;

    // Update player relative to new center if needed
    // Only reset if it seems to be initialization or resize causing misalignment
    if (!gameRunning) {
        player.x = kn.x;
        player.y = kn.y + 60;
    }
}

function setupJoystick() {
    const base = document.getElementById('joystick-base');
    const stick = document.getElementById('joystick-stick');
    const container = document.getElementById('joystick-container');

    let baseRect;
    const maxDist = 35;

    function updateJoystick(clientX, clientY) {
        if (!baseRect) baseRect = base.getBoundingClientRect();

        const centerX = baseRect.left + baseRect.width / 2;
        const centerY = baseRect.top + baseRect.height / 2;

        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
            dx = dx / dist * maxDist;
            dy = dy / dist * maxDist;
        }

        stick.style.transform = `translate(${dx}px, ${dy}px)`;
        moveDir.x = dx / maxDist;
        moveDir.y = dy / maxDist;
    }

    function resetJoystick() {
        stick.style.transform = 'translate(0, 0)';
        moveDir.x = 0;
        moveDir.y = 0;
        joystickActive = false;
    }

    container.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystickActive = true;
        baseRect = base.getBoundingClientRect();
        updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (joystickActive) updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    container.addEventListener('touchend', resetJoystick);
    container.addEventListener('touchcancel', resetJoystick);
}

function setupFireButton() {
    const fireBtn = document.getElementById('fire-btn');

    fireBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        firePressed = true;
        fireBtn.classList.add('pressed');
    }, { passive: false });

    fireBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        firePressed = false;
        fireBtn.classList.remove('pressed');
    }, { passive: false });

    fireBtn.addEventListener('mousedown', () => {
        firePressed = true;
        fireBtn.classList.add('pressed');
    });

    fireBtn.addEventListener('mouseup', () => {
        firePressed = false;
        fireBtn.classList.remove('pressed');
    });

    fireBtn.addEventListener('mouseleave', () => {
        firePressed = false;
        fireBtn.classList.remove('pressed');
    });
}

// ============================================
// INPUT HANDLING
// ============================================

const keys = {};

// Movement keys that should NOT trigger fire
const MOVE_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'];
const SPECIAL_KEYS = ['Escape', 'Tab', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight'];

function handleKeyDown(e) {
    keys[e.code] = true;
    updateMoveDir();

    // Fire with ANY key except movement and special keys
    if (!MOVE_KEYS.includes(e.code) && !SPECIAL_KEYS.includes(e.code)) {
        e.preventDefault();
        firePressed = true;
    }
}

function handleKeyUp(e) {
    keys[e.code] = false;
    updateMoveDir();

    // Stop firing when key released
    if (!MOVE_KEYS.includes(e.code) && !SPECIAL_KEYS.includes(e.code)) {
        firePressed = false;
    }
}

function updateMoveDir() {
    if (joystickActive) return;

    moveDir.x = 0;
    moveDir.y = 0;

    if (keys['ArrowLeft'] || keys['KeyA']) moveDir.x -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) moveDir.x += 1;
    if (keys['ArrowUp'] || keys['KeyW']) moveDir.y -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) moveDir.y += 1;

    const len = Math.sqrt(moveDir.x * moveDir.x + moveDir.y * moveDir.y);
    if (len > 1) {
        moveDir.x /= len;
        moveDir.y /= len;
    }
}

// ============================================
// GAME CONTROL
// ============================================

function resetStats() {
    // Detect mobile for higher bullet range
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    const baseRange = isMobile ? CONFIG.BULLET_RANGE_MOBILE : CONFIG.BULLET_RANGE;

    stats = {
        score: 0,
        level: 1,
        xp: 0,
        xpNeeded: CONFIG.BASE_XP_NEEDED,
        gold: 0,
        gameTime: 0,

        playerSpeed: CONFIG.PLAYER_SPEED,
        bulletDamage: CONFIG.BULLET_DAMAGE,
        fireRate: CONFIG.FIRE_RATE,
        bulletCount: 1,
        bulletRange: baseRange,
        bulletPierce: 1,
        knHealth: CONFIG.KN_HEALTH,
        knMaxHealth: CONFIG.KN_HEALTH
    };

    // Reset upgrade levels
    upgradeLevels = {};
    UPGRADES.forEach(u => upgradeLevels[u.id] = 0);
}

function startGame() {
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('levelup-overlay').classList.add('hidden');
    document.getElementById('shop-panel').classList.add('hidden');

    resetStats();

    enemies = [];
    bullets = [];
    particles = [];
    agents = [];

    const width = canvas.logicalWidth;
    const height = canvas.logicalHeight;
    kn.x = width / 2;
    kn.y = height / 2;
    player.x = kn.x;
    player.y = kn.y + 60;

    updateUI();
    updateShop();

    gameStartTime = performance.now();
    lastSpawnTime = gameStartTime;
    lastBossTime = gameStartTime;
    lastFireTime = 0;

    gameRunning = true;
    gamePaused = false;
    SoundManager.playBGM('ZMuP01GlQi4');
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    SoundManager.stopBGM();

    // Add score to Wallet
    const currentWallet = parseInt(localStorage.getItem('arcade_wallet_points') || 0);
    localStorage.setItem('arcade_wallet_points', currentWallet + stats.score);

    const highScore = parseInt(localStorage.getItem('arcade_protect_highscore') || 0);
    const isNewHighscore = stats.score > highScore;

    if (isNewHighscore) {
        localStorage.setItem('arcade_protect_highscore', stats.score);
    }

    document.getElementById('final-score').textContent = 'Điểm: ' + stats.score;
    document.getElementById('final-xp').textContent = Math.floor(stats.xp);
    document.getElementById('final-stats').textContent =
        `Thời gian: ${formatTime(stats.gameTime)} | Cấp: ${stats.level} | Vàng: ${stats.gold}`;
    document.getElementById('highscore-message').innerHTML = isNewHighscore
        ? '<span class="new-highscore">🎉 Kỷ lục mới!</span>'
        : `Kỷ lục: ${highScore}`;
    document.getElementById('gameover-overlay').classList.remove('hidden');
}

// ============================================
// LEVEL UP SYSTEM
// ============================================

function showLevelUp() {
    gamePaused = true;

    // Filter upgrades that haven't reached max level
    const availableUpgrades = UPGRADES.filter(u => upgradeLevels[u.id] < CONFIG.MAX_UPGRADE_LEVEL);

    // Pick 3 random
    const options = [...availableUpgrades].sort(() => Math.random() - 0.5).slice(0, 3);

    const container = document.getElementById('upgrade-options');
    container.innerHTML = '';

    options.forEach(upgrade => {
        const currentLevel = upgradeLevels[upgrade.id];
        const isMaxing = currentLevel === CONFIG.MAX_UPGRADE_LEVEL - 1;

        const btn = document.createElement('button');
        btn.className = 'upgrade-btn' + (isMaxing ? ' supreme-preview' : '');

        const levelText = isMaxing ? '→ TỐI THƯỢNG!' : `Lv.${currentLevel + 1}`;
        const name = isMaxing ? upgrade.maxName : `${upgrade.icon} ${upgrade.name}`;
        const desc = isMaxing ? upgrade.maxDesc : upgrade.desc;

        btn.innerHTML = `
            <span class="upgrade-icon">${upgrade.icon}</span>
            <span class="upgrade-name">${name}</span>
            <span class="upgrade-level">${levelText}</span>
            <span class="upgrade-desc">${desc}</span>
        `;
        btn.addEventListener('click', () => selectUpgrade(upgrade));
        container.appendChild(btn);
    });

    document.getElementById('levelup-overlay').classList.remove('hidden');
}

function selectUpgrade(upgrade) {
    upgrade.apply(stats);
    upgradeLevels[upgrade.id]++;

    document.getElementById('levelup-overlay').classList.add('hidden');
    gamePaused = false;
    updateUI();
}

// ============================================
// SHOP SYSTEM
// ============================================

function toggleShop() {
    if (!gameRunning) return;

    const panel = document.getElementById('shop-panel');
    const isOpen = !panel.classList.contains('hidden');

    if (isOpen) {
        panel.classList.add('hidden');
        gamePaused = false;
    } else {
        updateShop();
        panel.classList.remove('hidden');
        gamePaused = true;
    }
}

function updateShop() {
    const container = document.getElementById('agent-list');
    container.innerHTML = '';

    AGENT_TYPES.forEach(agentType => {
        const canAfford = stats.gold >= agentType.cost;
        const atMax = agents.length >= CONFIG.MAX_AGENTS;

        const div = document.createElement('div');
        div.className = 'agent-item' + (!canAfford || atMax ? ' disabled' : '');
        div.innerHTML = `
            <span class="agent-emoji">${agentType.emoji}</span>
            <div class="agent-info">
                <span class="agent-name">${agentType.name}</span>
                <span class="agent-stats">DMG: ${agentType.damage} | Rate: ${agentType.fireRate}ms</span>
            </div>
            <button class="buy-agent-btn" ${!canAfford || atMax ? 'disabled' : ''}>
                💰 ${agentType.cost}
            </button>
        `;

        if (canAfford && !atMax) {
            div.querySelector('.buy-agent-btn').addEventListener('click', () => buyAgent(agentType));
        }

        container.appendChild(div);
    });

    document.getElementById('agent-count').textContent = `${agents.length}/${CONFIG.MAX_AGENTS}`;
}

function buyAgent(agentType) {
    if (stats.gold < agentType.cost || agents.length >= CONFIG.MAX_AGENTS) return;

    stats.gold -= agentType.cost;

    // Position agent around KN
    const angle = (agents.length / CONFIG.MAX_AGENTS) * Math.PI * 2;
    const dist = 60;

    agents.push({
        x: kn.x + Math.cos(angle) * dist,
        y: kn.y + Math.sin(angle) * dist,
        type: agentType,
        lastFire: 0
    });

    updateUI();
    updateShop();
}

// ============================================
// UI HELPERS
// ============================================

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateUI() {
    if (!uiElements.score) return;

    uiElements.score.textContent = stats.score;
    uiElements.level.textContent = stats.level;
    uiElements.timer.textContent = formatTime(stats.gameTime);
    uiElements.gold.textContent = stats.gold;

    const xpPercent = (stats.xp / stats.xpNeeded) * 100;
    uiElements.xpBar.style.width = xpPercent + '%';
    uiElements.xpText.textContent = `${stats.xp} / ${stats.xpNeeded} XP`;

    const healthPercent = (stats.knHealth / stats.knMaxHealth) * 100;
    uiElements.knHealth.style.width = healthPercent + '%';
}

// ============================================
// GAME LOOP
// ============================================

function gameLoop(currentTime) {
    if (!gameRunning) return;

    if (!gamePaused) {
        update(currentTime);
    }
    draw();

    requestAnimationFrame(gameLoop);
}

function update(currentTime) {
    const width = canvas.logicalWidth;
    const height = canvas.logicalHeight;

    stats.gameTime = (currentTime - gameStartTime) / 1000;

    // Move player
    player.x += moveDir.x * stats.playerSpeed;
    player.y += moveDir.y * stats.playerSpeed;

    const margin = 20;
    player.x = Math.max(margin, Math.min(width - margin, player.x));
    player.y = Math.max(margin, Math.min(height - margin, player.y));

    // Player fire
    if (firePressed && currentTime - lastFireTime > stats.fireRate && enemies.length > 0) {
        fireAtNearestEnemy(player, currentTime, true);
        lastFireTime = currentTime;
    }

    // Agents fire
    agents.forEach(agent => {
        if (currentTime - agent.lastFire > agent.type.fireRate && enemies.length > 0) {
            fireFromAgent(agent, currentTime);
            agent.lastFire = currentTime;
        }
    });

    // Spawn enemies
    const spawnRate = Math.max(CONFIG.SPAWN_RATE_MIN, CONFIG.SPAWN_RATE_START - stats.gameTime * 5);
    if (currentTime - lastSpawnTime > spawnRate && enemies.length < CONFIG.MAX_ENEMIES) {
        spawnEnemy(width, height);
        lastSpawnTime = currentTime;
    }

    // Spawn bosses
    const timeSinceLastBoss = (currentTime - lastBossTime) / 1000;
    if (timeSinceLastBoss >= CONFIG.MINI_BOSS_TIME) {
        const isBigBoss = timeSinceLastBoss >= CONFIG.BOSS_TIME;
        spawnBoss(width, height, isBigBoss);
        lastBossTime = currentTime;
    }

    updateBullets(width, height);
    updateEnemies();
    updateParticles();

    // Level up check
    if (stats.xp >= stats.xpNeeded) {
        stats.level++;
        stats.xp -= stats.xpNeeded;
        stats.xpNeeded = Math.floor(CONFIG.BASE_XP_NEEDED * Math.pow(CONFIG.XP_MULTIPLIER, stats.level - 1));
        showLevelUp();
    }

    updateUI();

    if (stats.knHealth <= 0) {
        SoundManager.playGameOver();
        gameOver();
    }
}

function fireAtNearestEnemy(shooter, currentTime, isPlayer) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
        const dx = enemy.x - shooter.x;
        const dy = enemy.y - shooter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = enemy;
        }
    }

    if (!nearest) return;

    const angle = Math.atan2(nearest.y - shooter.y, nearest.x - shooter.x);
    if (isPlayer) player.angle = angle;

    const damage = isPlayer ? stats.bulletDamage : 0.5;
    const range = isPlayer ? stats.bulletRange : 150;
    const pierce = isPlayer ? stats.bulletPierce : 1;
    const count = isPlayer ? stats.bulletCount : 1;

    // Check if damage is "supreme" (level 6)
    const isSupreme = isPlayer && upgradeLevels['damage'] >= CONFIG.MAX_UPGRADE_LEVEL;

    const spread = 0.15;
    for (let i = 0; i < count; i++) {
        const bulletAngle = angle + (i - (count - 1) / 2) * spread;

        if (bullets.length < CONFIG.MAX_BULLETS) {
            bullets.push({
                x: shooter.x,
                y: shooter.y,
                vx: Math.cos(bulletAngle) * CONFIG.BULLET_SPEED,
                vy: Math.sin(bulletAngle) * CONFIG.BULLET_SPEED,
                damage: damage,
                pierce: pierce,
                range: range,
                distance: 0,
                isPlayer: isPlayer,
                isSupreme: isSupreme
            });
        }
    }

    if (isPlayer) {
        // Throttle sound to prevent mobile lag
        const now = performance.now();
        if (!window.lastShootSoundTime || now - window.lastShootSoundTime > 80) {
            SoundManager.playShoot();
            window.lastShootSoundTime = now;
        }
    }
}

function fireFromAgent(agent, currentTime) {
    let nearest = null;
    let nearestDist = agent.type.range;

    for (const enemy of enemies) {
        const dx = enemy.x - agent.x;
        const dy = enemy.y - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = enemy;
        }
    }

    if (!nearest) return;

    const angle = Math.atan2(nearest.y - agent.y, nearest.x - agent.x);

    if (bullets.length < CONFIG.MAX_BULLETS) {
        bullets.push({
            x: agent.x,
            y: agent.y,
            vx: Math.cos(angle) * CONFIG.BULLET_SPEED * 0.8,
            vy: Math.sin(angle) * CONFIG.BULLET_SPEED * 0.8,
            damage: agent.type.damage,
            pierce: 1,
            range: agent.type.range,
            distance: 0,
            isPlayer: false,
            isAgent: true
        });
    }
}

function spawnEnemy(width, height) {
    // Determine current phase based on game time
    if (stats.gameTime < 120) {
        currentPhase = 1;       // 0-2 minutes
    } else if (stats.gameTime < 240) {
        currentPhase = 2;       // 2-4 minutes
    } else {
        currentPhase = 3;       // 4+ minutes
    }

    // Swarm mechanic: determine group size
    let groupSize;
    const rand = Math.random();

    if (stats.gameTime >= 60) {
        // After 1 minute: can spawn large groups
        if (rand < 0.15) {
            groupSize = 4 + Math.floor(Math.random() * 3); // 4-6 (large swarm)
        } else if (rand < 0.45) {
            groupSize = 2 + Math.floor(Math.random() * 2); // 2-3 (medium group)
        } else {
            groupSize = 1; // Single monster
        }
    } else {
        // First minute: only small groups
        if (rand < 0.4) {
            groupSize = 2 + Math.floor(Math.random() * 2); // 2-3
        } else {
            groupSize = 1; // Single
        }
    }

    // Spawn position (group spawns from same general area)
    const side = Math.floor(Math.random() * 4);
    let baseX, baseY;

    switch (side) {
        case 0: baseX = -30; baseY = Math.random() * height; break;
        case 1: baseX = width + 30; baseY = Math.random() * height; break;
        case 2: baseX = Math.random() * width; baseY = -30; break;
        case 3: baseX = Math.random() * width; baseY = height + 30; break;
    }

    // Get monster types for current phase
    const phaseMonsters = PHASES[currentPhase];

    // Spawn group
    for (let i = 0; i < groupSize; i++) {
        if (enemies.length >= CONFIG.MAX_ENEMIES) break;

        const type = phaseMonsters[Math.floor(Math.random() * phaseMonsters.length)];
        const template = ENEMIES[type];

        // Offset position slightly for group members
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;

        enemies.push({
            x: baseX + offsetX,
            y: baseY + offsetY,
            type,
            imgKey: type,
            hp: template.hp,
            maxHp: template.hp,
            speed: template.speed * (1 + stats.gameTime / 400), // Slower scaling
            xp: template.xp,
            gold: template.gold,
            damage: template.damage,
            width: template.width,
            height: template.height,
            isBoss: false
        });
    }
}

function spawnBoss(width, height, isBigBoss) {
    const type = isBigBoss ? 'boss' : 'miniBoss';
    const template = ENEMIES[type];

    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
        case 0: x = -50; y = height / 2; break;
        case 1: x = width + 50; y = height / 2; break;
        case 2: x = width / 2; y = -50; break;
        case 3: x = width / 2; y = height + 50; break;
    }

    enemies.push({
        x, y,
        type,
        imgKey: type,  // 'miniBoss' or 'boss'
        hp: template.hp * (1 + stats.level * 0.2),
        maxHp: template.hp * (1 + stats.level * 0.2),
        speed: template.speed,
        xp: template.xp,
        gold: template.gold,
        damage: template.damage,
        width: template.width,
        height: template.height,
        isBoss: true
    });
}

function updateBullets(width, height) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.distance += CONFIG.BULLET_SPEED;

        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dx = b.x - e.x;
            const dy = b.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < (e.width || 40) / 2 + 5) {
                e.hp -= b.damage;
                createParticles(b.x, b.y, b.isSupreme ? '#ef4444' : '#fbbf24', 3);
                SoundManager.playHit();

                // Knockback effect - push enemy away from bullet direction
                const knockbackForce = e.isBoss ? 3 : 8;
                const knockAngle = Math.atan2(b.vy, b.vx);
                e.x += Math.cos(knockAngle) * knockbackForce;
                e.y += Math.sin(knockAngle) * knockbackForce;

                b.pierce--;
                if (b.pierce <= 0) {
                    bullets.splice(i, 1);
                }

                if (e.hp <= 0) {
                    stats.score += Math.floor(e.xp);
                    stats.xp += e.xp;
                    stats.gold += e.gold;
                    createParticles(e.x, e.y, '#22c55e', 8);
                    enemies.splice(j, 1);
                }
                break;
            }
        }

        // Remove if out of range or off screen
        if (b.distance > b.range) {
            bullets.splice(i, 1);
        } else {
            const margin = 30;
            if (b.x < -margin || b.x > width + margin || b.y < -margin || b.y > height + margin) {
                bullets.splice(i, 1);
            }
        }
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        const dx = kn.x - e.x;
        const dy = kn.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > CONFIG.KN_SIZE / 2 + (e.width || 40) / 2) {
            e.x += (dx / dist) * e.speed;
            e.y += (dy / dist) * e.speed;
        } else {
            stats.knHealth -= e.damage;
            createParticles(kn.x, kn.y, '#ef4444', 5);
            enemies.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;

        if (p.life <= 0) particles.splice(i, 1);
    }
}

function createParticles(x, y, color, count) {
    const canAdd = CONFIG.MAX_PARTICLES - particles.length;
    const toAdd = Math.min(count, canAdd);

    for (let i = 0; i < toAdd; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color,
            size: 2 + Math.random() * 3,
            life: 1
        });
    }
}

// ============================================
// DRAWING
// ============================================

function draw() {
    const width = canvas.logicalWidth;
    const height = canvas.logicalHeight;

    ctx.clearRect(0, 0, width, height);

    drawArena(width, height);

    // Particles
    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Bullets
    for (const b of bullets) {
        if (b.isSupreme) {
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
        } else if (b.isAgent) {
            ctx.fillStyle = '#60a5fa';
            ctx.shadowColor = '#60a5fa';
            ctx.shadowBlur = 5;
        } else {
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 5;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.isSupreme ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Enemies - draw using images with proper aspect ratio
    for (const e of enemies) {
        const img = images[e.imgKey];
        const w = e.width || 40;
        const h = e.height || 40;

        if (img && img.complete) {
            // Get aspect ratio and scale properly
            const aspect = imageAspects[e.imgKey] || 1;
            let drawW, drawH;

            if (aspect >= 1) {
                // Wider than tall
                drawW = w;
                drawH = w / aspect;
            } else {
                // Taller than wide
                drawH = h;
                drawW = h * aspect;
            }

            ctx.drawImage(img, e.x - drawW / 2, e.y - drawH / 2, drawW, drawH);
        } else {
            // Fallback to circle if image not loaded
            ctx.fillStyle = e.isBoss ? '#ef4444' : '#a855f7';
            ctx.beginPath();
            ctx.arc(e.x, e.y, w / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Health bar for bosses
        if (e.isBoss) {
            const barWidth = w;
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(e.x - barWidth / 2, e.y - h / 2 - 10, barWidth, 5);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(e.x - barWidth / 2, e.y - h / 2 - 10, barWidth * (e.hp / e.maxHp), 5);
        }
    }

    // Agents
    for (const agent of agents) {
        ctx.font = '24px Arial';
        ctx.fillText(agent.type.emoji, agent.x, agent.y);

        // Range indicator
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, agent.type.range, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Khánh Như
    drawKhanhNhu();

    // Player
    drawPlayer();
}

function drawArena(width, height) {
    // Concrete floor background
    ctx.fillStyle = '#1f2937'; // Dark gray concrete
    ctx.fillRect(0, 0, width, height);

    // Grid lines (road-like markings)
    ctx.strokeStyle = '#374151'; // Lighter gray for grid
    ctx.lineWidth = 2;
    ctx.setLineDash([]); // Solid lines for main grid

    const gridSize = 100; // Big tiles/blocks

    // Vertical lines
    const startX = Math.floor(-kn.x / gridSize) * gridSize; // Offset if we had camera, but here fixed

    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Horizontal lines (roads)
    for (let y = 0; y < height; y += gridSize) {
        // Draw main block lines
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Add "road markings" in the middle of blocks
        if (y + gridSize / 2 < height) {
            ctx.save();
            ctx.strokeStyle = '#4b5563';
            ctx.setLineDash([15, 15]); // Dashed line
            ctx.beginPath();
            ctx.moveTo(0, y + gridSize / 2);
            ctx.lineTo(width, y + gridSize / 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Add texture/noise effect (simple dots)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 50; i++) {
        const tx = Math.random() * width;
        const ty = Math.random() * height;
        const ts = Math.random() * 3;
        ctx.fillRect(tx, ty, ts, ts);
    }

    // Player range indicator
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, stats.bulletRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawKhanhNhu() {
    const glowSize = 50 + Math.sin(performance.now() / 300) * 5;
    const glow = ctx.createRadialGradient(kn.x, kn.y, 0, kn.x, kn.y, glowSize);
    glow.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(kn.x, kn.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${CONFIG.KN_SIZE}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖', kn.x, kn.y);
}

function drawPlayer() {
    // Direction indicator
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.angle) * 30, player.y + Math.sin(player.angle) * 30);
    ctx.stroke();

    // Draw player image with proper aspect ratio
    const playerImg = images['player'];
    const baseSize = CONFIG.PLAYER_SIZE + 10;

    if (playerImg && playerImg.complete) {
        // Use aspect ratio for proper scaling
        const aspect = imageAspects['player'] || 1;
        let drawW, drawH;

        if (aspect >= 1) {
            drawW = baseSize;
            drawH = baseSize / aspect;
        } else {
            drawH = baseSize;
            drawW = baseSize * aspect;
        }

        ctx.drawImage(playerImg, player.x - drawW / 2, player.y - drawH / 2, drawW, drawH);
    } else {
        // Fallback to emoji
        ctx.font = `${CONFIG.PLAYER_SIZE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🦸', player.x, player.y);
    }
}

// Start
init();
