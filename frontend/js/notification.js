// ============================================
   NOTIFICATIONS MODULE
// ============================================

class NotificationManager {
    constructor(options = {}) {
        this.container = document.getElementById('notificationContainer') || this.createContainer();
        this.permission = 'default';
        this.options = {
            position: options.position || 'top-right',
            duration: options.duration || 5000,
            maxNotifications: options.maxNotifications || 5,
            ...options
        };
        this.notifications = [];
        this.audioEnabled = options.audio !== false;
        this.sound = new Audio(options.soundUrl || '/sounds/notification.mp3');
    }

    // ============================================
    // CONTAINER
    // ============================================
    
    createContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = `notification-container notification-${this.options.position}`;
        container.style.cssText = `
            position: fixed;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
            width: 100%;
            pointer-events: none;
            ${this.getPositionStyles()}
        `;
        document.body.appendChild(container);
        return container;
    }

    getPositionStyles() {
        const positions = {
            'top-right': 'top: 20px; right: 20px;',
            'top-left': 'top: 20px; left: 20px;',
            'top-center': 'top: 20px; left: 50%; transform: translateX(-50%);',
            'bottom-right': 'bottom: 20px; right: 20px;',
            'bottom-left': 'bottom: 20px; left: 20px;',
            'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%);'
        };
        return positions[this.options.position] || positions['top-right'];
    }

    // ============================================
    // SHOW NOTIFICATION
    // ============================================
    
    show(options) {
        const config = {
            title: options.title || '',
            message: options.message || '',
            type: options.type || 'info', // info, success, warning, error
            duration: options.duration || this.options.duration,
            icon: options.icon || this.getTypeIcon(options.type),
            actions: options.actions || [],
            onClick: options.onClick || null,
            onClose: options.onClose || null,
            position: options.position || this.options.position,
            persistent: options.persistent || false,
            sound: options.sound !== undefined ? options.sound : this.audioEnabled
        };

        // Check max notifications
        if (this.notifications.length >= this.options.maxNotifications) {
            this.removeOldest();
        }

        // Create notification element
        const notification = this.createElement(config);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Play sound
        if (config.sound) {
            this.playSound();
        }

        // Auto dismiss
        if (!config.persistent) {
            setTimeout(() => {
                this.remove(notification);
            }, config.duration);
        }

        // Request permission for push notifications
        if (config.type === 'critical' || config.type === 'emergency') {
            this.requestPermission();
        }

        return notification;
    }

    // ============================================
    // CREATE NOTIFICATION ELEMENT
    // ============================================
    
    createElement(config) {
        const element = document.createElement('div');
        element.className = `notification notification-${config.type}`;
        element.style.cssText = `
            pointer-events: auto;
            background: var(--white, #ffffff);
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: flex;
            align-items: flex-start;
            gap: 12px;
            animation: slideInNotification 0.4s ease forwards;
            border-left: 4px solid ${this.getTypeColor(config.type)};
            min-width: 280px;
            max-width: 100%;
            position: relative;
        `;

        // Icon
        if (config.icon) {
            const icon = document.createElement('div');
            icon.className = 'notification-icon';
            icon.innerHTML = `<i class="${config.icon}"></i>`;
            icon.style.cssText = `
                color: ${this.getTypeColor(config.type)};
                font-size: 20px;
                flex-shrink: 0;
                margin-top: 2px;
            `;
            element.appendChild(icon);
        }

        // Content
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        if (config.title) {
            const title = document.createElement('div');
            title.className = 'notification-title';
            title.textContent = config.title;
            title.style.cssText = `
                font-weight: 600;
                font-size: 15px;
                color: var(--near-black, #1e293b);
                margin-bottom: 4px;
            `;
            content.appendChild(title);
        }

        if (config.message) {
            const message = document.createElement('div');
            message.className = 'notification-message';
            message.textContent = config.message;
            message.style.cssText = `
                font-size: 14px;
                color: var(--dark-gray, #475569);
                line-height: 1.5;
            `;
            content.appendChild(message);
        }

        // Actions
        if (config.actions.length > 0) {
            const actions = document.createElement('div');
            actions.className = 'notification-actions';
            actions.style.cssText = `
                display: flex;
                gap: 8px;
                margin-top: 10px;
                flex-wrap: wrap;
            `;
            
            config.actions.forEach(action => {
                const btn = document.createElement('button');
                btn.textContent = action.label;
                btn.className = `btn btn-${action.type || 'primary'}`;
                btn.style.cssText = `
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: ${action.type === 'primary' ? '#2563eb' : '#f1f5f9'};
                    color: ${action.type === 'primary' ? '#fff' : '#475569'};
                `;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (action.onClick) action.onClick();
                    this.remove(element);
                });
                actions.appendChild(btn);
            });
            
            content.appendChild(actions);
        }

        element.appendChild(content);

        // Close button
        if (!config.persistent) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'notification-close';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.style.cssText = `
                background: transparent;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 4px;
                font-size: 14px;
                transition: all 0.3s ease;
                flex-shrink: 0;
                margin-left: 4px;
                margin-top: -2px;
            `;
            closeBtn.addEventListener('click', () => this.remove(element));
            element.appendChild(closeBtn);
        }

        // Click handler
        if (config.onClick) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', (e) => {
                if (e.target.closest('.notification-close') || e.target.closest('.notification-actions')) return;
                config.onClick();
                this.remove(element);
            });
        }

        return element;
    }

    // ============================================
    // REMOVE NOTIFICATION
    // ============================================
    
    remove(element) {
        if (!element || !element.parentNode) return;
        
        element.style.animation = 'slideOutNotification 0.4s ease forwards';
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
                const index = this.notifications.indexOf(element);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }
        }, 400);
    }

    removeOldest() {
        if (this.notifications.length > 0) {
            const oldest = this.notifications[0];
            this.remove(oldest);
        }
    }

    clearAll() {
        this.notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        this.notifications = [];
    }

    // ============================================
    // HELPERS
    // ============================================
    
    getTypeIcon(type) {
        const icons = {
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-exclamation-circle',
            critical: 'fas fa-ambulance',
            emergency: 'fas fa-ambulance'
        };
        return icons[type] || icons.info;
    }

    getTypeColor(type) {
        const colors = {
            info: '#2563eb',
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
            critical: '#dc2626',
            emergency: '#dc2626'
        };
        return colors[type] || colors.info;
    }

    // ============================================
    // SOUND
    // ============================================
    
    playSound() {
        try {
            if (this.sound) {
                this.sound.currentTime = 0;
                this.sound.play().catch(() => {
                    // Silent fail if audio can't play
                });
            }
        } catch (error) {
            // Silent fail
        }
    }

    // ============================================
    // PUSH NOTIFICATIONS
    // ============================================
    
    async requestPermission() {
        if (!('Notification' in window)) return false;
        
        if (this.permission === 'default') {
            this.permission = await Notification.requestPermission();
        }
        
        return this.permission === 'granted';
    }

    sendPushNotification(options) {
        if (!('Notification' in window) || this.permission !== 'granted') {
            this.show(options);
            return;
        }

        try {
            const notification = new Notification(options.title || 'MediCare Hospital', {
                body: options.message || '',
                icon: options.icon || '/images/logo-192.png',
                badge: options.badge || '/images/logo-192.png',
                tag: options.tag || Date.now().toString(),
                requireInteraction: options.persistent || false,
                silent: !options.sound,
                data: options.data || {}
            });

            if (options.onClick) {
                notification.onclick = () => {
                    options.onClick();
                    notification.close();
                };
            }

            if (options.onClose) {
                notification.onclose = options.onClose;
            }

            return notification;
        } catch (error) {
            console.error('Push notification error:', error);
            this.show(options);
            return null;
        }
    }

    // ============================================
    // CONVENIENCE METHODS
    // ============================================
    
    info(message, options = {}) {
        return this.show({ message, type: 'info', ...options });
    }

    success(message, options = {}) {
        return this.show({ message, type: 'success', ...options });
    }

    warning(message, options = {}) {
        return this.show({ message, type: 'warning', ...options });
    }

    error(message, options = {}) {
        return this.show({ message, type: 'error', ...options });
    }

    critical(message, options = {}) {
        return this.show({ message, type: 'critical', persistent: true, ...options });
    }

    emergency(message, options = {}) {
        return this.show({ message, type: 'emergency', persistent: true, ...options });
    }

    // ============================================
    // DESTROY
    // ============================================
    
    destroy() {
        this.clearAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.notifications = [];
    }
}

// ============================================
// CREATE GLOBAL INSTANCE
// ============================================
const notifications = new NotificationManager();
window.notifications = notifications;

// ============================================
// EXPORT
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
    module.exports.notifications = notifications;
}
