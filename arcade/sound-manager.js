// Arcade Sound Manager - Synthesized Sounds (No assets needed)
const SoundManager = {
    ctx: null,
    muted: false,

    init: function () {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    toggleMute: function () {
        this.muted = !this.muted;
        return this.muted;
    },

    // Helper to play a tone
    playCone: function (freq, type, duration, vol = 0.1) {
        if (this.muted || !this.ctx) return;

        // Resume context if suspended (browser autoplay policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // --- GAME SFX ---

    // 1. Jump (Dino) - Rising pitch
    playJump: function () {
        if (this.muted) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    },

    // 2. Collect / Coin (Catch, Dino) - High Ding
    playCollect: function () {
        if (this.muted) return;
        this.init();

        // Two quick tones
        this.playCone(1200, 'sine', 0.1, 0.1);
        setTimeout(() => this.playCone(1600, 'sine', 0.2, 0.1), 50);
    },

    // 3. Game Over / Hit (All games) - Low descent
    playGameOver: function () {
        if (this.muted) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    },

    // 4. Bad item / Bomb (Catch) - Low thud
    playBad: function () {
        if (this.muted) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    },

    // 5. Shoot (Protect) - Laser pew
    playShoot: function () {
        if (this.muted) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    },

    // 6. Whack (Hammer hit)
    playHit: function () {
        if (this.muted) return;
        this.init();

        // Short burst of noise roughly simulated
        this.playCone(200, 'square', 0.05, 0.2);
    },

    playCriticalHit: function () {
        if (this.muted) return;
        this.init();

        // Heavy impact sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.8, this.ctx.currentTime); // Louder
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    },

    // 7. Click UI
    playClick: function () {
        if (this.muted) return;
        this.init();
        this.playCone(800, 'sine', 0.05, 0.05);
    },

    // --- BGM (YouTube) ---
    player: null,
    currentVideoId: null,
    isPlayerReady: false,
    bgmRequested: false, // Added to track if BGM was requested before player is ready

    initYouTube: function (videoId) {
        this.currentVideoId = videoId;
        if (window.YT && window.YT.Player) {
            this.createPlayer();
        } else {
            // Load API
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                this.createPlayer();
            };
        }
    },

    createPlayer: function () {
        if (this.player) return;

        // Create invisible container
        const div = document.createElement('div');
        div.id = 'bgm-player';
        div.style.position = 'absolute';
        div.style.width = '1px';
        div.style.height = '1px';
        div.style.opacity = '0';
        div.style.pointerEvents = 'none';
        div.style.zIndex = '-1000';
        document.body.appendChild(div);

        this.player = new YT.Player('bgm-player', {
            height: '1',
            width: '1',
            videoId: this.currentVideoId,
            playerVars: {
                'playsinline': 1,
                'controls': 0,
                'loop': 1,
                'playlist': this.currentVideoId // Required for loop to work
            },
            events: {
                'onReady': (event) => {
                    this.isPlayerReady = true;
                    if (this.bgmRequested) {
                        event.target.playVideo();
                        if (this.muted) event.target.setVolume(0);
                        else event.target.setVolume(30); // 30% volume
                    }
                }
            }
        });
    },

    playBGM: function (videoId) {
        this.bgmRequested = true;
        if (videoId && videoId !== this.currentVideoId) {
            this.currentVideoId = videoId;
            if (this.player && this.isPlayerReady) {
                this.player.loadVideoById(videoId);
            } else {
                this.initYouTube(videoId);
            }
        } else {
            if (this.player && this.isPlayerReady) {
                this.player.playVideo();
            } else {
                this.initYouTube(this.currentVideoId);
            }
        }
    },

    stopBGM: function () {
        this.bgmRequested = false;
        if (this.player && this.isPlayerReady) {
            this.player.stopVideo();
        }
    },

    pauseBGM: function () {
        this.bgmRequested = false;
        if (this.player && this.isPlayerReady) {
            this.player.pauseVideo();
        }
    }
};

// Auto init on first user interaction if needed
window.addEventListener('click', () => SoundManager.init(), { once: true });
window.addEventListener('keydown', () => SoundManager.init(), { once: true });
window.addEventListener('touchstart', () => SoundManager.init(), { once: true });
