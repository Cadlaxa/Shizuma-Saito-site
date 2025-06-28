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
        a, button, image, input, select, textarea,
        [role="button"], [role="link"], [role="checkbox"],
        [role="radio"], [role="switch"], 
        [tabindex]:not([tabindex="-1"]),
        [onclick], [contenteditable="true"]`;

    
    clickAudioFilePaths.forEach(path => {
        try {
            const audio = new Audio(path);
            audio.volume = 0.5;
            audio.preload = 'auto';
            clickAudioPlayers.push(audio);
        } catch (e) {
            console.error(`Error creating HTML Audio for "${path}":`, e);
        }
    });
    
    async function loadHoverSound() {
        if (!audioContext) return;
        try {
            const response = await fetch(hoverAudioFilePath);
            const arrayBuffer = await response.arrayBuffer();
            hoverAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            console.log("Hover audio loaded.");
        } catch (e) {
            console.error(`Failed to load hover sound:`, e);
        }
    }

    async function initAudio() {
        if (firstInteractionOccurred) return;

        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            try {
                await audioContext.resume();
                console.log("AudioContext resumed.");
            } catch (e) {
                console.warn("AudioContext resume failed:", e);
            }
        }

        try {
            const testAudio = clickAudioPlayers[0];
            if (testAudio) {
                testAudio.muted = true;
                await testAudio.play();
                testAudio.pause();
                testAudio.currentTime = 0;
                testAudio.muted = false;
                console.log("HTMLAudio unlocked.");
            }
        } catch (e) {
            console.warn("Silent HTMLAudio unlock failed:", e);
        }

        await loadHoverSound();

        firstInteractionOccurred = true;
        console.log("Audio systems fully unlocked.");
    }
    
    function playRandomClickSound() {
        if (!firstInteractionOccurred || clickAudioPlayers.length === 0) return;
        try {
            const randomIndex = Math.floor(Math.random() * clickAudioPlayers.length);
            const audio = clickAudioPlayers[randomIndex];
            audio.pause();
            audio.currentTime = 0;
            audio.play().catch(e => console.warn("Click SFX blocked:", e));
        } catch (e) {
            console.error("Error playing click sound:", e);
        }
    }
    
    function playPitchedHoverSound() {
        if (!firstInteractionOccurred || !hoverAudioBuffer || !audioContext) return;
        try {
            const source = audioContext.createBufferSource();
            source.buffer = hoverAudioBuffer;
            source.playbackRate.value = 0.8 + Math.random() * 0.4;

            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.6;

            source.connect(gainNode).connect(audioContext.destination);
            source.start(0);
        } catch (e) {
            console.error("Error playing hover sound:", e);
        }
    }
    
    document.body.addEventListener('click', initAudio, { once: true });
    document.body.addEventListener('keydown', initAudio, { once: true });

    
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

    if (!saitoSection || !saitoAudio) return;

    let saitoUnlocked = false;

    document.body.addEventListener('click', async () => {
        if (!saitoUnlocked) {
            try {
                await saitoAudio.play();
                saitoAudio.pause();
                saitoAudio.currentTime = 0;
                saitoUnlocked = true;
                console.log("Saito audio unlocked.");
            } catch (e) {
                console.warn("Saito unlock failed:", e);
            }
        }
    }, { once: true });

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && saitoUnlocked) {
                setTimeout(() => {
                    saitoAudio.currentTime = 0;
                    saitoAudio.play().catch(e => {
                        console.warn("Saito audio play failed:", e);
                    });
                }, 1000);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    observer.observe(saitoSection);
});
