// ===== Arcade Main Script =====

// Storage keys
const STORAGE_KEYS = {
    DINO_HIGHSCORE: 'arcade_dino_highscore',
    CATCH_HIGHSCORE: 'arcade_catch_highscore',
    WHACK_HIGHSCORE: 'arcade_whack_highscore',
    PROTECT_HIGHSCORE: 'arcade_protect_highscore',
    GAMES_PLAYED: 'arcade_games_played',
    WALLET: 'arcade_wallet_points' // Đây là key lưu số dư ví thực tế
};

// Initialize arcade
document.addEventListener('DOMContentLoaded', () => {
    // Logic chuyển đổi (Migrate): Nếu ví chưa tồn tại, tạo ví từ dữ liệu cũ
    if (localStorage.getItem(STORAGE_KEYS.WALLET) === null) {
        const dino = parseInt(localStorage.getItem(STORAGE_KEYS.DINO_HIGHSCORE) || 0);
        const catchG = parseInt(localStorage.getItem(STORAGE_KEYS.CATCH_HIGHSCORE) || 0);
        const whack = parseInt(localStorage.getItem(STORAGE_KEYS.WHACK_HIGHSCORE) || 0);
        const protect = parseInt(localStorage.getItem(STORAGE_KEYS.PROTECT_HIGHSCORE) || 0);
        const spent = parseInt(localStorage.getItem('arcade_spent_points') || 0);

        // Ví khởi tạo = Tổng điểm kỷ lục - Số điểm đã tiêu (nếu có)
        const initialWallet = Math.max(0, (dino + catchG + whack + protect) - spent);
        localStorage.setItem(STORAGE_KEYS.WALLET, initialWallet);
    }

    loadHighscores();
    loadStats();
    setupCardInteractions();
});

// Load highscores from localStorage
function loadHighscores() {
    // Hiển thị điểm kỷ lục từng game (để người chơi biết thành tích)
    const dinoScore = localStorage.getItem(STORAGE_KEYS.DINO_HIGHSCORE) || 0;
    const catchScore = localStorage.getItem(STORAGE_KEYS.CATCH_HIGHSCORE) || 0;
    const whackScore = localStorage.getItem(STORAGE_KEYS.WHACK_HIGHSCORE) || 0;
    const protectScore = localStorage.getItem(STORAGE_KEYS.PROTECT_HIGHSCORE) || 0;

    document.getElementById('dino-highscore').textContent = formatNumber(dinoScore);
    document.getElementById('catch-highscore').textContent = formatNumber(catchScore);
    document.getElementById('whack-highscore').textContent = formatNumber(whackScore);
    document.getElementById('protect-highscore').textContent = formatNumber(protectScore);

    // QUAN TRỌNG: Hiển thị Số dư ví (Wallet) thay vì Tổng điểm Highscore
    const wallet = parseInt(localStorage.getItem(STORAGE_KEYS.WALLET) || 0);
    const totalEl = document.getElementById('total-highscore');
    if (totalEl) {
        totalEl.textContent = formatNumber(wallet); // Chỉ hiển thị số tiền còn lại
    }
}

// Load games played stats
function loadStats() {
    const gamesPlayed = localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED) || 0;
    document.getElementById('games-played').textContent = formatNumber(gamesPlayed);
}

// Format number with comma separators
function formatNumber(num) {
    return parseInt(num).toLocaleString('vi-VN');
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

// --- HÀM CẬP NHẬT ĐIỂM (QUAN TRỌNG) ---
function updateHighscore(game, score) {
    // 1. Cập nhật Kỷ lục (Chỉ để hiển thị thành tích cao nhất)
    const key = STORAGE_KEYS[`${game.toUpperCase()}_HIGHSCORE`];
    const currentHighscore = parseInt(localStorage.getItem(key) || 0);
    let isNewHighscore = false;

    if (score > currentHighscore) {
        localStorage.setItem(key, score);
        isNewHighscore = true;
    }

    // 2. CỘNG TIỀN VÀO VÍ (Cày cuốc)
    // Lấy số dư hiện tại
    const currentWallet = parseInt(localStorage.getItem(STORAGE_KEYS.WALLET) || 0);
    // Cộng thêm điểm vừa chơi được
    const newWallet = currentWallet + score;
    // Lưu số dư mới
    localStorage.setItem(STORAGE_KEYS.WALLET, newWallet);

    // 3. Cập nhật giao diện ngay lập tức
    // Cập nhật số dư trên Header
    const totalEl = document.getElementById('total-highscore');
    if (totalEl) {
        totalEl.textContent = formatNumber(newWallet);
    }
    
    // Cập nhật số dư trong Modal Gacha (nếu đang mở)
    const gachaEl = document.getElementById('user-points-display');
    if (gachaEl) {
        gachaEl.textContent = formatNumber(newWallet);
    }

    return isNewHighscore;
}

// Export for use in games
window.ArcadeHelper = {
    updateHighscore,
    formatNumber,
    STORAGE_KEYS
};

/* --- GACHA SYSTEM LOGIC --- */
const GACHA_ITEMS = [
    { id: '1', img: 'games/catch/img/1.png', name: 'Bút Gel Xanh', prob: 0.01 }, // 1%
    { id: '1b', img: 'games/catch/img/1.png', name: 'Bút Gel Đỏ', prob: 0.01 },
    { id: '1c', img: 'games/catch/img/1.png', name: 'Bút Gel Đen', prob: 0.01 },
    { id: '2', img: 'games/catch/img/2.png', name: 'Bút Chì Gradient', prob: 0.009 }, // 0.9%
    { id: '3', img: 'games/catch/img/3.png', name: 'Bộ Bút Van Gogh', prob: 0.02 }, // 2%
    { id: '4', img: 'games/catch/img/4.png', name: 'Gọt Bút Chì', prob: 0.04 }, // 4%
    { id: '5', img: 'games/catch/img/5.png', name: 'Cốc Thỏ Hồng', prob: 0.001 } // 0.1%
];
const GACHA_COST = 200;

function openGacha(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Luôn lấy số dư ví hiện tại để hiển thị
    const currentWallet = getTotalPoints();
    document.getElementById('user-points-display').textContent = formatNumber(currentWallet);

    // Render Collection
    renderCollection();

    // Reset view
    document.getElementById('gacha-box').classList.remove('hidden');
    const single = document.getElementById('gacha-result-container');
    const multi = document.getElementById('gacha-multi-result');
    if (single) single.classList.add('hidden');
    if (multi) multi.classList.add('hidden');

    document.getElementById('gacha-modal').classList.remove('hidden');
}

function closeGacha() {
    document.getElementById('gacha-modal').classList.add('hidden');
    // Cập nhật lại màn hình chính khi đóng
    loadHighscores();
}

// Hàm lấy số dư ví
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

    // TRỪ ĐIỂM TRỰC TIẾP TỪ VÍ
    const newWallet = currentWallet - cost;
    localStorage.setItem(STORAGE_KEYS.WALLET, newWallet);

    // Cập nhật hiển thị số dư MỚI
    document.getElementById('user-points-display').textContent = formatNumber(newWallet);
    document.getElementById('total-highscore').textContent = formatNumber(newWallet);

    // Disable buttons
    const btns = document.querySelectorAll('.spin-btn');
    btns.forEach(b => {
        b.disabled = true;
        if (b.id === 'spin-btn-1') b.textContent = "Đang quay...";
    });

    // Animation
    const box = document.getElementById('gacha-box');
    const singleContainer = document.getElementById('gacha-result-container');
    const multiContainer = document.getElementById('gacha-multi-result');

    if (singleContainer) singleContainer.classList.add('hidden');
    if (multiContainer) multiContainer.classList.add('hidden');

    box.classList.remove('hidden');
    box.style.animation = 'bounce 0.5s infinite';
    document.getElementById('gacha-result-container').classList.add('hidden');

    setTimeout(() => {
        // Result logic
        box.style.animation = '';
        box.classList.add('hidden');

        // Loop Roll Items
        const results = [];
        const hasSpunBefore = localStorage.getItem('arcade_gacha_welcome');

        for (let i = 0; i < count; i++) {
            // First time ever spin (i=0 of the batch) gets guaranteed reward
            if (!hasSpunBefore && i === 0) {
                results.push(rollGuaranteedItem());
                localStorage.setItem('arcade_gacha_welcome', 'true');
            } else {
                results.push(rollItem());
            }
        }

        if (count === 1) {
            displaySingleResult(results[0]);
        } else {
            displayMultiResult(results);
        }

        // Reset buttons
        btns.forEach(b => b.disabled = false);
        const btn1 = document.getElementById('spin-btn-1');
        if (btn1) btn1.textContent = `Quay 1 (${GACHA_COST}đ)`;

        renderCollection();

    }, 1500);
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
