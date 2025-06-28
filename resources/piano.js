
const whiteKeysNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
const blackKeysNotes = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5', 'F#5', 'G#5', 'A#5'];
const pianoKeys = document.querySelectorAll(".piano-keys .key");
const volumeSlider = document.getElementById("volume-slider");
const showKeysToggle = document.getElementById("show-keys-toggle");
const languageSwitches = document.getElementById("language-switches");
const soundTypeSwitches = document.getElementById("sound-type-switches");


let currentLanguage = 'en'; 
let currentSoundType = 'core'; 


const keyMap = {
    "a": "C3", "w": "C#3", "s": "D3", "e": "D#3", "d": "E3", "f": "F3", "t": "F#3",
    "g": "G3", "y": "G#3", "h": "A3", "u": "A#3", "j": "B3", "k": "C4", "o": "C#4",
    "l": "D4", "p": "D#4", ";": "E4"
    
};


let audioCtx; 
let activeNotes = {}; 
let sampleCache = {};
const defaultFadeOutDuration = 0.3; 
const INITIAL_SOUND_MIN_DURATION_MS = 500; 
const CROSSFADE_ON_NEW_NOTE_DURATION = 0.2; 
const LOOP_CROSSFADE_DURATION = 0.01; 


const AUDIO_FILE_EXTENSION = '.mp3';
const AUDIO_FILE_PATH_PREFIX = 'resources/tunes/';


const loopPoints = {
    'a': { loopStart: 2.2, loopEnd: 4.5 },
    'w': { loopStart: 2.2, loopEnd: 4.5 },
    's': { loopStart: 2.2, loopEnd: 4.5 },
    'e': { loopStart: 2.2, loopEnd: 4.5 },
    'd': { loopStart: 2.2, loopEnd: 4.5 },
    'f': { loopStart: 2.2, loopEnd: 4.5 },
    't': { loopStart: 2.2, loopEnd: 4.5 },
    'g': { loopStart: 2.2, loopEnd: 4.5 },
    'y': { loopStart: 2.2, loopEnd: 4.5 },
    'h': { loopStart: 2.2, loopEnd: 4.5 },
    'u': { loopStart: 2.2, loopEnd: 4.5 },
    'j': { loopStart: 2.2, loopEnd: 4.5 },
    'k': { loopStart: 2.2, loopEnd: 4.5 },
    'o': { loopStart: 2.2, loopEnd: 4.5 },
    'l': { loopStart: 2.2, loopEnd: 4.5 },
    'p': { loopStart: 2.2, loopEnd: 4.5 },
    ';': { loopStart: 2.2, loopEnd: 4.5 },
};


function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function resumeAudioContext() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            console.log('AudioContext resumed successfully.');
        }).catch(e => console.error('Error resuming AudioContext:', e));
    }
}

async function loadSample(key, lang, type) {
    const cacheKey = `${key}_${lang}_${type}`;
    const fileName = `${key}_${lang}_${type}${AUDIO_FILE_EXTENSION}`; 
    const filePath = `${AUDIO_FILE_PATH_PREFIX}${fileName}`;

    if (sampleCache[cacheKey]) {
        return sampleCache[cacheKey];
    }

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} for ${filePath}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        sampleCache[cacheKey] = audioBuffer;
        return audioBuffer;
    } catch (error) {
        console.error(`Error loading sample ${filePath}:`, error);
        return null;
    }
}

function scheduleLoop(key, audioBuffer, gainNode, loopData, nextStartTime) {
    const noteInfo = activeNotes[key];
    
    if (!noteInfo || noteInfo.stopScheduled) return;
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);

    source.start(nextStartTime, loopData.loopStart, loopData.loopEnd - loopData.loopStart);

    const currentLoopDuration = loopData.loopEnd - loopData.loopStart;
    const nextLoopStartTime = nextStartTime + currentLoopDuration;

    if (currentLoopDuration > LOOP_CROSSFADE_DURATION) {
        
        noteInfo.loopTimer = setTimeout(() => {
            if (activeNotes[key] && activeNotes[key].isLooping && !activeNotes[key].stopScheduled) {
                scheduleLoop(key, audioBuffer, gainNode, loopData, nextLoopStartTime - LOOP_CROSSFADE_DURATION);
            }
        }, (currentLoopDuration - LOOP_CROSSFADE_DURATION) * 1000);
    } else {
        
        noteInfo.loopTimer = setTimeout(() => {
            if (activeNotes[key] && activeNotes[key].isLooping && !activeNotes[key].stopScheduled) {
                scheduleLoop(key, audioBuffer, gainNode, loopData, nextLoopStartTime);
            }
        }, currentLoopDuration * 1000);
    }
}

async function playTune(newKey) {
    if (!isPianoSectionActive()) return;
    
    initAudioContext(); 
    resumeAudioContext();
    createFallingNoteVisual(newKey);

    const newAudioBuffer = await loadSample(newKey, currentLanguage, currentSoundType);
    if (!newAudioBuffer) {
        console.warn(`Could not play note '${newKey}' with language '${currentLanguage}' and type '${currentSoundType}': audio buffer not available.`);
        return;
    }

    const now = audioCtx.currentTime;
    const vol = parseFloat(volumeSlider.value);

    for (const key in activeNotes) {
        if (key !== newKey) { 
            const oldNoteInfo = activeNotes[key];
            if (oldNoteInfo && oldNoteInfo.gainNode) {
                console.log(`Crossfading out old note '${key}' for new note '${newKey}'.`);
                
                performStop(key, CROSSFADE_ON_NEW_NOTE_DURATION); 
            }
        } else { 
            if (activeNotes[newKey]) {
                console.log(`Re-triggering note for ${newKey}.`);
                
                performStop(newKey, 0.001); 
            }
        }
    }
    
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = vol; 

    const visualElement = document.querySelector(`[data-key="${newKey}"]`);

    const noteInfo = {
        currentSource: null,
        gainNode: gainNode,
        visualElement: visualElement,
        loopTimer: null, 
        isLooping: false,
        startTime: audioCtx.currentTime, 
        stopScheduled: false, 
        pendingStopTimeout: null 
    };
    activeNotes[newKey] = noteInfo;

    
    if (visualElement) {
        visualElement.classList.add("active");
    }

    const loopData = loopPoints[newKey];
    const canLoop = loopData && newAudioBuffer.duration > loopData.loopEnd && loopData.loopEnd > loopData.loopStart;

    
    const initialSource = audioCtx.createBufferSource();
    initialSource.buffer = newAudioBuffer;
    initialSource.connect(gainNode);
    noteInfo.currentSource = initialSource; 

    if (canLoop) {
        initialSource.start(now, 0, loopData.loopStart); 

        noteInfo.loopTransitionTimeout = setTimeout(() => { 
            if (activeNotes[newKey] && (pressedKeys.has(newKey) || heldMouseKeys.has(newKey)) && !activeNotes[newKey].stopScheduled) {
                console.log(`Transitioning ${newKey} to loop.`);
                try {
                    initialSource.stop(audioCtx.currentTime + LOOP_CROSSFADE_DURATION);
                } catch (e) {
                    console.warn(`Error stopping initialSource for ${newKey} during loop transition:`, e);
                }
                scheduleLoop(newKey, newAudioBuffer, gainNode, loopData, audioCtx.currentTime);
                noteInfo.isLooping = true;
            } else {
                console.log(`Key ${newKey} released before loop initiated or stop was scheduled.`);
                
            }
        }, INITIAL_SOUND_MIN_DURATION_MS);
    } else {
        initialSource.start(now);
        initialSource.onended = () => {
            
            if (activeNotes[newKey] && activeNotes[newKey].currentSource === initialSource && !activeNotes[newKey].stopScheduled) {
                console.log(`Note ${newKey} (non-looping) ended naturally.`);
                if (activeNotes[newKey].visualElement) {
                    activeNotes[newKey].visualElement.classList.remove("active");
                }
                delete activeNotes[newKey];
                
                if (pressedKeys.has(newKey)) pressedKeys.delete(newKey);
                if (heldMouseKeys.has(newKey)) heldMouseKeys.delete(newKey);
            }
        };
    }
}

function createFallingNoteVisual(note) {
    const keyElement = document.querySelector(`[data-key="${note}"]`);
    const container = document.getElementById("note-fall-container");
    if (!keyElement || !container) return;

    const rect = keyElement.getBoundingClientRect();
    const pianoRect = container.getBoundingClientRect();

    const noteDiv = document.createElement("div");
    noteDiv.classList.add("note-fall");

    noteDiv.style.left = `${rect.left - pianoRect.left + rect.width / 2 - 10}px`; 
    noteDiv.style.top = `0px`;

    container.appendChild(noteDiv);

    noteDiv.addEventListener("animationend", () => {
        noteDiv.remove();
    });
}


function performStop(key, fadeDuration = defaultFadeOutDuration) {
    const noteInfo = activeNotes[key];
    if (!noteInfo) return;
    if (noteInfo.loopTimer) { 
        clearTimeout(noteInfo.loopTimer);
        noteInfo.loopTimer = null;
    }
    if (noteInfo.pendingStopTimeout) { 
        clearTimeout(noteInfo.pendingStopTimeout);
        noteInfo.pendingStopTimeout = null;
    }
    if (noteInfo.loopTransitionTimeout) { 
        clearTimeout(noteInfo.loopTransitionTimeout);
        noteInfo.loopTransitionTimeout = null;
    }

    noteInfo.stopScheduled = true; 
    const { currentSource, gainNode, visualElement } = noteInfo; 
    const now = audioCtx.currentTime;

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.linearRampToValueAtTime(0, now + fadeDuration);
    console.log(`Fading out gain for ${key} over ${fadeDuration}s.`);
    
    if (currentSource && !currentSource.onended) { 
        try {
            currentSource.stop(now + fadeDuration + 0.01);
            console.log(`Source for ${key} scheduled to stop after fade.`);
        } catch (e) {
            console.warn(`Error stopping source for ${key}: ${e.message}. It might have already ended naturally.`);
        }
    }
    if (visualElement) {
        visualElement.classList.remove("active");
    }
    setTimeout(() => {
        if (activeNotes[key] === noteInfo) { 
            delete activeNotes[key];
            console.log(`Cleaned up activeNotes for ${key}.`);
        }
    }, (fadeDuration * 1000) + 50); 
}

function stopTune(key) {
    const noteInfo = activeNotes[key];
    if (!noteInfo) return;
    if (noteInfo.stopScheduled) {
        return;
    }

    const timeElapsed = (audioCtx.currentTime - noteInfo.startTime) * 1000; 
    if (timeElapsed < INITIAL_SOUND_MIN_DURATION_MS) {
        
        const delay = INITIAL_SOUND_MIN_DURATION_MS - timeElapsed;
        console.log(`Scheduling stop for ${key} in ${delay.toFixed(2)}ms to meet minimum duration.`);
        noteInfo.stopScheduled = true; 
        noteInfo.pendingStopTimeout = setTimeout(() => {
            performStop(key); 
        }, delay);
    } else {
        
        console.log(`Stopping ${key} immediately (min duration met).`);
        performStop(key);
    }
}

const handleVolume = (e) => {
    const vol = parseFloat(e.target.value);
    const now = audioCtx.currentTime;
    for (const key in activeNotes) {
        const { gainNode } = activeNotes[key];
        if (gainNode) {
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.linearRampToValueAtTime(vol, now + 0.05);
        }
    }
};

const showHideKeys = () => {
    pianoKeys.forEach(key => {
        const span = key.querySelector("span");
        if (span) {
            if (showKeysToggle.checked) {
                span.style.opacity = "1";
                span.style.transform = "translateY(0)";
                span.style.pointerEvents = "auto";
            } else {
                span.style.opacity = "0";
                span.style.transform = "translateY(5px)";
                span.style.pointerEvents = "none";
            }
        }
    });
};

const pressedKeys = new Set();
const heldMouseKeys = new Set();

function isPianoSectionActive() {
    const pianoSection = document.getElementById("piano-section");
    return pianoSection && pianoSection.offsetParent !== null;
}

let allKeys = []; 
pianoKeys.forEach(keyEl => {
    const key = keyEl.dataset.key;
    allKeys.push(key);
    keyEl.addEventListener("mousedown", (event) => {
        if (event.button === 0) {
            if (!heldMouseKeys.has(key)) { 
                heldMouseKeys.add(key);
                playTune(key);
            }
        }
    });
    keyEl.addEventListener("mouseup", (event) => {
        if (event.button === 0) {
            if (heldMouseKeys.has(key)) {
                heldMouseKeys.delete(key);
                stopTune(key);
            }
        }
    });
    keyEl.addEventListener("mouseleave", () => {
        if (heldMouseKeys.has(key)) {
            stopTune(key);
        }
    });
    
    keyEl.addEventListener("touchstart", (e) => {
        e.preventDefault(); 
        if (!heldMouseKeys.has(key)) {
            heldMouseKeys.add(key);
            playTune(key);
        }
    });
    keyEl.addEventListener("touchend", () => {
        if (heldMouseKeys.has(key)) {
            heldMouseKeys.delete(key);
            stopTune(key);
        }
    });
});

document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (allKeys.includes(key) && !e.repeat && isPianoSectionActive()) {
        e.preventDefault();
        if (!pressedKeys.has(key)) {
            pressedKeys.add(key);
            playTune(key);
        }
    }
});

document.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();
    if (allKeys.includes(key) && isPianoSectionActive()) {
        if (pressedKeys.has(key)) {
            pressedKeys.delete(key);
            stopTune(key);
        }
    }
});

showKeysToggle.addEventListener("change", showHideKeys);
volumeSlider.addEventListener("input", handleVolume);

function stopAllNotesAndClearCache() {
    for (const key in activeNotes) {
        performStop(key, 0.1); 
    }
    activeNotes = {}; 
    sampleCache = {}; 
    console.log("All notes stopped and sample cache cleared.");
}

languageSwitches.addEventListener("click", (e) => {
    if (e.target.classList.contains("toggle-option")) {
        
        document.querySelectorAll('#language-switches .toggle-option').forEach(option => {
            option.classList.remove('active');
        });
        
        e.target.classList.add('active');
        const selectedLang = e.target.dataset.lang;
        if (selectedLang !== currentLanguage) {
            currentLanguage = selectedLang;
            console.log("Language selected:", currentLanguage);
            stopAllNotesAndClearCache(); 
        }
    }
});

soundTypeSwitches.addEventListener("click", (e) => {
    if (e.target.classList.contains("toggle-option")) {
        
        document.querySelectorAll('#sound-type-switches .toggle-option').forEach(option => {
            option.classList.remove('active');
        });
        
        e.target.classList.add('active');
        const selectedType = e.target.dataset.type;
        if (selectedType !== currentSoundType) {
            currentSoundType = selectedType;
            console.log("Sound type selected:", currentSoundType);
            stopAllNotesAndClearCache(); 
        }
    }
});

const toneJsScript = document.createElement('script');
toneJsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js';
toneJsScript.onload = () => {
    console.log('Tone.js loaded successfully!');
    
    
    
    pianoKeys.forEach(keyEl => {
        const key = keyEl.dataset.key;
        loadSample(key, currentLanguage, currentSoundType).catch(e => console.error("Error during initial pre-load:", e));
    });
    console.log("Initial audio samples pre-load attempt complete for default settings.");
};
document.head.appendChild(toneJsScript);
document.addEventListener('click', () => { initAudioContext(); resumeAudioContext(); }, { once: true });
document.addEventListener('keydown', () => { initAudioContext(); resumeAudioContext(); }, { once: true });
