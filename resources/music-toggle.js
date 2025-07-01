const backgroundMusic = document.getElementById('backgroundMusic');
const musicToggleContainer = document.querySelector('.music-toggle');
const musicIcon = musicToggleContainer ? musicToggleContainer.querySelector('i') : null;
const MUSIC_STATE_KEY = 'musicPlayerState';
const CURRENT_SONG_URL_KEY = 'currentSongUrl';
const PLAYBACK_TIME_KEY = 'playbackTime';
const IS_PLAYING_KEY = 'isPlaying';


const MUSIC_FOLDER = 'resources/covers/';
const initialSongUrl = MUSIC_FOLDER + 'ffffff.mp3';
let lastPlayedSongUrl = '';
let musicFiles = [];
const FADE_DURATION = 300; 
const FADE_INTERVAL = 50; 

async function fetchMusicFiles() {
    musicFiles = [
        'resources/covers/ffffff.mp3',
        'resources/covers/FMW new mixing.mp3',
        'resources/covers/headlock.mp3',
        'resources/covers/static tagalog ver full.mp3',
        'resources/covers/ao no sumika.mp3',
    ];
    console.log("Music files fetched:", musicFiles);
}

function saveMusicState() {
    try {
        const state = {
            [CURRENT_SONG_URL_KEY]: backgroundMusic.src,
            [PLAYBACK_TIME_KEY]: backgroundMusic.currentTime,
            [IS_PLAYING_KEY]: !backgroundMusic.paused
        };
        localStorage.setItem(MUSIC_STATE_KEY, JSON.stringify(state));
        console.log("Music state saved:", state);
    } catch (e) {
        console.error("Error saving music state to localStorage:", e);
    }
}

async function loadMusicState() {
    await fetchMusicFiles();

    try {
        const savedStateString = localStorage.getItem(MUSIC_STATE_KEY);
        if (savedStateString) {
            const savedState = JSON.parse(savedStateString);
            const savedSongUrl = savedState[CURRENT_SONG_URL_KEY];
            const savedTime = savedState[PLAYBACK_TIME_KEY];
            const wasPlaying = savedState[IS_PLAYING_KEY];

            if (savedSongUrl && savedTime !== undefined) {
                backgroundMusic.src = savedSongUrl;
                backgroundMusic.currentTime = savedTime;
                backgroundMusic.load();

                lastPlayedSongUrl = savedSongUrl;

                console.log("Music state loaded:", savedState);

                if (wasPlaying) {
                    
                    fadeInMusic();
                    if (musicIcon) {
                        musicIcon.className = "gg-play-pause-o";
                    }
                    musicToggleContainer.classList.add('active-music');
                } else {
                    if (musicIcon) {
                        musicIcon.className = "gg-play-button-o";
                    }
                    musicToggleContainer.classList.remove('active-music');
                }
            } else {
                console.log("Incomplete saved music state found. Starting with initial song.");
                playInitialMusic();
            }
        } else {
            console.log("No saved music state found. Playing initial song.");
            playInitialMusic();
        }
    } catch (e) {
        console.error("Error loading music state from localStorage:", e);
        if (musicIcon) {
            musicIcon.className = "gg-play-button-o";
        }
        musicToggleContainer.classList.remove('active-music');
        playInitialMusic();
    }
}

function playInitialMusic() {
    backgroundMusic.src = initialSongUrl;
    backgroundMusic.load();
    lastPlayedSongUrl = initialSongUrl;
    fadeInMusic(); 

    if (musicIcon) {
        musicIcon.className = "gg-play-pause-o";
    }
    musicToggleContainer.classList.add('active-music');
}

function fadeInMusic() {
    backgroundMusic.volume = 0;
    backgroundMusic.play().then(() => {
        let volume = 0;
        const fadeInInterval = setInterval(() => {
            if (volume < 1) {
                volume += (FADE_INTERVAL / FADE_DURATION);
                backgroundMusic.volume = Math.min(volume, 1);
            } else {
                clearInterval(fadeInInterval);
                saveMusicState(); 
                
                if (musicIcon) {
                    musicIcon.className = "gg-play-pause-o";
                }
            }
        }, FADE_INTERVAL);
        console.log("Music playing with fade-in.");
    }).catch(error => {
        console.warn("Autoplay prevented:", error);
        if (musicIcon) {
            musicIcon.className = "gg-play-button-o";
        }
        musicToggleContainer.classList.remove('active-music');
        
    });
}

function fadeOutMusic(callback) {
    if (backgroundMusic.paused || backgroundMusic.volume === 0) {
        callback(); 
        return;
    }

    let volume = backgroundMusic.volume;
    const fadeOutInterval = setInterval(() => {
        if (volume > 0) {
            volume -= (FADE_INTERVAL / FADE_DURATION);
            backgroundMusic.volume = Math.max(volume, 0);
        } else {
            backgroundMusic.pause(); 
            clearInterval(fadeOutInterval);
            console.log("Music paused with fade-out.");
            callback(); 
        }
    }, FADE_INTERVAL);
}

function playRandomMusic() {
    if (musicFiles.length === 0) {
        console.warn("No music files available to play.");
        return;
    }

    fadeOutMusic(() => { 
        let randomIndex;
        let randomSongUrl;
        
        do {
            randomIndex = Math.floor(Math.random() * musicFiles.length);
            randomSongUrl = musicFiles[randomIndex];
        } while (randomSongUrl === lastPlayedSongUrl && musicFiles.length > 1);

        lastPlayedSongUrl = randomSongUrl;

        console.log("Attempting to play next song:", randomSongUrl);

        if (musicIcon) {
            musicIcon.className = "gg-arrow-right-r"; 
        }
        musicToggleContainer.classList.add('active-music');

        backgroundMusic.src = randomSongUrl;
        backgroundMusic.load(); 

        fadeInMusic(); 
    });
}

function toggleMusic(newState) {
    if (!backgroundMusic || !musicIcon || !musicToggleContainer) {
        console.error("Missing audio element or music toggle elements. Cannot toggle music.");
        return;
    }

    if (newState === "play") {
        if (backgroundMusic.paused || backgroundMusic.src === "") {
            
            if (backgroundMusic.src === "" || (backgroundMusic.paused && backgroundMusic.src !== initialSongUrl && backgroundMusic.currentTime === 0)) {
                playInitialMusic();
            } else {
                fadeInMusic();
                musicIcon.className = "gg-play-pause-o";
                musicToggleContainer.classList.add('active-music');
            }
        }
    } else if (newState === "pause") {
        fadeOutMusic(() => {
            musicIcon.className = "gg-play-button-o";
            musicToggleContainer.classList.remove('active-music');
            saveMusicState(); 
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!musicToggleContainer || !backgroundMusic || !musicIcon) {
        console.error("Critical elements (music-toggle, backgroundMusic, musicIcon) not found. Script will not run.");
        return;
    }

    loadMusicState();

    let pressTimer;
    const LONG_PRESS_THRESHOLD = 300;

    musicToggleContainer.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            pressTimer = setTimeout(() => {
                console.log("Long press detected: Playing next random song.");
                
                playRandomMusic();
                musicToggleContainer.dataset.longPress = 'true';
            }, LONG_PRESS_THRESHOLD);
        }
    });

    musicToggleContainer.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
        if (musicToggleContainer.dataset.longPress === 'true') {
            delete musicToggleContainer.dataset.longPress;
        } else {
            console.log("Short click detected: Toggling play/pause.");
            if (!backgroundMusic.paused || backgroundMusic.ended) {
                toggleMusic("pause");
            } else {
                toggleMusic("play");
            }
        }
    });

    musicToggleContainer.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pressTimer = setTimeout(() => {
            console.log("Long touch detected: Playing next random song.");
            
            playRandomMusic();
            musicToggleContainer.dataset.longPress = 'true';
        }, LONG_PRESS_THRESHOLD);
    }, { passive: false });

    musicToggleContainer.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
        if (musicToggleContainer.dataset.longPress === 'true') {
            delete musicToggleContainer.dataset.longPress;
        } else {
            console.log("Short touch detected: Toggling play/pause.");
            if (!backgroundMusic.paused || backgroundMusic.ended) {
                toggleMusic("pause");
            } else {
                toggleMusic("play");
            }
        }
    });
    
    backgroundMusic.addEventListener('ended', playRandomMusic);
    window.addEventListener('beforeunload', saveMusicState);
    window.addEventListener('pagehide', saveMusicState);
});