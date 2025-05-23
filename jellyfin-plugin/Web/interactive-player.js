/**
 * Jellyfin Interactive Video Player
 * Based on the original BandersnatchInteractive player
 */

class JellyfinInteractivePlayer {
    constructor(itemId) {
        this.itemId = itemId;
        this.video = null;
        this.interactiveData = null;
        this.segmentMap = null;
        this.currentSegment = null;
        this.state = {};
        this.choiceTimeout = null;
        this.selectedChoice = 0;
        this.isChoiceActive = false;
        this.momentsBySegment = null;
        this.choicePoints = null;
        this.segmentGroups = null;
        this.lastChoiceShown = null;
        
        // Playback speed steps
        this.speedSteps = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];
        this.currentSpeedIndex = 3; // Start at 1.0x (index 3)
        
        // UI elements
        this.choicesContainer = null;
        this.timerElement = null;
        this.countdownElement = null;
        this.progressBar = null;
        this.loadingElement = null;
        this.errorElement = null;
        
        // Persistent state using localStorage
        this.ls = window.localStorage || {};
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadInteractiveData();
            this.setupUI();
            this.setupVideo();
            this.setupEventListeners();
            this.initializeState();
            
            console.log('Interactive player initialized successfully');
        } catch (error) {
            this.showError('Failed to initialize: ' + error.message);
            console.error('Init error:', error);
        }
    }
    
    async loadInteractiveData() {
        try {
            const response = await fetch(`/InteractiveVideo/Metadata/${this.itemId}`);
            if (!response.ok) {
                throw new Error('Failed to load metadata');
            }
            
            const data = await response.json();
            this.interactiveData = data;
            
            // Extract components (simplified from original structure)
            this.choicePoints = data.choicePoints || {};
            this.segmentMap = data.segments || {};
            this.momentsBySegment = this.buildMomentsBySegment();
            
            console.log('Interactive data loaded:', data);
        } catch (error) {
            console.error('Error loading interactive data:', error);
            throw error;
        }
    }
    
    buildMomentsBySegment() {
        // Convert choice points to moments by segment
        const moments = {};
        
        for (const [choiceId, choiceData] of Object.entries(this.choicePoints)) {
            const segmentId = this.getSegmentIdAtTime(choiceData.startTimeMs);
            if (!segmentId) continue;
            
            if (!moments[segmentId]) {
                moments[segmentId] = [];
            }
            
            moments[segmentId].push({
                startMs: choiceData.startTimeMs - this.segmentMap[segmentId].startTimeMs,
                endMs: choiceData.startTimeMs - this.segmentMap[segmentId].startTimeMs + (choiceData.timeout || 10000),
                choices: choiceData.choices.map((choice, index) => ({
                    id: choiceData.choiceIds[index],
                    text: choice
                })),
                description: choiceData.description
            });
        }
        
        return moments;
    }
    
    getSegmentIdAtTime(timeMs) {
        for (const [segmentId, segment] of Object.entries(this.segmentMap)) {
            if (timeMs >= segment.startTimeMs && timeMs < segment.endTimeMs) {
                return segmentId;
            }
        }
        return null;
    }
    
    setupUI() {
        const container = document.getElementById('video-container') || this.createVideoContainer();
        
        // Use existing video element or create new one
        this.video = document.getElementById('video') || document.createElement('video');
        this.video.id = 'video'; // Match the CSS in player.html
        this.video.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            z-index: 100;
            object-fit: contain;
            display: block;
        `;
        this.video.preload = 'metadata';
        this.video.controls = false;
        this.video.setAttribute('playsinline', '');
        
        // Clear existing sources and add new one
        this.video.innerHTML = '';
        const source = document.createElement('source');
        source.type = 'video/mp4';
        source.src = this.getVideoStreamUrl();
        this.video.appendChild(source);
        
        // Create interactive overlay if it doesn't exist
        let overlay = document.querySelector('.interactive-overlay');
        if (!overlay) {
            overlay = this.createInteractiveOverlay();
            container.appendChild(overlay);
        } else {
            // Use existing overlay elements
            this.choicesContainer = document.getElementById('choices');
            this.timerElement = document.getElementById('timer');
            this.countdownElement = document.getElementById('countdown');
            this.progressBar = document.getElementById('progress');
        }
        
        // Ensure video is in container
        if (!this.video.parentElement) {
            container.appendChild(this.video);
        }
        
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
        
        console.log('Video element setup completed:', {
            element: this.video,
            src: this.video.querySelector('source')?.src,
            styles: this.video.style.cssText
        });
    }
    
    createVideoContainer() {
        const container = document.createElement('div');
        container.id = 'video-container';
        container.style.cssText = `
            position: relative;
            width: 100vw;
            height: 100vh;
            background: black;
        `;
        document.body.appendChild(container);
        return container;
    }
    
    createInteractiveOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'interactive-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Choices container
        this.choicesContainer = document.createElement('div');
        this.choicesContainer.className = 'choice-container';
        this.choicesContainer.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 0;
            right: 0;
            display: none;
            pointer-events: auto;
            justify-content: center;
            align-items: center;
            gap: 20px;
        `;
        
        // Timer
        this.timerElement = document.createElement('div');
        this.timerElement.className = 'choice-timer';
        this.timerElement.style.cssText = `
            position: absolute;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            display: none;
        `;
        
        this.countdownElement = document.createElement('span');
        this.timerElement.innerHTML = 'Choose in ';
        this.timerElement.appendChild(this.countdownElement);
        this.timerElement.innerHTML += ' seconds';
        
        // Progress bar
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-bar';
        this.progressBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            height: 4px;
            background: #e50914;
            width: 0%;
            transition: width 0.1s ease;
        `;
        
        overlay.appendChild(this.choicesContainer);
        overlay.appendChild(this.timerElement);
        overlay.appendChild(this.progressBar);
        
        return overlay;
    }
    
    getVideoStreamUrl() {
        const baseUrl = window.location.origin;
        return `${baseUrl}/Videos/${this.itemId}/stream?static=true&mediaSourceId=${this.itemId}`;
    }
    
    setupVideo() {
        // Configure video element
        this.video.autoplay = false;
        this.video.muted = false;
        this.video.playsInline = true;
        
        // Add subtitle support
        this.setupSubtitles();
        
        // Start loading the video
        this.video.load();
        
        console.log('Video setup completed');
    }
    
    setupSubtitles() {
        // Load local subtitle file from plugin
        console.log('Setting up local subtitle tracks...');
        
        // Add English subtitle track
        this.addSubtitleTrack('English', 'en', '/InteractiveVideo/Subtitles/en');
        
        console.log('Subtitle setup completed');
    }
    
    addSubtitleTrack(label, srclang, src) {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = label;
        track.srclang = srclang;
        track.src = src;
        
        // Handle loading
        track.addEventListener('load', () => {
            console.log(`Subtitle track "${label}" loaded successfully`);
        });
        
        track.addEventListener('error', (e) => {
            console.log(`Subtitle track "${label}" failed to load:`, e);
        });
        
        this.video.appendChild(track);
        console.log(`Added subtitle track: ${label} (${src})`);
    }
    
    addJellyfinSubtitles() {
        // Not needed anymore - using local subtitles
        console.log('Using local subtitle files instead of Jellyfin endpoints');
    }
    
    setupEventListeners() {
        // Video events
        this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.video.addEventListener('loadedmetadata', () => this.onVideoLoaded());
        this.video.addEventListener('error', () => this.showError('Video failed to load'));
        this.video.addEventListener('ended', () => this.onVideoEnded());
        
        // Keyboard controls - use both keydown and keypress for different keys
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keypress', (e) => this.onKeyPress(e));
        
        // Video click to play/pause
        this.video.addEventListener('click', (e) => {
            if (!this.isChoiceActive) {
                this.video.paused ? this.video.play() : this.video.pause();
            }
            e.preventDefault();
        });
        
        // Prevent context menu on video
        this.video.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Double click for fullscreen
        this.video.addEventListener('dblclick', () => this.toggleFullscreen());
        
        console.log('Event listeners setup completed');
    }
    
    initializeState() {
        // Initialize persistent state if not exists
        if (!this.ls.interactive_initialized) {
            this.ls.interactive_initialized = 'true';
            this.ls.interactive_state = JSON.stringify({});
            this.ls.interactive_choices = JSON.stringify([]);
            this.ls.interactive_segments_seen = JSON.stringify([]);
        }
        
        // Load current state
        try {
            this.state = JSON.parse(this.ls.interactive_state || '{}');
        } catch (e) {
            this.state = {};
        }
        
        console.log('State initialized:', this.state);
    }
    
    onVideoLoaded() {
        console.log('Video loaded, duration:', this.video.duration);
        this.video.play().catch(e => {
            console.warn('Autoplay failed:', e);
            this.showPlayButton();
        });
    }
    
    showPlayButton() {
        // Create a clickable play button overlay
        const playOverlay = document.createElement('div');
        playOverlay.id = 'play-overlay';
        playOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2000;
        `;
        
        const playButton = document.createElement('div');
        playButton.style.cssText = `
            background: #e50914;
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 4px 20px rgba(229, 9, 20, 0.5);
            transition: all 0.3s ease;
        `;
        playButton.textContent = '▶ Click to Start Playback';
        
        playButton.addEventListener('mouseenter', () => {
            playButton.style.transform = 'scale(1.05)';
            playButton.style.boxShadow = '0 6px 25px rgba(229, 9, 20, 0.7)';
        });
        
        playButton.addEventListener('mouseleave', () => {
            playButton.style.transform = 'scale(1)';
            playButton.style.boxShadow = '0 4px 20px rgba(229, 9, 20, 0.5)';
        });
        
        playOverlay.appendChild(playButton);
        
        // Add click handler to start playback
        playOverlay.addEventListener('click', () => {
            this.video.play().then(() => {
                // Ensure overlay is completely removed
                if (playOverlay.parentNode) {
                    playOverlay.parentNode.removeChild(playOverlay);
                }
                console.log('Playback started successfully, overlay removed');
                
                // Ensure video is visible
                this.video.style.display = 'block';
                this.video.style.visibility = 'visible';
                this.video.style.opacity = '1';
                
                console.log('Video should now be visible:', {
                    display: this.video.style.display,
                    visibility: this.video.style.visibility,
                    opacity: this.video.style.opacity,
                    zIndex: this.video.style.zIndex
                });
                
            }).catch(e => {
                console.error('Failed to start playback:', e);
                this.showError('Failed to start video playback. Please try again.');
            });
        });
        
        // Add to video container
        const container = this.video.parentElement;
        container.appendChild(playOverlay);
        
        console.log('Play button overlay shown - click to start');
    }
    
    onTimeUpdate() {
        const currentTimeMs = this.video.currentTime * 1000;
        
        // Update progress bar
        if (this.video.duration) {
            const progress = (this.video.currentTime / this.video.duration) * 100;
            this.progressBar.style.width = progress + '%';
        }
        
        // Check for interactive moments
        if (!this.isChoiceActive) {
            this.checkForChoices(currentTimeMs);
        }
        
        // Update current segment
        this.updateCurrentSegment(currentTimeMs);
    }
    
    updateCurrentSegment(currentTimeMs) {
        const segmentId = this.getSegmentIdAtTime(currentTimeMs);
        if (segmentId && segmentId !== this.currentSegment) {
            this.currentSegment = segmentId;
            console.log('Entered segment:', segmentId);
            this.recordSegmentVisit(segmentId);
        }
    }
    
    recordSegmentVisit(segmentId) {
        try {
            const segmentsSeen = JSON.parse(this.ls.interactive_segments_seen || '[]');
            if (!segmentsSeen.includes(segmentId)) {
                segmentsSeen.push(segmentId);
                this.ls.interactive_segments_seen = JSON.stringify(segmentsSeen);
            }
        } catch (e) {
            console.warn('Failed to record segment visit:', e);
        }
    }
    
    checkForChoices(currentTimeMs) {
        if (!this.currentSegment || !this.momentsBySegment[this.currentSegment]) {
            return;
        }

        const moments = this.momentsBySegment[this.currentSegment];
        const segmentStartTime = this.segmentMap[this.currentSegment].startTimeMs;
        const relativeTime = currentTimeMs - segmentStartTime;

        for (const moment of moments) {
            // Let video continue playing 7 seconds past the original choice point
            const extendedEndMs = moment.endMs + 7000;
            
            if (relativeTime >= moment.startMs && relativeTime <= extendedEndMs) {
                // Check if we've already shown this choice recently
                const choiceKey = `${this.currentSegment}_${moment.startMs}`;
                if (this.lastChoiceShown === choiceKey) {
                    return; // Don't show the same choice again
                }
                
                // Show choice only after the extended period (7s after original end)
                if (relativeTime >= (moment.endMs + 5000)) { // Show 5s before extended end
                    console.log('Choice timing:', {
                        segmentTime: relativeTime,
                        originalStart: moment.startMs,
                        originalEnd: moment.endMs,
                        extendedEnd: extendedEndMs,
                        showingAt: moment.endMs + 5000,
                        message: 'Video continued 7s longer, showing choice now'
                    });
                    
                    this.lastChoiceShown = choiceKey;
                    this.showChoices(moment);
                    break;
                }
            }
        }
    }
    
    showChoices(moment) {
        if (this.isChoiceActive) return;
        
        this.isChoiceActive = true;
        this.video.pause();
        
        console.log('Showing choices:', moment);
        
        // Clear previous choices
        this.choicesContainer.innerHTML = '';
        
        // Create choice buttons
        moment.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.style.cssText = `
                background: rgba(255, 255, 255, 0.9);
                color: #000;
                border: none;
                padding: 15px 30px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                border-radius: 5px;
                transition: all 0.3s ease;
                min-width: 200px;
                margin: 0 10px;
            `;
            
            button.addEventListener('click', () => this.makeChoice(index, moment));
            button.addEventListener('mouseenter', () => {
                this.selectedChoice = index;
                this.updateChoiceSelection();
            });
            
            this.choicesContainer.appendChild(button);
        });
        
        this.choicesContainer.style.display = 'flex';
        this.selectedChoice = 0;
        this.updateChoiceSelection();
        
        // Start timer
        this.startChoiceTimer(moment);
    }
    
    startChoiceTimer(moment) {
        let timeLeft = 10; // Default timeout
        this.timerElement.style.display = 'block';
        this.countdownElement.textContent = timeLeft;
        
        this.choiceTimeout = setInterval(() => {
            timeLeft--;
            this.countdownElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                this.makeChoice(0, moment); // Default to first choice
            }
        }, 1000);
    }
    
    updateChoiceSelection() {
        const buttons = this.choicesContainer.querySelectorAll('.choice-button');
        buttons.forEach((button, index) => {
            if (index === this.selectedChoice) {
                button.style.background = '#e50914';
                button.style.color = 'white';
                button.style.transform = 'scale(1.05)';
            } else {
                button.style.background = 'rgba(255, 255, 255, 0.9)';
                button.style.color = '#000';
                button.style.transform = 'scale(1)';
            }
        });
    }
    
    makeChoice(choiceIndex, moment) {
        if (!this.isChoiceActive) return;
        
        console.log('Choice made:', choiceIndex, moment.choices[choiceIndex]);
        
        // Clear timer
        if (this.choiceTimeout) {
            clearInterval(this.choiceTimeout);
            this.choiceTimeout = null;
        }
        
        // Record choice
        this.recordChoice(choiceIndex, moment);
        
        // Hide choice UI
        this.hideChoices();
        
        // Clear the last choice shown to prevent repetition
        this.lastChoiceShown = null;
        
        // Continue playback or jump to next segment
        this.handleChoiceAction(choiceIndex, moment);
    }
    
    recordChoice(choiceIndex, moment) {
        try {
            const choices = JSON.parse(this.ls.interactive_choices || '[]');
            choices.push({
                timestamp: this.video.currentTime,
                choice: choiceIndex,
                choiceId: moment.choices[choiceIndex].id,
                moment: moment.description
            });
            this.ls.interactive_choices = JSON.stringify(choices);
            
            // Update state
            this.state[moment.description] = moment.choices[choiceIndex].id;
            this.ls.interactive_state = JSON.stringify(this.state);
            
            // Send to server for analytics
            fetch(`/InteractiveVideo/Choice/${this.itemId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    choice: choiceIndex,
                    choiceId: moment.choices[choiceIndex].id,
                    timestamp: this.video.currentTime,
                    segment: this.currentSegment
                })
            }).catch(e => console.warn('Failed to send choice to server:', e));
            
        } catch (e) {
            console.warn('Failed to record choice:', e);
        }
    }
    
    hideChoices() {
        this.isChoiceActive = false;
        this.choicesContainer.style.display = 'none';
        this.timerElement.style.display = 'none';
    }
    
    handleChoiceAction(choiceIndex, moment) {
        const choiceId = moment.choices[choiceIndex].id;
        console.log('Handling choice action:', choiceId);
        
        // Find the segment that corresponds to this choice
        const targetSegment = this.findSegmentByChoiceId(choiceId);
        
        if (targetSegment) {
            console.log('Jumping to segment:', targetSegment);
            // Jump to the target segment
            const targetTimeSeconds = this.segmentMap[targetSegment].startTimeMs / 1000;
            this.video.currentTime = targetTimeSeconds;
            this.currentSegment = targetSegment;
            this.video.play();
        } else {
            console.warn('No target segment found for choice:', choiceId, 'continuing normal playback');
            // Just continue playing if no specific segment found
            this.video.play();
        }
    }
    
    findSegmentByChoiceId(choiceId) {
        // Look for a segment that matches this choice ID
        // First check if the choice ID is directly a segment ID
        if (this.segmentMap[choiceId]) {
            return choiceId;
        }
        
        // For the simplified metadata, we need to map choice IDs to segments
        // Based on the structure, let's create a simple mapping
        const choiceToSegmentMap = {
            '1R': '1E',  // Sugar Puffs -> segment 1E
            '1S': '1E',  // Frosties -> segment 1E (same path for cereal choice)
            '1H': '1H',  // Accept music -> segment 1H
            '1G': '1H',  // Decline music -> segment 1H (simplified)
            '8A': '8A',  // Accept -> segment 8A
            '1Qtt': '1Qtt', // Decline -> segment 1Qtt
            'nsg-LettersPACSChoice': '1Qtt', // PACS choice
            'nsg-WhiteBearChoice': '1Qtt',   // White Bear choice
            'nsg-ThrowThemChoice': '2B',     // Throw pills
            'nsg-FlushThemChoice3X': '2B'    // Flush pills
        };
        
        return choiceToSegmentMap[choiceId] || null;
    }
    
    onKeyPress(event) {
        // Handle keypress events (for character keys)
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
        }

        console.log('KeyPress event:', event.code, event.key);

        switch (event.code) {
            case 'KeyF':
            case 'KeyR':
            case 'KeyS':
            case 'Space':
                // These are handled in keydown to prevent conflicts
                event.preventDefault();
                break;
        }
    }

    onKeyDown(event) {
        // Handle keydown events (for all keys including arrows)
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
        }

        console.log('KeyDown event:', event.code, event.key);

        // Global controls (available anytime)
        switch (event.code) {
            case 'KeyF':
                this.toggleFullscreen();
                event.preventDefault();
                event.stopPropagation();
                break;
            case 'KeyR':
                this.restartVideo();
                event.preventDefault();
                event.stopPropagation();
                break;
            case 'KeyS':
                this.toggleSubtitles();
                event.preventDefault();
                event.stopPropagation();
                break;
            case 'Digit0':
                if (!this.isChoiceActive) {
                    // Reset speed to 1x
                    this.currentSpeedIndex = 3; // 1.0x is at index 3
                    this.video.playbackRate = this.speedSteps[this.currentSpeedIndex];
                    console.log('Playback speed reset to:', this.video.playbackRate);
                    this.showSpeedNotification(`${this.video.playbackRate}x (Reset)`);
                }
                event.preventDefault();
                event.stopPropagation();
                break;
            case 'Space':
                if (!this.isChoiceActive) {
                    this.video.paused ? this.video.play() : this.video.pause();
                }
                event.preventDefault();
                event.stopPropagation();
                break;
        }

        // Arrow key controls
        switch (event.key) {
            case 'ArrowLeft':
                if (this.isChoiceActive) {
                    this.selectedChoice = Math.max(0, this.selectedChoice - 1);
                    this.updateChoiceSelection();
                } else {
                    this.jumpBack();
                }
                event.preventDefault();
                event.stopPropagation();
                break;
            case 'ArrowRight':
                if (this.isChoiceActive) {
                    const maxChoice = this.choicesContainer.children.length - 1;
                    this.selectedChoice = Math.min(maxChoice, this.selectedChoice + 1);
                    this.updateChoiceSelection();
                } else {
                    this.jumpForward();
                }
                event.preventDefault();
                event.stopPropagation();
                break;
            case 'ArrowUp':
                if (!this.isChoiceActive) {
                    // Speed up playback using defined steps
                    this.currentSpeedIndex = Math.min(this.speedSteps.length - 1, this.currentSpeedIndex + 1);
                    this.video.playbackRate = this.speedSteps[this.currentSpeedIndex];
                    console.log('Playback speed increased to:', this.video.playbackRate);
                    this.showSpeedNotification(`${this.video.playbackRate}x`);
                }
                event.preventDefault();
                event.stopPropagation();
                break;
            case 'ArrowDown':
                if (!this.isChoiceActive) {
                    // Slow down playback using defined steps
                    this.currentSpeedIndex = Math.max(0, this.currentSpeedIndex - 1);
                    this.video.playbackRate = this.speedSteps[this.currentSpeedIndex];
                    console.log('Playback speed decreased to:', this.video.playbackRate);
                    this.showSpeedNotification(`${this.video.playbackRate}x`);
                }
                event.preventDefault();
                event.stopPropagation();
                break;
            case 'Enter':
                if (this.isChoiceActive) {
                    const currentMoment = this.getCurrentMoment();
                    if (currentMoment) {
                        this.makeChoice(this.selectedChoice, currentMoment);
                    }
                }
                event.preventDefault();
                event.stopPropagation();
                break;
        }
    }
    
    jumpForward() {
        const currentTimeMs = this.video.currentTime * 1000;
        const segmentId = this.getSegmentIdAtTime(currentTimeMs);
        
        if (!segmentId || !this.momentsBySegment[segmentId]) {
            // Jump to next segment if no moments in current segment
            this.jumpToNextSegment();
            return;
        }

        const moments = this.momentsBySegment[segmentId];
        const segmentStartTime = this.segmentMap[segmentId].startTimeMs;
        const relativeTime = currentTimeMs - segmentStartTime;
        
        // Find the earliest moment after current time
        let nextMomentTime = null;
        for (const moment of moments) {
            if (moment.startMs > relativeTime) {
                if (!nextMomentTime || moment.startMs < nextMomentTime) {
                    nextMomentTime = moment.startMs;
                }
            }
        }
        
        if (nextMomentTime !== null) {
            const targetTime = (segmentStartTime + nextMomentTime) / 1000;
            this.video.currentTime = targetTime;
            console.log('Jumped forward to next moment at', targetTime, 'seconds');
        } else {
            this.jumpToNextSegment();
        }
    }
    
    jumpBack() {
        const currentTimeMs = this.video.currentTime * 1000;
        const segmentId = this.getSegmentIdAtTime(currentTimeMs);
        
        if (!segmentId || !this.momentsBySegment[segmentId]) {
            // Jump to beginning of current segment
            const segment = this.segmentMap[segmentId];
            if (segment) {
                this.video.currentTime = segment.startTimeMs / 1000;
            }
            return;
        }

        const moments = this.momentsBySegment[segmentId];
        const segmentStartTime = this.segmentMap[segmentId].startTimeMs;
        const relativeTime = currentTimeMs - segmentStartTime;
        
        // Find the latest moment before current time
        let prevMomentTime = null;
        for (const moment of moments) {
            if (moment.startMs < relativeTime - 1000) { // 1 second buffer
                if (!prevMomentTime || moment.startMs > prevMomentTime) {
                    prevMomentTime = moment.startMs;
                }
            }
        }
        
        if (prevMomentTime !== null) {
            const targetTime = (segmentStartTime + prevMomentTime) / 1000;
            this.video.currentTime = targetTime;
            console.log('Jumped back to previous moment at', targetTime, 'seconds');
        } else {
            // Jump to beginning of current segment
            this.video.currentTime = segmentStartTime / 1000;
            console.log('Jumped to beginning of segment', segmentId);
        }
    }
    
    jumpToNextSegment() {
        // Simplified next segment logic
        const nextSegments = Object.keys(this.segmentMap);
        const currentIndex = nextSegments.indexOf(this.currentSegment);
        if (currentIndex >= 0 && currentIndex < nextSegments.length - 1) {
            const nextSegment = nextSegments[currentIndex + 1];
            const targetTime = this.segmentMap[nextSegment].startTimeMs / 1000;
            this.video.currentTime = targetTime;
            console.log('Jumped to next segment:', nextSegment);
        }
    }
    
    getCurrentMoment() {
        if (!this.currentSegment || !this.momentsBySegment[this.currentSegment]) {
            return null;
        }
        
        const moments = this.momentsBySegment[this.currentSegment];
        const segmentStartTime = this.segmentMap[this.currentSegment].startTimeMs;
        const relativeTime = (this.video.currentTime * 1000) - segmentStartTime;
        
        return moments.find(moment => 
            relativeTime >= moment.startMs && relativeTime <= moment.endMs
        );
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => 
                console.warn('Fullscreen failed:', e)
            );
        } else {
            document.exitFullscreen();
        }
    }
    
    restartVideo() {
        this.video.currentTime = 0;
        this.hideChoices();
        this.video.play();
    }
    
    onVideoEnded() {
        console.log('Video ended');
        // Could show ending statistics or restart options
    }
    
    showError(message) {
        console.error('Error:', message);
        
        if (!this.errorElement) {
            this.errorElement = document.createElement('div');
            this.errorElement.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: #e50914;
                padding: 20px;
                border-radius: 5px;
                font-size: 18px;
                text-align: center;
                z-index: 2000;
            `;
            document.body.appendChild(this.errorElement);
        }
        
        this.errorElement.textContent = message;
        this.errorElement.style.display = 'block';
        
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }
    
    // Utility methods for debugging
    getState() {
        return {
            currentTime: this.video?.currentTime,
            currentSegment: this.currentSegment,
            state: this.state,
            choices: JSON.parse(this.ls.interactive_choices || '[]'),
            segmentsSeen: JSON.parse(this.ls.interactive_segments_seen || '[]')
        };
    }
    
    reset() {
        if (confirm('Reset all choices and progress?')) {
            this.ls.interactive_state = JSON.stringify({});
            this.ls.interactive_choices = JSON.stringify([]);
            this.ls.interactive_segments_seen = JSON.stringify([]);
            this.state = {};
            this.restartVideo();
            console.log('Interactive state reset');
        }
    }
    
    toggleSubtitles() {
        console.log('Toggle subtitles called, tracks available:', this.video.textTracks.length);
        
        // Wait a moment if tracks are still loading
        if (this.video.textTracks.length === 0) {
            console.log('No subtitle tracks available yet, checking in 1 second...');
            setTimeout(() => {
                if (this.video.textTracks.length === 0) {
                    console.log('Still no subtitle tracks available');
                    this.showSubtitleNotification('No Subtitles Available');
                } else {
                    this.toggleSubtitles(); // Try again
                }
            }, 1000);
            return;
        }

        // Find currently active track
        let activeTrackIndex = -1;
        for (let i = 0; i < this.video.textTracks.length; i++) {
            if (this.video.textTracks[i].mode === 'showing') {
                activeTrackIndex = i;
                this.video.textTracks[i].mode = 'disabled';
                break;
            }
        }

        const nextIndex = (activeTrackIndex + 1) % (this.video.textTracks.length + 1);
        
        if (nextIndex < this.video.textTracks.length) {
            this.video.textTracks[nextIndex].mode = 'showing';
            console.log('Enabled subtitle track:', this.video.textTracks[nextIndex].label);
            this.showSubtitleNotification(`Subtitles: ${this.video.textTracks[nextIndex].label}`);
        } else {
            console.log('Subtitles disabled');
            this.showSubtitleNotification('Subtitles: Off');
        }
    }

    showSubtitleNotification(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            z-index: 3000;
            pointer-events: none;
        `;
        notification.textContent = message;
        
        // Add to video container
        const container = this.video.parentElement;
        container.appendChild(notification);
        
        // Remove after 2 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 2000);
    }

    showSpeedNotification(speed) {
        this.showSubtitleNotification(`Speed: ${speed}`);
    }
}

// Global functions for debugging
window.InteractivePlayer = JellyfinInteractivePlayer;
window.getPlayerState = function() {
    return window.player?.getState();
};
window.resetPlayer = function() {
    return window.player?.reset();
}; 