// ===== Arcade Main Script =====

// Storage keys
const STORAGE_KEYS = {
    DINO_HIGHSCORE: 'arcade_dino_highscore',
    CATCH_HIGHSCORE: 'arcade_catch_highscore',
    WHACK_HIGHSCORE: 'arcade_whack_highscore',
    PROTECT_HIGHSCORE: 'arcade_protect_highscore',
    GAMES_PLAYED: 'arcade_games_played',
    WALLET: 'arcade_wallet_points',
    TOTAL_SPINS: 'arcade_total_spins'
};

// Initialize arcade
document.addEventListener('DOMContentLoaded', () => {
    // Migrate Logic or Fix Corruption
    let wallet = localStorage.getItem(STORAGE_KEYS.WALLET);
    if (wallet === null || wallet === 'NaN' || isNaN(parseInt(wallet))) {
        const dino = parseInt(localStorage.getItem(STORAGE_KEYS.DINO_HIGHSCORE) || 0);
        const catchG = parseInt(localStorage.getItem(STORAGE_KEYS.CATCH_HIGHSCORE) || 0);
        const whack = parseInt(localStorage.getItem(STORAGE_KEYS.WHACK_HIGHSCORE) || 0);
        const protect = parseInt(localStorage.getItem(STORAGE_KEYS.PROTECT_HIGHSCORE) || 0);
        const spent = parseInt(localStorage.getItem('arcade_spent_points') || 0);

        // Recalculate safe value
        const initialWallet = Math.max(0, (dino + catchG + whack + protect) - spent);
        localStorage.setItem(STORAGE_KEYS.WALLET, initialWallet);
    }

    loadHighscores();
    loadStats();
    setupCardInteractions();
});

// Fix: Reload data when returning to the page (handling Mobile Back Cache)
window.addEventListener('pageshow', (event) => {
    // Always reload to ensure points are up to date
    loadHighscores();
    loadStats();
});

// Update data when switching tabs/windows
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        loadHighscores();
        loadStats();
    }
});

window.addEventListener('focus', () => {
    loadHighscores();
    loadStats();
});

// Load highscores from localStorage
function loadHighscores() {
    const dinoScore = localStorage.getItem(STORAGE_KEYS.DINO_HIGHSCORE) || 0;
    const catchScore = localStorage.getItem(STORAGE_KEYS.CATCH_HIGHSCORE) || 0;
    const whackScore = localStorage.getItem(STORAGE_KEYS.WHACK_HIGHSCORE) || 0;
    const protectScore = localStorage.getItem(STORAGE_KEYS.PROTECT_HIGHSCORE) || 0;

    document.getElementById('dino-highscore').textContent = formatNumber(dinoScore);
    document.getElementById('catch-highscore').textContent = formatNumber(catchScore);
    document.getElementById('whack-highscore').textContent = formatNumber(whackScore);
    document.getElementById('protect-highscore').textContent = formatNumber(protectScore);

    // Display Wallet Points in Header (was Total Highscore)
    const wallet = parseInt(localStorage.getItem(STORAGE_KEYS.WALLET) || 0);
    document.getElementById('total-highscore').textContent = formatNumber(wallet);
}

// Load games played stats
function loadStats() {
    const gamesPlayed = localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED) || 0;
    document.getElementById('games-played').textContent = formatNumber(gamesPlayed);

    // Gacha spins
    const spins = localStorage.getItem(STORAGE_KEYS.TOTAL_SPINS) || 0;
    const spinDisplay = document.getElementById('total-spins-display');
    if (spinDisplay) spinDisplay.textContent = formatNumber(spins);
}

// Format number with comma separators
function formatNumber(num) {
    const n = parseInt(num);
    if (isNaN(n)) return "0";
    return n.toLocaleString('vi-VN');
}

// Setup card hover interactions
function setupCardInteractions() {
    const cards = document.querySelectorAll('.game-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Add subtle sound effect or haptic feedback here if needed
        });

        card.addEventListener('click', (e) => {
            // Don't trigger if clicking the play button
            if (e.target.closest('.play-button')) {
                incrementGamesPlayed();
            }
        });
    });
}

// Increment games played counter
function incrementGamesPlayed() {
    let gamesPlayed = parseInt(localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED) || 0);
    gamesPlayed++;
    localStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, gamesPlayed);
}

// Update highscore (called from individual games)
function updateHighscore(game, score) {
    const key = STORAGE_KEYS[`${game.toUpperCase()}_HIGHSCORE`];
    const currentHighscore = parseInt(localStorage.getItem(key) || 0);

    if (score > currentHighscore) {
        localStorage.setItem(key, score);
        return true; // New highscore!
    }
    return false;
}

// Export for use in games
window.ArcadeHelper = {
    updateHighscore,
    formatNumber,
    STORAGE_KEYS
};

/* --- GACHA SYSTEM LOGIC (UPDATED WITH WALLET SYSTEM) --- */
const GACHA_ITEMS = [
    { id: '1', img: 'games/catch/img/1.png', name: 'Bút Gel Xanh', prob: 0.01 }, // 1%
    { id: '1b', img: 'games/catch/img/1.png', name: 'Bút Gel Đỏ', prob: 0.01 },
    { id: '1c', img: 'games/catch/img/1.png', name: 'Bút Gel Đen', prob: 0.01 },
    { id: '2', img: 'games/catch/img/2.png', name: 'Bút Chì Gradient', prob: 0.009 }, // 0.9%
    { id: '3', img: 'games/catch/img/3.png', name: 'Bộ Bút Van Gogh', prob: 0.02 }, // 2%
    { id: '4', img: 'games/catch/img/4.png', name: 'Gọt Bút Chì', prob: 0.04 }, // 4%
    { id: '5', img: 'games/catch/img/5.png', name: 'Cốc Thỏ Hồng', prob: 0.00125 } // 1/800 (0.125%)
];
const GACHA_COST = 200;

function openGacha(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Update points display
    const currentWallet = getTotalPoints();
    document.getElementById('user-points-display').textContent = formatNumber(currentWallet);

    // Update spins count explicitly
    const spinDisplay = document.getElementById('total-spins-display');
    const totalSpins = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_SPINS) || 0);
    if (spinDisplay) spinDisplay.textContent = formatNumber(totalSpins);

    // Render Collection
    renderCollection();

    // Reset view (Stage)
    const stage = document.getElementById('gacha-stage');
    if (stage) {
        stage.innerHTML = '<div class="placeholder-text">Nhấn quay để bắt đầu!</div>';
    }

    // Ensure styles are reset
    document.querySelector('.gacha-display').classList.remove('burst');

    document.getElementById('gacha-modal').classList.remove('hidden');
}

function closeGacha() {
    document.getElementById('gacha-modal').classList.add('hidden');
    // Refresh main display too just in case
    loadHighscores();
}

function getTotalPoints() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.WALLET) || 0);
}

function spinGacha(count = 1) {
    const cost = GACHA_COST * count;
    const currentWallet = getTotalPoints();

    if (currentWallet < cost) {
        alert(`Bạn không đủ điểm! Cần ${formatNumber(cost)} điểm để quay ${count} lần.\nHãy chơi game để kiếm thêm điểm tích lũy nhé!`);
        return;
    }

    // Deduct points directly
    const newWallet = currentWallet - cost;
    localStorage.setItem(STORAGE_KEYS.WALLET, newWallet);

    // Increment Total Spins
    let totalSpins = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_SPINS) || 0);
    totalSpins += count;
    localStorage.setItem(STORAGE_KEYS.TOTAL_SPINS, totalSpins);

    // Update UI
    document.getElementById('user-points-display').textContent = formatNumber(newWallet);
    document.getElementById('total-highscore').textContent = formatNumber(newWallet);
    const spinDisplay = document.getElementById('total-spins-display');
    if (spinDisplay) spinDisplay.textContent = formatNumber(totalSpins);

    // Disable buttons temporarily
    const btns = document.querySelectorAll('.spin-btn');
    btns.forEach(b => b.disabled = true);

    const revealBtn = document.getElementById('reveal-all-btn');
    if (revealBtn) revealBtn.classList.add('hidden');

    // Reset Stage
    const stage = document.getElementById('gacha-stage');
    // Hide old elements if they exist
    const box = document.getElementById('gacha-box');
    if (box) box.classList.add('hidden');

    stage.innerHTML = ''; // Clear old cards

    // Generate Results
    const results = [];
    const hasSpunBefore = localStorage.getItem('arcade_gacha_welcome');

    for (let i = 0; i < count; i++) {
        if (!hasSpunBefore && i === 0) {
            results.push(rollGuaranteedItem());
            localStorage.setItem('arcade_gacha_welcome', 'true');
        } else {
            results.push(rollItem());
        }
    }

    // Render Cards
    renderCards(results);
    renderCollection();

    // Re-enable buttons after animation deal
    setTimeout(() => {
        btns.forEach(b => b.disabled = false);
        const btn1 = document.getElementById('spin-btn-1');
        if (btn1) btn1.textContent = `Quay 1 (${GACHA_COST}đ)`;

        const revealBtn = document.getElementById('reveal-all-btn');
        if (count > 1 && revealBtn) {
            revealBtn.classList.remove('hidden');
        }
    }, 600);
}

function renderCards(results) {
    const stage = document.getElementById('gacha-stage');
    const isSingle = results.length === 1;

    results.forEach((res, index) => {
        const card = createCardElement(res, isSingle, index);
        stage.appendChild(card);
    });
}

function createCardElement(result, isSingle, index) {
    const wrapper = document.createElement('div');
    wrapper.className = `flip-card ${isSingle ? 'single' : ''}`;
    wrapper.style.animationDelay = `${index * 0.05}s`;

    const inner = document.createElement('div');
    inner.className = 'flip-card-inner';

    // Front (Card Back Design)
    const front = document.createElement('div');
    front.className = 'flip-card-front';

    // Back (Reward Info)
    const back = document.createElement('div');
    // Check rarity: ID 5 (Mug) is rare for example
    const isRare = result.item && (result.item.id === '5' || result.item.prob < 0.02);
    back.className = `flip-card-back ${isRare ? 'rare' : ''}`;

    if (result.type === 'miss') {
        back.innerHTML = `
            <div style="font-size: 3rem;">💨</div>
            <div class="card-reward-name">Chúc may mắn!</div>
            <div class="card-reward-type">Trượt</div>
        `;
    } else {
        const isDup = result.type === 'duplicate';
        back.innerHTML = `
            <img src="${result.item.img}" alt="${result.item.name}">
            <div class="card-reward-name">${result.item.name}</div>
            <div class="card-reward-type" style="${isDup ? 'background:#fed7aa;color:#c2410c' : 'background:#bbf7d0;color:#15803d'}">
                ${isDup ? 'Đã có' : 'Mới!'}
            </div>
        `;
    }

    inner.appendChild(front);
    inner.appendChild(back);
    wrapper.appendChild(inner);

    // FLIP LOGIC
    const flipAction = () => {
        if (!wrapper.classList.contains('flipped')) {
            wrapper.classList.add('flipped');

            // JACKPOT TRIGGER (ID '5')
            if (result.item && result.item.id === '5') {
                setTimeout(() => {
                    const overlay = document.getElementById('jackpot-overlay');
                    if (overlay) overlay.classList.remove('hidden');
                }, 800);
            }
        }
    };

    wrapper.addEventListener('click', flipAction);

    // Auto flip for single spin
    if (isSingle) {
        setTimeout(flipAction, 300);
    }

    return wrapper;
}

function rollGuaranteedItem() {
    // Filter out Mug (ID '5')
    const pool = GACHA_ITEMS.filter(item => item.id !== '5');

    // Pick random
    const selected = pool[Math.floor(Math.random() * pool.length)];

    // Add to inventory
    const inventory = JSON.parse(localStorage.getItem('arcade_inventory') || '[]');
    let type = 'new';

    if (inventory.includes(selected.id)) {
        type = 'duplicate';
    } else {
        inventory.push(selected.id);
        localStorage.setItem('arcade_inventory', JSON.stringify(inventory));
    }

    return { type: type, item: selected, isGuaranteed: true };
}

function rollItem() {
    let selected = null;
    const roll = Math.random();

    let cumulative = 0;
    for (const item of GACHA_ITEMS) {
        if (roll < cumulative + item.prob) {
            selected = item;
            break;
        }
        cumulative += item.prob;
    }

    if (selected) {
        // Check owned
        const inventory = JSON.parse(localStorage.getItem('arcade_inventory') || '[]');
        if (inventory.includes(selected.id)) {
            return { type: 'duplicate', item: selected };
        } else {
            // Add to inventory
            inventory.push(selected.id);
            localStorage.setItem('arcade_inventory', JSON.stringify(inventory));
            return { type: 'new', item: selected };
        }
    }

    return { type: 'miss' };
}

function displaySingleResult(result) {
    const container = document.getElementById('gacha-result-container');
    const img = document.getElementById('gacha-reward-img');
    const name = document.getElementById('gacha-reward-name');
    const note = document.getElementById('gacha-reward-note');

    container.classList.remove('hidden');

    if (result.type === 'miss') {
        img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="50">💨</text></svg>';
        name.textContent = "Chúc may mắn lần sau!";
        note.textContent = "Trượt rồi hihi!";
    } else if (result.type === 'duplicate') {
        img.src = result.item.img;
        name.textContent = result.item.name;
        note.textContent = "⚠️ Bạn đã sở hữu món này rồi!";
    } else {
        img.src = result.item.img;
        name.textContent = "🎉 " + result.item.name;
        note.textContent = "Chúc mừng! Bạn nhận được quà mới!";
    }
}

function displayMultiResult(results) {
    const container = document.getElementById('gacha-multi-result');
    if (!container) return;
    container.innerHTML = '';
    container.classList.remove('hidden');

    results.forEach((res, index) => {
        const el = document.createElement('div');
        el.className = `gacha-mini-item ${res.type}`;
        el.style.animationDelay = `${index * 0.05}s`;

        if (res.type === 'miss') {
            el.innerHTML = `<span>💨</span><span>Trượt</span>`;
        } else {
            const isDup = res.type === 'duplicate';
            el.innerHTML = `<img src="${res.item.img}"><span>${res.item.name}</span>`;
            if (res.type === 'new') {
                el.classList.add('new');
            } else if (res.type === 'duplicate') {
                el.classList.add('duplicate');
            }
        }
        container.appendChild(el);
    });
}

function renderCollection() {
    const inventory = JSON.parse(localStorage.getItem('arcade_inventory') || '[]');
    const grid = document.getElementById('collection-grid');
    if (!grid) return;
    grid.innerHTML = '';

    GACHA_ITEMS.forEach(item => {
        const el = document.createElement('div');
        const isOwned = inventory.includes(item.id);
        el.className = `collection-item ${isOwned ? 'owned' : ''}`;

        if (isOwned) {
            el.innerHTML = `<img src="${item.img}" title="${item.name}">`;
        } else {
            el.innerHTML = '<span style="font-size:1.5rem">🔒</span>';
        }
        grid.appendChild(el);
    });
}

// ==========================================
// GIFTCODE SYSTEM
// ==========================================

function openCodeModal() {
    document.getElementById('code-modal').classList.remove('hidden');
}

function closeCodeModal() {
    document.getElementById('code-modal').classList.add('hidden');
}

function redeemCode() {
    const input = document.getElementById('giftcode-input');
    const code = input.value.trim().toLowerCase();

    if (!code) return;

    if (code === 'denbu') {
        const hasRedeemed = localStorage.getItem('arcade_redeemed_code_denbu');
        if (hasRedeemed) {
            alert('⚠️ Bạn nhận quà đền bù này rồi mà! Đừng tham lam nha 😘');
        } else {
            const reward = 250000; // 250k points
            const currentWallet = parseInt(localStorage.getItem(STORAGE_KEYS.WALLET) || 0);
            const newWallet = currentWallet + reward;

            localStorage.setItem(STORAGE_KEYS.WALLET, newWallet);
            localStorage.setItem('arcade_redeemed_code_denbu', 'true');

            alert(`🎉 THÀNH CÔNG!\nBạn đã nhận được ${formatNumber(reward)} điểm đền bù.\nChúc bạn chơi vui vẻ!`);

            // Update UI
            document.getElementById('user-points-display').textContent = formatNumber(newWallet);
            document.getElementById('total-highscore').textContent = formatNumber(newWallet);

            closeCodeModal();
        }
    } else {
        alert('❌ Mã code không đúng hoặc đã hết hạn.');
    }

    input.value = '';
}

function closeJackpot() {
    document.getElementById('jackpot-overlay').classList.add('hidden');
}

function revealAllCards() {
    const cards = document.querySelectorAll('.flip-card:not(.flipped)');
    if (cards.length === 0) return;

    cards.forEach((card, index) => {
        setTimeout(() => {
            card.click();
        }, index * 50);
    });

    const btn = document.getElementById('reveal-all-btn');
    if (btn) btn.classList.add('hidden');
}
