// ============================================
// WHACK-A-MOLE - Khánh Như Edition
// Mobile-First Touch Optimized
// ============================================

const CONFIG = {
    GAME_DURATION: 300, // 5 minutes
    HOLES_COUNT: 9,
    MAX_BOMBS: 5,

    // Mole timing (Slower and easier)
    INITIAL_UP_TIME: 1500,  // Was 1200
    MIN_UP_TIME: 800,       // Was 500
    INITIAL_SPAWN_DELAY: 1000, // Was 800
    MIN_SPAWN_DELAY: 600      // Was 300
};

const MOLE_TYPES = [
    { type: 'mouse1', img: 'img/1.png', points: 10, weight: 45 },
    { type: 'mouse2', img: 'img/2.png', points: 15, weight: 30 },
    { type: 'golden', img: 'img/3.png', points: 30, weight: 10, golden: true },
    { type: 'bomb', emoji: '💣', points: -20, weight: 15, isBad: true } // Changed from Hedgehog to Bomb
];

let gameRunning = false;
let score = 0;
let highScore = 0;
let timeLeft = CONFIG.GAME_DURATION;
let combo = 0;
let maxCombo = 0;
let bombCount = 0;

let holes = [];
let moles = [];
let gameTimer = null;
let spawnTimeout = null;

function init() {
    highScore = parseInt(localStorage.getItem('arcade_whack_highscore') || 0);
    const hsEl = document.getElementById('high-score');
    if (hsEl) hsEl.textContent = highScore;

    createBoard();

    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (restartBtn) restartBtn.addEventListener('click', startGame);
}

function createBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    holes = [];
    moles = [];

    for (let i = 0; i < CONFIG.HOLES_COUNT; i++) {
        const hole = document.createElement('div');
        hole.className = 'hole';
        hole.dataset.index = i;

        const mole = document.createElement('div');
        mole.className = 'mole';
        // Remove innerHTML initial span, we will manage content dynamically

        hole.appendChild(mole);
        board.appendChild(hole);

        // Touch/click handlers
        hole.addEventListener('touchstart', (e) => {
            e.preventDefault();
            whackMole(i);
        }, { passive: false });

        hole.addEventListener('click', () => whackMole(i));

        holes.push(hole);
        moles.push({
            element: mole,
            isUp: false,
            type: null,
            canHit: true,
            canHit: true,
            hideTimeout: null,
            tauntTimeout: null
        });
    }
}

function startGame() {
    const overlay = document.getElementById('start-overlay');
    const goOverlay = document.getElementById('gameover-overlay');

    if (overlay) overlay.classList.add('hidden');
    if (goOverlay) goOverlay.classList.add('hidden');

    // Reset state
    createBoard();
    score = 0;
    timeLeft = CONFIG.GAME_DURATION;
    combo = 0;
    maxCombo = 0;
    bombCount = 0;

    document.getElementById('current-score').textContent = '0';
    document.getElementById('timer').textContent = formatTimer(timeLeft);
    document.getElementById('timer').style.color = '';
    document.getElementById('bombs-count').textContent = `0/${CONFIG.MAX_BOMBS}`;
    document.getElementById('bombs-count').style.color = '#ef4444';

    // Start BGM
    SoundManager.playBGM('yA41iunMG6A');

    gameRunning = true;

    // Start timer
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = formatTimer(timeLeft);

        if (timeLeft <= 10) {
            document.getElementById('timer').style.color = '#ef4444';
        }

        if (timeLeft <= 0) {
            SoundManager.playGameOver();
            gameOver();
        }
    }, 1000);

    // Start spawning
    scheduleNextMole();
}

function gameOver() {
    gameRunning = false;
    SoundManager.stopBGM();

    // Add score to Wallet (Score can be negative in whack? Just in case, max(0))
    const currentWallet = parseInt(localStorage.getItem('arcade_wallet_points') || 0);
    localStorage.setItem('arcade_wallet_points', currentWallet + Math.max(0, score));

    clearInterval(gameTimer);
    clearTimeout(spawnTimeout);

    // Hide all moles
    moles.forEach((mole, i) => {
        clearTimeout(mole.hideTimeout);
        hideMole(i);
    });

    // Check highscore
    let isNewHighscore = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('arcade_whack_highscore', highScore);
        document.getElementById('high-score').textContent = highScore;
        isNewHighscore = true;
    }

    document.getElementById('final-score').textContent = 'Điểm: ' + score;
    const msg = document.getElementById('highscore-message');
    msg.innerHTML = isNewHighscore
        ? '<span class="new-highscore">🎉 Kỷ lục mới!</span>'
        : 'Kỷ lục: ' + highScore;
    document.getElementById('gameover-overlay').classList.remove('hidden');
}

function getDifficulty() {
    const elapsed = CONFIG.GAME_DURATION - timeLeft;
    return 1 + elapsed / CONFIG.GAME_DURATION;
}

function scheduleNextMole() {
    if (!gameRunning) return;

    // Linear interpolation for smooth speed increase
    // Tốc độ tăng đều từ INITIAL_SPAWN_DELAY xuống MIN_SPAWN_DELAY
    const progress = (CONFIG.GAME_DURATION - timeLeft) / CONFIG.GAME_DURATION;
    const currentDelay = CONFIG.INITIAL_SPAWN_DELAY - (progress * (CONFIG.INITIAL_SPAWN_DELAY - CONFIG.MIN_SPAWN_DELAY));

    // Randomize slightly but keep close to the curve
    const delay = Math.max(CONFIG.MIN_SPAWN_DELAY, currentDelay);

    spawnTimeout = setTimeout(() => {
        popUpMole();

        // 5% chance Double Spawn
        if (Math.random() < 0.05 && timeLeft > 5) {
            setTimeout(() => popUpMole(), 150);
        }

        scheduleNextMole();
    }, delay);
}

function popUpMole() {
    if (!gameRunning) return;

    // Find available holes
    const availableHoles = moles
        .map((m, i) => m.isUp ? -1 : i)
        .filter(i => i >= 0);

    if (availableHoles.length === 0) return;

    const holeIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    const mole = moles[holeIndex];

    // Select mole type
    const totalWeight = MOLE_TYPES.reduce((sum, t) => sum + t.weight, 0);
    let rand = Math.random() * totalWeight;
    let selectedType = MOLE_TYPES[0];

    for (const type of MOLE_TYPES) {
        rand -= type.weight;
        if (rand <= 0) { selectedType = type; break; }
    }

    // Setup mole properties
    mole.type = selectedType;
    mole.isUp = true;
    mole.canHit = true;

    // Render Content (Image or Emoji)
    mole.element.innerHTML = ''; // Clear previous
    mole.element.className = 'mole'; // Reset classes

    if (selectedType.img) {
        const img = document.createElement('img');
        img.src = selectedType.img;
        img.className = 'mole-img';
        img.draggable = false;
        mole.element.appendChild(img);
    } else if (selectedType.emoji) {
        const span = document.createElement('span');
        span.className = 'mole-emoji';
        span.textContent = selectedType.emoji;
        mole.element.appendChild(span);
        mole.element.classList.add('is-emoji'); // Special styling for bomb emoji
    }

    mole.element.classList.add('up');

    if (selectedType.golden) {
        mole.element.classList.add('golden');
    }
    if (selectedType.isBad) {
        mole.element.classList.add('bad'); // Add bad class for bomb styling
    }

    // Schedule hide ...


    // Schedule hide
    const progress = (CONFIG.GAME_DURATION - timeLeft) / CONFIG.GAME_DURATION;
    const currentUpTime = CONFIG.INITIAL_UP_TIME - (progress * (CONFIG.INITIAL_UP_TIME - CONFIG.MIN_UP_TIME));
    const upTime = Math.max(CONFIG.MIN_UP_TIME, currentUpTime);

    // Taunt mechanism: Shake harder after 50% of up time
    mole.tauntTimeout = setTimeout(() => {
        if (mole.isUp && mole.canHit) {
            mole.element.classList.add('taunt');
        }
    }, upTime * 0.4);

    mole.hideTimeout = setTimeout(() => {
        if (mole.isUp && mole.canHit) {
            // Missed this mole - reset combo
            combo = 0;
        }
        hideMole(holeIndex);
    }, upTime);
}

function hideMole(index) {
    const mole = moles[index];
    mole.element.classList.remove('up', 'hit', 'golden', 'taunt');
    mole.isUp = false;
    mole.type = null;
    clearTimeout(mole.tauntTimeout);
}

function whackMole(index) {
    const mole = moles[index];

    if (!mole.isUp || !mole.canHit || !gameRunning) return;

    mole.canHit = false;
    clearTimeout(mole.hideTimeout);
    clearTimeout(mole.tauntTimeout);
    mole.element.classList.remove('taunt');

    // Determine Critical Hit (15% chance)
    const isCritical = Math.random() < 0.15;

    // Visual Effects
    const rect = holes[index].getBoundingClientRect();
    createHammerEffect(rect.left + rect.width / 2, rect.top + rect.height / 2, isCritical);
    shakeScreen(isCritical);

    // Add hit animation
    mole.element.classList.add('hit');

    // Calculate points
    let points = mole.type.points;

    if (!mole.type.isBad) {
        // Good hit - increase combo
        if (isCritical) SoundManager.playCriticalHit();
        else SoundManager.playHit();

        SoundManager.playCollect();
        combo++;
        maxCombo = Math.max(maxCombo, combo);

        // Combo bonus
        if (combo >= 3) {
            points = Math.floor(points * (1 + combo * 0.1));
        }
    } else {
        // Bad hit - reset combo
        SoundManager.playBad();
        combo = 0;

        // Bomb logic
        bombCount++;
        document.getElementById('bombs-count').textContent = `${bombCount}/${CONFIG.MAX_BOMBS}`;

        if (bombCount >= CONFIG.MAX_BOMBS) {
            SoundManager.playGameOver();
            gameOver();
            return;
        }
    }

    // Update score
    score = Math.max(0, score + points);
    document.getElementById('current-score').textContent = score;

    // Show score popup
    showScorePopup(holes[index], points);

    // Hide mole after brief delay
    setTimeout(() => hideMole(index), 80);
}

function showScorePopup(hole, points) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = points > 0 ? '+' + points : points;
    popup.style.color = points > 0 ? '#22c55e' : '#ef4444';
    popup.style.left = '50%';
    popup.style.top = '30%';

    hole.appendChild(popup);

    setTimeout(() => popup.remove(), 500);
}

// Visual Effects Functions
function createHammerEffect(x, y, isBig = false) {
    const hammer = document.createElement('div');
    hammer.className = 'hammer-visual';
    hammer.style.left = (x - (isBig ? 45 : 30)) + 'px'; // Center offset adjustments
    hammer.style.top = (y - (isBig ? 60 : 40)) + 'px';

    if (isBig) hammer.style.transform = 'scale(1.5)';

    document.body.appendChild(hammer);
    setTimeout(() => hammer.remove(), 300);
}

function shakeScreen(isHard = false) {
    const container = document.querySelector('.game-container'); // Shake container/board
    container.classList.remove('shaking', 'shaking-hard'); // Reset
    void container.offsetWidth; // Force reflow
    container.classList.add(isHard ? 'shaking-hard' : 'shaking');
}

function formatTimer(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Start
init();
