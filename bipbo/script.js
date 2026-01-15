/**
 * 🐕 Truy Bắt Bíp Bơ - Game Script
 */

// Game State
const gameState = {
    isPlaying: false, isPaused: false, wins: 0,
    currentLevel: 1,
    currentPets: [], petsCaught: 0, totalPetsNeeded: 1,
    playerX: 0, playerY: 0,
    playerSpeed: 3.5, playerSprintSpeed: 5.5, petSpeed: 1.6,
    catchDistance: 65, catchProgress: 0, catchRequired: 300,
    selectedSkin: 'skin1', timer: 0, timerInterval: null,
    stamina: 100, maxStamina: 100, staminaDrain: 1.5, staminaRegen: 0.8, isSprinting: false,
    isMusicMuted: false,
    releaseTimers: {},
    mapHistory: [],
    petDashState: {},
    coins: 0,
    volume: 50,
    unlockedSkins: ['skin1'],
    upgrades: { staff: false, tranquilizer: false, speed: false, gloves: false },
    isStunned: false, stunEnd: 0
};

// Skin images from img folder
const skins = [
    { id: 'skin1', src: 'img/skin1.png', name: 'Nhân vật 1' },
    { id: 'skin2', src: 'img/skin2.png', name: 'Nhân vật 2' },
    { id: 'skin3', src: 'img/skin3.png', name: 'Nhân vật 3' }
];
const keys = { up: false, down: false, left: false, right: false, sprint: false };
let elements = {};

function initElements() {
    ['menuScreen', 'skinModal', 'skinGrid', 'gameContainer', 'player', 'petsContainer',
        'winScreen', 'winMascot', 'winStats', 'winCount', 'menuWinCount', 'timer',
        'tutorial', 'catchProgress', 'catchProgressBar', 'catchLabel', 'levelNotification',
        'staminaBar', 'settingsBtn', 'levelDisplay', 'musicToggleInside', 'bgMusic',
        'gameplayModal', 'gameplayTitle', 'gameplayBody', 'menuCoins', 'gameCoins',
        'settingsModal', 'skinGridMini', 'volumeSlider', 'skinUnlockModal', 'unlockBody', 'unlockIcon', 'equipBtn',
        'shopModal'].forEach(id => elements[id] = document.getElementById(id));
}

function init() {
    initElements();
    const savedSkin = localStorage.getItem('petChase_skin');
    if (savedSkin) {
        gameState.selectedSkin = savedSkin;
        updatePlayerSkin(savedSkin);
    } else {
        updatePlayerSkin(gameState.selectedSkin);
    }
    const savedWins = localStorage.getItem('petChase_wins');
    if (savedWins) { gameState.wins = parseInt(savedWins); elements.winCount.textContent = gameState.wins; elements.menuWinCount.textContent = gameState.wins; }

    const savedCoins = localStorage.getItem('petChase_coins');
    if (savedCoins) {
        gameState.coins = parseInt(savedCoins);
        elements.menuCoins.textContent = gameState.coins;
        elements.gameCoins.textContent = gameState.coins;
    }

    const savedUpgrades = localStorage.getItem('petChase_upgrades');
    if (savedUpgrades) {
        gameState.upgrades = JSON.parse(savedUpgrades);
        applyUpgrades();
    }

    const savedSkins = localStorage.getItem('petChase_unlockedSkins');
    if (savedSkins) {
        gameState.unlockedSkins = JSON.parse(savedSkins);
    }

    const savedVolume = localStorage.getItem('petChase_volume');
    if (savedVolume) {
        gameState.volume = parseInt(savedVolume);
        elements.volumeSlider.value = gameState.volume;
        updateVolume(gameState.volume);
    }

    // Load music preference
    const savedMusicMuted = localStorage.getItem('petChase_musicMuted');
    if (savedMusicMuted === 'true') {
        gameState.isMusicMuted = true;
        elements.musicToggleInside.classList.add('muted');
        setTimeout(() => sendYouTubeCommand('mute'), 1000);
    }

    initSkins();
    initSkinsMini(); // New mini skin grid for settings
    setupControls();

    // Ensure music volume is synced when iframe loads
    if (elements.bgMusic) {
        elements.bgMusic.onload = () => {
            updateVolume(gameState.volume);
            if (gameState.isMusicMuted) sendYouTubeCommand('mute');
        };
    }
}

// Update player skin with image
function updatePlayerSkin(skinId) {
    const skin = skins.find(s => s.id === skinId);
    if (skin && elements.player) {
        elements.player.innerHTML = `
            <img src="${skin.src}" alt="${skin.name}" class="player-skin-img">
            <span class="player-name">Khánh Như</span>
        `;
    } else if (elements.player) {
        // Fallback to first skin if ID not found
        const firstSkin = skins[0];
        elements.player.innerHTML = `
            <img src="${firstSkin.src}" alt="${firstSkin.name}" class="player-skin-img">
            <span class="player-name">Khánh Như</span>
        `;
        gameState.selectedSkin = firstSkin.id;
    }
}

function initSkins() {
    elements.skinGrid.innerHTML = '';
    skins.forEach(skin => {
        const isUnlocked = gameState.unlockedSkins.includes(skin.id);
        const item = document.createElement('div');
        item.className = `skin-item ${gameState.selectedSkin === skin.id ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
        item.innerHTML = isUnlocked ? `<img src="${skin.src}" class="skin-img">` : '🔒';
        if (isUnlocked) {
            item.onclick = () => {
                selectSkin(skin.id);
                initSkins();
            };
        }
        elements.skinGrid.appendChild(item);
    });
}

window.openSkinModal = () => elements.skinModal.classList.add('active');
window.closeSkinModal = () => elements.skinModal.classList.remove('active');

window.selectSkin = function (skinId) {
    gameState.selectedSkin = skinId;
    updatePlayerSkin(skinId);
    localStorage.setItem('petChase_skin', skinId);
};

function showNotify(text) {
    if (elements.levelNotification) {
        elements.levelNotification.textContent = text;
        elements.levelNotification.classList.add('active');
        setTimeout(() => elements.levelNotification.classList.remove('active'), 1200);
    }
}

window.startGame = function () {
    elements.menuScreen.classList.add('hidden');
    elements.gameContainer.classList.add('active');
    Object.assign(gameState, { isPlaying: true, isPaused: false, petsCaught: 0, catchProgress: 0, stamina: 100 });

    // Explicitly play music on first interaction
    sendYouTubeCommand('playVideo');
    updateVolume(gameState.volume);

    // Calculate current level
    gameState.currentLevel = gameState.wins + 1;
    const level = Math.min(gameState.currentLevel, 5);

    // Update level display
    if (elements.levelDisplay) {
        elements.levelDisplay.textContent = gameState.currentLevel;
    }

    // List of all pets
    const petPool = [
        { img: 'img/bo.png', name: 'Bơ' },
        { img: 'img/bo2.png', name: 'Bơ 2' },
        { img: 'img/bip.png', name: 'Bíp' },
        { img: 'img/bip2.png', name: 'Bíp 2' }
    ];

    // Set pets based on level with rotation
    if (level >= 5) {
        gameState.totalPetsNeeded = 2;
        // Pick two different pets based on level
        const p1 = petPool[(gameState.currentLevel - 1) % petPool.length];
        const p2 = petPool[gameState.currentLevel % petPool.length];
        gameState.currentPets = [p1, p2];
    }
    else {
        gameState.totalPetsNeeded = 1;
        // Pick one pet based on level
        gameState.currentPets = [petPool[(gameState.currentLevel - 1) % petPool.length]];
    }

    // Set map background based on level
    setMapBackground(gameState.currentLevel);
    checkGameplayUpgrades(gameState.currentLevel);
    checkSkinUnlock(gameState.currentLevel);

    gameState.playerX = window.innerWidth / 2;
    gameState.playerY = window.innerHeight / 2;
    updatePlayer();
    createPets();
    createDecorations();
    startTimer();
    elements.tutorial.classList.remove('hidden');
    setTimeout(() => elements.tutorial.classList.add('hidden'), 3000);

    // Clear any leftover release timers
    Object.values(gameState.releaseTimers).forEach(t => clearTimeout(t));
    gameState.releaseTimers = {};
};

function updatePlayer() {
    elements.player.style.left = gameState.playerX + 'px';
    elements.player.style.top = gameState.playerY + 'px';
}

function createPets() {
    elements.petsContainer.innerHTML = '';
    gameState.petDashState = {};
    gameState.currentPets.forEach((petObj, i) => {
        const pet = document.createElement('div');
        pet.className = 'character pet';
        pet.id = `pet${i}`;
        pet.innerHTML = `
            <img src="${petObj.img}" class="pet-img" alt="${petObj.name}">
            <div class="status-badge">✓ Đã bắt!</div>
            <div class="release-timer">30s</div>
            <div class="dash-indicator">⚡ DASH!</div>
            <div class="taunt-badge">Lêu lêu! 😜</div>
        `;
        pet.dataset.caught = 'false';
        pet.dataset.x = Math.random() * (window.innerWidth - 150) + 75;
        pet.dataset.y = Math.random() * (window.innerHeight - 350) + 120;
        pet.style.left = pet.dataset.x + 'px';
        pet.style.top = pet.dataset.y + 'px';
        elements.petsContainer.appendChild(pet);

        // Initialize dash state
        gameState.petDashState[i] = {
            lastDash: 0,
            isDashing: false,
            dashEnd: 0
        };
    });
}

function createDecorations() {
    const deco = document.getElementById('decorations');
    deco.innerHTML = '';
    const emojis = ['🌸', '🌼', '🌷', '🌻', '🌺', '🍀', '🌿', '🌾', '🦋', '🐝'];
    for (let i = 0; i < 18; i++) {
        const d = document.createElement('div');
        d.className = 'decoration';
        d.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        d.style.left = Math.random() * 100 + '%';
        d.style.bottom = Math.random() * 150 + 'px';
        deco.appendChild(d);
    }
}

function startTimer() {
    gameState.timer = 0;
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isPaused && gameState.isPlaying) {
            gameState.timer++;
            elements.timer.textContent = `${String(Math.floor(gameState.timer / 60)).padStart(2, '0')}:${String(gameState.timer % 60).padStart(2, '0')}`;
        }
    }, 1000);
}

function gameLoop() {
    if (!gameState.isPlaying || gameState.isPaused) { requestAnimationFrame(gameLoop); return; }

    const now = Date.now();

    // Check Stun
    if (gameState.isStunned) {
        if (now > gameState.stunEnd) {
            gameState.isStunned = false;
            elements.player.classList.remove('stunned');
        }
    }
    // Stamina logic
    const moving = keys.up || keys.down || keys.left || keys.right;
    if (keys.sprint && moving && gameState.stamina > 0) {
        gameState.isSprinting = true;
        gameState.stamina = Math.max(0, gameState.stamina - gameState.staminaDrain);
    } else {
        gameState.isSprinting = false;
        gameState.stamina = Math.min(100, gameState.stamina + gameState.staminaRegen);
    }
    elements.staminaBar.style.width = gameState.stamina + '%';
    elements.staminaBar.classList.toggle('low', gameState.stamina < 30);

    // Speed calculation
    const isMobile = window.innerWidth < 768;
    const mobileMultiplier = isMobile ? 0.75 : 1.0; // Slightly slower on mobile for better control
    const speed = (gameState.isSprinting ? gameState.playerSprintSpeed : gameState.playerSpeed) * mobileMultiplier;

    // Adjust play bounds based on screen size (Better for mobile)
    const marginL = isMobile ? 40 : 60;
    const marginR = isMobile ? 40 : 90;
    const marginT = isMobile ? 80 : 100;
    const marginB = isMobile ? 120 : 200;

    // Random Coin Spawning (Reduced frequency)
    if (gameState.isPlaying && !gameState.isPaused && Math.random() < 0.002) {
        spawnCoin(marginL, marginR, marginT, marginB);
    }

    // Pet Intelligence Scaling
    const intelStep = Math.floor(gameState.currentLevel / 5);
    const intelBonus = (intelStep * 0.15) * mobileMultiplier;
    const currentPetSpeed = gameState.petSpeed + (gameState.currentLevel * 0.04 * mobileMultiplier) + intelBonus;
    const evadeRadius = (140 + (gameState.currentLevel * 5) + (intelStep * 15)) * mobileMultiplier;

    let moved = false;
    if (!gameState.isStunned) {
        if (keys.up && gameState.playerY > marginT - 20) { gameState.playerY -= speed; moved = true; }
        if (keys.down && gameState.playerY < window.innerHeight - marginB + 20) { gameState.playerY += speed; moved = true; }
        if (keys.left && gameState.playerX > marginL - 20) {
            gameState.playerX -= speed;
            const img = elements.player.querySelector('.player-skin-img');
            if (img) img.style.transform = 'scaleX(-1)';
            moved = true;
        }
        if (keys.right && gameState.playerX < window.innerWidth - marginR + 20) {
            gameState.playerX += speed;
            const img = elements.player.querySelector('.player-skin-img');
            if (img) img.style.transform = 'scaleX(1)';
            moved = true;
        }
    }

    if (moved) {
        elements.player.classList.add('running');
        updatePlayer();
        if (Math.random() < 0.08) createPaw(gameState.playerX + 20, gameState.playerY + 40);
    } else {
        elements.player.classList.remove('running');
    }

    // Pets Logic
    let nearAnyPet = false;
    gameState.currentPets.forEach((petObj, i) => {
        const pet = document.getElementById(`pet${i}`);
        if (!pet || pet.dataset.caught === 'true') return;

        const dashState = gameState.petDashState[i];
        let px = parseFloat(pet.dataset.x), py = parseFloat(pet.dataset.y);
        const dx = gameState.playerX - px, dy = gameState.playerY - py, dist = Math.sqrt(dx * dx + dy * dy);

        // Bíp Attack Logic (0.01% chance when player is close) - Applies to both Bíp and Bíp 2
        if (petObj.name.includes('Bíp') && dist < 130 && Math.random() < 0.0001 && !gameState.isStunned && gameState.isPlaying) {
            gameState.isStunned = true;
            gameState.stunEnd = now + 2000;
            showNotify('⚡ Bíp đã tấn công! Bạn bị choáng 2 giây!');
            elements.player.classList.add('stunned');

            // Visual indicator for attack
            pet.querySelector('.dash-indicator').textContent = "💥 ATTACK!";
            pet.querySelector('.dash-indicator').classList.add('active');
            setTimeout(() => pet.querySelector('.dash-indicator').classList.remove('active'), 1000);
        }

        // Dash Logic (Level 10+)
        const cooldown = gameState.currentLevel >= 15 ? 12000 : 15000;
        const canDash = now - dashState.lastDash > cooldown;

        if (gameState.currentLevel >= 10 && !dashState.isDashing && dist < evadeRadius * 0.7 && canDash) {
            dashState.isDashing = true;
            dashState.dashEnd = now + 1500;
            dashState.lastDash = now;
            pet.querySelector('.dash-indicator').classList.add('active');
            pet.querySelector('.dash-indicator').textContent = "⚡ DASH!";
        }

        if (dashState.isDashing && now > dashState.dashEnd) {
            dashState.isDashing = false;
            pet.querySelector('.dash-indicator').classList.remove('active');
        }

        // Flee Logic + Corner Escape (Level 10+)
        if (dist < evadeRadius) {
            const a = Math.atan2(dy, dx);
            let fleeSpeed = currentPetSpeed * (1 + (gameState.currentLevel * 0.04) * mobileMultiplier);
            if (dashState.isDashing) fleeSpeed *= 2.5;

            // Check if trapped in a corner/edge
            const isNearEdge = px < marginL + 45 || px > window.innerWidth - marginR - 45 ||
                py < marginT + 45 || py > window.innerHeight - marginB - 45;
            const isStuck = px <= marginL + 10 || px >= window.innerWidth - marginR - 10 ||
                py <= marginT + 10 || py >= window.innerHeight - marginB - 10;

            let escapeChance = 0;
            const progressRatio = gameState.catchProgress / gameState.catchRequired;

            // Updated Escape logic: Base chance if stuck + Bonus if progress high
            if (gameState.currentLevel >= 10 && isNearEdge) {
                // Small random chance even if progress is low
                escapeChance = (gameState.currentLevel >= 20 ? 0.12 : 0.08);

                // Higher chance if player is close to catching (40%+)
                if (progressRatio >= 0.4) {
                    escapeChance = (gameState.currentLevel >= 20 ? 0.6 : 0.4);
                }

                // Bonus chance if strictly touching the edge (Total max: 0.7)
                if (isStuck) escapeChance += 0.1;
            }

            if (escapeChance > 0 && Math.random() < escapeChance && !dashState.isDashing && canDash) {
                // Dash towards center instead of fleeing into the wall
                const centerX = window.innerWidth / 2, centerY = window.innerHeight / 2;
                const angleToCenter = Math.atan2(centerY - py, centerX - px);
                px += Math.cos(angleToCenter) * fleeSpeed * 3.5;
                py += Math.sin(angleToCenter) * fleeSpeed * 3.5;
                dashState.isDashing = true;
                dashState.dashEnd = now + 1500;
                dashState.lastDash = now;
                pet.querySelector('.dash-indicator').classList.add('active');
                pet.querySelector('.dash-indicator').textContent = "⚡ ESCAPE!";
            } else {
                let moveX = -Math.cos(a) * fleeSpeed;
                let moveY = -Math.sin(a) * fleeSpeed;

                // Corner Avoidance Logic (50% chance to steer away from corners if nearby)
                const cornerZone = 130;
                const isNearCorner = (
                    (px < marginL + cornerZone || px > window.innerWidth - marginR - cornerZone) &&
                    (py < marginT + cornerZone || py > window.innerHeight - marginB - cornerZone)
                );

                if (isNearCorner && Math.random() < 0.5) {
                    const centerX = window.innerWidth / 2, centerY = window.innerHeight / 2;
                    const angleToCenter = Math.atan2(centerY - py, centerX - px);
                    moveX = Math.cos(angleToCenter) * fleeSpeed;
                    moveY = Math.sin(angleToCenter) * fleeSpeed;
                }

                // SLIDING LOGIC: Move parallel to wall if direction is blocked

                if ((px <= marginL + 5 && moveX < 0) || (px >= window.innerWidth - marginR - 5 && moveX > 0)) {
                    moveX = 0; // Blocked horizontally
                    moveY *= 1.2; // Speed up vertical sliding
                }
                if ((py <= marginT + 5 && moveY < 0) || (py >= window.innerHeight - marginB - 5 && moveY > 0)) {
                    moveY = 0; // Blocked vertically
                    moveX *= 1.2; // Speed up horizontal sliding
                }

                px += moveX;
                py += moveY;
            }
            pet.classList.add('running');
        } else {
            px += (Math.random() - 0.5) * currentPetSpeed;
            py += (Math.random() - 0.5) * currentPetSpeed;
            pet.classList.remove('running');
        }

        px = Math.max(marginL, Math.min(window.innerWidth - marginR, px));
        py = Math.max(marginT, Math.min(window.innerHeight - marginB, py));
        pet.dataset.x = px; pet.dataset.y = py;
        pet.style.left = px + 'px'; pet.style.top = py + 'px';
        pet.style.transform = dx > 0 ? 'scaleX(-1)' : 'scaleX(1)';

        if (dist < gameState.catchDistance) {
            nearAnyPet = true;
            let catchSpeed = 2.5;
            if (gameState.upgrades.gloves) catchSpeed *= 1.3;
            gameState.catchProgress += catchSpeed;
            elements.catchProgress.classList.add('active');
            elements.catchLabel.classList.add('active');
            elements.catchProgressBar.style.width = (gameState.catchProgress / gameState.catchRequired * 100) + '%';
            if (pet.querySelector('.taunt-badge')) pet.querySelector('.taunt-badge').classList.remove('active');
            if (gameState.catchProgress >= gameState.catchRequired) catchPet(i);
        }
    });

    if (!nearAnyPet) {
        const prevProgress = gameState.catchProgress;
        gameState.catchProgress = Math.max(0, gameState.catchProgress - 1.5);
        elements.catchProgressBar.style.width = (gameState.catchProgress / gameState.catchRequired * 100) + '%';
        if (prevProgress > 20 && gameState.catchProgress < prevProgress - 5) triggerTaunt();
        if (gameState.catchProgress === 0) {
            elements.catchProgress.classList.remove('active');
            elements.catchLabel.classList.remove('active');
        }
    }
    requestAnimationFrame(gameLoop);
}

function checkGameplayUpgrades(level) {
    let title = "";
    let body = "";

    if (level === 5) {
        title = "🧠 Trí Thông Minh +1";
        body = "Thú cưng đã trở nên thông minh hơn! Chúng sẽ phát hiện bạn từ xa và né tránh khéo léo hơn.";
    } else if (level === 10) {
        title = "⚡ Kỹ Năng: DASH & ESCAPE";
        body = "Thú cưng đã học được kỹ năng Lướt nhanh (Dash). <br>Đặc biệt: Nếu bị dồn vào góc, chúng có <b>20% cơ hội</b> bứt tốc chạy ngược ra ngoài!";
    } else if (level === 15) {
        title = "🔥 Siêu Cấp Linh Hoạt";
        body = "Tốc độ Dash của thú cưng được tối ưu hóa. <br><b>Hồi chiêu giảm còn: 12s</b>";
    } else if (level === 20) {
        title = "🐾 Bậc Thầy Thoát Hiểm";
        body = "Thú cưng trở nên cực kỳ tinh quái. <br>Khả năng tự động chạy thoát khi bị dồn vào góc tăng lên <b>30%</b>!";
    }

    if (title) {
        elements.gameplayTitle.innerHTML = title;
        elements.gameplayBody.innerHTML = body;
        elements.gameplayModal.classList.add('active');
        gameState.isPaused = true;
    }
}

window.closeGameplayModal = () => {
    elements.gameplayModal.classList.remove('active');
    gameState.isPaused = false;
};

function triggerTaunt() {
    gameState.currentPets.forEach((_, i) => {
        const pet = document.getElementById(`pet${i}`);
        if (!pet || pet.dataset.caught === 'true') return;

        const tauntBadge = pet.querySelector('.taunt-badge');
        if (tauntBadge && !tauntBadge.classList.contains('active') && Math.random() < 0.02) {
            const taunts = ['Lêu lêu! 😜', 'Cố lên nào! 🐾', 'Bắt hụt rồi! ✨', 'Hì hì! 🐕', 'Lêu lêu 😛'];
            tauntBadge.textContent = taunts[Math.floor(Math.random() * taunts.length)];
            tauntBadge.classList.add('active');
            setTimeout(() => tauntBadge.classList.remove('active'), 1000);
        }
    });
}

function createPaw(x, y) {
    const p = document.createElement('div');
    p.className = 'paw-print';
    p.textContent = '🐾';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    elements.gameContainer.appendChild(p);
    setTimeout(() => p.remove(), 1200);
}

function catchPet(i) {
    const pet = document.getElementById(`pet${i}`);
    if (!pet || pet.dataset.caught === 'true') return;
    pet.dataset.caught = 'true';
    pet.querySelector('.status-badge').classList.add('caught');
    gameState.petsCaught++;
    gameState.catchProgress = 0;
    elements.catchProgress.classList.remove('active');
    elements.catchLabel.classList.remove('active');

    // Level 10+ Temporary Catch Mechanic
    if (gameState.currentLevel >= 10) {
        const timerEl = pet.querySelector('.release-timer');
        timerEl.classList.add('active');
        let timeLeft = gameState.upgrades.tranquilizer ? 60 : 30;
        timerEl.textContent = timeLeft + 's';

        const countdown = setInterval(() => {
            if (!gameState.isPlaying || gameState.isPaused) return;
            timeLeft--;
            timerEl.textContent = timeLeft + 's';
            if (timeLeft <= 0) clearInterval(countdown);
        }, 1000);

        gameState.releaseTimers[i] = setTimeout(() => {
            clearInterval(countdown);
            if (pet.dataset.caught === 'true' && gameState.isPlaying) {
                // Release pet
                pet.dataset.caught = 'false';
                pet.querySelector('.status-badge').classList.remove('caught');
                timerEl.classList.remove('active');
                gameState.petsCaught--;
                showNotify('Ὃ Ôi không! Thú cưng đã trốn thoát!');
            }
        }, gameState.upgrades.tranquilizer ? 60000 : 30000);
    }

    if (gameState.petsCaught >= gameState.totalPetsNeeded) winRound();
}

function winRound() {
    gameState.isPlaying = false;
    clearInterval(gameState.timerInterval);
    gameState.wins++;
    elements.winCount.textContent = gameState.wins;
    elements.menuWinCount.textContent = gameState.wins;
    localStorage.setItem('petChase_wins', gameState.wins);

    if (gameState.wins === 3) showNotify('🎊 Thử thách: Truy bắt tốc độ!');
    if (gameState.wins === 5) showNotify('🎊 Đại chiến: Bắt cả Bíp và Bơ!');

    elements.winMascot.innerHTML = gameState.currentPets.map(p => `<img src="${p.img}" style="width:100px; height:100px; object-fit:contain;">`).join(' ');
    elements.winStats.innerHTML = `<div>⏱️ Thời gian: ${String(Math.floor(gameState.timer / 60)).padStart(2, '0')}:${String(gameState.timer % 60).padStart(2, '0')}</div><div>🏆 Tổng thắng: ${gameState.wins}</div>`;
    // Clear all release timers on win
    Object.values(gameState.releaseTimers).forEach(t => clearTimeout(t));
    gameState.releaseTimers = {};

    createConfetti();
    setTimeout(() => elements.winScreen.classList.add('active'), 500);
}

function showNotify(msg) {
    elements.levelNotification.textContent = msg;
    elements.levelNotification.classList.add('active');
    setTimeout(() => elements.levelNotification.classList.remove('active'), 3500);
}

function createConfetti() {
    const colors = ['#ff6b9d', '#fbbf24', '#60a5fa', '#a78bfa', '#34d399'];
    for (let i = 0; i < 50; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + '%';
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDelay = Math.random() * 2 + 's';
        elements.winScreen.appendChild(c);
        setTimeout(() => c.remove(), 6000);
    }
}

window.continueGame = () => { elements.winScreen.classList.remove('active'); startGame(); };
window.goToMenu = () => {
    elements.winScreen.classList.remove('active');
    elements.gameContainer.classList.remove('active');
    // Remove all map classes
    elements.gameContainer.classList.remove('map-2', 'map-3', 'map-4', 'map-transition');
    elements.menuScreen.classList.remove('hidden');
    gameState.isPlaying = false;
};
window.togglePause = () => { gameState.isPaused = !gameState.isPaused; elements.pauseBtn.classList.toggle('playing', gameState.isPaused); };

// Map background system
function setMapBackground(level) {
    // Remove all previous map classes
    elements.gameContainer.classList.remove('map-2', 'map-3', 'map-4', 'map-transition', 'map-random');
    elements.gameContainer.style.backgroundImage = '';

    // Add transition effect
    elements.gameContainer.classList.add('map-transition');

    // Level 1-4: Story Maps
    if (level < 5) {
        if (level === 2) {
            elements.gameContainer.classList.add('map-2');
            setTimeout(() => showNotify('🗺️ Map mới: Vùng đất mới!'), 500);
        } else if (level === 3) {
            elements.gameContainer.classList.add('map-3');
            setTimeout(() => showNotify('🌟 Map đặc biệt xuất hiện!'), 500);
        } else if (level === 4) {
            elements.gameContainer.classList.add('map-4');
            setTimeout(() => showNotify('✨ Map động: Thế giới sống động!'), 500);
        }
    }
    // Level 5+: Random Non-repeating Maps
    else {
        elements.gameContainer.classList.add('map-random');

        // Ensure mapHistory has all 6 maps in random order if empty
        if (gameState.mapHistory.length === 0) {
            const maps = [1, 2, 3, 4, 5, 6];
            // Shuffle
            for (let i = maps.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [maps[i], maps[j]] = [maps[j], maps[i]];
            }
            gameState.mapHistory = maps;
        }

        // Take the first map from history
        const mapNum = gameState.mapHistory.shift();

        // Handle typo in "backgound6.gif" if necessary, but request said background(number).gif
        // Based on file list, 6 is "backgound6.gif", others are "backgroundX.gif"
        let fileName = `background${mapNum}.gif`;
        if (mapNum === 6) fileName = 'backgound6.gif'; // Match the exact filename found in directory

        elements.gameContainer.style.backgroundImage = `url('img/${fileName}')`;
        setTimeout(() => showNotify(`🎭 Khám phá: Vùng đất thứ ${mapNum}!`), 500);
    }
}

// Music control system
function sendYouTubeCommand(func, args = []) {
    if (elements.bgMusic && elements.bgMusic.contentWindow) {
        elements.bgMusic.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: func,
            args: args
        }), '*');
    }
}

window.toggleMusic = function () {
    const musicBtn = elements.musicToggleInside;
    gameState.isMusicMuted = !gameState.isMusicMuted;

    if (gameState.isMusicMuted) {
        musicBtn.classList.add('muted');
        sendYouTubeCommand('mute');
    } else {
        musicBtn.classList.remove('muted');
        sendYouTubeCommand('unMute');
        sendYouTubeCommand('playVideo');
    }

    localStorage.setItem('petChase_musicMuted', gameState.isMusicMuted);
};

window.updateVolume = function (val) {
    gameState.volume = val;
    sendYouTubeCommand('setVolume', [val]);
    localStorage.setItem('petChase_volume', val);
};

window.openSettings = function () {
    gameState.isPaused = true;
    elements.settingsModal.classList.add('active');
    initSkinsMini();
};

window.closeSettings = function () {
    elements.settingsModal.classList.remove('active');
    gameState.isPaused = false;
};

window.goToMenuFromSettings = function () {
    closeSettings();
    goToMenu();
};

function initSkinsMini() {
    elements.skinGridMini.innerHTML = '';
    skins.forEach(skin => {
        const isUnlocked = gameState.unlockedSkins.includes(skin.id);
        const item = document.createElement('div');
        item.className = `skin-item-mini ${gameState.selectedSkin === skin.id ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
        item.innerHTML = isUnlocked ? `<img src="${skin.src}" class="skin-img">` : '🔒';
        if (isUnlocked) {
            item.onclick = () => {
                selectSkin(skin.id);
                initSkinsMini();
            };
        }
        elements.skinGridMini.appendChild(item);
    });
}

function checkSkinUnlock(level) {
    let unlockedSkinId = null;
    if (level === 3 && !gameState.unlockedSkins.includes('skin2')) unlockedSkinId = 'skin2';
    if (level === 5 && !gameState.unlockedSkins.includes('skin3')) unlockedSkinId = 'skin3';

    if (unlockedSkinId) {
        const skin = skins.find(s => s.id === unlockedSkinId);
        elements.unlockIcon.innerHTML = `<img src="${skin.src}" class="unlock-skin-img">`;
        elements.unlockBody.innerHTML = `Bạn đã mở khóa trang phục mới: <br><b>${skin.name}</b>! (Màn ${level})`;
        elements.skinUnlockModal.classList.add('active');
        gameState.isPaused = true;

        elements.equipBtn.onclick = () => {
            if (!gameState.unlockedSkins.includes(unlockedSkinId)) {
                gameState.unlockedSkins.push(unlockedSkinId);
                localStorage.setItem('petChase_unlockedSkins', JSON.stringify(gameState.unlockedSkins));
            }
            selectSkin(unlockedSkinId);
            closeSkinUnlockModal();
            initSkins();
            initSkinsMini();
        };

        // Ensure it's added to unlocked list even if not equipped
        if (!gameState.unlockedSkins.includes(unlockedSkinId)) {
            gameState.unlockedSkins.push(unlockedSkinId);
            localStorage.setItem('petChase_unlockedSkins', JSON.stringify(gameState.unlockedSkins));
            initSkins();
        }
    }
}

window.closeSkinUnlockModal = () => {
    elements.skinUnlockModal.classList.remove('active');
    gameState.isPaused = false;
};

function setupControls() {
    document.addEventListener('keydown', e => {
        const k = e.key.toLowerCase();
        if (k === 'arrowup' || k === 'w') keys.up = true;
        if (k === 'arrowdown' || k === 's') keys.down = true;
        if (k === 'arrowleft' || k === 'a') keys.left = true;
        if (k === 'arrowright' || k === 'd') keys.right = true;
        if (k === 'shift') keys.sprint = true;
        if (k === 'escape' || k === 'p') togglePause();
    });
    document.addEventListener('keyup', e => {
        const k = e.key.toLowerCase();
        if (k === 'arrowup' || k === 'w') keys.up = false;
        if (k === 'arrowdown' || k === 's') keys.down = false;
        if (k === 'arrowleft' || k === 'a') keys.left = false;
        if (k === 'arrowright' || k === 'd') keys.right = false;
        if (k === 'shift') keys.sprint = false;
    });

    ['Up', 'Down', 'Left', 'Right'].forEach(dir => {
        const btn = document.getElementById('btn' + dir);
        if (!btn) return;
        const key = dir.toLowerCase();
        btn.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true; });
        btn.addEventListener('touchend', e => { e.preventDefault(); keys[key] = false; });
        btn.addEventListener('mousedown', () => keys[key] = true);
        btn.addEventListener('mouseup', () => keys[key] = false);
        btn.addEventListener('mouseleave', () => keys[key] = false);
    });

    const sprint = document.getElementById('btnSprint');
    if (sprint) {
        sprint.addEventListener('touchstart', e => { e.preventDefault(); keys.sprint = true; });
        sprint.addEventListener('touchend', e => { e.preventDefault(); keys.sprint = false; });
        sprint.addEventListener('mousedown', () => keys.sprint = true);
        sprint.addEventListener('mouseup', () => keys.sprint = false);
    }
}

function spawnCoin(mL, mR, mT, mB) {
    const coin = document.createElement('div');
    coin.className = 'coin-drop';
    coin.textContent = '🪙';
    const x = Math.random() * (window.innerWidth - mL - mR) + mL;
    const y = Math.random() * (window.innerHeight - mT - mB) + mT;
    coin.style.left = x + 'px';
    coin.style.top = y + 'px';
    elements.gameContainer.appendChild(coin);

    // Collision check interval
    const checkInterval = setInterval(() => {
        if (!gameState.isPlaying) { clearInterval(checkInterval); coin.remove(); return; }
        if (gameState.isPaused) return;

        const dx = (gameState.playerX + 30) - (x + 15);
        const dy = (gameState.playerY + 30) - (y + 15);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50) {
            collectCoin();
            clearInterval(checkInterval);
            coin.classList.add('collected');
            setTimeout(() => coin.remove(), 400);
        }
    }, 100);

    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (coin.parentNode) {
            clearInterval(checkInterval);
            coin.remove();
        }
    }, 8000);
}

function collectCoin() {
    gameState.coins += 1;
    elements.gameCoins.textContent = gameState.coins;
    elements.menuCoins.textContent = gameState.coins;
    localStorage.setItem('petChase_coins', gameState.coins);

    // Tiny bounce effect on coin display
    elements.gameCoins.parentElement.classList.add('bounce');
    setTimeout(() => elements.gameCoins.parentElement.classList.remove('bounce'), 300);
}

// Shop System
window.openShop = function () {
    elements.shopModal.classList.add('active');
    updateShopUI();
};

window.closeShop = function () {
    elements.shopModal.classList.remove('active');
};

function updateShopUI() {
    for (const [id, purchased] of Object.entries(gameState.upgrades)) {
        const itemEl = document.getElementById('item' + id.charAt(0).toUpperCase() + id.slice(1));
        if (itemEl) {
            const btn = itemEl.querySelector('.btn-buy');
            if (purchased) {
                itemEl.classList.add('purchased');
                btn.textContent = 'Đã Mua';
                btn.classList.add('disabled');
            } else {
                itemEl.classList.remove('purchased');
                btn.classList.remove('disabled');
            }
        }
    }
}

window.buyItem = function (itemId, price) {
    if (gameState.upgrades[itemId]) return;
    if (gameState.coins >= price) {
        gameState.coins -= price;
        gameState.upgrades[itemId] = true;

        // Update UI
        elements.menuCoins.textContent = gameState.coins;
        elements.gameCoins.textContent = gameState.coins;

        // Save
        localStorage.setItem('petChase_coins', gameState.coins);
        localStorage.setItem('petChase_upgrades', JSON.stringify(gameState.upgrades));

        applyUpgrades();
        updateShopUI();
        showNotify('🛒 Mua hàng thành công!');
    } else {
        showNotify('❌ Không đủ xu!');
    }
};

function applyUpgrades() {
    // Apply Speed
    if (gameState.upgrades.speed) {
        gameState.playerSpeed = 3.5 * 1.1;
        gameState.playerSprintSpeed = 5.5 * 1.1;
    } else {
        gameState.playerSpeed = 3.5;
        gameState.playerSprintSpeed = 5.5;
    }

    // Apply Staff (Range)
    if (gameState.upgrades.staff) {
        gameState.catchDistance = 65 * 1.2;
    } else {
        gameState.catchDistance = 65;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    requestAnimationFrame(gameLoop);
});
