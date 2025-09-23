// Configuration depuis le backend
const config = window.chatConfig;
let currentChatId = null;
let socket = null;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    connectWebSocket();
    loadUsers();
    setupEventListeners();
});

// Initialisation de l'application
function initializeApp() {
    // Configuration des headers pour les requêtes AJAX
    setupAjaxHeaders();
    
    // Vérifier l'authentification
    if (!config.currentUserId) {
        window.location.href = '/login';
        return;
    }
}

// Configuration des headers AJAX
function setupAjaxHeaders() {
    // Pour les requêtes fetch
    window.defaultHeaders = {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': config.csrfToken,
        'Accept': 'application/json'
    };
}

// Connexion WebSocket pour les messages en temps réel
function connectWebSocket() {
    if (config.socketUrl) {
        try {
            socket = new WebSocket(config.socketUrl);
            
            socket.onopen = function() {
                console.log('WebSocket connecté');
                // S'identifier auprès du serveur WebSocket
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

// Gestion des messages WebSocket
function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'new_message':
            if (data.chatId === currentChatId) {
                displayMessage(data.message, false);
            }
            updateUserList(); // Mettre à jour la liste pour les notifications
            break;
        case 'user_status':
            updateUserStatus(data.userId, data.status);
            break;
    }
}

// Charger la liste des utilisateurs
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

// Afficher les utilisateurs
function displayUsers(users) {
    const userList = document.getElementById('userList');
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

// Sélectionner un utilisateur
async function selectUser(user) {
    // Mettre à jour l'interface
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-user-id="${user.id}"]`).classList.add('active');
    
    document.getElementById('chatTitle').textContent = user.name;
    currentChatId = user.chat_id;
    
    // Activer l'input de message
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    
    // Charger les messages
    await loadMessages(user.chat_id);
}

// Charger les messages d'une conversation
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

// Afficher les messages
function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    messages.forEach(message => {
        displayMessage(message, false);
    });
    
    scrollToBottom();
}

// Afficher un message
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
    
    scrollToBottom();
}

// Envoyer un message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (content === '' || !currentChatId) return;
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/chats/${currentChatId}/messages`, {
            method: 'POST',
            headers: window.defaultHeaders,
            body: JSON.stringify({
                content: content
            })
        });
        
        if (response.ok) {
            const message = await response.json();
            displayMessage(message, true);
            input.value = '';
            
            // Envoyer via WebSocket pour les autres utilisateurs
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
        alert('Erreur réseau');
    }
}

// Configuration des événements
function setupEventListeners() {
    // Envoi de message
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Déconnexion
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            try {
                await fetch('/logout', {
                    method: 'POST',
                    headers: window.defaultHeaders
                });
                window.location.href = '/login';
            } catch (error) {
                window.location.href = '/login';
            }
        }
    });
}

// Fonctions utilitaires
function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
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
