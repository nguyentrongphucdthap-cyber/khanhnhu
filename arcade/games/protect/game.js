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
    BULLET_DAMAGE: 2,
    BULLET_RANGE: 250,
    BULLET_RANGE_MOBILE: 320,

    // Khánh Như
    KN_HEALTH: 100,
    KN_SIZE: 40,

    // XP & Leveling
    BASE_XP_NEEDED: 50,
    XP_MULTIPLIER: 1.5,
    XP_MULTIPLIER_EASY: 1.25, // Easier from level 5+

    // Spawning
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

    // Upgrade system
    MAX_UPGRADE_LEVEL: 6,
    FREE_REROLLS: 3,
    REROLL_COST: 50,

    // XP Gem
    GEM_DROP_INTERVAL: 60, // seconds

    // Special weapons cooldowns (ms)
    DRONE_COOLDOWN: 8000,
    BLADE_COOLDOWN: 10000
};

// Enemy types - speeds balanced (Reduced speed by 30%, HP by 25%)
const ENEMIES = {
    // Phase 1 monsters (weakest)
    monster1: { img: 'img/monster.png', hp: 0.75, speed: 0.7, xp: 8, gold: 4, damage: 4, width: 38, height: 38, phase: 1 },
    monster2: { img: 'img/monster2.png', hp: 0.75, speed: 0.63, xp: 10, gold: 5, damage: 5, width: 42, height: 42, phase: 1 },
    monster6: { img: 'img/monster6.png', hp: 0.9, speed: 0.77, xp: 9, gold: 5, damage: 4, width: 36, height: 36, phase: 1 },

    // Phase 2 monsters (medium)
    monster3: { img: 'img/monster3.png', hp: 1.5, speed: 0.66, xp: 12, gold: 6, damage: 6, width: 40, height: 40, phase: 2 },
    monster4: { img: 'img/monster4.png', hp: 1.1, speed: 0.77, xp: 10, gold: 5, damage: 5, width: 34, height: 34, phase: 2 },
    monster7: { img: 'img/monster7.png', hp: 1.9, speed: 0.6, xp: 14, gold: 7, damage: 7, width: 42, height: 42, phase: 2 },

    // Phase 3 monsters (strongest)
    monster5: { img: 'img/monster5.png', hp: 2.25, speed: 0.63, xp: 18, gold: 10, damage: 10, width: 46, height: 46, phase: 3 },
    monster8: { img: 'img/monster8.png', hp: 1.9, speed: 0.7, xp: 15, gold: 8, damage: 8, width: 40, height: 40, phase: 3 },
    monster2b: { img: 'img/monster2.png', hp: 1.5, speed: 0.8, xp: 12, gold: 6, damage: 6, width: 42, height: 42, phase: 3 },

    // Bosses (slower)
    miniBoss: { img: 'img/miniboss1.png', hp: 18, speed: 0.35, xp: 100, gold: 50, damage: 15, width: 70, height: 70, isBoss: true, isMiniBoss: true },
    boss: { img: 'img/boss1.png', hp: 60, speed: 0.28, xp: 300, gold: 150, damage: 25, width: 90, height: 90, isBoss: true }
};

const PHASES = {
    1: ['monster1', 'monster2', 'monster6'],      // 3 monsters per phase
    2: ['monster3', 'monster4', 'monster7'],
    3: ['monster5', 'monster8', 'monster2b'],
    special: ['monster1', 'monster3', 'monster4', 'monster5', 'monster6', 'monster7', 'monster8']
};

const images = {};
const imageAspects = {};
let imagesLoaded = false;

// ============================================
// NEW UPGRADES SYSTEM
// ============================================
const UPGRADES = [
    // Original upgrades
    {
        id: 'damage', icon: '⚔️', name: 'Sát thương', desc: '+20% damage', category: 'stat',
        apply: (s) => s.bulletDamage *= 1.2, maxName: '⚔️ Tử Thần', maxDesc: 'Đạn đỏ hủy diệt!'
    },
    {
        id: 'speed', icon: '👟', name: 'Tốc độ', desc: '+15% speed', category: 'stat',
        apply: (s) => s.playerSpeed *= 1.15, maxName: '👟 Thần Tốc', maxDesc: 'Nhanh như chớp!'
    },
    {
        id: 'firerate', icon: '🔥', name: 'Tốc bắn', desc: '+20% fire rate', category: 'stat',
        apply: (s) => s.fireRate *= 0.8, maxName: '🔥 Liên Hoàn', maxDesc: 'Bắn không ngừng!'
    },
    {
        id: 'heal', icon: '💖', name: 'Hồi máu', desc: 'Hồi 15 HP', category: 'stat',
        apply: (s) => s.knHealth = Math.min(s.knMaxHealth, s.knHealth + 15), maxName: '💖 Bất Tử', maxDesc: 'Hồi 50% HP!'
    },
    {
        id: 'multishot', icon: '🎯', name: 'Đa đạn', desc: '+1 đạn', category: 'stat',
        apply: (s) => s.bulletCount = Math.min(7, s.bulletCount + 1), maxName: '🎯 Mưa Đạn', maxDesc: '7 đạn!'
    },
    {
        id: 'range', icon: '📏', name: 'Tầm xa', desc: '+25% range', category: 'stat',
        apply: (s) => s.bulletRange *= 1.25, maxName: '📏 Vô Cực', maxDesc: 'Bắn cực xa!'
    },
    {
        id: 'pierce', icon: '💫', name: 'Xuyên giáp', desc: '+1 xuyên', category: 'stat',
        apply: (s) => s.bulletPierce += 1, maxName: '💫 Xuyên Không', maxDesc: 'Xuyên 6 quái!'
    },
    {
        id: 'shield', icon: '🛡️', name: 'Giáp', desc: '+20 Max HP', category: 'stat',
        apply: (s) => { s.knMaxHealth += 20; s.knHealth += 20; }, maxName: '🛡️ Thần Hộ', maxDesc: 'Giáp tối thượng!'
    },
    // NEW WEAPON UPGRADES
    {
        id: 'drone', icon: '🚁', name: 'Drone', desc: 'Triệu hồi Drone bắn tự động', category: 'weapon',
        apply: (s) => { s.droneLevel = (s.droneLevel || 0) + 1; }, maxName: '🚁 Phi Đội', maxDesc: '3 Drone cùng lúc!'
    },
    {
        id: 'icewitch', icon: '❄️', name: 'Phù Thủy Băng', desc: 'Giảm tốc địch 40%', category: 'weapon',
        apply: (s) => { s.iceSlowLevel = (s.iceSlowLevel || 0) + 1; }, maxName: '❄️ Băng Giá', maxDesc: 'Giảm tốc 60%!'
    },
    {
        id: 'fireball', icon: '🔮', name: 'Cầu Lửa', desc: 'Phun cầu lửa', category: 'weapon',
        apply: (s) => { s.fireballCount = (s.fireballCount || 0) + 1; }, maxName: '🔮 Địa Ngục', maxDesc: '6 cầu lửa!'
    },
    {
        id: 'shuriken', icon: '✴️', name: 'Phi Tiêu', desc: 'Phóng phi tiêu', category: 'weapon',
        apply: (s) => { s.shurikenCount = (s.shurikenCount || 0) + 1; }, maxName: '✴️ Nhẫn Giả', maxDesc: '8 phi tiêu!'
    },
    {
        id: 'blade', icon: '🗡️', name: 'Lưỡi Liềm', desc: 'Quay quanh người chơi', category: 'weapon',
        apply: (s) => { s.bladeCount = (s.bladeCount || 0) + 1; }, maxName: '🗡️ Tử Thần', maxDesc: '4 lưỡi liềm!'
    },
    {
        id: 'halo', icon: '✨', name: 'Hào Quang', desc: 'Vùng sát thương quanh KN', category: 'weapon',
        apply: (s) => { s.haloLevel = (s.haloLevel || 0) + 1; }, maxName: '✨ Thiên Thần', maxDesc: 'Hào quang chết chóc!'
    }
];

// Agent types - can only buy once, can upgrade multiple times
const AGENT_TYPES = [
    { id: 'shooter', emoji: '🤖', name: 'Xạ Thủ', cost: 100, fireRate: 800, damage: 0.5, range: 150, upgradeCost: 75 },
    { id: 'sniper', emoji: '🎖️', name: 'Bắn Tỉa', cost: 200, fireRate: 1500, damage: 1.5, range: 300, upgradeCost: 120 },
    { id: 'rapid', emoji: '⚡', name: 'Súng Máy', cost: 150, fireRate: 300, damage: 0.3, range: 120, upgradeCost: 90 }
];

// ============================================
// GAME STATE
// ============================================

let canvas, ctx;
let gameRunning = false;
let gamePaused = false;

// Game stats
let stats = {};
let upgradeLevels = {};
let currentPhase = 1;

// Entities
let player = { x: 0, y: 0, angle: 0 };
let kn = { x: 0, y: 0 };
let enemies = [];
let bullets = [];
let particles = [];
let agents = [];

// Special weapons entities
let fireballs = [];
let shurikens = [];
let blades = [];
let drones = [];
let xpGems = [];

// Weapon cooldowns
let lastDroneTime = 0;
let lastBladeTime = 0;
let lastFireballTime = 0;
let lastShurikenTime = 0;
let lastGemDropTime = 0;

// Reroll system
let rerollsUsed = 0;
let guaranteedSupreme = null; // Track if supreme upgrade needs to appear

// Purchased agents tracking (each can only be bought once)
let purchasedAgentIds = [];

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
        { key: 'monster2b', src: 'img/monster2.png' }, // Reuse monster2 for phase 3 variant
        { key: 'monster3', src: 'img/monster3.png' },
        { key: 'monster4', src: 'img/monster4.png' },
        { key: 'monster5', src: 'img/monster5.png' },
        { key: 'monster6', src: 'img/monster6.png' },
        { key: 'monster7', src: 'img/monster7.png' },
        { key: 'monster8', src: 'img/monster8.png' },
        { key: 'miniBoss', src: 'img/miniboss1.png' },
        { key: 'boss', src: 'img/boss1.png' },
        { key: 'khanhnhu', src: 'img/khanhnhu.png' }
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

    // Volume button
    const volBtn = document.getElementById('volume-btn');
    if (volBtn) {
        volBtn.addEventListener('click', () => {
            const isMuted = SoundManager.toggleMute();
            volBtn.textContent = isMuted ? '🔇' : '🔊';
            volBtn.style.opacity = isMuted ? '0.5' : '1';
        });
    }
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Store DPR for later use
    canvas.dpr = dpr;

    // Set canvas pixel dimensions
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Store logical dimensions (CSS pixels)
    canvas.logicalWidth = rect.width;
    canvas.logicalHeight = rect.height;

    // Apply DPR scaling
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Recenter entities based on logical dimensions
    kn.x = canvas.logicalWidth / 2;
    kn.y = canvas.logicalHeight / 2;

    // Only reset player position if game not running
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
    const autoFireBtn = document.getElementById('auto-fire-btn');

    // Regular fire button
    fireBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        firePressed = true;
        fireBtn.classList.add('pressed');
    }, { passive: false });

    fireBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!autoFire) firePressed = false;
        fireBtn.classList.remove('pressed');
    }, { passive: false });

    fireBtn.addEventListener('touchcancel', (e) => {
        e.stopPropagation();
        if (!autoFire) firePressed = false;
        fireBtn.classList.remove('pressed');
    });

    fireBtn.addEventListener('mousedown', () => {
        firePressed = true;
        fireBtn.classList.add('pressed');
    });

    fireBtn.addEventListener('mouseup', () => {
        if (!autoFire) firePressed = false;
        fireBtn.classList.remove('pressed');
    });

    fireBtn.addEventListener('mouseleave', () => {
        if (!autoFire) firePressed = false;
        fireBtn.classList.remove('pressed');
    });

    // Auto-fire button (mobile only)
    if (autoFireBtn) {
        // Handle desktop click
        autoFireBtn.addEventListener('click', toggleAutoFire);

        // Handle mobile touch
        autoFireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scroll/zoom
            e.stopPropagation();
        }, { passive: false });

        autoFireBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleAutoFire();
        }, { passive: false });
    }
}

// Auto-fire state
let autoFire = false;

function toggleAutoFire() {
    autoFire = !autoFire;
    firePressed = autoFire;
    const btn = document.getElementById('auto-fire-btn');
    if (btn) {
        btn.classList.toggle('active', autoFire);
        btn.textContent = autoFire ? '🔴' : '🟢';
    }
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
        knMaxHealth: CONFIG.KN_HEALTH,

        // New weapon stats
        droneLevel: 0,
        iceSlowLevel: 0,
        fireballCount: 0,
        shurikenCount: 0,
        bladeCount: 0,
        haloLevel: 0
    };

    // Reset upgrade levels
    upgradeLevels = {};
    UPGRADES.forEach(u => upgradeLevels[u.id] = 0);

    // Reset special weapon entities
    fireballs = [];
    shurikens = [];
    blades = [];
    drones = [];
    xpGems = [];

    // Reset reroll
    rerollsUsed = 0;
    guaranteedSupreme = null;

    // Reset purchased agents
    purchasedAgentIds = [];
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
    lastGemDropTime = gameStartTime;
    lastFireballTime = 0;
    lastShurikenTime = 0;
    lastBladeTime = 0;
    lastDroneTime = 0;

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
    document.getElementById('final-stats').textContent =
        `Thời gian: ${formatTime(stats.gameTime)} | Cấp: ${stats.level} | Vàng: ${stats.gold}`;
    document.getElementById('highscore-message').innerHTML = isNewHighscore
        ? '<span class="new-highscore">🎉 Kỷ lục mới!</span>'
        : `Kỷ lục: ${highScore}`;
    document.getElementById('gameover-overlay').classList.remove('hidden');
}

// ============================================
// LEVEL UP SYSTEM WITH REROLL
// ============================================

let currentUpgradeOptions = [];

function getWeightedUpgrades() {
    const available = UPGRADES.filter(u => upgradeLevels[u.id] < CONFIG.MAX_UPGRADE_LEVEL);

    // Calculate weights - higher level = higher chance
    const weighted = available.map(u => {
        let weight = 1;
        const level = upgradeLevels[u.id];

        // Level 4+ gets 2x weight
        if (level >= 4) weight = 2;
        // Level 5 (about to be supreme) gets 3x weight
        if (level === CONFIG.MAX_UPGRADE_LEVEL - 1) weight = 3;

        return { upgrade: u, weight };
    });

    // Check if any upgrade is guaranteed supreme (must appear in next 2 rolls)
    if (guaranteedSupreme) {
        const supremeUpgrade = available.find(u => u.id === guaranteedSupreme);
        if (supremeUpgrade) {
            return selectWeightedRandom(weighted, 3, supremeUpgrade);
        }
        guaranteedSupreme = null;
    }

    return selectWeightedRandom(weighted, 3);
}

function selectWeightedRandom(weighted, count, mustInclude = null) {
    const result = [];
    const pool = [...weighted];

    // Add must-include first
    if (mustInclude) {
        result.push(mustInclude);
        const idx = pool.findIndex(w => w.upgrade.id === mustInclude.id);
        if (idx > -1) pool.splice(idx, 1);
        count--;
    }

    // Weighted random selection
    for (let i = 0; i < count && pool.length > 0; i++) {
        const totalWeight = pool.reduce((sum, w) => sum + w.weight, 0);
        let rand = Math.random() * totalWeight;

        for (let j = 0; j < pool.length; j++) {
            rand -= pool[j].weight;
            if (rand <= 0) {
                result.push(pool[j].upgrade);
                pool.splice(j, 1);
                break;
            }
        }
    }

    return result;
}

function showLevelUp() {
    gamePaused = true;
    currentUpgradeOptions = getWeightedUpgrades();
    renderUpgradeOptions();
    document.getElementById('levelup-overlay').classList.remove('hidden');
}

function renderUpgradeOptions() {
    const container = document.getElementById('upgrade-options');
    container.innerHTML = '';

    currentUpgradeOptions.forEach(upgrade => {
        const currentLevel = upgradeLevels[upgrade.id];
        const isMaxing = currentLevel === CONFIG.MAX_UPGRADE_LEVEL - 1;

        const btn = document.createElement('button');
        btn.className = 'upgrade-btn' + (isMaxing ? ' supreme-preview' : '');
        if (upgrade.category === 'weapon') btn.classList.add('weapon-upgrade');

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

    // Add reroll button
    const rerollBtn = document.createElement('button');
    const isFree = rerollsUsed < CONFIG.FREE_REROLLS;
    const cost = isFree ? 0 : CONFIG.REROLL_COST;
    const canAfford = isFree || stats.gold >= cost;

    rerollBtn.className = 'reroll-btn' + (canAfford ? '' : ' disabled');
    rerollBtn.innerHTML = isFree
        ? `🔄 Đổi lựa chọn (${CONFIG.FREE_REROLLS - rerollsUsed} miễn phí)`
        : `🔄 Đổi lựa chọn (💰${cost})`;

    if (canAfford) {
        rerollBtn.addEventListener('click', () => rerollUpgrades(cost));
    }
    container.appendChild(rerollBtn);
}

function rerollUpgrades(cost) {
    if (cost > 0) stats.gold -= cost;
    rerollsUsed++;
    currentUpgradeOptions = getWeightedUpgrades();
    renderUpgradeOptions();
}

function selectUpgrade(upgrade) {
    upgrade.apply(stats);
    upgradeLevels[upgrade.id]++;

    // If upgrade reaches level 5, guarantee it appears in next 2 level ups
    if (upgradeLevels[upgrade.id] === CONFIG.MAX_UPGRADE_LEVEL - 1) {
        guaranteedSupreme = upgrade.id;
    }

    // Reset reroll counter for next level up
    rerollsUsed = 0;

    document.getElementById('levelup-overlay').classList.add('hidden');
    gamePaused = false;
    updateUI();
}

// Trigger level up (used by boss kills and XP gems)
function triggerLevelUp(levels = 1) {
    for (let i = 0; i < levels; i++) {
        stats.level++;
        // Calculate new XP needed (easier from level 5+)
        const multiplier = stats.level >= 5 ? CONFIG.XP_MULTIPLIER_EASY : CONFIG.XP_MULTIPLIER;
        stats.xpNeeded = Math.floor(CONFIG.BASE_XP_NEEDED * Math.pow(multiplier, stats.level - 1));
    }
    showLevelUp();
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
        const isPurchased = purchasedAgentIds.includes(agentType.id);
        const ownedAgent = agents.find(a => a.type.id === agentType.id);

        const div = document.createElement('div');

        if (isPurchased && ownedAgent) {
            // Already owned - show upgrade option
            const upgradeLevel = ownedAgent.upgradeLevel || 1;
            const upgradeCost = agentType.upgradeCost * upgradeLevel;
            const canUpgrade = stats.gold >= upgradeCost && upgradeLevel < 5;

            div.className = 'agent-item owned' + (!canUpgrade ? ' disabled' : '');
            div.innerHTML = `
                <span class="agent-emoji">${agentType.emoji}</span>
                <div class="agent-info">
                    <span class="agent-name">${agentType.name} <span class="agent-lvl">Lv.${upgradeLevel}</span></span>
                    <span class="agent-stats">DMG: ${(agentType.damage * (1 + upgradeLevel * 0.3)).toFixed(1)} | Range: ${Math.floor(agentType.range * (1 + upgradeLevel * 0.15))}</span>
                </div>
                ${upgradeLevel < 5 ? `<button class="upgrade-agent-btn" ${!canUpgrade ? 'disabled' : ''}>⬆️ 💰${upgradeCost}</button>` : '<span class="max-badge">MAX</span>'}
            `;

            if (canUpgrade && upgradeLevel < 5) {
                div.querySelector('.upgrade-agent-btn').addEventListener('click', () => upgradeAgent(ownedAgent, upgradeCost));
            }
        } else {
            // Not purchased - show buy option
            const canAfford = stats.gold >= agentType.cost;
            const atMax = agents.length >= CONFIG.MAX_AGENTS;

            div.className = 'agent-item' + (!canAfford || atMax ? ' disabled' : '');
            div.innerHTML = `
                <span class="agent-emoji">${agentType.emoji}</span>
                <div class="agent-info">
                    <span class="agent-name">${agentType.name}</span>
                    <span class="agent-stats">DMG: ${agentType.damage} | Rate: ${agentType.fireRate}ms</span>
                </div>
                <button class="buy-agent-btn" ${!canAfford || atMax ? 'disabled' : ''}>💰 ${agentType.cost}</button>
            `;

            if (canAfford && !atMax) {
                div.querySelector('.buy-agent-btn').addEventListener('click', () => buyAgent(agentType));
            }
        }

        container.appendChild(div);
    });

    document.getElementById('agent-count').textContent = `${agents.length}/${CONFIG.MAX_AGENTS}`;
}

function buyAgent(agentType) {
    if (stats.gold < agentType.cost || agents.length >= CONFIG.MAX_AGENTS) return;
    if (purchasedAgentIds.includes(agentType.id)) return; // Already purchased

    stats.gold -= agentType.cost;
    purchasedAgentIds.push(agentType.id);

    // Position agents symmetrically around KN
    const positions = [
        { angle: -Math.PI / 2, dist: 55 },      // Top
        { angle: Math.PI / 6, dist: 60 },        // Bottom-right
        { angle: Math.PI - Math.PI / 6, dist: 60 } // Bottom-left
    ];
    const pos = positions[agents.length] || positions[0];

    agents.push({
        x: kn.x + Math.cos(pos.angle) * pos.dist,
        y: kn.y + Math.sin(pos.angle) * pos.dist,
        type: agentType,
        lastFire: 0,
        upgradeLevel: 1
    });

    updateUI();
    updateShop();
}

function upgradeAgent(agent, cost) {
    if (stats.gold < cost) return;

    stats.gold -= cost;
    agent.upgradeLevel = (agent.upgradeLevel || 1) + 1;

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
    const width = canvas.logicalWidth || 400;
    const height = canvas.logicalHeight || 600;

    // Safety check - ensure dimensions are valid
    if (!width || !height || isNaN(width) || isNaN(height)) {
        console.warn('Invalid canvas dimensions, skipping update');
        return;
    }

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
    const spawnRate = Math.max(CONFIG.SPAWN_RATE_MIN, CONFIG.SPAWN_RATE_START - stats.gameTime * 20);

    if (currentTime - lastSpawnTime > spawnRate) {
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

    // XP Gem drop every 1 minute from Khánh Như
    if (currentTime - lastGemDropTime > CONFIG.GEM_DROP_INTERVAL * 1000) {
        xpGems.push({
            x: kn.x + (Math.random() - 0.5) * 40,
            y: kn.y + (Math.random() - 0.5) * 40,
            value: Math.random() < 0.3 ? 2 : 1, // 30% chance for 2 levels
            spawnTime: currentTime
        });
        lastGemDropTime = currentTime;
    }

    updateBullets(width, height);
    updateEnemies();
    updateParticles();
    updateXPGems();
    updateSpecialWeapons(currentTime, width, height);

    // Level up check (easier XP from level 5+)
    if (stats.xp >= stats.xpNeeded) {
        stats.level++;
        stats.xp -= stats.xpNeeded;
        const multiplier = stats.level >= 5 ? CONFIG.XP_MULTIPLIER_EASY : CONFIG.XP_MULTIPLIER;
        stats.xpNeeded = Math.floor(CONFIG.BASE_XP_NEEDED * Math.pow(multiplier, stats.level - 1));
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
    const lvl = agent.upgradeLevel || 1;
    const scaledRange = agent.type.range * (1 + lvl * 0.15);
    let nearestDist = scaledRange;

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
    const scaledDamage = agent.type.damage * (1 + lvl * 0.3);

    if (bullets.length < CONFIG.MAX_BULLETS) {
        bullets.push({
            x: agent.x,
            y: agent.y,
            vx: Math.cos(angle) * CONFIG.BULLET_SPEED * 0.8,
            vy: Math.sin(angle) * CONFIG.BULLET_SPEED * 0.8,
            damage: scaledDamage,
            pierce: 1,
            range: scaledRange,
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

    // Difficulty Scaling
    const minutes = stats.gameTime / 60;
    const hpMultiplier = 1 + (minutes * 0.5); // +50% HP per minute

    // Increase mob cap: +15 enemies per minute
    const dynamicMaxEnemies = CONFIG.MAX_ENEMIES + Math.floor(minutes * 15);

    // Stop if limit reached
    if (enemies.length >= dynamicMaxEnemies) return;

    // Swarm mechanic: determine group size
    let groupSize;
    const rand = Math.random();

    if (stats.gameTime >= 180) {
        // 3+ mins: Nightmare Swarms
        if (rand < 0.2) groupSize = 10 + Math.floor(Math.random() * 5); // 10-15
        else if (rand < 0.5) groupSize = 5 + Math.floor(Math.random() * 5); // 5-10
        else groupSize = 2;
    } else if (stats.gameTime >= 60) {
        // 1+ mins: Big Groups
        if (rand < 0.15) groupSize = 4 + Math.floor(Math.random() * 4); // 4-8
        else if (rand < 0.45) groupSize = 2 + Math.floor(Math.random() * 2); // 2-3
        else groupSize = 1;
    } else {
        // Early game
        if (rand < 0.3) groupSize = 2 + Math.floor(Math.random() * 2);
        else groupSize = 1;
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
        // Check dynamic limit inside loop
        if (enemies.length >= dynamicMaxEnemies) break;

        const type = phaseMonsters[Math.floor(Math.random() * phaseMonsters.length)];
        const template = ENEMIES[type];

        // Offset position slightly for group members
        const offsetX = (Math.random() - 0.5) * 60; // Wider spread for larger groups
        const offsetY = (Math.random() - 0.5) * 60;

        enemies.push({
            x: baseX + offsetX,
            y: baseY + offsetY,
            type,
            imgKey: type,
            hp: template.hp * hpMultiplier,
            maxHp: template.hp * hpMultiplier,
            speed: template.speed * (1 + stats.gameTime / 300),
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

                // Knockback effect
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

                    // Boss kill = auto level up
                    if (e.isBoss) {
                        const levelsGained = e.isMiniBoss ? 1 : 2;
                        setTimeout(() => triggerLevelUp(levelsGained), 500);
                    }

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
// XP GEMS
// ============================================

function updateXPGems() {
    for (let i = xpGems.length - 1; i >= 0; i--) {
        const gem = xpGems[i];

        // Check if player picks up gem
        const dx = player.x - gem.x;
        const dy = player.y - gem.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) {
            // Pickup! Level up
            triggerLevelUp(gem.value);
            createParticles(gem.x, gem.y, '#a855f7', 10);
            SoundManager.playCollect();
            xpGems.splice(i, 1);
            continue;
        }

        // Gems disappear after 30 seconds
        if (performance.now() - gem.spawnTime > 30000) {
            xpGems.splice(i, 1);
        }
    }
}

// ============================================
// SPECIAL WEAPONS
// ============================================

function updateSpecialWeapons(currentTime, width, height) {
    // Ice Slow effect on enemies
    if (stats.iceSlowLevel > 0) {
        const slowPercent = 0.4 + stats.iceSlowLevel * 0.15; // Buffed slow
        enemies.forEach(e => {
            if (!e.iceSlowed) {
                e.originalSpeed = e.speed;
                e.speed *= (1 - slowPercent);
                e.iceSlowed = true;
            }
        });
    }

    // Halo damage around Khánh Như
    if (stats.haloLevel > 0) {
        const haloRadius = 80 + stats.haloLevel * 20; // Larger range
        const haloDamage = 0.15 * stats.haloLevel; // 3x Damage

        enemies.forEach(e => {
            const dx = kn.x - e.x;
            const dy = kn.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < haloRadius) {
                e.hp -= haloDamage;
            }
        });
    }

    // DRONES - shoot at enemies automatically
    if (stats.droneLevel > 0) {
        const droneCount = Math.min(stats.droneLevel, 3);

        // Initialize drones if needed
        while (drones.length < droneCount) {
            drones.push({
                angle: (drones.length / droneCount) * Math.PI * 2,
                lastFire: 0
            });
        }

        // Update each drone
        drones.forEach((drone, idx) => {
            // Orbit around player
            drone.angle += 0.02;
            drone.x = player.x + Math.cos(drone.angle) * 40;
            drone.y = player.y + Math.sin(drone.angle) * 40;

            // Fire at nearest enemy
            if (currentTime - drone.lastFire > 500 && enemies.length > 0) {
                const nearest = findNearestEnemy(drone);
                if (nearest) {
                    const angle = Math.atan2(nearest.y - drone.y, nearest.x - drone.x);
                    bullets.push({
                        x: drone.x,
                        y: drone.y,
                        vx: Math.cos(angle) * 8,
                        vy: Math.sin(angle) * 8,
                        damage: 1.5 + stats.droneLevel * 0.5, // Stronger Drones
                        pierce: 2, // Pierce 2 enemies
                        range: 200,
                        distance: 0,
                        isPlayer: false,
                        isDrone: true
                    });
                    drone.lastFire = currentTime;
                }
            }
        });
    }

    // FIREBALLS - auto aim, faster cooldown, huge damage
    if (stats.fireballCount > 0 && currentTime - lastFireballTime > 2000) { // 2s cooldown (was 3s)
        const nearest = findNearestEnemy(player);
        if (nearest) {
            for (let i = 0; i < stats.fireballCount; i++) {
                const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
                const spread = (i - (stats.fireballCount - 1) / 2) * 0.2;
                const angle = baseAngle + spread;

                fireballs.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * 4.0,
                    vy: Math.sin(angle) * 4.0,
                    damage: 4.0 + stats.fireballCount * 0.8, // Massive Damage
                    life: 100
                });
            }
            lastFireballTime = currentTime;
        }
    }

    // SHURIKENS - faster, pierce through enemies
    if (stats.shurikenCount > 0 && currentTime - lastShurikenTime > 800) { // 0.8s cooldown (faster)
        const nearest = findNearestEnemy(player);
        if (nearest) {
            for (let i = 0; i < stats.shurikenCount; i++) {
                const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
                const spread = (i - (stats.shurikenCount - 1) / 2) * 0.25;
                const angle = baseAngle + spread;

                shurikens.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * 12,
                    vy: Math.sin(angle) * 12,
                    damage: 2.0 + stats.shurikenCount * 0.3, // Stronger
                    pierce: 5 + stats.shurikenCount, // Pierce 5+
                    rotation: 0
                });
            }
            lastShurikenTime = currentTime;
        }
    }

    // Spinning blades around player
    if (stats.bladeCount > 0) {
        const bladeRadius = 60;
        const bladeSpeed = 0.08; // Faster spin
        const bladeDamage = 1.2 + stats.bladeCount * 0.4; // Shredder damage

        while (blades.length < stats.bladeCount) {
            blades.push({ angle: (blades.length / stats.bladeCount) * Math.PI * 2 });
        }

        blades.forEach(blade => {
            blade.angle += bladeSpeed;
            blade.x = player.x + Math.cos(blade.angle) * bladeRadius;
            blade.y = player.y + Math.sin(blade.angle) * bladeRadius;

            enemies.forEach(e => {
                const dx = blade.x - e.x;
                const dy = blade.y - e.y;
                if (Math.sqrt(dx * dx + dy * dy) < 25) {
                    e.hp -= bladeDamage;
                    createParticles(blade.x, blade.y, '#60a5fa', 2);
                }
            });
        });
    }

    // Update fireballs
    for (let i = fireballs.length - 1; i >= 0; i--) {
        const fb = fireballs[i];
        fb.x += fb.vx;
        fb.y += fb.vy;
        fb.life--;

        enemies.forEach(e => {
            const dx = fb.x - e.x;
            const dy = fb.y - e.y;
            if (Math.sqrt(dx * dx + dy * dy) < 22) {
                e.hp -= fb.damage;
                createParticles(fb.x, fb.y, '#f97316', 4);
            }
        });

        if (fb.life <= 0 || fb.x < -20 || fb.x > width + 20 || fb.y < -20 || fb.y > height + 20) {
            fireballs.splice(i, 1);
        }
    }

    // Update shurikens (with pierce)
    for (let i = shurikens.length - 1; i >= 0; i--) {
        const sh = shurikens[i];
        sh.x += sh.vx;
        sh.y += sh.vy;
        sh.rotation += 0.4;

        // Check collision - pierce through multiple enemies
        for (const e of enemies) {
            const dx = sh.x - e.x;
            const dy = sh.y - e.y;
            if (Math.sqrt(dx * dx + dy * dy) < 20) {
                // Only damage if not already hit this enemy
                if (!sh.hitEnemies) sh.hitEnemies = new Set();
                if (!sh.hitEnemies.has(e)) {
                    e.hp -= sh.damage;
                    createParticles(sh.x, sh.y, '#94a3b8', 2);
                    sh.hitEnemies.add(e);
                    sh.pierce--;

                    if (sh.pierce <= 0) {
                        shurikens.splice(i, 1);
                        break;
                    }
                }
            }
        }

        if (sh.x < -20 || sh.x > width + 20 || sh.y < -20 || sh.y > height + 20) {
            shurikens.splice(i, 1);
        }
    }
}

function findNearestEnemy(from) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const e of enemies) {
        const dx = e.x - from.x;
        const dy = e.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = e;
        }
    }
    return nearest;
}

// ============================================
// DRAWING
// ============================================

function draw() {
    const width = canvas.logicalWidth;
    const height = canvas.logicalHeight;
    const dpr = canvas.dpr || 1;

    // Reset and reapply DPR transform before each frame
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
        } else if (b.isDrone) {
            ctx.fillStyle = '#22d3ee';
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 6;
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

    // Agents with level indicator
    for (const agent of agents) {
        const lvl = agent.upgradeLevel || 1;
        const size = 20 + lvl * 2;

        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(agent.type.emoji, agent.x, agent.y);

        // Level badge
        if (lvl > 1) {
            ctx.font = '10px Arial';
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(`Lv${lvl}`, agent.x, agent.y + 18);
        }

        // Range indicator
        const range = agent.type.range * (1 + lvl * 0.15);
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, range, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Drones
    for (const drone of drones) {
        if (drone.x && drone.y) {
            // Drone body
            ctx.fillStyle = '#22d3ee';
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(drone.x, drone.y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Propellers
            ctx.strokeStyle = '#67e8f9';
            ctx.lineWidth = 2;
            const propAngle = performance.now() / 50;
            for (let i = 0; i < 4; i++) {
                const a = propAngle + (i * Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(drone.x, drone.y);
                ctx.lineTo(drone.x + Math.cos(a) * 12, drone.y + Math.sin(a) * 12);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }
    }

    // XP Gems
    for (const gem of xpGems) {
        const pulse = 1 + Math.sin(performance.now() / 200) * 0.1;
        const gemSize = 12 * pulse;

        // Glow
        const glow = ctx.createRadialGradient(gem.x, gem.y, 0, gem.x, gem.y, gemSize * 2);
        glow.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(gem.x, gem.y, gemSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // Gem (Diamond shape)
        ctx.fillStyle = gem.value >= 2 ? '#e879f9' : '#a855f7';
        ctx.beginPath();
        ctx.moveTo(gem.x, gem.y - gemSize); // Top
        ctx.lineTo(gem.x + gemSize, gem.y); // Right
        ctx.lineTo(gem.x, gem.y + gemSize); // Bottom
        ctx.lineTo(gem.x - gemSize, gem.y); // Left
        ctx.closePath();
        ctx.fill();

        // Shine/Reflection on top part
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(gem.x, gem.y - gemSize);
        ctx.lineTo(gem.x + gemSize * 0.5, gem.y - gemSize * 0.5);
        ctx.lineTo(gem.x, gem.y);
        ctx.lineTo(gem.x - gemSize * 0.5, gem.y - gemSize * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(`+${gem.value}`, gem.x, gem.y + 3);
    }

    // Fireballs (larger size)
    for (const fb of fireballs) {
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, 11, 0, Math.PI * 2); // 40% larger
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Shurikens
    for (const sh of shurikens) {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.rotation);
        ctx.fillStyle = '#94a3b8';

        // Draw star shape
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(8, -3);
            ctx.lineTo(8, 3);
            ctx.closePath();
            ctx.fill();
            ctx.rotate(Math.PI / 2);
        }
        ctx.restore();
    }

    // Spinning Blades
    for (const blade of blades) {
        if (blade.x && blade.y) {
            ctx.save();
            ctx.translate(blade.x, blade.y);
            ctx.rotate(blade.angle * 3);

            ctx.fillStyle = '#60a5fa';
            ctx.shadowColor = '#60a5fa';
            ctx.shadowBlur = 8;

            // Blade shape
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    // Halo around Khánh Như
    if (stats.haloLevel > 0) {
        const haloRadius = 60 + stats.haloLevel * 15;
        const gradient = ctx.createRadialGradient(kn.x, kn.y, 0, kn.x, kn.y, haloRadius);
        gradient.addColorStop(0, 'rgba(251, 191, 36, 0)');
        gradient.addColorStop(0.7, 'rgba(251, 191, 36, 0.1)');
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0.3)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(kn.x, kn.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Rotating particles
        const time = performance.now() / 1000;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time;
            const px = kn.x + Math.cos(angle) * (haloRadius - 5);
            const py = kn.y + Math.sin(angle) * (haloRadius - 5);

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Khánh Như
    drawKhanhNhu();

    // Player
    drawPlayer();
}

function drawArena(width, height) {
    // 1. Background (Off-road areas - clean dark slate)
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    // Grid settings - Larger blocks for less clutter
    const blockSize = 400;
    const roadWidth = 120;

    // 2. Draw Roads (Simplistic style)
    // Draw all vertical roads
    for (let x = blockSize / 2; x < width + blockSize; x += blockSize) {
        // Road surface
        ctx.fillStyle = '#374151';
        ctx.fillRect(x - roadWidth / 2, 0, roadWidth, height);

        // Curb lines (Solid, distinct)
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(x - roadWidth / 2 - 4, 0, 4, height); // Left curb
        ctx.fillRect(x + roadWidth / 2, 0, 4, height);     // Right curb

        // Center line (Dashes, spaced out)
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([40, 40]); // Long dashes, long gaps
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Draw all horizontal roads
    for (let y = blockSize / 2; y < height + blockSize; y += blockSize) {
        // Road surface
        ctx.fillStyle = '#374151';
        ctx.fillRect(0, y - roadWidth / 2, width, roadWidth);

        // Curb lines
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(0, y - roadWidth / 2 - 4, width, 4); // Top curb
        ctx.fillRect(0, y + roadWidth / 2, width, 4);     // Bottom curb

        // Center line
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([40, 40]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    ctx.setLineDash([]); // Reset dash

    // 3. Intersections (Clean, no complex markings)
    for (let x = blockSize / 2; x < width + blockSize; x += blockSize) {
        for (let y = blockSize / 2; y < height + blockSize; y += blockSize) {
            // Darker intersection patch
            ctx.fillStyle = '#374151';
            ctx.fillRect(x - roadWidth / 2, y - roadWidth / 2, roadWidth, roadWidth);

            // Simple crosswalk (faded white stripes)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            const stripeW = 20;
            const stripeH = 8;
        }
    }

    // Player range indicator (Clean circle)
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(player.x, player.y, stats.bulletRange, 0, Math.PI * 2);
    ctx.stroke();
}

function drawKhanhNhu() {
    // Glow effect
    const glowSize = 50 + Math.sin(performance.now() / 300) * 5;
    const glow = ctx.createRadialGradient(kn.x, kn.y, 0, kn.x, kn.y, glowSize);
    glow.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(kn.x, kn.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw Image
    const knImg = images['khanhnhu'];
    const size = CONFIG.KN_SIZE + 30; // Slightly larger for visibility

    if (knImg && knImg.complete) {
        const aspect = imageAspects['khanhnhu'] || 1;
        let drawW, drawH;

        if (aspect >= 1) {
            drawW = size;
            drawH = size / aspect;
        } else {
            drawH = size;
            drawW = size * aspect;
        }
        ctx.drawImage(knImg, kn.x - drawW / 2, kn.y - drawH / 2, drawW, drawH);
    } else {
        // Fallback
        ctx.font = `${CONFIG.KN_SIZE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💖', kn.x, kn.y);
    }

    // Draw Name "Khánh Như"
    ctx.font = '700 16px "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Outline for better visibility
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ec4899'; // Pink stroke
    ctx.strokeText('Khánh Như', kn.x, kn.y - size / 2 - 5);

    // Fill text
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Khánh Như', kn.x, kn.y - size / 2 - 5);
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
