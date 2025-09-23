// Code JavaScript pour la page de connexion
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const usernameInput = document.querySelector('input[name="username"]');
    const passwordInput = document.querySelector('input[type="password"]');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Récupérer les valeurs
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validation simple
        if (username === '' || password === '') {
            alert('Veuillez saisir votre identifiant et mot de passe');
            return;
        }
        
        // Simulation de la connexion (à remplacer par votre logique backend)
        if (validateLogin(username, password)) {
            // Connexion réussie - redirection vers la page de chat
            console.log('Connexion réussie pour:', username);
            window.location.href = 'chat.html';
        } else {
            alert('Identifiant ou mot de passe incorrect');
        }
    });

    // Fonction de validation (simulation - à remplacer par votre API)
    function validateLogin(username, password) {
        // Pour la démonstration, accepter n'importe quel identifiant/mot de passe non vide
        // Dans la vraie implémentation, ceci ferait un appel API
        
        /*
        // Exemple d'appel API réel :
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = 'chat.html';
            } else {
                alert('Identifiant ou mot de passe incorrect');
            }
        })
        .catch(error => {
            console.error('Erreur de connexion:', error);
            alert('Erreur de connexion');
        });
        */
        
        return true; // Simulation - accepter toute connexion
    }

    // Gestion de l'appui sur Entrée
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            form.dispatchEvent(new Event('submit'));
        }
    });
});
