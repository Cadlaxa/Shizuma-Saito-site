// Get references to the audio element and the music toggle container
const backgroundMusic = document.getElementById('backgroundMusic');
const musicToggleContainer = document.querySelector('.music-toggle');
const musicIcon = musicToggleContainer ? musicToggleContainer.querySelector('i') : null;

// Keys for localStorage
const MUSIC_STATE_KEY = 'musicPlayerState';
const CURRENT_SONG_URL_KEY = 'currentSongUrl';
const PLAYBACK_TIME_KEY = 'playbackTime';
const IS_PLAYING_KEY = 'isPlaying';

// Music files array including your provided URLs (which are direct MP3s)
const musicFiles = [
    'resources/covers/ffffff.mp3',
    'resources/covers/FMW new mixing.mp3',
    'resources/covers/headlock.mp3',
    'resources/covers/static tagalog ver full.mp3'
];

// Define the specific song you want to play first
const initialSongUrl = 'resources/covers/ffffff.mp3';

/**
 * Saves the current music state to localStorage.
 * Stores: current song URL, current playback time, and whether it was playing.
 */
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

/**
 * Loads and restores the music state from localStorage.
 * If no state is found, it sets the initial song and attempts to play it.
 */
function loadMusicState() {
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
                backgroundMusic.load(); // Load the audio

                console.log("Music state loaded:", savedState);

                if (wasPlaying) {
                    // Attempt to play only if it was playing and the source is loaded
                    backgroundMusic.play().then(() => {
                        console.log("Music resumed from last session.");
                        if (musicIcon) {
                            musicIcon.className = "gg-play-pause-o";
                        }
                        musicToggleContainer.classList.add('active-music');
                    }).catch(error => {
                        console.warn("Autoplay prevented on page load from saved state. User interaction required to resume:", error);
                        // If autoplay fails, set icon to play
                        if (musicIcon) {
                            musicIcon.className = "gg-play-button-o";
                        }
                        musicToggleContainer.classList.remove('active-music');
                        // Crucially, if autoplay is prevented, we still want to indicate it *was* playing
                        // so that the first user interaction correctly resumes it.
                        // We don't save state here, as the state would indicate it's paused.
                    });
                } else {
                    // Was paused, just update icon
                    if (musicIcon) {
                        musicIcon.className = "gg-play-button-o";
                    }
                    musicToggleContainer.classList.remove('active-music');
                }
            } else {
                console.log("Incomplete saved music state found. Starting with initial song.");
                playInitialMusic(); // Play the fffff song if state is incomplete
            }
        } else {
            console.log("No saved music state found. Playing initial song.");
            playInitialMusic(); // Play the fffff song directly
        }
    } catch (e) {
        console.error("Error loading music state from localStorage:", e);
        // Fallback to default initial state if error occurs
        if (musicIcon) {
            musicIcon.className = "gg-play-button-o";
        }
        musicToggleContainer.classList.remove('active-music');
        playInitialMusic(); // Play the fffff song on error
    }
}

/**
 * Attempts to play the initial song ('ffffff.mp3') on page load.
 */
function playInitialMusic() {
    backgroundMusic.src = initialSongUrl;
    backgroundMusic.load();

    backgroundMusic.play().then(() => {
        console.log("Initial music ('ffffff.mp3') playing.");
        if (musicIcon) {
            musicIcon.className = "gg-play-pause-o";
        }
        musicToggleContainer.classList.add('active-music');
        saveMusicState(); // Save state if successfully played
    }).catch(error => {
        console.warn("Autoplay of initial music ('ffffff.mp3') prevented. User interaction required:", error);
        if (musicIcon) {
            musicIcon.className = "gg-play-button-o";
        }
        musicToggleContainer.classList.remove('active-music');
        // Do NOT save state as playing here, as it's not playing.
    });
}

/**
 * Selects a random song from the list and plays it.
 */
function playRandomMusic() {
    if (musicFiles.length === 0) {
        console.warn("No music files available to play.");
        return;
    }

    const randomIndex = Math.floor(Math.random() * musicFiles.length);
    const randomSongUrl = musicFiles[randomIndex];

    console.log("Attempting to play next song:", randomSongUrl);

    if (musicIcon) {
        musicIcon.className = "gg-arrow-right-r"; // Indicate loading/changing song
    }
    musicToggleContainer.classList.add('active-music');

    backgroundMusic.src = randomSongUrl;
    backgroundMusic.load();

    backgroundMusic.play().then(() => {
        // Delay icon update slightly for visual feedback
        setTimeout(() => {
            if (musicIcon) {
                musicIcon.className = "gg-play-pause-o";
            }
        }, 500); // Shorter delay for quicker feedback
        console.log("Music playing:", randomSongUrl);
        saveMusicState();
    }).catch(error => {
        console.warn("Autoplay prevented for:", randomSongUrl, error);
        // Delay icon update slightly for visual feedback
        setTimeout(() => {
            if (musicIcon) {
                musicIcon.className = "gg-play-button-o";
            }
            musicToggleContainer.classList.remove('active-music');
        }, 500);
        // Do NOT save state as playing if autoplay was prevented
    });
}

/**
 * Toggles the playback state of the background music and updates the button icon.
 * @param {string} newState - 'play' to play music, 'pause' to pause music.
 */
function toggleMusic(newState) {
    if (!backgroundMusic || !musicIcon || !musicToggleContainer) {
        console.error("Missing audio element or music toggle elements. Cannot toggle music.");
        return;
    }

    if (newState === "play") {
        if (backgroundMusic.paused || backgroundMusic.src === "") {
            // If the music is paused or no song is loaded (e.g., initial load and autoplay blocked)
            // and the current source is not the fffff song, play the initial song.
            // Otherwise, if a song is already loaded but paused, just play it.
            if (backgroundMusic.src === "" || (backgroundMusic.paused && backgroundMusic.src !== initialSongUrl && backgroundMusic.currentTime === 0)) {
                // This condition handles the very first play when autoplay might have been blocked
                // or if the previous song ended and no new one was started.
                playInitialMusic(); // Try playing the initial song
            } else {
                backgroundMusic.play().then(() => {
                    musicIcon.className = "gg-play-pause-o";
                    musicToggleContainer.classList.add('active-music');
                    console.log("Music resumed.");
                    saveMusicState();
                }).catch(error => {
                    console.warn("Autoplay prevented on resume (user initiated):", error);
                    musicIcon.className = "gg-play-button-o";
                    musicToggleContainer.classList.remove('active-music');
                    // We still indicate the intent to play by setting the icon to play,
                    // but the actual playback will need another click.
                });
            }
        }
    } else if (newState === "pause") {
        backgroundMusic.pause();
        musicIcon.className = "gg-play-button-o";
        musicToggleContainer.classList.remove('active-music');
        console.log("Music paused.");
        saveMusicState();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!musicToggleContainer || !backgroundMusic || !musicIcon) {
        console.error("Critical elements (music-toggle, backgroundMusic, musicIcon) not found. Script will not run.");
        return;
    }

    // Attempt to load music state or play initial song on DOMContentLoaded
    loadMusicState();

    let pressTimer;
    const LONG_PRESS_THRESHOLD = 500;

    musicToggleContainer.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            pressTimer = setTimeout(() => {
                console.log("Long press detected: Playing next random song.");
                if (!backgroundMusic.paused) {
                    backgroundMusic.pause();
                }
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
            if (!backgroundMusic.paused) {
                backgroundMusic.pause();
            }
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

    // Add the 'ended' event listener for continuous random play
    backgroundMusic.addEventListener('ended', playRandomMusic);

    // Add event listener to save state before page unload
    window.addEventListener('beforeunload', saveMusicState);
    window.addEventListener('pagehide', saveMusicState);
});