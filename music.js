class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio');
        this.playBtn = document.getElementById('play-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.repeatBtn = document.getElementById('repeat-btn');
        this.progressBar = document.querySelector('.progress-bar');
        this.progress = document.getElementById('progress');
        this.currentTime = document.getElementById('current-time');
        this.duration = document.getElementById('duration');
        this.volumeSlider = document.getElementById('volume-slider');
        this.playlist = document.getElementById('playlist');
        this.searchInput = document.getElementById('search-input');
        this.currentTitle = document.getElementById('current-title');
        this.currentArtist = document.getElementById('current-artist');
        
        this.songs = [];
        this.currentSongIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
        
        this.init();
    }
    
    async init() {
        await this.loadSongs();
        this.setupEventListeners();
        this.renderPlaylist();
        this.setVolume(50);
    }
    
    async loadSongs() {
        try {
            const response = await fetch('music.json');
            this.songs = await response.json();
        } catch (error) {
            console.error('Error loading songs:', error);
            this.songs = [];
        }
    }
    
    setupEventListeners() {
        // Play/Pause button
        this.playBtn.addEventListener('click', () => this.togglePlay());
        
        // Previous/Next buttons
        this.prevBtn.addEventListener('click', () => this.previousSong());
        this.nextBtn.addEventListener('click', () => this.nextSong());
        
        // Shuffle button
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        
        // Repeat button
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        
        // Progress bar
        this.progressBar.addEventListener('click', (e) => this.setProgress(e));
        
        // Volume slider
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        
        // Search input
        this.searchInput.addEventListener('input', (e) => this.searchSongs(e.target.value));
        
        // Audio events with better error handling
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('error', (e) => this.handleAudioError(e));
        this.audio.addEventListener('canplay', () => this.handleCanPlay());
        this.audio.addEventListener('loadstart', () => this.handleLoadStart());
        
        // Add ripple effect to buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', this.createRippleEffect.bind(this));
        });
        
        // Add sparkle effect on song change
        this.audio.addEventListener('play', () => this.addSparkleEffect());
        this.audio.addEventListener('pause', () => this.removeSparkleEffect());
    }
    
    createRippleEffect(e) {
        const button = e.currentTarget;
        const ripple = button.querySelector('.btn-ripple');
        
        // Reset ripple
        ripple.style.width = '0';
        ripple.style.height = '0';
        
        // Trigger ripple animation
        setTimeout(() => {
            ripple.style.width = '100px';
            ripple.style.height = '100px';
        }, 10);
        
        // Reset after animation
        setTimeout(() => {
            ripple.style.width = '0';
            ripple.style.height = '0';
        }, 300);
    }
    
    addSparkleEffect() {
        const songImage = document.querySelector('.song-image');
        songImage.classList.add('playing-animation');
        
        // Add extra sparkles during playback
        this.sparkleInterval = setInterval(() => {
            this.createFloatingSparkle();
        }, 2000);
    }
    
    removeSparkleEffect() {
        const songImage = document.querySelector('.song-image');
        songImage.classList.remove('playing-animation');
        
        if (this.sparkleInterval) {
            clearInterval(this.sparkleInterval);
        }
    }
    
    createFloatingSparkle() {
        const container = document.querySelector('.player-container');
        const sparkle = document.createElement('div');
        sparkle.className = 'floating-sparkle';
        sparkle.innerHTML = '✨';
        
        // Random position
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.animationDuration = (Math.random() * 2 + 1) + 's';
        
        container.appendChild(sparkle);
        
        // Remove after animation
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 3000);
    }
    
    renderPlaylist(songsToRender = this.songs) {
        this.playlist.innerHTML = '';
        songsToRender.forEach((song, index) => {
            const songItem = document.createElement('div');
            songItem.className = 'song-item';
            songItem.style.animationDelay = (index * 0.05) + 's';
            songItem.innerHTML = `
                <span class="song-number">${index + 1}</span>
                <span class="song-title">${this.formatSongTitle(song)}</span>
                <span class="song-duration">--:--</span>
            `;
            
            // Add hover effects
            songItem.addEventListener('mouseenter', () => {
                if (!songItem.classList.contains('active')) {
                    songItem.style.transform = 'translateX(8px) scale(1.02)';
                }
            });
            
            songItem.addEventListener('mouseleave', () => {
                if (!songItem.classList.contains('active')) {
                    songItem.style.transform = 'translateX(0) scale(1)';
                }
            });
            
            // Click handler with preventDefault to avoid download
            songItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const originalIndex = this.songs.indexOf(song);
                this.playSong(originalIndex);
                this.addClickEffect(songItem);
                
                // Auto-play when song is selected
                if (!this.isPlaying) {
                    setTimeout(() => {
                        this.togglePlay();
                    }, 100);
                }
            });
            
            this.playlist.appendChild(songItem);
        });
    }
    
    addClickEffect(element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = 'translateX(5px) scale(1)';
        }, 100);
    }
    
    formatSongTitle(filename) {
        // Remove .mp3 extension and decode Unicode characters
        let title = filename.replace('.mp3', '');
        try {
            title = decodeURIComponent(JSON.parse('"' + title.replace(/\\/g, '\\\\') + '"'));
        } catch (e) {
            // If decoding fails, return original
        }
        return title.length > 60 ? title.substring(0, 60) + '...' : title;
    }
    
    playSong(index) {
        if (index < 0 || index >= this.songs.length) return;
        
        this.currentSongIndex = index;
        const song = this.songs[index];
        
        // Stop current playback
        this.audio.pause();
        this.audio.currentTime = 0;
        
        // Set new source with proper encoding
        this.audio.src = `music/${song}`;
        this.audio.load(); // Force reload of the audio element
        
        this.updateCurrentSongInfo(song);
        this.updateActivePlaylistItem();
        
        // Auto-play if currently playing
        if (this.isPlaying) {
            this.audio.play().catch(e => {
                console.error('Error playing:', e);
                this.handleError();
            });
        }
    }
    
    updateCurrentSongInfo(song) {
        const title = this.formatSongTitle(song);
        this.currentTitle.textContent = `🎵 ${title} 🎵`;
        this.currentArtist.textContent = `🎤 ${this.extractArtist(title)} 🎤`;
        
        // Add text animation
        this.currentTitle.style.animation = 'none';
        this.currentArtist.style.animation = 'none';
        
        setTimeout(() => {
            this.currentTitle.style.animation = 'textGlow 2s ease-in-out infinite alternate';
            this.currentArtist.style.animation = 'fadeIn 2s ease-in';
        }, 10);
    }
    
    extractArtist(title) {
        // Try to extract artist from title (simple heuristic)
        const parts = title.split(' - ');
        if (parts.length > 1) {
            return parts[0];
        }
        return '🎅 Nghệ sĩ không xác định 🎅';
    }
    
    updateActivePlaylistItem() {
        document.querySelectorAll('.song-item').forEach((item, index) => {
            const isActive = index === this.currentSongIndex;
            item.classList.toggle('active', isActive);
            
            if (isActive) {
                // Scroll to active item
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Add pulse effect
                item.style.animation = 'activeGlow 2s ease-in-out infinite alternate';
            } else {
                item.style.animation = 'slideInLeft 0.5s ease-out';
            }
        });
    }
    
    togglePlay() {
        if (this.songs.length === 0) return;
        
        if (this.isPlaying) {
            this.audio.pause();
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
            this.isPlaying = false;
        } else {
            // If no song is loaded, load the first song
            if (!this.audio.src || this.audio.src === window.location.href) {
                this.playSong(0);
            }
            
            // Ensure audio is loaded before playing
            if (this.audio.readyState >= 2) { // HAVE_CURRENT_DATA
                this.playAudio();
            } else {
                // Wait for audio to be ready
                this.audio.addEventListener('canplay', this.playAudio.bind(this), { once: true });
            }
        }
    }
    
    playAudio() {
        this.audio.play().then(() => {
            this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.isPlaying = true;
        }).catch(e => {
            console.error('Error playing audio:', e);
            this.handleError();
        });
    }
    
    previousSong() {
        let newIndex = this.currentSongIndex - 1;
        if (newIndex < 0) {
            newIndex = this.songs.length - 1;
        }
        this.playSong(newIndex);
    }
    
    nextSong() {
        let newIndex;
        if (this.isShuffled) {
            newIndex = Math.floor(Math.random() * this.songs.length);
        } else {
            newIndex = this.currentSongIndex + 1;
            if (newIndex >= this.songs.length) {
                newIndex = 0;
            }
        }
        this.playSong(newIndex);
    }
    
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn.classList.toggle('active-buttons', this.isShuffled);
    }
    
    toggleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        
        switch (this.repeatMode) {
            case 0:
                this.repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
                this.repeatBtn.classList.remove('active-buttons');
                break;
            case 1:
                this.repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
                this.repeatBtn.classList.add('active-buttons');
                break;
            case 2:
                this.repeatBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
                this.repeatBtn.classList.add('active-buttons');
                break;
        }
    }
    
    setProgress(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.audio.duration;
    }
    
    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progress.style.width = percent + '%';
            this.currentTime.textContent = this.formatTime(this.audio.currentTime);
        }
    }
    
    updateDuration() {
        this.duration.textContent = this.formatTime(this.audio.duration);
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    setVolume(value) {
        this.audio.volume = value / 100;
        this.volumeSlider.value = value;
    }
    
    handleSongEnd() {
        if (this.repeatMode === 2) {
            // Repeat current song
            this.audio.currentTime = 0;
            this.audio.play();
        } else if (this.repeatMode === 1 || this.currentSongIndex < this.songs.length - 1) {
            // Repeat all or not last song
            this.nextSong();
        } else {
            // Stop playing
            this.isPlaying = false;
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    handleError() {
        console.error('Error loading audio file');
        this.currentTitle.textContent = '🎄 Lỗi phát nhạc 🎄';
        this.currentArtist.textContent = '❄️ Không thể tải file ❄️';
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    
    handleLoadStart() {
        // Show loading state
        this.currentTitle.textContent = '🎵 Đang tải bài hát... 🎵';
    }
    
    handleCanPlay() {
        // Audio is ready to play
        console.log('Audio ready to play');
    }
    
    handleAudioError(e) {
        console.error('Audio error:', e);
        const error = this.audio.error;
        if (error) {
            switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                    console.error('Audio loading aborted');
                    break;
                case error.MEDIA_ERR_NETWORK:
                    console.error('Network error while loading audio');
                    break;
                case error.MEDIA_ERR_DECODE:
                    console.error('Audio decoding error');
                    break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    console.error('Audio format not supported');
                    break;
                default:
                    console.error('Unknown audio error');
                    break;
            }
        }
        this.handleError();
    }
    
    searchSongs(query) {
        const filteredSongs = this.songs.filter(song => 
            this.formatSongTitle(song).toLowerCase().includes(query.toLowerCase())
        );
        this.renderPlaylist(filteredSongs);
    }
}

// Add floating sparkle CSS
const sparkleCSS = `
.floating-sparkle {
    position: absolute;
    font-size: 1.2em;
    pointer-events: none;
    animation: floatingSparkle 3s ease-out forwards;
    z-index: 10;
}

@keyframes floatingSparkle {
    0% {
        opacity: 1;
        transform: translateY(0) rotate(0deg) scale(1);
    }
    100% {
        opacity: 0;
        transform: translateY(-100px) rotate(360deg) scale(0.5);
    }
}

.playing-animation {
    animation: pulse 2s ease-in-out infinite alternate, 
               rotate 10s linear infinite, 
               playingGlow 1s ease-in-out infinite alternate !important;
}

@keyframes playingGlow {
    from { 
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    }
    to { 
        box-shadow: 0 8px 25px rgba(0,0,0,0.3), 
                    0 0 30px rgba(255,107,107,0.5),
                    0 0 50px rgba(78, 205, 196, 0.3);
    }
}
`;

// Inject additional CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = sparkleCSS;
document.head.appendChild(styleSheet);

// Initialize the music player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});
