// Variables globales
let currentUser = null;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

// Configuration des événements
function setupEventListeners() {
    // Formulaire de connexion
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Lien "Mot de passe oublié"
    document.getElementById('forgotPasswordLink').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('pinPage');
    });
    
    // Formulaire PIN
    document.getElementById('pinForm').addEventListener('submit', handlePinValidation);
    document.getElementById('cancelPin').addEventListener('click', function() {
        showPage('loginPage');
    });
    
    // Formulaire réinitialisation
    document.getElementById('resetForm').addEventListener('submit', handlePasswordReset);
    document.getElementById('cancelReset').addEventListener('click', function() {
        showPage('loginPage');
    });
    
    // Gestion des touches Entrée
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('loginForm').dispatchEvent(new Event('submit'));
        }
    });
    
    document.getElementById('pinCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('pinForm').dispatchEvent(new Event('submit'));
        }
    });
}

// Gestion de la navigation entre pages
function showPage(pageId) {
    // Cacher toutes les pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Afficher la page demandée
    document.getElementById(pageId).classList.add('active');
    
    // Nettoyer les formulaires
    clearMessages();
    if (pageId === 'loginPage') {
        document.getElementById('loginForm').reset();
    } else if (pageId === 'pinPage') {
        document.getElementById('pinForm').reset();
    } else if (pageId === 'resetPage') {
        document.getElementById('resetForm').reset();
    }
}

// Gestion de la connexion
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Validation côté client
    if (username === '' || password === '') {
        showMessage('Veuillez saisir votre identifiant et mot de passe', 'error', 'loginForm');
        return;
    }
    
    // Afficher loading
    setLoading('loginForm', true);
    
    try {
        const success = await authenticateUser(username, password);
        
        if (success) {
            showMessage('Connexion réussie ! Redirection...', 'success', 'loginForm');
            
            // Redirection après un court délai
            setTimeout(() => {
                window.location.href = 'chat-unified.html';
            }, 1000);
        } else {
            showMessage('Identifiant ou mot de passe incorrect', 'error', 'loginForm');
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        showMessage('Erreur de connexion. Veuillez réessayer.', 'error', 'loginForm');
    }
    
    setLoading('loginForm', false);
}

// Fonction d'authentification
async function authenticateUser(username, password) {
    // Simulation de l'appel API - À remplacer par votre vraie API
    return new Promise((resolve) => {
        setTimeout(() => {
            // Pour la démo, accepter toute connexion non vide
            resolve(username.length > 0 && password.length > 0);
        }, 1000);
    });
    
    /* Version réelle avec API :
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Stocker les informations utilisateur si nécessaire
            currentUser = data.user;
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw error;
    }
    */
}

// Gestion de la validation du PIN
async function handlePinValidation(e) {
    e.preventDefault();
    
    const pin = document.getElementById('pinCode').value.trim();
    
    if (pin === '') {
        showMessage('Veuillez saisir votre code PIN', 'error', 'pinForm');
        return;
    }
    
    if (pin.length < 4) {
        showMessage('Le code PIN doit contenir au moins 4 chiffres', 'error', 'pinForm');
        return;
    }
    
    setLoading('pinForm', true);
    
    try {
        const isValidPin = await validatePin(pin);
        
        if (isValidPin) {
            showMessage('Code PIN valide ! Redirection...', 'success', 'pinForm');
            setTimeout(() => {
                showPage('resetPage');
            }, 1000);
        } else {
            showMessage('Code PIN incorrect', 'error', 'pinForm');
        }
    } catch (error) {
        console.error('Erreur validation PIN:', error);
        showMessage('Erreur lors de la validation. Veuillez réessayer.', 'error', 'pinForm');
    }
    
    setLoading('pinForm', false);
}

// Validation du PIN
async function validatePin(pin) {
    // Simulation - À remplacer par votre vraie API
    return new Promise((resolve) => {
        setTimeout(() => {
            // Pour la démo, accepter "1234" comme PIN valide
            resolve(pin === '1234');
        }, 800);
    });
    
    /* Version réelle avec API :
    try {
        const response = await fetch('/api/validate-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({ pin: pin })
        });
        
        const data = await response.json();
        return response.ok && data.valid;
    } catch (error) {
        throw error;
    }
    */
}

// Gestion de la réinitialisation du mot de passe
async function handlePasswordReset(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    
    // Validations
    if (newPassword === '' || confirmPassword === '') {
        showMessage('Veuillez remplir tous les champs', 'error', 'resetForm');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error', 'resetForm');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('Les mots de passe ne correspondent pas', 'error', 'resetForm');
        return;
    }
    
    setLoading('resetForm', true);
    
    try {
        const success = await resetPassword(newPassword);
        
        if (success) {
            showMessage('Mot de passe mis à jour avec succès !', 'success', 'resetForm');
            setTimeout(() => {
                showPage('loginPage');
                showMessage('Vous pouvez maintenant vous connecter avec votre nouveau mot de passe', 'success', 'loginForm');
            }, 2000);
        } else {
            showMessage('Erreur lors de la mise à jour du mot de passe', 'error', 'resetForm');
        }
    } catch (error) {
        console.error('Erreur réinitialisation:', error);
        showMessage('Erreur lors de la mise à jour. Veuillez réessayer.', 'error', 'resetForm');
    }
    
    setLoading('resetForm', false);
}

// Réinitialisation du mot de passe
async function resetPassword(newPassword) {
    // Simulation - À remplacer par votre vraie API
    return new Promise((resolve) => {
        setTimeout(() => {
            // Pour la démo, toujours réussir
            resolve(true);
        }, 1000);
    });
    
    /* Version réelle avec API :
    try {
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({ 
                password: newPassword,
                password_confirmation: newPassword
            })
        });
        
        const data = await response.json();
        return response.ok && data.success;
    } catch (error) {
        throw error;
    }
    */
}

// Fonctions utilitaires
function showMessage(message, type, formId) {
    // Supprimer les anciens messages
    clearMessages();
    
    const form = document.getElementById(formId);
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;
    
    // Insérer le message au début du formulaire
    form.insertBefore(messageDiv, form.firstChild);
    
    // Supprimer le message après 5 secondes (sauf pour les succès)
    if (type !== 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

function clearMessages() {
    document.querySelectorAll('.message').forEach(msg => msg.remove());
}

function setLoading(formId, isLoading) {
    const form = document.getElementById(formId);
    if (isLoading) {
        form.classList.add('loading');
    } else {
        form.classList.remove('loading');
    }
}

function getCsrfToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : '';
}

// Validation en temps réel
document.addEventListener('DOMContentLoaded', function() {
    // Validation du PIN en temps réel
    const pinInput = document.getElementById('pinCode');
    if (pinInput) {
        pinInput.addEventListener('input', function(e) {
            // Autoriser seulement les chiffres
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }
    
    // Validation des mots de passe en temps réel
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = this.value;
            
            if (confirmPassword && newPassword !== confirmPassword) {
                this.setCustomValidity('Les mots de passe ne correspondent pas');
            } else {
                this.setCustomValidity('');
            }
        });
    }
});
