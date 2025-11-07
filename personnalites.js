// Gestion des personnalités
document.addEventListener('DOMContentLoaded', function() {
    
    // Arrays temporaires pour les liens
    let tempVideos = [];
    let tempArticles = [];
    
    // ========== MODAL ADMIN - OUVRIR ==========
    const adminLink = document.querySelector('[data-w-id="04ef9136-aa3c-8a32-1874-52c7613bd891"]');
    const adminModal = document.querySelector('.admin-perso-modal');
    const adminModalBg = document.querySelector('.admin-modal-bg');
    
    if (adminLink) {
        adminLink.addEventListener('click', function(e) {
            e.preventDefault();
            const user = getUserSession();
            if (!user || !user.isAdmin) {
                alert('Accès réservé aux administrateurs');
                return;
            }
            if (adminModal) adminModal.style.display = 'block';
            if (adminModalBg) adminModalBg.style.display = 'block';
        });
    }
    
    // Fermer modal admin
    const closeAdminModal = document.querySelector('[data-w-id="577ba5b4-1e99-3de5-9565-2497057080c0"]');
    if (closeAdminModal) {
        closeAdminModal.addEventListener('click', function(e) {
            e.preventDefault();
            if (adminModal) adminModal.style.display = 'none';
            if (adminModalBg) adminModalBg.style.display = 'none';
            resetAdminForm();
        });
    }
    
    // Fermer en cliquant sur le fond
    if (adminModalBg) {
        adminModalBg.addEventListener('click', function() {
            if (adminModal) adminModal.style.display = 'none';
            this.style.display = 'none';
            resetAdminForm();
        });
    }
    
    // ========== AJOUT DE LIENS VIDEO/ARTICLE ==========
    const addVideoBtn = document.getElementById('add-video-btn');
    const addArticleBtn = document.getElementById('add-article-btn');
    const videosList = document.getElementById('videos-list');
    const articlesList = document.getElementById('articles-list');
    
    if (addVideoBtn) {
        addVideoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = prompt('URL de la vidéo :');
            if (url && url.trim()) {
                tempVideos.push(url.trim());
                updateVideosList();
            }
        });
    }
    
    if (addArticleBtn) {
        addArticleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = prompt('URL de l\'article :');
            if (url && url.trim()) {
                tempArticles.push(url.trim());
                updateArticlesList();
            }
        });
    }
    
    function updateVideosList() {
        if (!videosList) return;
        videosList.innerHTML = tempVideos.map((url, index) => `
            <div style="display:flex; align-items:center; margin:5px 0; padding:8px; background:#f5f5f5; border-radius:4px;">
                <span style="flex:1; font-size:13px; overflow:hidden; text-overflow:ellipsis;">${url}</span>
                <button onclick="removeVideo(${index})" style="margin-left:10px; padding:4px 8px; background:#ff4444; color:white; border:none; border-radius:3px; cursor:pointer;">✕</button>
            </div>
        `).join('');
    }
    
    function updateArticlesList() {
        if (!articlesList) return;
        articlesList.innerHTML = tempArticles.map((url, index) => `
            <div style="display:flex; align-items:center; margin:5px 0; padding:8px; background:#f5f5f5; border-radius:4px;">
                <span style="flex:1; font-size:13px; overflow:hidden; text-overflow:ellipsis;">${url}</span>
                <button onclick="removeArticle(${index})" style="margin-left:10px; padding:4px 8px; background:#ff4444; color:white; border:none; border-radius:3px; cursor:pointer;">✕</button>
            </div>
        `).join('');
    }
    
    // Fonctions globales pour supprimer
    window.removeVideo = function(index) {
        tempVideos.splice(index, 1);
        updateVideosList();
    };
    
    window.removeArticle = function(index) {
        tempArticles.splice(index, 1);
        updateArticlesList();
    };
    
    // ========== FORMULAIRE ADMIN - AJOUTER PERSONNALITÉ ==========
    const adminForm = document.getElementById('admin-add-perso-form');
    if (adminForm) {
        adminForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const user = getUserSession();
            if (!user || !user.isAdmin) {
                alert('Accès réservé aux administrateurs');
                return;
            }
            
            const nom = document.getElementById('admin-nom').value.trim();
            const prenom = document.getElementById('admin-prenom').value.trim();
            const metiersInput = document.getElementById('admin-metiers').value.trim();
            const bio = document.getElementById('admin-bio').value.trim();
            const expertise = document.getElementById('admin-expertise').value.trim();
            const engagement = document.getElementById('admin-engagement').value.trim();
            
            // Convertir les métiers en array
            const metiers = metiersInput ? metiersInput.split(',').map(m => m.trim()).filter(m => m) : [];
            
            try {
                const { data, error } = await supabase
                    .from('personnalites')
                    .insert([{
                        nom: nom,
                        prenom: prenom,
                        metiers: metiers,
                        bio_courte: bio,
                        expertise: expertise,
                        engagement_politique: engagement,
                        liens_videos: tempVideos,
                        liens_articles: tempArticles,
                        created_by: user.id,
                        is_admin_created: true
                    }])
                    .select();
                
                if (error) {
                    console.error('Erreur Supabase:', error);
                    alert('Erreur lors de l\'ajout : ' + error.message);
                    return;
                }
                
                alert('Personnalité ajoutée avec succès !');
                resetAdminForm();
                if (adminModal) adminModal.style.display = 'none';
                if (adminModalBg) adminModalBg.style.display = 'none';
                
            } catch (err) {
                console.error('Erreur:', err);
                alert('Erreur lors de l\'ajout de la personnalité');
            }
        });
    }
    
    function resetAdminForm() {
        if (adminForm) adminForm.reset();
        tempVideos = [];
        tempArticles = [];
        updateVideosList();
        updateArticlesList();
    }
    
    // ========== RECHERCHE PERSONNALITÉ (AUTOCOMPLETE) ==========
    const searchInput = document.getElementById('search-perso-input');
    const searchDropdown = document.getElementById('search-results-dropdown');
    let searchTimeout;
    
    if (searchInput && searchDropdown) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim().toLowerCase();
            
            if (query.length < 1) {
                searchDropdown.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                try {
                    const { data, error } = await supabase
                        .from('personnalites')
                        .select('*')
                        .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%`)
                        .limit(10);
                    
                    if (error) {
                        console.error('Erreur recherche:', error);
                        return;
                    }
                    
                    if (data && data.length > 0) {
                        searchDropdown.innerHTML = data.map(perso => `
                            <div class="search-result-item" data-perso-id="${perso.id}">
                                <strong>${perso.prenom} ${perso.nom}</strong>
                                ${perso.metiers && perso.metiers.length > 0 ? '<br><small>' + perso.metiers.join(', ') + '</small>' : ''}
                            </div>
                        `).join('');
                        searchDropdown.style.display = 'block';
                        
                        // Clic sur un résultat
                        document.querySelectorAll('.search-result-item').forEach(item => {
                            item.addEventListener('click', function() {
                                const persoId = this.dataset.persoId;
                                loadPersonnalite(persoId);
                                searchDropdown.style.display = 'none';
                                searchInput.value = '';
                            });
                        });
                    } else {
                        searchDropdown.innerHTML = '<div class="search-result-item">Aucun résultat</div>';
                        searchDropdown.style.display = 'block';
                    }
                } catch (err) {
                    console.error('Erreur recherche:', err);
                }
            }, 300);
        });
        
        // Fermer le dropdown si on clique ailleurs
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.style.display = 'none';
            }
        });
    }
    
    async function loadPersonnalite(id) {
        try {
            const { data, error } = await supabase
                .from('personnalites')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                console.error('Erreur chargement:', error);
                return;
            }
            
            // Remplir le formulaire avec les données
            document.getElementById('admin-nom').value = data.nom || '';
            document.getElementById('admin-prenom').value = data.prenom || '';
            document.getElementById('admin-metiers').value = data.metiers ? data.metiers.join(', ') : '';
            document.getElementById('admin-bio').value = data.bio_courte || '';
            document.getElementById('admin-expertise').value = data.expertise || '';
            document.getElementById('admin-engagement').value = data.engagement_politique || '';
            
            tempVideos = data.liens_videos || [];
            tempArticles = data.liens_articles || [];
            updateVideosList();
            updateArticlesList();
            
        } catch (err) {
            console.error('Erreur:', err);
        }
    }
    
    // ========== FORMULAIRE UTILISATEUR - AJOUTER PERSONNALITÉ (NOM + PRÉNOM) ==========
    const userForm = document.getElementById('user-add-perso-form');
    if (userForm) {
        userForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const user = getUserSession();
            if (!user) {
                alert('Vous devez être connecté pour ajouter une personnalité');
                return;
            }
            
            const nom = document.getElementById('user-nom').value.trim();
            const prenom = document.getElementById('user-prenom').value.trim();
            
            try {
                const { data, error } = await supabase
                    .from('personnalites')
                    .insert([{
                        nom: nom,
                        prenom: prenom,
                        created_by: user.id,
                        is_admin_created: false
                    }])
                    .select();
                
                if (error) {
                    console.error('Erreur Supabase:', error);
                    alert('Erreur lors de l\'ajout : ' + error.message);
                    return;
                }
                
                alert('Personnalité ajoutée avec succès !');
                userForm.reset();
                
            } catch (err) {
                console.error('Erreur:', err);
                alert('Erreur lors de l\'ajout de la personnalité');
            }
        });
    }
    
    // ========== AFFICHER LISTE DES PERSONNALITÉS ==========
    async function loadPersonnalitesList() {
        const listContainer = document.getElementById('personnalites-list');
        if (!listContainer) return;
        
        try {
            const { data, error } = await supabase
                .from('personnalites')
                .select('*')
                .order('nom', { ascending: true });
            
            if (error) {
                console.error('Erreur chargement liste:', error);
                return;
            }
            
            if (data && data.length > 0) {
                listContainer.innerHTML = data.map(perso => `
                    <div style="padding:15px; margin:10px 0; border:1px solid #ddd; border-radius:5px;">
                        <h3>${perso.prenom} ${perso.nom}</h3>
                        ${perso.metiers && perso.metiers.length > 0 ? '<p><strong>Métiers:</strong> ' + perso.metiers.join(', ') + '</p>' : ''}
                        ${perso.bio_courte ? '<p>' + perso.bio_courte + '</p>' : ''}
                    </div>
                `).join('');
            } else {
                listContainer.innerHTML = '<p>Aucune personnalité dans la base de données.</p>';
            }
        } catch (err) {
            console.error('Erreur:', err);
        }
    }
    
    // Charger la liste quand on affiche la page
    const listeBouton = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0f03"]');
    if (listeBouton) {
        listeBouton.addEventListener('click', function() {
            setTimeout(loadPersonnalitesList, 100);
        });
    }
});
