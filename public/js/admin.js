// Variables globales
let currentUsers = [];
let currentAlerts = [];
let selectedPriority = 'information';
let editingUser = null;
let editingAlert = null;
let currentFilter = 'urgent';

// Configuration depuis le backend
const config = window.adminConfig || {
    apiBaseUrl: '/api/admin',
    currentAdminId: 1,
    csrfToken: 'demo-token',
    socketUrl: 'ws://localhost:3000'
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du panneau admin...');
    setupEventListeners();
    loadUsers();
    loadAlerts();
    
    // Activer les états par défaut
    setTimeout(() => {
        const urgentBtn = document.querySelector('[data-filter="urgent"]');
        if (urgentBtn) urgentBtn.classList.add('active');
        
        const infoBtn = document.querySelector('[data-priority="information"]');
        if (infoBtn) infoBtn.classList.add('active');
    }, 500);
});

// Configuration des événements
function setupEventListeners() {
    console.log('Configuration des événements...');
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            showPage(this.dataset.page);
        });
    });

    // Boutons de déconnexion
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', logout);
    });

    // Bouton ajouter utilisateur
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Ouverture modal ajout utilisateur');
            openUserModal();
        });
    }

    // Formulaire utilisateur
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSave);
    }

    // Fermeture modal utilisateur
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', closeUserModal);
    }
    
    const cancelModal = document.getElementById('cancelModal');
    if (cancelModal) {
        cancelModal.addEventListener('click', closeUserModal);
    }

    // Filtres d'alertes
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Filtre sélectionné:', this.dataset.filter);
            setAlertFilter(this.dataset.filter);
        });
    });

    // Boutons de priorité
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Priorité sélectionnée:', this.dataset.priority);
            selectPriority(this.dataset.priority);
        });
    });

    // Bouton envoyer alerte
    const sendAlertBtn = document.getElementById('sendAdminAlertBtn');
    if (sendAlertBtn) {
        sendAlertBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Envoi d\'alerte admin');
            sendAlert();
        });
    }

    // Input alerte avec Ctrl+Entrée
    const alertInput = document.getElementById('adminAlertInput');
    if (alertInput) {
        alertInput.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                sendAlert();
            }
        });
    }

    // Modal alertes
    const alertForm = document.getElementById('alertForm');
    if (alertForm) {
        alertForm.addEventListener('submit', handleAlertSave);
    }
    
    const closeAlertModal = document.getElementById('closeAlertModal');
    if (closeAlertModal) {
        closeAlertModal.addEventListener('click', function() {
            document.getElementById('alertModal').classList.remove('active');
        });
    }
    
    const cancelAlertModal = document.getElementById('cancelAlertModal');
    if (cancelAlertModal) {
        cancelAlertModal.addEventListener('click', function() {
            document.getElementById('alertModal').classList.remove('active');
        });
    }

    // Fermeture modals en cliquant à l'extérieur
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    console.log('Événements configurés avec succès');
}

// Navigation entre pages
function showPage(pageName) {
    console.log('Navigation vers:', pageName);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const activePage = document.getElementById(pageName + 'Page');
    if (activePage) activePage.classList.add('active');

    // Charger données selon la page
    if (pageName === 'users') {
        loadUsers();
    } else if (pageName === 'alerts') {
        loadAlerts();
        // Activer le bon filtre
        setTimeout(() => {
            if (!document.querySelector('.filter-btn.active')) {
                const urgentFilter = document.querySelector('[data-filter="urgent"]');
                if (urgentFilter) urgentFilter.classList.add('active');
            }
        }, 100);
    }
}

// Déconnexion
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        // Nettoyer les données locales
        currentUsers = [];
        currentAlerts = [];
        
        // Rediriger vers login
        window.location.href = 'login.html';
    }
}

// ============================================
// GESTION UTILISATEURS - Prêt pour Database
// ============================================

async function loadUsers() {
    console.log('Chargement utilisateurs depuis API...');
    setLoading('usersPage', true);
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/users`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + getAuthToken(),
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': config.csrfToken
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const users = await response.json();
        currentUsers = users.data || users;
        displayUsers(currentUsers);
        
        console.log(`${currentUsers.length} utilisateurs chargés`);
        
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
        
        // Fallback en cas d'erreur API - données de démonstration
        currentUsers = [
            {
                id: 1,
                nom: 'Calise',
                prenom: 'Jean', 
                identifiant: 'calise.jean',
                appartement: 'A101',
                immeuble: 'Bât A',
                derniere_connexion: '2025-01-20T10:30:00Z',
                actif: true,
                pin: '1234',
                password: 'password123'
            },
            {
                id: 2,
                nom: 'Dupont',
                prenom: 'Xavier',
                identifiant: 'dupont.xavier', 
                appartement: 'B205',
                immeuble: 'Bât B',
                derniere_connexion: '2025-01-18T15:45:00Z',
                actif: true,
                pin: '5678',
                password: 'motdepasse456'
            },
            {
                id: 3,
                nom: 'Martin',
                prenom: 'Sophie',
                identifiant: 'martin.sophie',
                appartement: 'C302', 
                immeuble: 'Bât C',
                derniere_connexion: '2025-01-15T09:20:00Z',
                actif: false,
                pin: '9012',
                password: 'secret789'
            }
        ];
        displayUsers(currentUsers);
        showNotification('Mode hors-ligne activé', 'info');
    }
    
    setLoading('usersPage', false);
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        const identifiant = user.identifiant || `${user.nom.toLowerCase()}.${user.prenom.toLowerCase()}`;
        const lastConnection = formatDateTime(user.derniere_connexion) || user.derniere_connexion || 'Jamais';
        
        row.innerHTML = `
            <td><strong>${identifiant}</strong></td>
            <td>${user.nom}</td>
            <td>${user.prenom}</td>
            <td>${user.appartement}</td>
            <td>${user.immeuble}</td>
            <td>${lastConnection}</td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" ${user.actif ? 'checked' : ''} 
                           onchange="toggleUserStatus(${user.id}, this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editUser(${user.id})" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function toggleUserStatus(userId, isActive) {
    console.log(`Changement statut utilisateur ${userId}:`, isActive);
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/users/${userId}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + getAuthToken(),
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': config.csrfToken
            },
            body: JSON.stringify({ actif: isActive })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du statut');
        }
        
        // Mettre à jour localement
        const user = currentUsers.find(u => u.id === userId);
        if (user) {
            user.actif = isActive;
        }
        
        showNotification(
            `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`,
            'success'
        );
        
    } catch (error) {
        console.error('Erreur toggle statut:', error);
        
        // Remettre l'ancien état en cas d'erreur
        const checkbox = document.querySelector(`input[onchange*="${userId}"]`);
        if (checkbox) {
            checkbox.checked = !isActive;
        }
        
        showNotification('Erreur lors de la mise à jour du statut', 'error');
    }
}

function openUserModal(user = null) {
    console.log('Ouverture modal utilisateur:', user ? 'modification' : 'création');
    editingUser = user;
    
    const modal = document.getElementById('userModal');
    if (!modal) {
        console.error('Modal utilisateur introuvable');
        return;
    }
    
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');
    
    if (user) {
        title.textContent = 'Modifier l\'utilisateur';
        document.getElementById('userName').value = user.nom || '';
        document.getElementById('userPrenom').value = user.prenom || '';
        document.getElementById('userAppartement').value = user.appartement || '';
        document.getElementById('userImmeuble').value = user.immeuble || '';
        document.getElementById('userPin').value = user.pin || '';
        document.getElementById('userPassword').value = user.password || '';
    } else {
        title.textContent = 'Ajouter un utilisateur';
        form.reset();
    }
    
    modal.classList.add('active');
}

function editUser(userId) {
    const user = currentUsers.find(u => u.id === userId);
    if (user) {
        openUserModal(user);
    }
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) modal.classList.remove('active');
    editingUser = null;
}

async function handleUserSave(e) {
    e.preventDefault();
    console.log('Sauvegarde utilisateur...');
    
    const formData = new FormData(e.target);
    const nom = formData.get('nom').trim();
    const prenom = formData.get('prenom').trim();
    const pin = formData.get('pin').trim();
    const password = formData.get('password').trim();
    
    // Validations côté client
    if (!nom || !prenom) {
        showNotification('Le nom et le prénom sont obligatoires', 'error');
        return;
    }
    
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
        showNotification('Le code PIN doit contenir exactement 6 chiffres', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }
    
    const identifiant = `${nom.toLowerCase()}.${prenom.toLowerCase()}`;
    
    const userData = {
        nom: nom,
        prenom: prenom,
        identifiant: identifiant,
        appartement: formData.get('appartement').trim(),
        immeuble: formData.get('immeuble').trim(),
        pin: pin,
        password: password
    };
    
    if (!userData.appartement || !userData.immeuble) {
        showNotification('Tous les champs sont obligatoires', 'error');
        return;
    }
    
    setLoading('userForm', true);
    
    try {
        let response;
        
        if (editingUser) {
            // Modification utilisateur existant
            response = await fetch(`${config.apiBaseUrl}/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken(),
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': config.csrfToken
                },
                body: JSON.stringify(userData)
            });
        } else {
            // Création nouvel utilisateur
            response = await fetch(`${config.apiBaseUrl}/users`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getAuthToken(),
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': config.csrfToken
                },
                body: JSON.stringify(userData)
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
        }
        
        const savedUser = await response.json();
        
        if (editingUser) {
            // Mettre à jour l'utilisateur existant
            const userIndex = currentUsers.findIndex(u => u.id === editingUser.id);
            if (userIndex !== -1) {
                currentUsers[userIndex] = savedUser.data || savedUser;
            }
            showNotification('Utilisateur modifié avec succès', 'success');
        } else {
            // Ajouter le nouvel utilisateur
            currentUsers.push(savedUser.data || savedUser);
            showNotification(`Utilisateur créé avec succès. Identifiant: ${identifiant}`, 'success');
        }
        
        closeUserModal();
        displayUsers(currentUsers);
        
    } catch (error) {
        console.error('Erreur sauvegarde utilisateur:', error);
        
        if (error.message.includes('identifiant')) {
            showNotification('Un utilisateur avec cet identifiant existe déjà', 'error');
        } else {
            showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    }
    
    setLoading('userForm', false);
}

// ============================================
// GESTION ALERTES - Prêt pour Database
// ============================================

async function loadAlerts() {
    console.log('Chargement alertes depuis API...');
    setLoading('alertsPage', true);
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/alerts`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + getAuthToken(),
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': config.csrfToken
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const alerts = await response.json();
        currentAlerts = alerts.data || alerts;
        displayAlerts(currentAlerts);
        
        console.log(`${currentAlerts.length} alertes chargées`);
        
    } catch (error) {
        console.error('Erreur chargement alertes:', error);
        
        // Fallback - données de démonstration
        currentAlerts = [
            {
                id: 1,
                utilisateur: 'Admin',
                contenu: 'Maintenance serveur prévue à 16h00. Veuillez sauvegarder vos données.',
                priorite: 'urgent',
                statut: 'active',
                timestamp: '2025-01-23T14:30:00Z'
            },
            {
                id: 2,
                utilisateur: 'Utilisateur 19',
                contenu: 'Coupure d\'eau potable pendant 30 minutes à partir de 14h.',
                priorite: 'important',
                statut: 'active', 
                timestamp: '2025-01-23T13:15:00Z'
            },
            {
                id: 3,
                utilisateur: 'Admin',
                contenu: 'Distribution de repas prévue pour 19h.',
                priorite: 'information',
                statut: 'active',
                timestamp: '2025-01-23T12:00:00Z'
            }
        ];
        displayAlerts(currentAlerts);
        showNotification('Mode hors-ligne activé', 'info');
    }
    
    setLoading('alertsPage', false);
}

function displayAlerts(alerts) {
    console.log('Affichage alertes, filtre actuel:', currentFilter);
    const container = document.getElementById('alertsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const filteredAlerts = alerts.filter(alert => alert.priorite === currentFilter);
    console.log(`${filteredAlerts.length} alertes ${currentFilter} trouvées`);
    
    if (filteredAlerts.length === 0) {
        container.innerHTML = `<div class="no-alerts">Aucune alerte ${currentFilter} à afficher</div>`;
        return;
    }
    
    filteredAlerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `admin-alert ${alert.priorite}`;
        alertDiv.innerHTML = `
            <div class="alert-header">
                <div class="alert-user">${alert.utilisateur}</div>
                <div class="alert-actions">
                    <button class="action-btn edit-btn" onclick="editAlert(${alert.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteAlert(${alert.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="alert-content">${escapeHtml(alert.contenu)}</div>
            <div class="alert-meta">
                <span class="alert-badge ${alert.priorite}">${alert.priorite.toUpperCase()}</span>
                <span>${formatDateTime(alert.timestamp)}</span>
            </div>
        `;
        container.appendChild(alertDiv);
    });
}

function setAlertFilter(filter) {
    console.log('Changement filtre vers:', filter);
    currentFilter = filter;
    
    // Mettre à jour l'UI
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');
    
    // Réafficher les alertes
    displayAlerts(currentAlerts);
}

function selectPriority(priority) {
    console.log('Priorité sélectionnée:', priority);
    selectedPriority = priority;
    
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedBtn = document.querySelector(`[data-priority="${priority}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');
}

async function sendAlert() {
    console.log('Envoi alerte admin, priorité:', selectedPriority);
    
    const input = document.getElementById('adminAlertInput');
    if (!input) {
        console.error('Input alerte introuvable');
        return;
    }
    
    const content = input.value.trim();
    if (content === '') {
        showNotification('Veuillez saisir un message d\'alerte', 'error');
        return;
    }
    
    const alertData = {
        contenu: content,
        priorite: selectedPriority,
        statut: 'active'
    };
    
    setLoading('alertsPage', true);
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/alerts`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getAuthToken(),
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': config.csrfToken
            },
            body: JSON.stringify(alertData)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de l\'envoi de l\'alerte');
        }
        
        const newAlert = await response.json();
        currentAlerts.unshift(newAlert.data || newAlert);
        
        input.value = '';
        displayAlerts(currentAlerts);
        
        // Diffuser à tous les utilisateurs via WebSocket
        broadcastAlertToUsers(newAlert.data || newAlert);
        
        showNotification('Alerte envoyée à tous les utilisateurs avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur envoi alerte:', error);
        
        // Fallback local
        const newAlert = {
            id: Date.now(),
            utilisateur: 'Admin',
            contenu: content,
            priorite: selectedPriority,
            statut: 'active',
            timestamp: new Date().toISOString()
        };
        
        currentAlerts.unshift(newAlert);
        input.value = '';
        displayAlerts(currentAlerts);
        
        showNotification('Alerte créée (mode hors-ligne)', 'info');
    }
    
    setLoading('alertsPage', false);
}

function editAlert(alertId) {
    const alert = currentAlerts.find(a => a.id === alertId);
    if (!alert) return;
    
    editingAlert = alert;
    
    document.getElementById('alertStatus').value = alert.statut;
    document.getElementById('alertPriority').value = alert.priorite;
    document.getElementById('alertContent').value = alert.contenu;
    
    document.getElementById('alertModal').classList.add('active');
}

async function deleteAlert(alertId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) {
        return;
    }
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/alerts/${alertId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + getAuthToken(),
                'X-CSRF-TOKEN': config.csrfToken
            }
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }
        
        // Supprimer localement
        const index = currentAlerts.findIndex(a => a.id === alertId);
        if (index !== -1) {
            currentAlerts.splice(index, 1);
        }
        
        displayAlerts(currentAlerts);
        showNotification('Alerte supprimée avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur suppression alerte:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
}

async function handleAlertSave(e) {
    e.preventDefault();
    
    if (!editingAlert) return;
    
    const formData = new FormData(e.target);
    const alertData = {
        statut: formData.get('status'),
        priorite: formData.get('priority'),
        contenu: formData.get('content')
    };
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/alerts/${editingAlert.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + getAuthToken(),
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': config.csrfToken
            },
            body: JSON.stringify(alertData)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la modification');
        }
        
        // Mettre à jour localement
        const alertIndex = currentAlerts.findIndex(a => a.id === editingAlert.id);
        if (alertIndex !== -1) {
            currentAlerts[alertIndex] = { ...currentAlerts[alertIndex], ...alertData };
        }
        
        document.getElementById('alertModal').classList.remove('active');
        displayAlerts(currentAlerts);
        showNotification('Alerte modifiée avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur modification alerte:', error);
        showNotification('Erreur lors de la modification', 'error');
    }
    
    editingAlert = null;
}

// ============================================
// WEBSOCKET & DIFFUSION
// ============================================

function broadcastAlertToUsers(alertData) {
    console.log('Diffusion alerte à tous les utilisateurs:', alertData);
    
    // À implémenter avec WebSocket réel
    /*
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'admin_alert_broadcast',
            alert: alertData,
            target: 'all_users',
            admin_id: config.currentAdminId
        }));
    }
    */
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]:`, message);
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 2000;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Couleurs selon le type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'info':
            notification.style.backgroundColor = '#17a2b8';
            break;
        default:
            notification.style.backgroundColor = '#6c757d';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

function setLoading(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (element) {
        if (isLoading) {
            element.classList.add('loading');
        } else {
            element.classList.remove('loading');
        }
    }
}

function formatDateTime(timestamp) {
    if (!timestamp) return 'Jamais';
    
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return timestamp;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getAuthToken() {
    // À adapter selon votre système d'authentification
    return localStorage.getItem('admin_auth_token') || 'demo-admin-token';
}

function getCsrfToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : config.csrfToken;
}

// Styles d'animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
    
    .no-alerts {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 40px 20px;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 12px;
        margin: 20px 0;
        border: 2px dashed #ddd;
    }
`;
document.head.appendChild(style);
