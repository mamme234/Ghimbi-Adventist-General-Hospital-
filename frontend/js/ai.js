// ============================================
   AI ASSISTANT MODULE - Complete
// ============================================

class AIAssistant {
    constructor(options = {}) {
        this.apiKey = options.apiKey || null;
        this.apiUrl = options.apiUrl || '/api/ai';
        this.model = options.model || 'gpt-3.5-turbo';
        this.context = [];
        this.maxContextLength = options.maxContextLength || 10;
        this.isProcessing = false;
        this.onResponse = options.onResponse || null;
        this.onError = options.onError || null;
        
        // Medical knowledge base
        this.knowledgeBase = this.initKnowledgeBase();
    }

    // ============================================
    // INITIALIZE KNOWLEDGE BASE
    // ============================================
    
    initKnowledgeBase() {
        return {
            // Common medical conditions
            conditions: {
                'headache': {
                    description: 'Headache is pain in any region of the head.',
                    causes: ['Tension', 'Migraine', 'Sinusitis', 'Dehydration', 'Eye strain'],
                    advice: 'Rest in a quiet room, stay hydrated, avoid bright lights.',
                    emergency: 'Seek immediate help if headache is sudden, severe, or accompanied by confusion, fever, or neck stiffness.'
                },
                'fever': {
                    description: 'Fever is a temporary increase in body temperature.',
                    causes: ['Infection', 'Inflammation', 'Heat exhaustion'],
                    advice: 'Rest, stay hydrated, take paracetamol if temperature is high.',
                    emergency: 'Seek immediate help if fever is above 104°F (40°C) or lasts more than 3 days.'
                },
                'chest pain': {
                    description: 'Chest pain can be a sign of serious conditions.',
                    causes: ['Heart attack', 'Angina', 'Anxiety', 'Costochondritis'],
                    advice: 'Seek immediate medical attention. Do not wait.',
                    emergency: 'CALL EMERGENCY SERVICES IMMEDIATELY! This could be a heart attack.'
                },
                'shortness of breath': {
                    description: 'Difficulty breathing or feeling unable to get enough air.',
                    causes: ['Asthma', 'COPD', 'Anxiety', 'Heart failure', 'Infection'],
                    advice: 'Seek medical attention if persistent or severe.',
                    emergency: 'CALL EMERGENCY SERVICES if sudden, severe, or with chest pain.'
                }
            },
            // Departments
            departments: {
                'cardiology': 'Heart and cardiovascular system.',
                'neurology': 'Brain and nervous system.',
                'orthopedics': 'Bones and joints.',
                'pediatrics': 'Children\'s health.',
                'gynecology': 'Women\'s health.',
                'radiology': 'Medical imaging.',
                'emergency': 'Urgent care.',
                'dermatology': 'Skin conditions.',
                'ophthalmology': 'Eye care.',
                'dentistry': 'Dental care.'
            }
        };
    }

    // ============================================
    // PROCESS QUERY
    // ============================================
    
    async processQuery(query) {
        if (this.isProcessing) {
            return { error: 'Already processing a query' };
        }

        if (!query || query.trim().length === 0) {
            return { error: 'Please enter a question' };
        }

        this.isProcessing = true;

        try {
            // Check knowledge base first for quick responses
            const kbResponse = this.checkKnowledgeBase(query);
            if (kbResponse) {
                this.isProcessing = false;
                return kbResponse;
            }

            // If no KB match, use AI API
            const response = await this.queryAI(query);
            this.isProcessing = false;
            
            // Add to context
            this.addToContext(query, response);
            
            return response;
        } catch (error) {
            this.isProcessing = false;
            console.error('AI Error:', error);
            if (this.onError) {
                this.onError(error);
            }
            return {
                error: 'Sorry, I encountered an error. Please try again.',
                fallback: true
            };
        }
    }

    // ============================================
    // KNOWLEDGE BASE CHECK
    // ============================================
    
    checkKnowledgeBase(query) {
        const lowerQuery = query.toLowerCase();
        
        // Check for conditions
        for (const [condition, data] of Object.entries(this.knowledgeBase.conditions)) {
            if (lowerQuery.includes(condition)) {
                return {
                    type: 'condition',
                    condition: condition,
                    data: data,
                    response: this.formatConditionResponse(condition, data)
                };
            }
        }

        // Check for department queries
        if (lowerQuery.includes('department') || lowerQuery.includes('which department')) {
            for (const [dept, desc] of Object.entries(this.knowledgeBase.departments)) {
                if (lowerQuery.includes(dept)) {
                    return {
                        type: 'department',
                        department: dept,
                        response: `The ${dept} department specializes in ${desc}.`
                    };
                }
            }
        }

        // Check for emergency
        if (this.isEmergencyQuery(lowerQuery)) {
            return {
                type: 'emergency',
                response: '⚠️ This appears to be a medical emergency. Please call emergency services (911) immediately or visit the nearest emergency room. Do not wait for online advice.'
            };
        }

        // Check for appointment help
        if (lowerQuery.includes('appointment') || lowerQuery.includes('book')) {
            return {
                type: 'appointment',
                response: 'You can book an appointment through our online booking system at appointments.html, or call us at +251 911 234 567 for assistance.'
            };
        }

        // Check for visiting hours
        if (lowerQuery.includes('visiting') || lowerQuery.includes('visitor')) {
            return {
                type: 'visiting',
                response: 'Hospital visiting hours are from 9:00 AM to 8:00 PM daily. ICU visiting hours are from 4:00 PM to 6:00 PM. Please check with the department for specific restrictions.'
            };
        }

        return null;
    }

    // ============================================
    // QUERY AI API
    // ============================================
    
    async queryAI(query) {
        // Build context
        const contextMessages = this.buildContext();

        const messages = [
            {
                role: 'system',
                content: 'You are a helpful medical assistant for MediCare Hospital. Provide accurate, helpful, and professional responses. Always include a disclaimer that you are an AI assistant and users should consult healthcare professionals for medical decisions. Keep responses concise and informative.'
            },
            ...contextMessages,
            {
                role: 'user',
                content: query
            }
        ];

        if (this.apiKey) {
            // Use OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return {
                type: 'ai',
                response: data.choices[0].message.content,
                raw: data
            };
        } else {
            // Use local API
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messages,
                    query: query
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            return {
                type: 'ai',
                response: data.response || data.message || 'I understand. Let me help you with that.',
                raw: data
            };
        }
    }

    // ============================================
    // CONTEXT MANAGEMENT
    // ============================================
    
    addToContext(query, response) {
        this.context.push({
            query: query,
            response: response.response || response.message || response
        });

        // Keep context within limit
        if (this.context.length > this.maxContextLength) {
            this.context.shift();
        }
    }

    buildContext() {
        return this.context.map(item => [
            {
                role: 'user',
                content: item.query
            },
            {
                role: 'assistant',
                content: typeof item.response === 'string' ? item.response : item.response.response || item.response.message || 'OK'
            }
        ]).flat();
    }

    // ============================================
    // UTILITY METHODS
    // ============================================
    
    formatConditionResponse(condition, data) {
        let response = `**${condition.charAt(0).toUpperCase() + condition.slice(1)}**\n\n`;
        response += `📋 **Description:** ${data.description}\n\n`;
        response += `🔍 **Common causes:** ${data.causes.join(', ')}\n\n`;
        response += `💡 **Advice:** ${data.advice}\n\n`;
        if (data.emergency) {
            response += `🚨 **⚠️ ${data.emergency}**`;
        }
        return response;
    }

    isEmergencyQuery(query) {
        const emergencyKeywords = [
            'emergency', 'urgent', 'immediate', 'calling 911',
            'can\'t breathe', 'severe pain', 'unconscious',
            'not breathing', 'heart attack', 'stroke',
            'bleeding heavily', 'suicide', 'overdose'
        ];
        
        return emergencyKeywords.some(keyword => query.includes(keyword));
    }

    // ============================================
    // SMART SEARCH
    // ============================================
    
    async smartSearch(query, options = {}) {
        try {
            const response = await this.processQuery(query);
            
            if (response.error) {
                return {
                    results: [],
                    suggestion: response.error,
                    fallback: response.fallback || false
                };
            }

            // Parse response for structured results
            const results = this.parseSearchResults(response);
            
            return {
                results: results,
                suggestion: response.response || response.message || '',
                type: response.type || 'general'
            };
        } catch (error) {
            console.error('Smart search error:', error);
            return {
                results: [],
                suggestion: 'I couldn\'t process your search. Please try again.',
                fallback: true
            };
        }
    }

    parseSearchResults(response) {
        const text = response.response || response.message || '';
        const results = [];
        
        // Extract potential search results
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.trim() && (line.includes('•') || line.includes('-') || line.match(/^\d+\./))) {
                results.push({
                    text: line.replace(/^[•\-]\s*/, '').replace(/^\d+\.\s*/, ''),
                    type: 'suggestion'
                });
            }
        }
        
        return results;
    }

    // ============================================
    // MEDICAL TERM EXPLANATION
    // ============================================
    
    async explainTerm(term) {
        const query = `Please explain the medical term "${term}" in simple language.`;
        return await this.processQuery(query);
    }

    // ============================================
    // SUGGEST DOCTOR
    // ============================================
    
    async suggestDoctor(symptoms) {
        const query = `Based on these symptoms: ${symptoms}, what type of doctor should I see at MediCare Hospital?`;
        const response = await this.processQuery(query);
        return response;
    }

    // ============================================
    // MEDICATION INFORMATION
    // ============================================
    
    async getMedicationInfo(medication) {
        const query = `Provide information about the medication "${medication}" including uses, side effects, and precautions.`;
        return await this.processQuery(query);
    }

    // ============================================
    // SESSION MANAGEMENT
    // ============================================
    
    clearContext() {
        this.context = [];
        return { success: true, message: 'Conversation context cleared' };
    }

    getContext() {
        return this.context;
    }

    // ============================================
    // RESPONSE FORMATTING
    // ============================================
    
    formatResponse(response) {
        if (typeof response === 'string') {
            return response;
        }
        
        if (response.error) {
            return `⚠️ ${response.error}`;
        }
        
        if (response.response) {
            return response.response;
        }
        
        if (response.message) {
            return response.message;
        }
        
        return JSON.stringify(response, null, 2);
    }

    // ============================================
    // DESTROY
    // ============================================
    
    destroy() {
        this.context = [];
        this.isProcessing = false;
        this.onResponse = null;
        this.onError = null;
    }
}

// ============================================
// CREATE GLOBAL INSTANCE
// ============================================
const ai = new AIAssistant({
    apiKey: window.AI_API_KEY || null,
    apiUrl: '/api/ai',
    maxContextLength: 10
});

window.ai = ai;

// ============================================
// AI CHAT UI INTEGRATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const aiToggle = document.getElementById('aiToggle');
    const aiChat = document.getElementById('aiChat');
    const aiClose = document.querySelector('.ai-close');
    const aiInput = document.getElementById('aiInput');
    const aiSend = document.getElementById('aiSend');
    const aiMessages = document.getElementById('aiMessages');

    // Toggle chat
    if (aiToggle && aiChat) {
        aiToggle.addEventListener('click', function() {
            aiChat.classList.toggle('active');
            if (aiChat.classList.contains('active')) {
                setTimeout(() => aiInput?.focus(), 300);
            }
        });
    }

    // Close chat
    if (aiClose && aiChat) {
        aiClose.addEventListener('click', function() {
            aiChat.classList.remove('active');
        });
    }

    // Send message
    async function sendAIMessage() {
        if (!aiInput) return;
        const text = aiInput.value.trim();
        if (!text) return;

        // Add user message
        addMessage(text, 'user');
        aiInput.value = '';

        // Show typing indicator
        const typingMsg = addMessage('...', 'ai', true);
        
        try {
            const response = await ai.processQuery(text);
            
            // Remove typing indicator
            typingMsg.remove();
            
            // Add AI response
            const formattedResponse = ai.formatResponse(response);
            addMessage(formattedResponse, 'ai');
            
        } catch (error) {
            typingMsg.remove();
            addMessage('Sorry, I encountered an error. Please try again.', 'ai');
            console.error('AI Error:', error);
        }
    }

    function addMessage(text, type, isTyping = false) {
        if (!aiMessages) return null;
        
        const msg = document.createElement('div');
        msg.className = `message ${type}`;
        if (isTyping) {
            msg.classList.add('typing');
            msg.innerHTML = '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
        } else {
            msg.innerHTML = `<p>${text}</p>`;
        }
        aiMessages.appendChild(msg);
        aiMessages.scrollTop = aiMessages.scrollHeight;
        return msg;
    }

    // Event listeners
    if (aiSend) {
        aiSend.addEventListener('click', sendAIMessage);
    }

    if (aiInput) {
        aiInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendAIMessage();
            }
        });
    }

    // Typing animation styles
    const typingStyles = document.createElement('style');
    typingStyles.textContent = `
        .message.typing {
            background: var(--light-gray, #f1f5f9);
            color: var(--near-black, #1e293b);
            align-self: flex-start;
            border-bottom-left-radius: 0;
            padding: 12px 16px;
            min-width: 60px;
        }
        .typing-dots span {
            display: inline-block;
            animation: dotPulse 1.4s ease-in-out infinite;
            font-size: 24px;
            font-weight: 700;
            line-height: 0;
        }
        .typing-dots span:nth-child(2) {
            animation-delay: 0.2s;
        }
        .typing-dots span:nth-child(3) {
            animation-delay: 0.4s;
        }
        @keyframes dotPulse {
            0%, 60%, 100% {
                opacity: 0.3;
                transform: translateY(0);
            }
            30% {
                opacity: 1;
                transform: translateY(-5px);
            }
        }
    `;
    document.head.appendChild(typingStyles);
});

// ============================================
// EXPORT
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAssistant;
    module.exports.ai = ai;
                      }
