// ============================================
// WHACK-A-MOLE - Khánh Như Edition
// Mobile-First Touch Optimized
// ============================================

const CONFIG = {
    GAME_DURATION: 45,
    HOLES_COUNT: 9,

    // Mole timing (adjusts with difficulty)
    INITIAL_UP_TIME: 1200,
    MIN_UP_TIME: 500,
    INITIAL_SPAWN_DELAY: 800,
    MIN_SPAWN_DELAY: 300
};

const MOLE_TYPES = [
    { type: 'mouse1', img: 'img/1.png', points: 10, weight: 45 },
    { type: 'mouse2', img: 'img/2.png', points: 15, weight: 30 },
    { type: 'golden', img: 'img/3.png', points: 30, weight: 10, golden: true },
    { type: 'bomb', emoji: '💣', points: -20, weight: 15, isBad: true } // Changed from Hedgehog to Bomb
];

// ... (giữ nguyên các biến global)

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
            hideTimeout: null
        });
    }
}

// ... (giữ nguyên startGame, gameOver, getDifficulty, scheduleNextMole)

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
    const difficulty = getDifficulty();
    const upTime = Math.max(
        CONFIG.MIN_UP_TIME,
        CONFIG.INITIAL_UP_TIME - (difficulty - 1) * 300
    );

    mole.hideTimeout = setTimeout(() => {
        if (mole.isUp && mole.canHit) {
            // Missed this mole - reset combo
            combo = 0;
        }
        hideMole(holeIndex);
    }, upTime + Math.random() * 200);
}

function hideMole(index) {
    const mole = moles[index];
    mole.element.classList.remove('up', 'hit', 'golden');
    mole.isUp = false;
    mole.type = null;
}

function whackMole(index) {
    const mole = moles[index];

    if (!mole.isUp || !mole.canHit || !gameRunning) return;

    mole.canHit = false;
    clearTimeout(mole.hideTimeout);

    // Visual Effects
    const rect = holes[index].getBoundingClientRect();
    createHammerEffect(rect.left + rect.width / 2, rect.top + rect.height / 2);
    shakeScreen();

    // Add hit animation
    mole.element.classList.add('hit');

    // Calculate points
    let points = mole.type.points;

    if (!mole.type.isBad) {
        // Good hit - increase combo
        SoundManager.playHit();
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
function createHammerEffect(x, y) {
    const hammer = document.createElement('div');
    hammer.className = 'hammer-visual';
    hammer.style.left = (x - 20) + 'px'; // Offset slightly
    hammer.style.top = (y - 40) + 'px';
    document.body.appendChild(hammer);
    setTimeout(() => hammer.remove(), 300);
}

function shakeScreen() {
    const container = document.querySelector('.game-container'); // Shake container/board
    container.classList.remove('shaking'); // Reset
    void container.offsetWidth; // Force reflow
    container.classList.add('shaking');
}

// Start
init();
