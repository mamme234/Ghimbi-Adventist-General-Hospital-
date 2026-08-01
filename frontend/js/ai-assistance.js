// ========== AI ASSISTANT ==========
class AIAssistant {
    constructor() {
        this.config = {
            apiEndpoint: 'https://ghimbi-adventist-general-hospital-1.onrender.com/api/ai',
            maxHistory: 50,
            autoScroll: true,
            typingSpeed: 20,
            responseDelay: 800
        };
        
        this.elements = {
            btn: document.getElementById('aiAssistantBtn'),
            modal: document.getElementById('aiChatModal'),
            close: document.getElementById('aiChatClose'),
            send: document.getElementById('aiChatSend'),
            input: document.getElementById('aiChatInput'),
            body: document.getElementById('aiChatBody')
        };
        
        this.state = {
            isOpen: false,
            isTyping: false,
            history: [],
            sessionId: this.generateSessionId(),
            messages: []
        };
        
        this.init();
    }
    
    init() {
        if (!this.elements.btn) return;
        
        this.setupEventListeners();
        this.addWelcomeMessage();
        this.setupKeyboardShortcuts();
        this.setupSocketConnection();
        
        console.log('🤖 AI Assistant initialized');
    }
    
    setupEventListeners() {
        // Toggle modal
        this.elements.btn.addEventListener('click', () => {
            this.toggleModal();
        });
        
        // Close modal
        if (this.elements.close) {
            this.elements.close.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        // Send message
        if (this.elements.send) {
            this.elements.send.addEventListener('click', () => {
                this.sendMessage();
            });
        }
        
        // Enter key
        if (this.elements.input) {
            this.elements.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
                
                // Shift+Enter for new line
                if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault();
                    this.insertNewLine();
                }
            });
            
            // Auto-resize textarea
            this.elements.input.addEventListener('input', () => {
                this.autoResizeInput();
            });
        }
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.state.isOpen && this.elements.modal) {
                if (!this.elements.modal.contains(e.target) && 
                    !this.elements.btn.contains(e.target)) {
                    this.closeModal();
                }
            }
        });
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isOpen) {
                this.closeModal();
            }
        });
    }
    
    toggleModal() {
        if (this.state.isOpen) {
            this.closeModal();
        } else {
            this.openModal();
        }
    }
    
    openModal() {
        if (!this.elements.modal) return;
        
        this.elements.modal.classList.add('active');
        this.state.isOpen = true;
        
        // Focus input
        setTimeout(() => {
            if (this.elements.input) {
                this.elements.input.focus();
            }
        }, 300);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Track analytics
        if (window.gtag) {
            gtag('event', 'ai_chat_open');
        }
    }
    
    closeModal() {
        if (!this.elements.modal) return;
        
        this.elements.modal.classList.remove('active');
        this.state.isOpen = false;
        
        // Clear typing indicator
        this.removeTypingIndicator();
    }
    
    async sendMessage() {
        const input = this.elements.input;
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Disable input
        input.disabled = true;
        this.state.isTyping = true;
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        this.autoResizeInput();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send to AI API
            const response = await this.getAIResponse(message);
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add AI response
            this.addMessage(response, 'bot');
            
            // Save to history
            this.saveToHistory(message, response);
            
        } catch (error) {
            console.error('AI Error:', error);
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Show error message
            this.addMessage(
                'I apologize, but I\'m having trouble connecting right now. ' +
                'Please try again in a moment or contact our support team directly.',
                'bot'
            );
        }
        
        // Enable input
        input.disabled = false;
        this.state.isTyping = false;
        input.focus();
    }
    
    async getAIResponse(message) {
        // If API is not available, use fallback responses
        if (this.config.apiEndpoint) {
            try {
                const response = await fetch(this.config.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Session-ID': this.state.sessionId
                    },
                    body: JSON.stringify({
                        message: message,
                        history: this.state.history,
                        context: this.getContext()
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.response || this.getFallbackResponse(message);
                }
            } catch (error) {
                console.warn('API request failed, using fallback:', error);
            }
        }
        
        // Fallback responses
        return this.getFallbackResponse(message);
    }
    
    getFallbackResponse(message) {
        const lower = message.toLowerCase();
        
        // Medical queries
        const medicalResponses = {
            'symptom': 'I can help with general information about symptoms. Please note that I am not a medical professional. For serious concerns, please consult a doctor.',
            'doctor': 'Our hospital has over 200 expert doctors across 30+ departments. Would you like to book an appointment?',
            'appointment': 'You can book an appointment through our website or by calling +251 911 234 567. We offer both in-person and telemedicine consultations.',
            'emergency': '🚑 For emergencies, call our emergency hotline: +251 911 234 567. Our ambulance service is available 24/7.',
            'pharmacy': 'Our pharmacy is open 24/7. You can check medicine availability and order refills online through the patient portal.',
            'laboratory': 'Our lab offers comprehensive diagnostic services with fast results. Tests can be booked online or at the hospital.',
            'radiology': 'We have state-of-the-art imaging equipment including MRI, CT scan, X-ray, and ultrasound services.',
            'insurance': 'We accept most major insurance plans. Please contact our finance department for details about coverage.',
            'payment': 'We offer multiple payment options including cash, credit cards, insurance, and mobile money.',
            'visiting': 'Visiting hours are from 8:00 AM to 8:00 PM. Please check with the reception for specific ward visiting times.',
            'location': 'We are located in Gimbi, Ethiopia. You can find us on Google Maps for directions.',
            'contact': 'You can reach us at +251 911 234 567 or info@gimbiadventist.com. We\'re here to help!'
        };
        
        // Check for keywords
        for (const [key, response] of Object.entries(medicalResponses)) {
            if (lower.includes(key)) {
                return response;
            }
        }
        
        // Greetings
        const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
        if (greetings.some(g => lower.includes(g))) {
            const timeGreeting = this.getTimeBasedGreeting();
            return `${timeGreeting} How can I assist you with your healthcare needs today?`;
        }
        
        // Thank you
        if (lower.includes('thank') || lower.includes('thanks')) {
            return 'You\'re welcome! Is there anything else I can help you with?';
        }
        
        // Goodbye
        if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('see you')) {
            return 'Goodbye! Take care of your health. Feel free to come back if you have any questions.';
        }
        
        // Default response
        return this.getDefaultResponse();
    }
    
    getDefaultResponse() {
        const responses = [
            'I appreciate your question. For specific medical information, please consult our healthcare professionals. How else can I assist you?',
            'That\'s a great question! I recommend speaking with one of our expert doctors for personalized advice. Can I help with anything else?',
            'I\'m here to provide general information about our hospital services. For medical advice, please consult a doctor. What would you like to know?',
            'Our team is dedicated to providing the best care possible. Is there something specific about our services you\'d like to learn about?',
            'Thank you for reaching out! I can help with appointments, department information, and general inquiries. What do you need?'
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    getTimeBasedGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning!';
        if (hour < 18) return 'Good afternoon!';
        return 'Good evening!';
    }
    
    getContext() {
        return {
            page: window.location.pathname,
            hospital: 'Gimbi Adventist General Hospital',
            version: '2027',
            userAgent: navigator.userAgent
        };
    }
    
    addMessage(text, type) {
        if (!this.elements.body) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ai-message-${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar';
        avatar.innerHTML = type === 'bot' 
            ? '<i class="fas fa-robot"></i>' 
            : '<i class="fas fa-user"></i>';
        
        const content = document.createElement('div');
        content.className = 'ai-message-content';
        content.innerHTML = text;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        // Add with animation
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(10px)';
        
        this.elements.body.appendChild(messageDiv);
        
        // Animate in
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });
        
        // Save to state
        this.state.messages.push({ type, text, timestamp: new Date() });
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        this.removeTypingIndicator();
        
        const indicator = document.createElement('div');
        indicator.className = 'ai-message ai-message-bot typing-indicator';
        indicator.id = 'typingIndicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        
        const content = document.createElement('div');
        content.className = 'ai-message-content';
        content.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        indicator.appendChild(avatar);
        indicator.appendChild(content);
        
        if (this.elements.body) {
            this.elements.body.appendChild(indicator);
            this.scrollToBottom();
        }
        
        // Add typing animation CSS
        const style = document.createElement('style');
        style.id = 'typingStyles';
        style.textContent = `
            .typing-dots {
                display: flex;
                gap: 4px;
                padding: 4px 0;
            }
            .typing-dots span {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--text-muted);
                animation: typingBounce 1.4s ease-in-out infinite;
            }
            .typing-dots span:nth-child(2) {
                animation-delay: 0.2s;
            }
            .typing-dots span:nth-child(3) {
                animation-delay: 0.4s;
            }
            @keyframes typingBounce {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                30% { transform: translateY(-8px); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
        
        const style = document.getElementById('typingStyles');
        if (style) {
            style.remove();
        }
    }
    
    addWelcomeMessage() {
        // Check if already added
        if (document.querySelector('.ai-message-bot')) {
            return;
        }
        
        const welcomeMessage = `
            👋 Hello! I'm your AI health assistant at Gimbi Adventist General Hospital.
            <br><br>
            I can help you with:
            <br>
            • 📋 Booking appointments
            <br>
            • 🏥 Department information
            <br>
            • 👨‍⚕️ Doctor inquiries
            <br>
            • 💊 Pharmacy services
            <br>
            • 🚑 Emergency assistance
            <br>
            • 📍 Hospital location and contact
            <br><br>
            <small>Please note: I provide informational support only and am not a substitute for professional medical advice.</small>
        `;
        
        this.addMessage(welcomeMessage, 'bot');
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt+A to toggle AI assistant
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                this.toggleModal();
            }
            
            // Ctrl+Enter to send message
            if (e.ctrlKey && e.key === 'Enter' && this.state.isOpen) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    setupSocketConnection() {
        // Setup real-time connection for AI responses
        // This will be used with Socket.IO for streaming responses
        if (typeof io !== 'undefined') {
            const socket = io('https://ghimbi-adventist-general-hospital-1.onrender.com');
            
            socket.on('connect', () => {
                console.log('🔌 AI Socket connected');
            });
            
            socket.on('ai_response', (data) => {
                if (data.sessionId === this.state.sessionId) {
                    // Handle streaming response
                }
            });
            
            socket.on('disconnect', () => {
                console.log('🔌 AI Socket disconnected');
            });
        }
    }
    
    scrollToBottom() {
        if (this.elements.body && this.config.autoScroll) {
            setTimeout(() => {
                this.elements.body.scrollTop = this.elements.body.scrollHeight;
            }, 50);
        }
    }
    
    autoResizeInput() {
        if (!this.elements.input) return;
        
        this.elements.input.style.height = 'auto';
        this.elements.input.style.height = Math.min(this.elements.input.scrollHeight, 120) + 'px';
    }
    
    insertNewLine() {
        if (!this.elements.input) return;
        
        const start = this.elements.input.selectionStart;
        const end = this.elements.input.selectionEnd;
        const value = this.elements.input.value;
        
        this.elements.input.value = value.substring(0, start) + '\n' + value.substring(end);
        this.elements.input.selectionStart = this.elements.input.selectionEnd = start + 1;
        
        this.autoResizeInput();
    }
    
    saveToHistory(userMessage, aiResponse) {
        this.state.history.push({
            user: userMessage,
            ai: aiResponse,
            timestamp: new Date()
        });
        
        // Keep history limited
        if (this.state.history.length > this.config.maxHistory) {
            this.state.history = this.state.history.slice(-this.config.maxHistory);
        }
        
        // Save to localStorage
        try {
            localStorage.setItem('ai_chat_history', JSON.stringify(this.state.history));
        } catch (error) {
            // Storage full or unavailable
        }
    }
    
    loadHistory() {
        try {
            const saved = localStorage.getItem('ai_chat_history');
            if (saved) {
                this.state.history = JSON.parse(saved);
            }
        } catch (error) {
            // Invalid JSON or storage unavailable
        }
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    clearHistory() {
        this.state.history = [];
        localStorage.removeItem('ai_chat_history');
        
        // Clear messages
        if (this.elements.body) {
            this.elements.body.innerHTML = '';
        }
        
        this.addWelcomeMessage();
    }
    
    // Analytics tracking
    trackEvent(eventName, data = {}) {
        if (window.gtag) {
            gtag('event', eventName, {
                ...data,
                'ai_session': this.state.sessionId
            });
        }
    }
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AIAssistant();
});

// ========== EXPORT ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAssistant;
                                                 }
