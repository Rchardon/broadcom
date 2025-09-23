// ============================================
// VARIABLES GLOBALES
// ============================================

// Configuration depuis le backend
const config = window.chatConfig;
let currentChatId = null;
let socket = null;
let selectedPriority = 'information';
let currentPage = 'chat'; // 'chat' ou 'alert'

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    connectWebSocket();
    loadUsers();
    setupEventListeners();
});

function initializeApp() {
    setupAjaxHeaders();
    
    if (!config.currentUserId) {
        window.location.href = 'login.html';
        return;
    }
}

function setupAjaxHeaders() {
    window.defaultHeaders = {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': config.csrfToken,
        'Accept': 'application/json'
    };
}

// ============================================
// WEBSOCKET
// ============================================

function connectWebSocket() {
    if (config.socketUrl) {
        try {
            socket = new WebSocket(config.socketUrl);
            
            socket.onopen = function() {
                console.log('WebSocket connecté');
                socket.send(JSON.stringify({
                    type: 'authenticate',
                    userId: config.currentUserId
                }));
            };
            
            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            socket.onclose = function() {
                console.log('WebSocket fermé - tentative de reconnexion...');
                setTimeout(connectWebSocket, 3000);
            };
        } catch (error) {
            console.error('Erreur WebSocket:', error);
        }
    }
}

function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'new_message':
            if (data.chatId === currentChatId && currentPage === 'chat') {
                displayMessage(data.message, false);
            }
            updateUserList();
            break;
        case 'new_alert':
            if (currentPage === 'alert') {
                displayNewAlert(data.alert);
            }
            break;
        case 'user_status':
            updateUserStatus(data.userId, data.status);
            break;
    }
}

// ============================================
// GESTION DES PAGES
// ============================================

function showPage(pageName) {
    // Cacher toutes les pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Afficher la page demandée
    document.getElementById(pageName + 'Page').classList.add('active');
    currentPage = pageName;
    
    // Actions spécifiques selon la page
    if (pageName === 'alert') {
        loadExistingAlerts();
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // ========== NAVIGATION ==========
    
    // Bouton ALERTES
    document.getElementById('alertsBtn').addEventListener('click', function() {
        showPage('alert');
    });
    
    // Bouton Quitter - Page Chat
    document.getElementById('quitBtnChat').addEventListener('click', function() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            window.location.href = 'login.html';
        }
    });
    
    // Bouton Quitter - Page Alert
    document.getElementById('quitBtnAlert').addEventListener('click', function() {
        showPage('chat');
    });

    // ========== CHAT NORMAL ==========
    
    // Envoi de message chat
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Sélection d'utilisateurs
    document.querySelectorAll('#chatPage .user-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.textContent.includes('📢')) return; // Ignorer l'item alertes
            
            selectUser({
                id: Math.random(), // Simulation
                name: this.textContent,
                chat_id: Math.random()
            });
        });
    });

    // ========== ALERTES ==========
    
    // Gestion des boutons de priorité
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectPriority(this.dataset.priority);
        });
    });

    // Envoi d'alerte
    document.getElementById('sendAlertBtn').addEventListener('click', sendAlert);
    
    document.getElementById('alertInput').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            sendAlert();
        }
    });
}

// ============================================
// FONCTIONS CHAT
// ============================================

async function loadUsers() {
    try {
        const response = await fetch(`${config.apiBaseUrl}/users`, {
            headers: window.defaultHeaders
        });
        
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        } else {
            console.error('Erreur lors du chargement des utilisateurs');
        }
    } catch (error) {
        console.error('Erreur réseau:', error);
    }
}

function displayUsers(users) {
    const userList = document.querySelector('#chatPage .user-list');
    userList.innerHTML = '';
    
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.dataset.userId = user.id;
        userItem.innerHTML = `
            <span class="user-status ${user.online ? 'online' : 'offline'}"></span>
            ${user.name}
            ${user.unread_count > 0 ? `<span class="unread-badge">${user.unread_count}</span>` : ''}
        `;
        
        userItem.addEventListener('click', () => selectUser(user));
        userList.appendChild(userItem);
    });
}

async function selectUser(user) {
    document.querySelectorAll('#chatPage .user-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-user-id="${user.id}"]`).classList.add('active');
    
    document.getElementById('chatTitle').textContent = user.name;
    currentChatId = user.chat_id;
    
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    
    await loadMessages(user.chat_id);
}

async function loadMessages(chatId) {
    try {
        const response = await fetch(`${config.apiBaseUrl}/chats/${chatId}/messages`, {
            headers: window.defaultHeaders
        });
        
        if (response.ok) {
            const messages = await response.json();
            displayMessages(messages);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
    }
}

function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    messages.forEach(message => {
        displayMessage(message, false);
    });
    
    scrollToBottom('messagesContainer');
}

function displayMessage(message, animate = true) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    
    const isSent = message.sender_id === config.currentUserId;
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(message.content)}</div>
        <div class="message-time">${formatTime(message.created_at)}</div>
    `;
    
    if (animate) {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
    }
    
    container.appendChild(messageDiv);
    
    if (animate) {
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);
    }
    
    scrollToBottom('messagesContainer');
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (content === '' || !currentChatId) return;
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/chats/${currentChatId}/messages`, {
            method: 'POST',
            headers: window.defaultHeaders,
            body: JSON.stringify({ content: content })
        });
        
        if (response.ok) {
            const message = await response.json();
            displayMessage(message, true);
            input.value = '';
            
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'send_message',
                    chatId: currentChatId,
                    message: message
                }));
            }
        } else {
            alert('Erreur lors de l\'envoi du message');
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        
        // Simulation locale en cas d'erreur
        const simulatedMessage = {
            content: content,
            sender_id: config.currentUserId,
            created_at: new Date().toISOString()
        };
        displayMessage(simulatedMessage, true);
        input.value = '';
    }
}

// ============================================
// FONCTIONS ALERTES
// ============================================

function selectPriority(priority) {
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`[data-priority="${priority}"]`).classList.add('active');
    selectedPriority = priority;
}

function sendAlert() {
    const alertInput = document.getElementById('alertInput');
    const content = alertInput.value.trim();
    
    if (content === '') {
        alert('Veuillez saisir un message d\'alerte');
        return;
    }
    
    const alertData = {
        priority: selectedPriority,
        content: content,
        sender: getCurrentUser(),
        timestamp: new Date().toISOString()
    };
    
    displayNewAlert(alertData);
    sendAlertToBackend(alertData);
    
    alertInput.value = '';
    showNotification('Alerte envoyée avec succès !');
}

function displayNewAlert(alertData) {
    const container = document.getElementById('alertMessagesContainer');
    const alertDiv = document.createElement('div');
    
    alertDiv.className = `alert-message ${alertData.priority}`;
    alertDiv.innerHTML = `
        <div class="alert-header">
            <span class="alert-badge ${alertData.priority}">${alertData.priority.toUpperCase()}</span>
            <span class="alert-time">${formatTime(alertData.timestamp)}</span>
        </div>
        <div class="alert-content">${escapeHtml(alertData.content)}</div>
        <div class="alert-sender">- ${alertData.sender}</div>
    `;
    
    alertDiv.style.opacity = '0';
    alertDiv.style.transform = 'translateY(20px)';
    
    container.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.transition = 'all 0.3s ease';
        alertDiv.style.opacity = '1';
        alertDiv.style.transform = 'translateY(0)';
    }, 10);
    
    scrollToBottom('alertMessagesContainer');
}

function loadExistingAlerts() {
    console.log('Chargement des alertes existantes...');
    // Les alertes sont déjà dans le HTML pour la démo
    // Dans la vraie implémentation:
    /*
    fetch('/api/alerts')
        .then(response => response.json())
        .then(alerts => {
            const container = document.getElementById('alertMessagesContainer');
            container.innerHTML = '';
            alerts.forEach(alert => displayNewAlert(alert));
        })
        .catch(error => console.error('Erreur lors du chargement des alertes:', error));
    */
}

function sendAlertToBackend(alertData) {
    console.log('Envoi de l\'alerte au backend:', alertData);
    
    // Dans la vraie implémentation:
    /*
    fetch('/api/alerts', {
        method: 'POST',
        headers: window.defaultHeaders,
        body: JSON.stringify(alertData)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Alerte envoyée avec succès:', result);
        
        // Diffuser via WebSocket
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'send_alert',
                alert: result
            }));
        }
    })
    .catch(error => {
        console.error('Erreur lors de l\'envoi de l\'alerte:', error);
        alert('Erreur lors de l\'envoi de l\'alerte');
    });
    */
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function scrollToBottom(containerId) {
    const container = document.getElementById(containerId);
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function updateUserStatus(userId, status) {
    const userElement = document.querySelector(`[data-user-id="${userId}"] .user-status`);
    if (userElement) {
        userElement.className = `user-status ${status}`;
    }
}

function updateUserList() {
    // Recharger la liste des utilisateurs pour les notifications
    loadUsers();
}

function getCurrentUser() {
    return 'Utilisateur Actuel'; // À adapter selon votre système d'auth
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// ANIMATIONS CSS DYNAMIQUES
// ============================================

// Ajouter les animations manquantes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
