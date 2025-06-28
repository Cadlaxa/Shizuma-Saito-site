document.addEventListener('DOMContentLoaded', () => {
    const clickAudioFilePaths = [
        'resources/sfx/click_sfx.mp3',
        'resources/sfx/click_general.mp3',
        'resources/sfx/click_close.mp3',
    ];
    const clickAudioPlayers = [];
    const hoverAudioFilePath = 'resources/sfx/hover.mp3'; 
    let hoverAudioBuffer = null; 
    let audioContext = null; 
    let firstInteractionOccurred = false; 
    const interactiveSelectors = `
        a,
        button,
        image,
        input,
        select,
        textarea,
        [role="button"],
        [role="link"],
        [role="checkbox"],
        [role="radio"],
        [role="switch"],
        [tabindex]:not([tabindex="-1"]),
        [onclick],
        [contenteditable="true"]
        `;


    clickAudioFilePaths.forEach(path => {
        try {
            const audio = new Audio(path);
            audio.volume = 0.5;
            audio.preload = 'auto';
            clickAudioPlayers.push(audio);
        } catch (e) {
            console.error(`Error creating HTML Audio object for "${path}":`, e);
            showMessageBox(`Failed to load click audio: ${path}. Check console.`, 'error');
        }
    });

    async function loadHoverSound() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        try {
            const response = await fetch(hoverAudioFilePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${hoverAudioFilePath}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            hoverAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            console.log("Hover sound loaded successfully!");
        } catch (e) {
            console.error(`Error loading or decoding hover sound "${hoverAudioFilePath}":`, e);
            showMessageBox(`Failed to load hover sound from "${hoverAudioFilePath}". Please ensure the URL is correct and accessible (CORS). Check console for details.`, 'error');
        }
    }
    loadHoverSound();
    function playRandomClickSound() {
        if (!firstInteractionOccurred) {
            showMessageBox("Audio not ready. Please interact with the page first.", 'warning');
            return;
        }
        if (clickAudioPlayers.length === 0) {
            console.warn("No click audio files loaded to play.");
            return;
        }

        try {
            const randomIndex = Math.floor(Math.random() * clickAudioPlayers.length);
            const selectedAudio = clickAudioPlayers[randomIndex];
            selectedAudio.pause();
            selectedAudio.currentTime = 0;
            selectedAudio.play().catch(e => {
                console.warn("Click SFX playback prevented:", e);
            });
        } catch (e) {
            console.error("Error playing random click audio:", e);
            showMessageBox("Failed to play click sound. Check console for details.", 'error');
        }
    }
    function playPitchedHoverSound() {
        if (!firstInteractionOccurred || !hoverAudioBuffer) {
            return;
        }
        try {
            
            const source = audioContext.createBufferSource(); 
            source.buffer = hoverAudioBuffer;
            
            const minPitch = 0.5;
            const maxPitch = 1.5;
            source.playbackRate.value = minPitch + (Math.random() * (maxPitch - minPitch));

            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.6; 
            
            source.connect(gainNode).connect(audioContext.destination);
            source.start(0); 
        } catch (e) {
            console.error("Error playing pitched hover audio:", e);
            
        }
    }
    document.body.addEventListener('click', async () => {
        if (!firstInteractionOccurred) {
            
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContext.state === 'suspended') {
                try {
                    await audioContext.resume();
                    console.log("Web Audio API context resumed.");
                } catch (e) {
                    console.error("Error resuming Web Audio API context:", e);
                }
            }
            if (clickAudioPlayers.length > 0) {
                try {
                    const silentAudio = clickAudioPlayers[0];
                    silentAudio.muted = true;
                    await silentAudio.play();
                    silentAudio.pause();
                    silentAudio.currentTime = 0;
                    silentAudio.muted = false;
                    console.log("HTML Audio playback enabled.");
                } catch (e) {
                    console.warn("Silent HTML Audio play for context unlock prevented:", e);
                }
            }
            
            firstInteractionOccurred = true;
            console.log("All audio playback systems are now enabled.");
        }
    }, { once: true }); 

    document.body.addEventListener('click', (event) => {
        if (event.target.closest(interactiveSelectors)) {
            playRandomClickSound();
        }
    });
    document.body.addEventListener('mouseover', (event) => {
        if (event.target.closest(interactiveSelectors)) {
            playPitchedHoverSound();
        }
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const saitoSection = document.getElementById('saito-section');
    const saitoAudio = document.getElementById('saitoAudio');

    if (!saitoSection || !saitoAudio) {
        console.warn("Saito section or audio element not found.");
        return;
    }
    let firstInteractionOccurred = false;
    document.body.addEventListener('click', async () => {
        try {
            await saitoAudio.play();
            saitoAudio.pause();
            saitoAudio.currentTime = 0;
            firstInteractionOccurred = true;
            console.log("Saito audio unlocked.");
        } catch (e) {
            console.warn("Audio unlock failed:", e);
        }
    }, { once: true });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && firstInteractionOccurred) {
                setTimeout(() => {
                    saitoAudio.currentTime = 0;
                    saitoAudio.play().catch(e => {
                        console.warn("Failed to play Saito audio:", e);
                    });
                }, 1000); 
                observer.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.5 });
    observer.observe(saitoSection);
});

