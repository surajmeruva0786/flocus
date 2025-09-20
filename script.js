// Study Timer App
class StudyTimer {
    constructor() {
        this.timer = null;
        this.timeRemaining = 0;
        this.totalTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.sessionStartTime = null;
        this.currentSessionTime = 0;
        
        // DOM elements
        this.hoursInput = document.getElementById('hours');
        this.minutesInput = document.getElementById('minutes');
        this.displayTime = document.getElementById('display-time');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.sessionStatus = document.getElementById('session-status');
        this.currentSessionDisplay = document.getElementById('current-session-time');
        this.progressRing = document.querySelector('.progress-ring-progress');
        
        // Analytics elements
        this.todayTime = document.getElementById('today-time');
        this.weekTime = document.getElementById('week-time');
        this.totalSessions = document.getElementById('total-sessions');
        this.avgSession = document.getElementById('avg-session');
        this.dailyChart = document.getElementById('daily-chart');
        this.sessionsList = document.getElementById('sessions-list');
        
        // Audio context for alarm
        this.audioContext = null;
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateAnalytics();
        this.setupAudio();
        
        // Update session time every second
        setInterval(() => {
            if (this.sessionStartTime) {
                this.currentSessionTime = Date.now() - this.sessionStartTime;
                this.updateSessionDisplay();
            }
        }, 1000);
    }
    
    setupEventListeners() {
        // Timer controls
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.stopBtn.addEventListener('click', () => this.stopTimer());
        
        // Time input changes
        this.hoursInput.addEventListener('change', () => {
            this.updateTimerSettings();
            this.saveSettings();
        });
        this.minutesInput.addEventListener('change', () => {
            this.updateTimerSettings();
            this.saveSettings();
        });
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Data management
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('clear-data').addEventListener('click', () => this.clearData());
    }
    
    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    updateTimerSettings() {
        if (!this.isRunning) {
            const hours = parseInt(this.hoursInput.value) || 0;
            const minutes = parseInt(this.minutesInput.value) || 1;
            this.totalTime = (hours * 60 + minutes) * 60;
            this.timeRemaining = this.totalTime;
            this.updateDisplay();
            this.updateProgressRing();
        }
    }
    
    startTimer() {
        if (!this.isPaused) {
            // Starting new timer
            const hours = parseInt(this.hoursInput.value) || 0;
            const minutes = parseInt(this.minutesInput.value) || 1;
            this.totalTime = (hours * 60 + minutes) * 60;
            this.timeRemaining = this.totalTime;
            this.sessionStartTime = Date.now();
            this.currentSessionTime = 0;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            this.updateProgressRing();
            
            if (this.timeRemaining <= 0) {
                this.completeTimer();
            }
        }, 1000);
        
        this.updateControls();
        this.sessionStatus.textContent = 'Timer running...';
    }
    
    pauseTimer() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = true;
        this.updateControls();
        this.sessionStatus.textContent = 'Timer paused';
    }
    
    stopTimer() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;
        
        // Save partial session if any time was spent
        if (this.sessionStartTime && this.currentSessionTime > 30000) { // At least 30 seconds
            this.saveSession(Math.floor(this.currentSessionTime / 1000));
        }
        
        this.resetTimer();
        this.updateControls();
        this.sessionStatus.textContent = 'Timer stopped';
        this.sessionStartTime = null;
        this.currentSessionTime = 0;
        this.updateSessionDisplay();
    }
    
    completeTimer() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;
        
        // Save completed session
        this.saveSession(this.totalTime);
        
        // Play alarm
        this.playAlarm();
        
        this.resetTimer();
        this.updateControls();
        this.sessionStatus.textContent = 'Session completed! Great job! 🎉';
        this.sessionStartTime = null;
        this.currentSessionTime = 0;
        this.updateSessionDisplay();
        this.updateAnalytics();
        
        // Show celebration message
        setTimeout(() => {
            this.sessionStatus.textContent = 'Ready to start';
        }, 5000);
    }
    
    resetTimer() {
        const hours = parseInt(this.hoursInput.value) || 0;
        const minutes = parseInt(this.minutesInput.value) || 1;
        this.totalTime = (hours * 60 + minutes) * 60;
        this.timeRemaining = this.totalTime;
        this.updateDisplay();
        this.updateProgressRing();
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.displayTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateSessionDisplay() {
        const sessionMinutes = Math.floor(this.currentSessionTime / 60000);
        const sessionSeconds = Math.floor((this.currentSessionTime % 60000) / 1000);
        this.currentSessionDisplay.textContent = `Session time: ${sessionMinutes}:${sessionSeconds.toString().padStart(2, '0')}`;
    }
    
    updateProgressRing() {
        const circumference = 2 * Math.PI * 110; // radius = 110
        const progress = this.totalTime > 0 ? (this.totalTime - this.timeRemaining) / this.totalTime : 0;
        const offset = circumference - (progress * circumference);
        this.progressRing.style.strokeDashoffset = offset;
    }
    
    updateControls() {
        this.startBtn.disabled = this.isRunning;
        this.pauseBtn.disabled = !this.isRunning;
        this.stopBtn.disabled = !this.isRunning && !this.isPaused;
        
        this.hoursInput.disabled = this.isRunning || this.isPaused;
        this.minutesInput.disabled = this.isRunning || this.isPaused;
    }
    
    playAlarm() {
        if (!this.audioContext) return;
        
        this.playBeepSequence(3); // Play 3 beeps
    }
    
    playBeepSequence(count) {
        if (count <= 0) return;
        
        try {
            // Resume audio context if needed (modern browsers require user gesture)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Create a simple beep sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 800; // 800 Hz
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
            
            // Schedule next beep if more remaining
            if (count > 1) {
                setTimeout(() => this.playBeepSequence(count - 1), 600);
            }
        } catch (e) {
            console.log('Could not play alarm sound');
        }
    }
    
    saveSession(duration) {
        const sessions = this.getSessions();
        const session = {
            date: new Date().toISOString(),
            duration: duration, // in seconds
            completed: duration === this.totalTime
        };
        
        sessions.push(session);
        localStorage.setItem('studyTimerSessions', JSON.stringify(sessions));
    }
    
    getSessions() {
        try {
            return JSON.parse(localStorage.getItem('studyTimerSessions') || '[]');
        } catch (e) {
            return [];
        }
    }
    
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('studyTimerSettings') || '{}');
            this.hoursInput.value = settings.hours || 0;
            this.minutesInput.value = settings.minutes || 25;
        } catch (e) {
            this.hoursInput.value = 0;
            this.minutesInput.value = 25;
        }
        this.updateTimerSettings();
    }
    
    saveSettings() {
        const settings = {
            hours: parseInt(this.hoursInput.value) || 0,
            minutes: parseInt(this.minutesInput.value) || 1
        };
        localStorage.setItem('studyTimerSettings', JSON.stringify(settings));
    }
    
    switchTab(tab) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update sections
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.getElementById(`${tab}-section`).classList.add('active');
        
        if (tab === 'analytics') {
            this.updateAnalytics();
        }
    }
    
    updateAnalytics() {
        const sessions = this.getSessions();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Calculate today's time
        const todaySessions = sessions.filter(session => 
            new Date(session.date) >= today
        );
        const todayTime = todaySessions.reduce((total, session) => total + session.duration, 0);
        
        // Calculate week's time
        const weekSessions = sessions.filter(session => 
            new Date(session.date) >= weekAgo
        );
        const weekTime = weekSessions.reduce((total, session) => total + session.duration, 0);
        
        // Calculate total completed sessions
        const completedSessions = sessions.filter(session => session.completed);
        
        // Calculate average session length
        const avgDuration = completedSessions.length > 0 
            ? completedSessions.reduce((total, session) => total + session.duration, 0) / completedSessions.length
            : 0;
        
        // Update display
        this.todayTime.textContent = this.formatTime(todayTime);
        this.weekTime.textContent = this.formatTime(weekTime);
        this.totalSessions.textContent = completedSessions.length;
        this.avgSession.textContent = this.formatDuration(avgDuration);
        
        // Update charts
        this.updateDailyChart(sessions);
        this.updateSessionsList(sessions);
    }
    
    updateDailyChart(sessions) {
        const chartData = [];
        const today = new Date();
        
        // Get data for last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            
            const daySessions = sessions.filter(session => {
                const sessionDate = new Date(session.date);
                return sessionDate >= dayStart && sessionDate < dayEnd;
            });
            
            const dayTime = daySessions.reduce((total, session) => total + session.duration, 0);
            
            chartData.push({
                date: dayStart,
                time: dayTime,
                label: dayStart.toLocaleDateString('en-US', { weekday: 'short' })
            });
        }
        
        // Find max time for scaling
        const maxTime = Math.max(...chartData.map(d => d.time), 1);
        
        // Create chart bars
        this.dailyChart.innerHTML = '';
        chartData.forEach(data => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            const height = (data.time / maxTime) * 150; // Max height 150px
            bar.style.height = `${Math.max(height, 2)}px`;
            
            const label = document.createElement('div');
            label.className = 'chart-bar-label';
            label.textContent = data.label;
            
            const value = document.createElement('div');
            value.className = 'chart-bar-value';
            value.textContent = this.formatDuration(data.time);
            
            bar.appendChild(label);
            bar.appendChild(value);
            this.dailyChart.appendChild(bar);
        });
    }
    
    updateSessionsList(sessions) {
        // Show last 10 sessions
        const recentSessions = sessions.slice(-10).reverse();
        
        this.sessionsList.innerHTML = '';
        
        if (recentSessions.length === 0) {
            this.sessionsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No study sessions yet. Start your first timer!</p>';
            return;
        }
        
        recentSessions.forEach(session => {
            const item = document.createElement('div');
            item.className = 'session-item';
            
            const date = new Date(session.date);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            item.innerHTML = `
                <span class="session-date">${dateStr}</span>
                <span class="session-duration">${this.formatDuration(session.duration)}${session.completed ? ' ✓' : ' (partial)'}</span>
            `;
            
            this.sessionsList.appendChild(item);
        });
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
    
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        }
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes}m`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
    
    exportData() {
        const data = {
            sessions: this.getSessions(),
            settings: JSON.parse(localStorage.getItem('studyTimerSettings') || '{}'),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `study-timer-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    clearData() {
        if (confirm('Are you sure you want to clear all study data? This cannot be undone.')) {
            localStorage.removeItem('studyTimerSessions');
            localStorage.removeItem('studyTimerSettings');
            
            // Reset to defaults
            this.hoursInput.value = 0;
            this.minutesInput.value = 25;
            this.updateTimerSettings();
            this.updateAnalytics();
            
            alert('All data has been cleared.');
        }
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    new StudyTimer();
});

