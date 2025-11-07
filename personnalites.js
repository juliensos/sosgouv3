// Gestion des personnalités avec statut, tri et filtres
document.addEventListener('DOMContentLoaded', function() {
    
    let tempVideos = [];
    let tempArticles = [];
    let allPersonnalites = []; // Cache des données
    
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
    
    if (adminModalBg) {
        adminModalBg.addEventListener('click', function() {
            if (adminModal) adminModal.style.display = 'none';
            this.style.display = 'none';
            resetAdminForm();
        });
    }
    
    // ========== AJOUT LIENS VIDEO/ARTICLE ==========
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
        videosList.innerHTML = tempVideos.length > 0 ? '<strong>Vidéos:</strong>' : '';
        videosList.innerHTML += tempVideos.map((url, index) => `
            <div style="display:flex; align-items:center; margin:5px 0; padding:8px; background:#f5f5f5; border-radius:4px;">
                <span style="flex:1; font-size:13px; overflow:hidden; text-overflow:ellipsis;">${url}</span>
                <button onclick="removeVideo(${index})" type="button" style="margin-left:10px; padding:4px 8px; background:#ff4444; color:white; border:none; border-radius:3px; cursor:pointer;">✕</button>
            </div>
        `).join('');
    }
    
    function updateArticlesList() {
        if (!articlesList) return;
        articlesList.innerHTML = tempArticles.length > 0 ? '<strong>Articles:</strong>' : '';
        articlesList.innerHTML += tempArticles.map((url, index) => `
            <div style="display:flex; align-items:center; margin:5px 0; padding:8px; background:#f5f5f5; border-radius:4px;">
                <span style="flex:1; font-size:13px; overflow:hidden; text-overflow:ellipsis;">${url}</span>
                <button onclick="removeArticle(${index})" type="button" style="margin-left:10px; padding:4px 8px; background:#ff4444; color:white; border:none; border-radius:3px; cursor:pointer;">✕</button>
            </div>
        `).join('');
    }
    
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
            const statut = parseInt(document.getElementById('admin-statut').value);
            
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
                        statut: statut,
                        created_by: user.id,
                        is_admin_created: true
                    }])
                    .select();
                
                if (error) {
                    alert('Erreur : ' + error.message);
                    return;
                }
                
                alert('Personnalité ajoutée avec succès !');
                resetAdminForm();
                if (adminModal) adminModal.style.display = 'none';
                if (adminModalBg) adminModalBg.style.display = 'none';
                
                // Recharger la liste si elle est affichée
                if (document.querySelector('._3-4_sous-menu-content-4').style.display !== 'none') {
                    loadPersonnalitesList();
                }
            } catch (err) {
                alert('Erreur lors de l\'ajout');
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
    
    // ========== RECHERCHE PERSONNALITÉ ==========
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
                    
                    if (error) return;
                    
                    if (data && data.length > 0) {
                        searchDropdown.innerHTML = data.map(perso => `
                            <div class="search-result-item" data-perso-id="${perso.id}">
                                <strong>${perso.prenom} ${perso.nom}</strong>
                                ${perso.metiers && perso.metiers.length > 0 ? '<br><small>' + perso.metiers.join(', ') + '</small>' : ''}
                                ${perso.statut ? '<br><small>Statut: ' + getStatutLabel(perso.statut) + '</small>' : ''}
                            </div>
                        `).join('');
                        searchDropdown.style.display = 'block';
                        
                        document.querySelectorAll('.search-result-item').forEach(item => {
                            item.addEventListener('click', function() {
                                loadPersonnalite(this.dataset.persoId);
                                searchDropdown.style.display = 'none';
                                searchInput.value = '';
                            });
                        });
                    } else {
                        searchDropdown.innerHTML = '<div class="search-result-item">Aucun résultat</div>';
                        searchDropdown.style.display = 'block';
                    }
                } catch (err) {
                    console.error(err);
                }
            }, 300);
        });
        
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
            
            if (error) return;
            
            document.getElementById('admin-nom').value = data.nom || '';
            document.getElementById('admin-prenom').value = data.prenom || '';
            document.getElementById('admin-metiers').value = data.metiers ? data.metiers.join(', ') : '';
            document.getElementById('admin-bio').value = data.bio_courte || '';
            document.getElementById('admin-expertise').value = data.expertise || '';
            document.getElementById('admin-engagement').value = data.engagement_politique || '';
            document.getElementById('admin-statut').value = data.statut || 0;
            
            tempVideos = data.liens_videos || [];
            tempArticles = data.liens_articles || [];
            updateVideosList();
            updateArticlesList();
        } catch (err) {
            console.error(err);
        }
    }
    
    // ========== FORMULAIRE UTILISATEUR ==========
    const userForm = document.getElementById('user-add-perso-form');
    if (userForm) {
        userForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const user = getUserSession();
            if (!user) {
                alert('Vous devez être connecté');
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
                        is_admin_created: false,
                        statut: 0
                    }])
                    .select();
                
                if (error) {
                    alert('Erreur : ' + error.message);
                    return;
                }
                
                alert('Personnalité ajoutée avec succès !');
                userForm.reset();
            } catch (err) {
                alert('Erreur lors de l\'ajout');
            }
        });
    }
    
    // ========== LISTE DES PERSONNALITÉS AVEC TRI ET FILTRES ==========
    function getStatutLabel(statut) {
        const labels = {0: 'néant', 1: 'jamais', 2: 'sous condition', 3: 'ok'};
        return `${statut} - ${labels[statut] || 'inconnu'}`;
    }
    
    async function loadPersonnalitesList() {
        const listContainer = document.getElementById('personnalites-list');
        if (!listContainer) return;
        
        try {
            const { data, error } = await supabase
                .from('personnalites')
                .select('*')
                .order('nom', { ascending: true });
            
            if (error) {
                console.error(error);
                return;
            }
            
            allPersonnalites = data || [];
            renderPersonnalitesList();
        } catch (err) {
            console.error(err);
        }
    }
    
    function renderPersonnalitesList() {
        const listContainer = document.getElementById('personnalites-list');
        if (!listContainer) return;
        
        const sortBy = document.getElementById('sort-select').value;
        const filterStatut = document.getElementById('filter-statut').value;
        
        // Filtrer
        let filtered = allPersonnalites;
        if (filterStatut !== 'all') {
            filtered = filtered.filter(p => p.statut === parseInt(filterStatut));
        }
        
        // Trier
        if (sortBy === 'alpha') {
            filtered.sort((a, b) => a.nom.localeCompare(b.nom));
            
            // Grouper par lettre
            const grouped = {};
            filtered.forEach(perso => {
                const letter = perso.nom[0].toUpperCase();
                if (!grouped[letter]) grouped[letter] = [];
                grouped[letter].push(perso);
            });
            
            listContainer.innerHTML = Object.keys(grouped).sort().map(letter => `
                <div style="margin:30px 0;">
                    <h2 style="background:#ffbbad; padding:10px; border-radius:5px;">${letter}</h2>
                    ${grouped[letter].map(perso => renderPersonnaliteCard(perso)).join('')}
                </div>
            `).join('');
            
        } else if (sortBy === 'metier') {
            // Grouper par métier
            const grouped = {};
            filtered.forEach(perso => {
                if (perso.metiers && perso.metiers.length > 0) {
                    perso.metiers.forEach(metier => {
                        if (!grouped[metier]) grouped[metier] = [];
                        grouped[metier].push(perso);
                    });
                } else {
                    if (!grouped['Sans métier']) grouped['Sans métier'] = [];
                    grouped['Sans métier'].push(perso);
                }
            });
            
            listContainer.innerHTML = Object.keys(grouped).sort().map(metier => `
                <div style="margin:30px 0;">
                    <h2 style="background:#ffbbad; padding:10px; border-radius:5px;">${metier}</h2>
                    ${grouped[metier].map(perso => renderPersonnaliteCard(perso)).join('')}
                </div>
            `).join('');
        }
    }
    
    function renderPersonnaliteCard(perso) {
        return `
            <div style="padding:15px; margin:10px 0; border:1px solid #ddd; border-radius:5px; background:#fff;">
                <h3 style="margin:0 0 5px 0;">${perso.prenom} ${perso.nom} <span style="font-size:14px; color:#666;">[${getStatutLabel(perso.statut)}]</span></h3>
                ${perso.metiers && perso.metiers.length > 0 ? '<p style="margin:5px 0;"><strong>Métiers:</strong> ' + perso.metiers.join(', ') + '</p>' : ''}
                ${perso.bio_courte ? '<p style="margin:5px 0;">' + perso.bio_courte + '</p>' : ''}
                ${perso.expertise ? '<p style="margin:5px 0;"><strong>Expertise:</strong> ' + perso.expertise.substring(0, 150) + (perso.expertise.length > 150 ? '...' : '') + '</p>' : ''}
            </div>
        `;
    }
    
    // Événements pour les filtres
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-statut');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', renderPersonnalitesList);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', renderPersonnalitesList);
    }
    
    // Charger la liste quand on clique sur le bouton
    const listeBouton = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0f03"]');
    if (listeBouton) {
        listeBouton.addEventListener('click', function() {
            setTimeout(loadPersonnalitesList, 100);
        });
    }
});
