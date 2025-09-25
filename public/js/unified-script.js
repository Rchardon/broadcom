// ============================================
// VARIABLES GLOBALES
// ============================================

// Configuration depuis le backend
const config = window.chatConfig;
let currentChatId = null;
let socket = null;
let selectedPriority = 'information';
let currentPage = 'chat';
let connectedUsers = new Map(); // Pour tracker les utilisateurs connectés

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
        console.log('Pas d\'utilisateur connecté, redirection vers login');
        // window.location.href = 'login.html';
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
// WEBSOCKET POUR TEMPS RÉEL
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
            
            socket.onerror = function(error) {
                console.error('Erreur WebSocket:', error);
            };
        } catch (error) {
            console.error('Erreur connexion WebSocket:', error);
        }
    } else {
        console.log('Mode sans WebSocket - fonctionnalités en local uniquement');
    }
}

function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'new_message':
            if (data.chatId === currentChatId && currentPage === 'chat') {
                displayMessage(data.message, true);
                // Marquer comme lu
                markMessagesAsRead(data.chatId);
            } else {
                // Augmenter le compteur de messages non lus
                updateUnreadCount(data.message.sender_id, 1);
                showNotification(`Nouveau message de ${data.message.sender_name}!`, 'info');
            }
            break;
        case 'new_alert':
            if (currentPage === 'alert') {
                displayNewAlert(data.alert);
            }
            showNotification('Nouvelle alerte reçue!', 'info');
            break;
        case 'user_status':
            updateUserStatus(data.userId, data.status);
            break;
        case 'user_joined':
            addNewUser(data.user);
            showNotification(`${data.user.name} a rejoint la conversation!`, 'success');
            break;
        case 'user_invited':
            // Actualiser la liste des utilisateurs
            loadUsers();
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
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageName;
    }
    
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
    const alertsBtn = document.getElementById('alertsBtn');
    if (alertsBtn) {
        alertsBtn.addEventListener('click', function() {
            showPage('alert');
        });
    }
    
    // Bouton Quitter - Page Chat
    const quitBtnChat = document.getElementById('quitBtnChat');
    if (quitBtnChat) {
        quitBtnChat.addEventListener('click', function() {
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                // window.location.href = 'login.html';
                showNotification('Déconnexion simulée', 'info');
            }
        });
    }
    
    // Bouton Retour - Page Alert
    const quitBtnAlert = document.getElementById('quitBtnAlert');
    if (quitBtnAlert) {
        quitBtnAlert.addEventListener('click', function() {
            showPage('chat');
        });
    }

    // ========== INVITATION D'UTILISATEURS ==========
    
    // Bouton d'invitation
    const inviteUserBtn = document.getElementById('inviteUserBtn');
    if (inviteUserBtn) {
        inviteUserBtn.addEventListener('click', function() {
            openInviteModal();
        });
    }
    
    // Modal d'invitation
    const cancelInviteBtn = document.getElementById('cancelInviteBtn');
    if (cancelInviteBtn) {
        cancelInviteBtn.addEventListener('click', function() {
            closeInviteModal();
        });
    }
    
    // Formulaire d'invitation
    const inviteForm = document.getElementById('inviteForm');
    if (inviteForm) {
        inviteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            inviteUser();
        });
    }
    
    // Fermer modal en cliquant à l'extérieur
    const inviteModal = document.getElementById('inviteModal');
    if (inviteModal) {
        inviteModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeInviteModal();
            }
        });
    }

    // Fermer modal avec Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeInviteModal();
        }
    });

    // ========== CHAT NORMAL ==========
    
    // Envoi de message chat
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // ========== ALERTES ==========
    
    // Gestion des boutons de priorité
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectPriority(this.dataset.priority);
        });
    });

    // Envoi d'alerte
    const sendAlertBtn = document.getElementById('sendAlertBtn');
    if (sendAlertBtn) {
        sendAlertBtn.addEventListener('click', sendAlert);
    }
    
    const alertInput = document.getElementById('alertInput');
    if (alertInput) {
        alertInput.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                sendAlert();
            }
        });
    }
}

// ============================================
// FONCTIONS D'INVITATION
// ============================================

function openInviteModal() {
    const modal = document.getElementById('inviteModal');
    const usernameInput = document.getElementById('inviteUsername');
    
    if (modal && usernameInput) {
        modal.classList.add('active');
        usernameInput.focus();
    }
}

function closeInviteModal() {
    const modal = document.getElementById('inviteModal');
    const form = document.getElementById('inviteForm');
    
    if (modal) {
        modal.classList.remove('active');
    }
    if (form) {
        form.reset();
    }
}

async function inviteUser() {
    const usernameInput = document.getElementById('inviteUsername');
    const emailInput = document.getElementById('inviteEmail');
    
    if (!usernameInput || !emailInput) {
        showNotification('Erreur: Éléments du formulaire introuvables', 'error');
        return;
    }
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    
    if (!username || !email) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Adresse email invalide', 'error');
        return;
    }
    
    try {
        // Appel API pour inviter l'utilisateur
        const response = await fetch(`${config.apiBaseUrl}/users/invite`, {
            method: 'POST',
            headers: window.defaultHeaders,
            body: JSON.stringify({
                username: username,
                email: email,
                invited_by: config.currentUserId
            })
        });
        
        if (response.ok) {
            const newUser = await response.json();
            addNewUser(newUser);
            showNotification(`${username} a été invité avec succès!`, 'success');
            closeInviteModal();
            
            // Notifier via WebSocket
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'user_invited',
                    user: newUser
                }));
            }
        } else {
            const error = await response.json();
            showNotification(error.message || 'Erreur lors de l\'invitation', 'error');
        }
    } catch (error) {
        console.error('Erreur lors de l\'invitation:', error);
        
        // Mode simulation locale
        const simulatedUser = {
            id: Date.now(),
            name: username,
            email: email,
            online: false,
            unread_count: 0
        };
        addNewUser(simulatedUser);
        showNotification(`${username} a été invité (mode local)!`, 'success');
        closeInviteModal();
    }
}

function addNewUser(user) {
    const userList = document.querySelector('#chatPage .user-list');
    if (!userList) return;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = document.querySelector(`[data-user-id="${user.id}"]`);
    if (existingUser) {
        showNotification('Cet utilisateur est déjà dans la liste', 'info');
        return;
    }
    
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    userItem.dataset.userId = user.id;
    userItem.innerHTML = `
        <span class="user-status ${user.online ? 'online' : 'offline'}"></span>
        ${user.name}
        ${user.unread_count > 0 ? `<span class="unread-badge">${user.unread_count}</span>` : ''}
    `;
    
    userItem.addEventListener('click', () => selectUser(user));
    
    // Insérer avant la section alertes (le dernier élément de la liste)
    userList.appendChild(userItem);
    
    // Ajouter à notre map des utilisateurs
    connectedUsers.set(user.id, user);
}

// ============================================
// FONCTIONS CHAT AMÉLIORÉES
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
            loadDefaultUsers();
        }
    } catch (error) {
        console.error('Erreur réseau:', error);
        loadDefaultUsers();
    }
}

function loadDefaultUsers() {
    // Mode local avec utilisateurs par défaut
    const defaultUsers = [
        { id: 1, name: 'Utilisateur 1', online: true, unread_count: 3 },
        { id: 2, name: 'Utilisateur 2', online: false, unread_count: 0 },
        { id: 3, name: 'Agent Smith', online: true, unread_count: 1 }
    ];
    displayUsers(defaultUsers);
}

function displayUsers(users) {
    const userList = document.querySelector('#chatPage .user-list');
    if (!userList) return;
    
    userList.innerHTML = '';
    
    users.forEach((user, index) => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        if (index === 0) userItem.classList.add('active'); // Premier utilisateur actif par défaut
        userItem.dataset.userId = user.id;
        userItem.innerHTML = `
            <span class="user-status ${user.online ? 'online' : 'offline'}"></span>
            ${user.name}
            ${user.unread_count > 0 ? `<span class="unread-badge">${user.unread_count}</span>` : ''}
        `;
        
        userItem.addEventListener('click', () => selectUser(user));
        userList.appendChild(userItem);
        
        // Ajouter à notre map
        connectedUsers.set(user.id, user);
    });
}

async function selectUser(user) {
    // Mettre à jour l'interface
    document.querySelectorAll('#chatPage .user-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Activer l'utilisateur sélectionné
    const selectedItem = document.querySelector(`[data-user-id="${user.id}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
        // Supprimer le badge de messages non lus
        const unreadBadge = selectedItem.querySelector('.unread-badge');
        if (unreadBadge) {
            unreadBadge.remove();
        }
    }
    
    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle) {
        chatTitle.textContent = user.name;
    }
    currentChatId = user.chat_id || `chat_${user.id}`;
    
    // Activer l'input de message
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    if (messageInput && sendBtn) {
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.placeholder = `Discuter avec ${user.name}...`;
    }
    
    // Charger les messages de cette conversation
    await loadMessages(currentChatId);
    
    // Marquer les messages comme lus
    markMessagesAsRead(currentChatId);
}

async function loadMessages(chatId) {
    try {
        const response = await fetch(`${config.apiBaseUrl}/chats/${chatId}/messages`, {
            headers: window.defaultHeaders
        });
        
        if (response.ok) {
            const messages = await response.json();
            displayMessages(messages);
        } else {
            // Conversation vide
            clearMessages();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        // Conversation vide en mode local
        clearMessages();
    }
}

function clearMessages() {
    const container = document.getElementById('messagesContainer');
    if (container) {
        container.innerHTML = '<div class="empty-conversation jaini-font">AUCUN MESSAGE POUR L\'INSTANT. COMMENCEZ LA CONVERSATION !</div>';
    }
}

function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    if (!messages || messages.length === 0) {
        clearMessages();
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
    
    const isSent = message.sender_id === config.currentUserId || message.sent;
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
    if (!input) return;
    
    const content = input.value.trim();
    
    if (content === '' || !currentChatId) {
        showNotification('Veuillez saisir un message et sélectionner un utilisateur', 'error');
        return;
    }
    
    const messageData = {
        content: content,
        chat_id: currentChatId,
        sender_id: config.currentUserId
    };
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/chats/${currentChatId}/messages`, {
            method: 'POST',
            headers: window.defaultHeaders,
            body: JSON.stringify(messageData)
        });
        
        if (response.ok) {
            const message = await response.json();
            displayMessage(message, true);
            input.value = '';
            
            // Envoyer via WebSocket pour le temps réel
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'send_message',
                    chatId: currentChatId,
                    message: message
                }));
            }
        } else {
            throw new Error('Erreur serveur');
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        
        // Mode local - afficher le message immédiatement
        const localMessage = {
            content: content,
            sender_id: config.currentUserId,
            created_at: new Date().toISOString(),
            sent: true
        };
        displayMessage(localMessage, true);
        input.value = '';
        
        // Simuler la réception d'un message après un délai
        setTimeout(() => {
            const replyMessage = {
                content: `Message reçu: "${content}"`,
                sender_id: parseInt(currentChatId.split('_')[1]) || 2,
                created_at: new Date().toISOString(),
                sent: false
            };
            displayMessage(replyMessage, true);
        }, 2000);
    }
}

function markMessagesAsRead(chatId) {
    // Marquer les messages comme lus côté serveur
    fetch(`${config.apiBaseUrl}/chats/${chatId}/mark-read`, {
        method: 'POST',
        headers: window.defaultHeaders
    }).catch(error => console.error('Erreur marquage lu:', error));
}

function updateUnreadCount(userId, increment) {
    const userItem = document.querySelector(`[data-user-id="${userId}"]`);
    if (!userItem) return;
    
    let badge = userItem.querySelector('.unread-badge');
    if (!badge && increment > 0) {
        badge = document.createElement('span');
        badge.className = 'unread-badge';
        badge.textContent = '0';
        userItem.appendChild(badge);
    }
    
    if (badge) {
        const currentCount = parseInt(badge.textContent) || 0;
        const newCount = Math.max(0, currentCount + increment);
        
        if (newCount > 0) {
            badge.textContent = newCount;
        } else {
            badge.remove();
        }
    }
}

// ============================================
// FONCTIONS ALERTES
// ============================================

function selectPriority(priority) {
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const priorityBtn = document.querySelector(`[data-priority="${priority}"]`);
    if (priorityBtn) {
        priorityBtn.classList.add('active');
        selectedPriority = priority;
    }
}

function sendAlert() {
    const alertInput = document.getElementById('alertInput');
    if (!alertInput) return;
    
    const content = alertInput.value.trim();
    
    if (content === '') {
        showNotification('Veuillez saisir un message d\'alerte', 'error');
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
    showNotification('Alerte envoyée avec succès !', 'success');
}

function displayNewAlert(alertData) {
    const container = document.getElementById('alertMessagesContainer');
    if (!container) return;
    
    const alertDiv = document.createElement('div');
    
    alertDiv.className = `alert-message ${alertData.priority}`;
    alertDiv.innerHTML = `
        <div class="alert-header">
            <span class="alert-badge ${alertData.priority} jaini-font">${alertData.priority.toUpperCase()}</span>
            <span class="alert-time jaini-font">${formatTime(alertData.timestamp)}</span>
        </div>
        <div class="alert-content">${escapeHtml(alertData.content)}</div>
        <div class="alert-sender jaini-font">- ${alertData.sender}</div>
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
    // Dans la vraie implémentation, charger depuis l'API
}

function sendAlertToBackend(alertData) {
    fetch(`${config.apiBaseUrl}/alerts`, {
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
    });
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
    
    // Mettre à jour notre map
    if (connectedUsers.has(userId)) {
        connectedUsers.get(userId).online = (status === 'online');
    }
}

function getCurrentUser() {
    return 'Utilisateur Actuel';
}

function showNotification(message, type = 'success') {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Afficher
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Masquer et supprimer
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// INITIALISATION DES DONNÉES LOCALES
// ============================================

// Activer le premier utilisateur par défaut après le chargement
setTimeout(() => {
    const firstUser = { id: 1, name: 'Utilisateur 1', chat_id: 'chat_1' };
    const activeUserItem = document.querySelector('.user-item.active');
    if (activeUserItem && !currentChatId) {
        selectUser(firstUser);
    }
}, 1000);

// Gestion de la déconnexion/fermeture de page
window.addEventListener('beforeunload', function() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'user_disconnect',
            userId: config.currentUserId
        }));
        socket.close();
    }
});

// Gestion des erreurs globales
window.addEventListener('error', function(event) {
    console.error('Erreur JavaScript:', event.error);
    showNotification('Une erreur s\'est produite', 'error');
});

// Log des informations de débogage
console.log('Application Broadcom Chat initialisée');
console.log('Configuration:', config);
console.log('WebSocket supporté:', 'WebSocket' in window);
