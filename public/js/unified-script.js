// ============================================
// VARIABLES GLOBALES
// ============================================

// Configuration depuis le backend (avec valeurs par défaut)
const config = window.chatConfig || {
    currentUserId: 'user123', // Valeur par défaut pour test
    apiBaseUrl: '/api',
    socketUrl: null,
    csrfToken: 'default-token'
};

let currentChatId = null;
let socket = null;
let selectedPriority = 'information';
let currentPage = 'chat'; // 'chat' ou 'alert'

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
    connectWebSocket();
    loadUsers();
    setupEventListeners();
});

function initializeApp() {
    setupAjaxHeaders();
    
    if (!config.currentUserId) {
        console.warn('Pas d\'utilisateur connecté, redirection...');
        // window.location.href = 'login.html';
        return;
    }
    
    console.log('App initialisée avec l\'utilisateur:', config.currentUserId);
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
    } else {
        console.log('Pas de WebSocket configuré');
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
    console.log('Changement de page vers:', pageName);
    
    // Cacher toutes les pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Afficher la page demandée
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageName;
        
        // Actions spécifiques selon la page
        if (pageName === 'alert') {
            loadExistingAlerts();
        }
    } else {
        console.error('Page non trouvée:', pageName + 'Page');
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    console.log('Configuration des event listeners...');
    
    // ========== NAVIGATION ==========
    
    // Bouton ALERTES
    const alertsBtn = document.getElementById('alertsBtn');
    if (alertsBtn) {
        alertsBtn.addEventListener('click', function() {
            console.log('Bouton alertes cliqué');
            showPage('alert');
        });
        console.log('Event listener ajouté pour alertsBtn');
    } else {
        console.error('Bouton alertsBtn non trouvé');
    }
    
    // Bouton Quitter - Page Chat
    const quitBtnChat = document.getElementById('quitBtnChat');
    if (quitBtnChat) {
        quitBtnChat.addEventListener('click', function() {
            console.log('Bouton quitter chat cliqué');
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                // window.location.href = 'login.html';
                console.log('Déconnexion confirmée');
            }
        });
        console.log('Event listener ajouté pour quitBtnChat');
    } else {
        console.error('Bouton quitBtnChat non trouvé');
    }
    
    // Bouton Quitter - Page Alert
    const quitBtnAlert = document.getElementById('quitBtnAlert');
    if (quitBtnAlert) {
        quitBtnAlert.addEventListener('click', function() {
            console.log('Bouton quitter alert cliqué');
            showPage('chat');
        });
        console.log('Event listener ajouté pour quitBtnAlert');
    } else {
        console.error('Bouton quitBtnAlert non trouvé');
    }

    // ========== CHAT NORMAL ==========
    
    // Envoi de message chat
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            console.log('Bouton envoyer cliqué');
            sendMessage();
        });
        console.log('Event listener ajouté pour sendBtn');
    } else {
        console.error('Bouton sendBtn non trouvé');
    }
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                console.log('Envoi message via Enter');
                sendMessage();
            }
        });
        console.log('Event listener ajouté pour messageInput');
    } else {
        console.error('Input messageInput non trouvé');
    }

    // ========== ALERTES ==========
    
    // Gestion des boutons de priorité
    const priorityBtns = document.querySelectorAll('.priority-btn');
    if (priorityBtns.length > 0) {
        priorityBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                console.log('Bouton priorité cliqué:', this.dataset.priority);
                selectPriority(this.dataset.priority);
            });
        });
        console.log(`${priorityBtns.length} boutons de priorité configurés`);
    } else {
        console.error('Aucun bouton de priorité trouvé');
    }

    // Envoi d'alerte
    const sendAlertBtn = document.getElementById('sendAlertBtn');
    if (sendAlertBtn) {
        sendAlertBtn.addEventListener('click', function() {
            console.log('Bouton envoyer alerte cliqué');
            sendAlert();
        });
        console.log('Event listener ajouté pour sendAlertBtn');
    } else {
        console.error('Bouton sendAlertBtn non trouvé');
    }
    
    const alertInput = document.getElementById('alertInput');
    if (alertInput) {
        alertInput.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                console.log('Envoi alerte via Ctrl+Enter');
                sendAlert();
            }
        });
        console.log('Event listener ajouté pour alertInput');
    } else {
        console.error('Input alertInput non trouvé');
    }
    
    console.log('Configuration des event listeners terminée');
}

// ============================================
// FONCTIONS CHAT
// ============================================

async function loadUsers() {
    console.log('Chargement des utilisateurs...');
    
    try {
        // Simulation d'utilisateurs pour test
        const users = [
            { id: 1, name: 'Jean Dupont', online: true, unread_count: 2, chat_id: 'chat1' },
            { id: 2, name: 'Marie Martin', online: false, unread_count: 0, chat_id: 'chat2' },
            { id: 3, name: 'Pierre Durand', online: true, unread_count: 1, chat_id: 'chat3' },
            { id: 4, name: 'Sophie Bernard', online: true, unread_count: 0, chat_id: 'chat4' }
        ];
        
        displayUsers(users);
        
        /* Version avec API réelle :
        const response = await fetch(`${config.apiBaseUrl}/users`, {
            headers: window.defaultHeaders
        });
        
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        } else {
            console.error('Erreur lors du chargement des utilisateurs');
        }
        */
    } catch (error) {
        console.error('Erreur réseau:', error);
        // Afficher des utilisateurs par défaut en cas d'erreur
        displayUsers([
            { id: 1, name: 'Utilisateur Test', online: true, unread_count: 0, chat_id: 'test' }
        ]);
    }
}

function displayUsers(users) {
    console.log('Affichage des utilisateurs:', users);
    
    const userList = document.querySelector('#chatPage .user-list');
    if (!userList) {
        console.error('Liste utilisateurs non trouvée');
        return;
    }
    
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
        
        // ✅ Event listener ajouté directement lors de la création
        userItem.addEventListener('click', function() {
            console.log('Utilisateur sélectionné:', user.name);
            selectUser(user);
        });
        
        userList.appendChild(userItem);
    });
    
    console.log(`${users.length} utilisateurs affichés`);
}

async function selectUser(user) {
    console.log('Sélection de l\'utilisateur:', user);
    
    // Mettre à jour l'interface
    document.querySelectorAll('#chatPage .user-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Trouver l'élément cliqué et l'activer
    const clickedItem = document.querySelector(`[data-user-id="${user.id}"]`);
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
    
    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle) {
        chatTitle.textContent = user.name;
    }
    
    currentChatId = user.chat_id || user.id;
    console.log('Chat ID défini:', currentChatId);
    
    // Activer l'input de message
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (messageInput) messageInput.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    
    // Vider la conversation
    clearMessages();
    
    // Dans la vraie implémentation, charger les messages depuis la base de données
    // await loadMessages(user.chat_id);
}

function clearMessages() {
    const container = document.getElementById('messagesContainer');
    if (container) {
        container.innerHTML = '<div class="empty-conversation">Aucun message pour l\'instant. Commencez la conversation !</div>';
    }
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
    if (!container) return;
    
    if (!messages || messages.length === 0) {
        container.innerHTML = '<div class="empty-conversation">Aucun message pour l\'instant. Commencez la conversation !</div>';
        return;
    }
    
    container.innerHTML = '';
    messages.forEach(message => {
        displayMessage(message, false);
    });
    
    scrollToBottom('messagesContainer');
}

function displayMessage(message, animate = true) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    // Supprimer le message "conversation vide" s'il existe
    const emptyMessage = container.querySelector('.empty-conversation');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    
    const isSent = message.sender_id === config.currentUserId;
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(message.content)}</div>
        <div class="message-time">${formatTime(message.created_at || new Date().toISOString())}</div>
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
    if (!input) {
        console.error('Input message non trouvé');
        return;
    }
    
    const content = input.value.trim();
    
    if (content === '') {
        console.log('Message vide, envoi annulé');
        return;
    }
    
    if (!currentChatId) {
        console.log('Aucun chat sélectionné');
        alert('Veuillez sélectionner un utilisateur pour commencer une conversation');
        return;
    }
    
    console.log('Envoi du message:', content, 'vers', currentChatId);
    
    try {
        /* Version avec API réelle :
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
        */
        
        // Simulation pour test
        const simulatedMessage = {
            content: content,
            sender_id: config.currentUserId,
            created_at: new Date().toISOString()
        };
        displayMessage(simulatedMessage, true);
        input.value = '';
        
        console.log('Message envoyé avec succès');
        
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
    console.log('Sélection de la priorité:', priority);
    
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedBtn = document.querySelector(`[data-priority="${priority}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
        selectedPriority = priority;
        console.log('Priorité définie:', selectedPriority);
    }
}

function sendAlert() {
    const alertInput = document.getElementById('alertInput');
    if (!alertInput) {
        console.error('Input alerte non trouvé');
        return;
    }
    
    const content = alertInput.value.trim();
    
    if (content === '') {
        alert('Veuillez saisir un message d\'alerte');
        return;
    }
    
    console.log('Envoi de l\'alerte:', content, 'priorité:', selectedPriority);
    
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
    if (!container) {
        console.error('Container alertes non trouvé');
        return;
    }
    
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
}

function sendAlertToBackend(alertData) {
    console.log('Envoi de l\'alerte au backend:', alertData);
    // Implémentation backend à faire
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function scrollToBottom(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
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
