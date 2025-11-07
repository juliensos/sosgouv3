// Configuration Supabase
const SUPABASE_URL = 'https://lbcmwivxvzeortvftxsi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiY213aXZ4dnplb3J0dmZ0eHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzc2MTgsImV4cCI6MjA3ODAxMzYxOH0.RN431cCTPF2D_1xH8HJX7Eey-s4STlU3F-ZZ8sxoE7I';

// Initialiser le client Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hash simple du mot de passe (à utiliser côté client pour comparaison)
// Note: En production, utilisez bcrypt côté serveur
async function hashPassword(password) {
    // Pour simplifier, on va comparer directement avec le hash stocké
    // Le hash bcrypt de "123456" est déjà dans la base
    return password;
}

// Fonction de connexion
async function login(username, password) {
    try {
        // Récupérer l'utilisateur depuis Supabase
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        console.log('Data reçue de Supabase:', data);

        if (error || !data) {
            console.error('Utilisateur non trouvé:', error);
            return { success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' };
        }

        // Vérifier le mot de passe (comparaison simple pour ce test)
        // En production, utilisez bcrypt.compare()
        if (password === '123456') {
            // Stocker les informations de session
            const userSession = {
                id: data.id,
                username: data.username,
                isAdmin: data.is_admin,
                loginTime: new Date().toISOString()
            };
            
            console.log('Session créée:', userSession);
            console.log('isAdmin:', userSession.isAdmin, 'Type:', typeof userSession.isAdmin);
            
            localStorage.setItem('userSession', JSON.stringify(userSession));
            return { success: true, user: userSession };
        } else {
            return { success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' };
        }
    } catch (err) {
        console.error('Erreur de connexion:', err);
        return { success: false, message: 'Erreur de connexion' };
    }
}

// Fonction d'inscription
async function signup(username, password) {
    try {
        // Hash du mot de passe bcrypt (pour test, on utilise le même hash)
        const passwordHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
        
        // Insérer le nouvel utilisateur
        const { data, error } = await supabase
            .from('users')
            .insert([
                { username: username, password_hash: passwordHash, is_admin: false }
            ])
            .select()
            .single();

        if (error) {
            console.error('Erreur d\'inscription:', error);
            if (error.code === '23505') {
                return { success: false, message: 'Ce nom d\'utilisateur existe déjà' };
            }
            return { success: false, message: 'Erreur lors de l\'inscription' };
        }

        // Connexion automatique après inscription
        const userSession = {
            id: data.id,
            username: data.username,
            isAdmin: data.is_admin,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('userSession', JSON.stringify(userSession));
        return { success: true, user: userSession };
    } catch (err) {
        console.error('Erreur d\'inscription:', err);
        return { success: false, message: 'Erreur lors de l\'inscription' };
    }
}

// Fonction de déconnexion
function logout() {
    localStorage.removeItem('userSession');
    updateUIForLoggedOutUser();
    location.reload(); // Recharger la page
}

// Vérifier si l'utilisateur est connecté
function isLoggedIn() {
    const session = localStorage.getItem('userSession');
    return session !== null;
}

// Récupérer la session utilisateur
function getUserSession() {
    const session = localStorage.getItem('userSession');
    return session ? JSON.parse(session) : null;
}

// Mettre à jour l'interface pour un utilisateur connecté
function updateUIForLoggedInUser(user) {
    console.log('updateUIForLoggedInUser appelée avec:', user);
    
    // Afficher le nom d'utilisateur
    const usernameDisplay = document.querySelector('.connected-username');
    if (usernameDisplay) {
        usernameDisplay.textContent = user.username;
        usernameDisplay.style.display = 'block';
    }

    // Afficher la partie admin si l'utilisateur est admin
    const adminPart = document.querySelector('.admine-part');
    console.log('adminPart trouvé:', adminPart);
    console.log('user.isAdmin:', user.isAdmin);
    
    if (adminPart) {
        if (user.isAdmin === true) {
            console.log('Affichage de la zone admin');
            adminPart.style.display = 'flex';
        } else {
            console.log('Masquage de la zone admin');
            adminPart.style.display = 'none';
        }
    }

    // Pré-remplir les informations personnelles
    const usernameInput = document.querySelector('input[placeholder="nom d\'utilisateur*"]');
    if (usernameInput) {
        usernameInput.value = user.username;
    }

    // Modifier le menu pour afficher "me déconnecter" au lieu de "me connecter"
    const connectLink = document.querySelector('.menu-link[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0985"]');
    if (connectLink) {
        connectLink.textContent = 'me déconnecter';
        connectLink.onclick = function(e) {
            e.preventDefault();
            logout();
        };
    }
}

// Mettre à jour l'interface pour un utilisateur non connecté
function updateUIForLoggedOutUser() {
    // Masquer le nom d'utilisateur
    const usernameDisplay = document.querySelector('.connected-username');
    if (usernameDisplay) {
        usernameDisplay.style.display = 'none';
    }

    // Masquer la partie admin
    const adminPart = document.querySelector('.admine-part');
    if (adminPart) {
        adminPart.style.display = 'none';
    }

    // Restaurer le texte "me connecter"
    const connectLink = document.querySelector('.menu-link[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0985"]');
    if (connectLink) {
        connectLink.textContent = 'me connecter';
        connectLink.onclick = null;
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'utilisateur est déjà connecté
    if (isLoggedIn()) {
        const user = getUserSession();
        updateUIForLoggedInUser(user);
    } else {
        updateUIForLoggedOutUser();
    }

    // Gérer le formulaire de connexion
    const loginForm = document.querySelector('form[id="email-form-13"]');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            const result = await login(username, password);
            
            if (result.success) {
                updateUIForLoggedInUser(result.user);
                // Fermer le modal
                const modal = document.querySelector('.cont-flex');
                if (modal) modal.style.display = 'none';
                const fondModal = document.querySelector('._3-fond-modal');
                if (fondModal) fondModal.style.display = 'none';
                
                location.reload(); // Recharger pour appliquer tous les changements
            } else {
                alert(result.message);
            }
        });
    }

    // Gérer le formulaire d'inscription
    const signupForms = document.querySelectorAll('form[id="email-form-13"]');
    if (signupForms.length > 1) {
        const signupForm = signupForms[1];
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('signup-username').value;
            const password = document.getElementById('signup-password').value;
            const passwordConfirm = document.getElementById('signup-password-confirm').value;

            if (password !== passwordConfirm) {
                alert('Les mots de passe ne correspondent pas');
                return;
            }

            const result = await signup(username, password);
            
            if (result.success) {
                updateUIForLoggedInUser(result.user);
                // Fermer le modal
                const modal = document.querySelector('.cont-flex');
                if (modal) modal.style.display = 'none';
                const fondModal = document.querySelector('._3-fond-modal');
                if (fondModal) fondModal.style.display = 'none';
                
                location.reload();
            } else {
                alert(result.message);
            }
        });
    }
});
