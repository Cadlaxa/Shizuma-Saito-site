document.addEventListener('DOMContentLoaded', () => {
    // Data Structure: Links songs to their vocal modes and audio files
    const songsData = {
        'Movements Align': [
            { mode: 'Core', src: 'resources/demos/en_core.mp3' },
            { mode: 'Soft', src: 'resources/demos/en_soft.mp3' }
        ],
        'Value (svp: ryu)': [
            { mode: 'Core', src: 'resources/demos/ja_core.mp3' },
            { mode: 'Soft', src: 'resources/demos/ja_soft.mp3' }
        ],
        'Calorie': [
            { mode: 'Core', src: 'resources/demos/fil_core.mp3' },
            { mode: 'Soft', src: 'resources/demos/fil_soft.mp3' }
        ],
        '필요조건◎Stranded (ust: Mimisan15)': [
            { mode: 'Core', src: 'resources/demos/kor_core.mp3' },
            { mode: 'Soft', src: 'resources/demos/kor_soft.mp3' }
        ],
        '野花香/Yěhuāxiāng (ust: Mimisan15)': [
            { mode: 'Core', src: 'resources/demos/zh_core.mp3' },
            { mode: 'Soft', src: 'resources/demos/zh_soft.mp3' }
        ],
        'Synthimentale (ustx: UFR)': [
            { mode: 'Core', src: 'resources/demos/fr_core.mp3' },
            { mode: 'Soft', src: 'resources/demos/fr_soft.mp3' }
        ],
        '笑納/Xiaona (svp: kávézó)': [
            { mode: 'Core', src: 'resources/demos/zh-yue_core.mp3' },
            { mode: 'Soft', src: 'resources/demos/zh-yue_soft.mp3' }
        ],
    };

    // New object for overriding language codes
    const languageOverrides = {
        'EN': 'EN',
        'JA': 'JA',
        'FIL': 'FIL',
        'KOR': 'KR (dict)',
        'ZH': 'ZH (dict)',
        'ZH-YUE': 'ZH-YUE (dict)',
        'FR': 'FR (dict)'
    };

    // Modal Popup DOM Elements
    const openPopupBtn = document.querySelector('.buttons .open-popup-btn');
    const closePopupBtn = document.getElementById('close-popup-btn');
    const modalOverlay = document.getElementById('modal-overlay');

    // Dropdown DOM Elements
    const songDropdownContainer = document.getElementById('song-dropdown');
    const vocalModeDropdownContainer = document.getElementById('vocal-mode-dropdown');
    const songMenu = songDropdownContainer.querySelector('.dropdown-menu');
    const vocalModeMenu = vocalModeDropdownContainer.querySelector('.dropdown-menu');
    const songTriggerText = songDropdownContainer.querySelector('.selected-text');
    const vocalModeTriggerText = vocalModeDropdownContainer.querySelector('.selected-text');
    const audioPlayer = document.getElementById('audio-player');

    let currentSongTitle = null;
    let currentVocalMode = null;

    // --- Modal Popup Logic ---
    function openModal() {
        modalOverlay.classList.add('is-open');
        document.body.classList.add('modal-open');
        initialize();
    }

    function closeModal() {
        modalOverlay.classList.add('is-closing');
        audioPlayer.pause();
        audioPlayer.currentTime = 0;

        setTimeout(() => {
            modalOverlay.classList.remove('is-open', 'is-closing');
            document.body.classList.remove('modal-open');
        }, 1000);
    }

    openPopupBtn.addEventListener('click', openModal);
    closePopupBtn.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    window.addEventListener('popstate', (event) => {
        // If the modal was open, close it. Otherwise, do nothing.
        if (event.state && event.state.modalOpen) {
            closeModal();
        }
    });

    // --- Dropdown and Audio Player Logic ---
    function initialize() {
        songMenu.innerHTML = '';
        Object.keys(songsData).forEach(title => {
            const li = document.createElement('li');
            li.className = 'dropdown-item';

            // Correctly extract the language code from the file path
            const filePath = songsData[title][0].src;
            const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
            const languageCode = fileName.split('_')[0].toUpperCase();

            // Use the override if it exists, otherwise use the extracted code
            const displayCode = languageOverrides[languageCode] || languageCode;

            li.innerHTML = `${title} <span class="language">${displayCode}</span>`;
            li.setAttribute('data-song-title', title);
            songMenu.appendChild(li);
        });

        const initialSongTitle = Object.keys(songsData)[0];
        const initialVocalModes = songsData[initialSongTitle];
        const initialVocalMode = initialVocalModes[0];

        updateSongSelection(initialSongTitle);
        updateVocalModeSelection(initialVocalMode);
    }

    function updateSongSelection(songTitle) {
        currentSongTitle = songTitle;
        const songElement = songMenu.querySelector(`[data-song-title="${songTitle}"]`);
        if (!songElement) return;

        songTriggerText.innerHTML = songElement.innerHTML;
        songMenu.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('active'));
        songElement.classList.add('active');

        populateVocalModeDropdown(songsData[currentSongTitle]);

        const firstVocalMode = songsData[currentSongTitle][0];
        updateVocalModeSelection(firstVocalMode);
    }

    function populateVocalModeDropdown(vocalModes) {
        vocalModeMenu.innerHTML = '';
        vocalModes.forEach(modeData => {
            const li = document.createElement('li');
            li.className = 'dropdown-item';
            li.textContent = modeData.mode;
            li.setAttribute('data-mode-src', modeData.src);
            vocalModeMenu.appendChild(li);
        });
    }

    function updateVocalModeSelection(modeData) {
        if (!modeData || !modeData.src) return;

        currentVocalMode = modeData;

        const modeElement = vocalModeMenu.querySelector(`[data-mode-src="${modeData.src}"]`);
        vocalModeTriggerText.textContent = modeData.mode;
        vocalModeMenu.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('active'));
        if (modeElement) {
            modeElement.classList.add('active');
        }

        // === Lazy load audio and preserve timestamp ===
        const oldTime = audioPlayer.currentTime || 0;
        const wasPlaying = !audioPlayer.paused;

        audioPlayer.pause();
        audioPlayer.removeAttribute('src');
        audioPlayer.load();

        audioPlayer.src = modeData.src;

        // Wait for audio to be ready, then sync time
        audioPlayer.addEventListener('canplay', function handleSeek() {
            try {
                audioPlayer.currentTime = oldTime;
                if (wasPlaying) {
                    audioPlayer.play();
                }
            } catch (e) {
                console.warn('Could not preserve timestamp:', e);
            }
            audioPlayer.removeEventListener('canplay', handleSeek);
        });

        audioPlayer.load();
    }

    songDropdownContainer.addEventListener('click', (e) => {
        if (e.target.closest('.dropdown-trigger')) {
            songDropdownContainer.classList.toggle('open');
        } else if (e.target.closest('.dropdown-item')) {
            const newSongTitle = e.target.closest('.dropdown-item').getAttribute('data-song-title');
            updateSongSelection(newSongTitle);
            songDropdownContainer.classList.remove('open');
        }
    });

    vocalModeDropdownContainer.addEventListener('click', (e) => {
        if (e.target.closest('.dropdown-trigger')) {
            vocalModeDropdownContainer.classList.toggle('open');
        } else if (e.target.closest('.dropdown-item')) {
            const newModeSrc = e.target.closest('.dropdown-item').getAttribute('data-mode-src');
            const newModeData = songsData[currentSongTitle].find(item => item.src === newModeSrc);
            updateVocalModeSelection(newModeData);
            vocalModeDropdownContainer.classList.remove('open');
        }
    });

    document.addEventListener('click', (e) => {
        if (!songDropdownContainer.contains(e.target)) {
            songDropdownContainer.classList.remove('open');
        }
        if (!vocalModeDropdownContainer.contains(e.target)) {
            vocalModeDropdownContainer.classList.remove('open');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.carousel-slides .youtube-link');
    const indicators = document.querySelectorAll('.carousel-indicators button');
    const carouselSlidesContainer = document.querySelector('.carousel-slides');

    let currentIndex = 0;
    let startX = 0;
    let isSwiping = false;
    let autoSlideInterval;

    function showSlide(index) {
        if (index >= slides.length) {
            index = 0;
        } else if (index < 0) {
            index = slides.length - 1;
        }
        
        currentIndex = index;

        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));

        slides[currentIndex].classList.add('active');
        indicators[currentIndex].classList.add('active');
    }

    function startAutoSlide() {
        // Clear any existing interval to prevent multiple timers
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(() => {
            showSlide(currentIndex + 1);
        }, 7000); // Change slide every 7000ms (7 seconds)
    }

    function pauseAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    startAutoSlide();

    carouselSlidesContainer.addEventListener('mouseenter', pauseAutoSlide);
    carouselSlidesContainer.addEventListener('mouseleave', startAutoSlide);

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            pauseAutoSlide();
            showSlide(index);
            startAutoSlide(); 
        });
    });

    const handleStart = (e) => {
        pauseAutoSlide(); 
        isSwiping = true;
        startX = (e.touches ? e.touches[0].clientX : e.clientX);
        if (e.type === 'mousedown') {
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleEnd);
        }
    };

    const handleMove = (e) => {
        if (!isSwiping) return;
        const diffX = startX - (e.touches ? e.touches[0].clientX : e.clientX);
        if (Math.abs(diffX) > 20) {
            e.preventDefault();
        }
    };

    const handleEnd = (e) => {
        if (!isSwiping) return;
        isSwiping = false;

        const endX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
        const diffX = startX - endX;
        const swipeThreshold = 50;

        if (diffX > swipeThreshold) {
            showSlide(currentIndex + 1);
        } else if (diffX < -swipeThreshold) {
            showSlide(currentIndex - 1);
        }
        
        startAutoSlide(); 
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
    };

    carouselSlidesContainer.addEventListener('mousedown', handleStart);
    carouselSlidesContainer.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchend', handleEnd);

    showSlide(0);
});