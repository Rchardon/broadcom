// Variables globales
let selectedPriority = 'information'; // Par défaut

// Initialisation de la page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadExistingAlerts();
});

// Configuration des événements
function setupEventListeners() {
    // Gestion des boutons de priorité
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectPriority(this.dataset.priority);
        });
    });

    // Envoi d'alerte
    document.getElementById('sendAlertBtn').addEventListener('click', sendAlert);
    
    // Envoi avec Ctrl+Entrée
    document.getElementById('alertInput').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            sendAlert();
        }
    });

    // Bouton Quitter
    document.getElementById('quitBtn').addEventListener('click', function() {
        // Déterminer vers quelle page rediriger
        const referrer = document.referrer;
        
        if (referrer && referrer.includes('chat')) {
            // Si on vient de la page chat, y retourner
            window.location.href = 'chat.html';
        } else {
            // Sinon, aller vers la page de login
            window.location.href = 'login.html';
        }
    });
}

// Sélection de la priorité
function selectPriority(priority) {
    // Retirer la classe active de tous les boutons
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Ajouter la classe active au bouton sélectionné
    document.querySelector(`[data-priority="${priority}"]`).classList.add('active');
    
    selectedPriority = priority;
}

// Envoyer une alerte
function sendAlert() {
    const alertInput = document.getElementById('alertInput');
    const content = alertInput.value.trim();
    
    if (content === '') {
        alert('Veuillez saisir un message d\'alerte');
        return;
    }
    
    // Créer l'objet alerte
    const alertData = {
        priority: selectedPriority,
        content: content,
        sender: getCurrentUser(), // À adapter selon votre système d'auth
        timestamp: new Date().toISOString()
    };
    
    // Afficher l'alerte immédiatement (simulation)
    displayNewAlert(alertData);
    
    // Envoyer au backend (à adapter selon votre API)
    sendAlertToBackend(alertData);
    
    // Vider le champ
    alertInput.value = '';
    
    // Afficher confirmation
    showNotification('Alerte envoyée avec succès !');
}

// Afficher une nouvelle alerte
function displayNewAlert(alertData) {
    const container = document.getElementById('messagesContainer');
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
    
    // Animation d'apparition
    alertDiv.style.opacity = '0';
    alertDiv.style.transform = 'translateY(20px)';
    
    container.appendChild(alertDiv);
    
    // Déclencher l'animation
    setTimeout(() => {
        alertDiv.style.transition = 'all 0.3s ease';
        alertDiv.style.opacity = '1';
        alertDiv.style.transform = 'translateY(0)';
    }, 10);
    
    // Faire défiler vers le bas
    container.scrollTop = container.scrollHeight;
}

// Charger les alertes existantes (simulation)
function loadExistingAlerts() {
    // Cette fonction sera connectée à votre API backend
    console.log('Chargement des alertes existantes...');
    
    // Pour l'instant, les alertes sont déjà dans le HTML
    // Dans la vraie implémentation, vous feriez un appel API ici
    
    /*
    fetch('/api/alerts')
        .then(response => response.json())
        .then(alerts => {
            alerts.forEach(alert => displayNewAlert(alert));
        })
        .catch(error => console.error('Erreur lors du chargement des alertes:', error));
    */
}

// Envoyer l'alerte au backend
function sendAlertToBackend(alertData) {
    // À adapter selon votre API backend
    console.log('Envoi de l\'alerte au backend:', alertData);
    
    /*
    fetch('/api/alerts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken()
        },
        body: JSON.stringify(alertData)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Alerte envoyée avec succès:', result);
    })
    .catch(error => {
        console.error('Erreur lors de l\'envoi de l\'alerte:', error);
        alert('Erreur lors de l\'envoi de l\'alerte');
    });
    */
}

// Fonctions utilitaires
function getCurrentUser() {
    // À adapter selon votre système d'authentification
    return 'Utilisateur Actuel'; // Placeholder
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    // Simple notification (à améliorer selon vos besoins)
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
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
