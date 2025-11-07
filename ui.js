// Gestion des menus et modaux
document.addEventListener('DOMContentLoaded', function() {
    
    // ========== GESTION DU MENU UTILISATEUR (en haut à droite) ==========
    
    // Bouton compte utilisateur
    const userButton = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd097a"]');
    const userMenu = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0984"]');
    
    if (userButton && userMenu) {
        userButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Toggle du menu utilisateur
            if (userMenu.style.display === 'none' || userMenu.style.display === '') {
                userMenu.style.display = 'block';
            } else {
                userMenu.style.display = 'none';
            }
        });
    }
    
    // Fermer le menu si on clique ailleurs
    document.addEventListener('click', function(e) {
        if (userMenu && !userButton.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.style.display = 'none';
        }
    });
    
    // ========== GESTION DU MODAL DE CONNEXION ==========
    
    // Lien "me connecter" dans le menu
    const connectLink = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0985"]');
    const loginModal = document.querySelector('.cont-flex');
    const loginModalBackground = document.querySelector('._3-fond-modal');
    
    if (connectLink) {
        connectLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Si l'utilisateur est connecté, cette fonction sera gérée par auth.js (déconnexion)
            if (this.textContent.trim() === 'me connecter') {
                // Ouvrir le modal de connexion
                if (loginModal) loginModal.style.display = 'flex';
                if (loginModalBackground) loginModalBackground.style.display = 'block';
                if (userMenu) userMenu.style.display = 'none';
            }
        });
    }
    
    // Bouton de fermeture du modal de connexion
    const closeLoginModal = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd09dd"]');
    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', function(e) {
            e.preventDefault();
            if (loginModal) loginModal.style.display = 'none';
            if (loginModalBackground) loginModalBackground.style.display = 'none';
        });
    }
    
    // Clic sur le fond du modal pour fermer
    if (loginModalBackground) {
        loginModalBackground.addEventListener('click', function() {
            if (loginModal) loginModal.style.display = 'none';
            this.style.display = 'none';
        });
    }
    
    // ========== GESTION DU MODAL "INFO PERSONNELLES" ==========
    
    const infoPersoLink = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0987"]');
    const infoPersoModal = document.querySelector('._4-page-modal');
    const infoPersoModalBackground = document.querySelector('._3-fond-modal-pages');
    
    if (infoPersoLink) {
        infoPersoLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (infoPersoModal) infoPersoModal.style.display = 'block';
            if (infoPersoModalBackground) infoPersoModalBackground.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        });
    }
    
    // Bouton de fermeture du modal info perso
    const closeInfoPersoModal = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0c45"]');
    if (closeInfoPersoModal) {
        closeInfoPersoModal.addEventListener('click', function(e) {
            e.preventDefault();
            if (infoPersoModal) infoPersoModal.style.display = 'none';
            if (infoPersoModalBackground) infoPersoModalBackground.style.display = 'none';
        });
    }
    
    // Clic sur le fond du modal pour fermer
    if (infoPersoModalBackground) {
        infoPersoModalBackground.addEventListener('click', function() {
            if (infoPersoModal) infoPersoModal.style.display = 'none';
            this.style.display = 'none';
        });
    }
    
    // ========== GESTION DU MENU PRINCIPAL (pages de contenu) ==========
    
    // Tous les contenus de page
    const contentSections = [
        document.querySelector('._3-0_sous-menu-content-0'), // A propos (index 0)
        document.querySelector('._3-1_sous-menu-content-1'), // Gouvernements publiés (index 1)
        document.querySelector('._3-2_sous-menu-content-2'), // Composer gouvernement (index 2)
        document.querySelector('._3-3_sous-menu-content-3'), // Ajouter personnalité (index 3)
        document.querySelector('._3-4_sous-menu-content-4')  // Liste personnalités (index 4)
    ];
    
    // Fonction pour afficher une section et masquer les autres
    function showSection(index) {
        contentSections.forEach((section, i) => {
            if (section) {
                section.style.display = (i === index) ? 'block' : 'none';
            }
        });
    }
    
    // Bouton "gouvernements publiés"
    const btnGouvernements = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0efa"]');
    if (btnGouvernements) {
        btnGouvernements.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(1);
        });
    }
    
    // Bouton "composer un gouvernement"
    const btnComposer = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0efd"]');
    if (btnComposer) {
        btnComposer.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(2);
        });
    }
    
    // Bouton "ajouter une personnalité"
    const btnAjouter = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0f00"]');
    if (btnAjouter) {
        btnAjouter.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(3);
        });
    }
    
    // Bouton "liste des personnalités"
    const btnListe = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0f03"]');
    if (btnListe) {
        btnListe.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(4);
        });
    }
    
    // Logo SOSGOUV pour revenir à l'accueil (A propos)
    const logo = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0976"]');
    if (logo) {
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(0);
        });
    }
    
    // ========== INITIALISATION ==========
    // Afficher la page "A propos" par défaut
    showSection(0);
    
});
