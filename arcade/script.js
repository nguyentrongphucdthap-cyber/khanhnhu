// ===== Arcade Main Script =====

// Storage keys
const STORAGE_KEYS = {
    DINO_HIGHSCORE: 'arcade_dino_highscore',
    CATCH_HIGHSCORE: 'arcade_catch_highscore',
    WHACK_HIGHSCORE: 'arcade_whack_highscore',
    PROTECT_HIGHSCORE: 'arcade_protect_highscore',
    GAMES_PLAYED: 'arcade_games_played'
};

// Initialize arcade
document.addEventListener('DOMContentLoaded', () => {
    loadHighscores();
    loadStats();
    setupCardInteractions();
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
    
    // Calculate total highscore
    const total = parseInt(dinoScore) + parseInt(catchScore) + parseInt(whackScore) + parseInt(protectScore);
    document.getElementById('total-highscore').textContent = formatNumber(total);
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
