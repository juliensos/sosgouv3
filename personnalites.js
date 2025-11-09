// Gestion des personnalités
document.addEventListener('DOMContentLoaded', function() {
    
    let tempVideos = [];
    let tempArticles = [];
    let allPersonnalites = [];
    let currentEditingId = null; // Pour savoir si on édite ou crée
    
    // ========== MODAL ADMIN ==========
    const adminLink = document.querySelector('[data-w-id="04ef9136-aa3c-8a32-1874-52c7613bd891"]');
    const adminModal = document.querySelectorAll('._4-page-modal')[1];
    const adminModalBg = document.querySelector('[data-w-id="74c58c9f-a3ac-f587-492e-d6624dd5467b"]');
    
    if (adminLink) {
        adminLink.addEventListener('click', function(e) {
            e.preventDefault();
            const user = getUserSession();
            if (!user || !user.isAdmin) {
                alert('Accès réservé aux administrateurs');
                return;
            }
            currentEditingId = null; // Reset
            resetAdminForm();
            
            // Cacher le bouton supprimer en mode création
            const deleteBtn = document.getElementById('delete-perso-btn');
            if (deleteBtn) deleteBtn.style.display = 'none';
            
            if (adminModal) adminModal.style.display = 'block';
            if (adminModalBg) adminModalBg.style.display = 'block';
        });
    }
    
    const closeAdminModal = document.querySelector('[data-w-id="577ba5b4-1e99-3de5-9565-2497057080c0"]');
    if (closeAdminModal) {
        closeAdminModal.addEventListener('click', function(e) {
            e.preventDefault();
            if (adminModal) adminModal.style.display = 'none';
            if (adminModalBg) adminModalBg.style.display = 'none';
            currentEditingId = null;
            resetAdminForm();
        });
    }
    
    if (adminModalBg) {
        adminModalBg.addEventListener('click', function() {
            if (adminModal) adminModal.style.display = 'none';
            this.style.display = 'none';
            currentEditingId = null;
            resetAdminForm();
        });
    }
    
    // ========== VIDEOS/ARTICLES ==========
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
            <div style="display:flex;align-items:center;margin:5px 0;padding:8px;background:#f5f5f5;border-radius:4px;">
                <span style="flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;">${url}</span>
                <button onclick="removeVideo(${index})" type="button" style="margin-left:10px;padding:4px 8px;background:#ff4444;color:white;border:none;border-radius:3px;cursor:pointer;">✕</button>
            </div>
        `).join('');
    }
    
    function updateArticlesList() {
        if (!articlesList) return;
        articlesList.innerHTML = tempArticles.length > 0 ? '<strong>Articles:</strong>' : '';
        articlesList.innerHTML += tempArticles.map((url, index) => `
            <div style="display:flex;align-items:center;margin:5px 0;padding:8px;background:#f5f5f5;border-radius:4px;">
                <span style="flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;">${url}</span>
                <button onclick="removeArticle(${index})" type="button" style="margin-left:10px;padding:4px 8px;background:#ff4444;color:white;border:none;border-radius:3px;cursor:pointer;">✕</button>
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
    
    // ========== FORMULAIRE ADMIN - AJOUT/UPDATE ==========
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
            
            const dataToSave = {
                nom: nom,
                prenom: prenom,
                metiers: metiers,
                bio_courte: bio,
                expertise: expertise,
                engagement_politique: engagement,
                liens_videos: tempVideos,
                liens_articles: tempArticles,
                statut: statut
            };
            
            try {
                if (currentEditingId) {
                    // UPDATE
                    const { data, error } = await supabase
                        .from('personnalites')
                        .update(dataToSave)
                        .eq('id', currentEditingId)
                        .select();
                    
                    if (error) {
                        alert('Erreur : ' + error.message);
                        return;
                    }
                    alert('Personnalité mise à jour avec succès !');
                } else {
                    // INSERT
                    dataToSave.created_by = user.id;
                    dataToSave.is_admin_created = true;
                    
                    const { data, error } = await supabase
                        .from('personnalites')
                        .insert([dataToSave])
                        .select();
                    
                    if (error) {
                        alert('Erreur : ' + error.message);
                        return;
                    }
                    alert('Personnalité ajoutée avec succès !');
                }
                
                currentEditingId = null;
                resetAdminForm();
                if (adminModal) adminModal.style.display = 'none';
                if (adminModalBg) adminModalBg.style.display = 'none';
                
                if (document.querySelector('._3-4_sous-menu-content-4').style.display !== 'none') {
                    loadPersonnalitesList();
                }
            } catch (err) {
                alert('Erreur lors de l\'opération');
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
    
    // ========== RECHERCHE ==========
    const searchInput = document.getElementById('search-perso-input');
    const searchDropdown = document.getElementById('search-results-dropdown');
    let searchTimeout;
    
    if (searchInput && searchDropdown) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim().toLowerCase();
            
            if (query.length < 2) {
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
                    console.error('Erreur recherche:', err);
                }
            }, 300);
        });
        
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.style.display = 'none';
            }
        });
    } else {
        console.error('searchInput ou searchDropdown introuvable');
    }
    
    async function loadPersonnalite(id) {
        try {
            const { data, error } = await supabase
                .from('personnalites')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) return;
            
            currentEditingId = id; // Mode édition
            
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
            
            // Afficher le bouton supprimer
            const deleteBtn = document.getElementById('delete-perso-btn');
            if (deleteBtn) deleteBtn.style.display = 'inline-block';
        } catch (err) {
            console.error(err);
        }
    }
    
    // Bouton supprimer
    const deleteBtn = document.getElementById('delete-perso-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async function() {
            if (!currentEditingId) return;
            
            if (!confirm('Êtes-vous sûr de vouloir supprimer cette personnalité ?')) {
                return;
            }
            
            try {
                const { error } = await supabase
                    .from('personnalites')
                    .delete()
                    .eq('id', currentEditingId);
                
                if (error) {
                    alert('Erreur : ' + error.message);
                    return;
                }
                
                alert('Personnalité supprimée avec succès');
                currentEditingId = null;
                resetAdminForm();
                this.style.display = 'none';
                
                if (adminModal) adminModal.style.display = 'none';
                if (adminModalBg) adminModalBg.style.display = 'none';
                
                if (document.querySelector('._3-4_sous-menu-content-4').style.display !== 'none') {
                    loadPersonnalitesList();
                }
            } catch (err) {
                alert('Erreur lors de la suppression');
            }
        });
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
            
            // Vérification champs obligatoires
            if (!nom || !prenom) {
                alert('Le nom et le prénom sont obligatoires');
                return;
            }
            
            try {
                // Vérifier si la personnalité existe déjà
                const { data: existing, error: checkError } = await supabase
                    .from('personnalites')
                    .select('id, nom, prenom')
                    .ilike('nom', nom)
                    .ilike('prenom', prenom);
                
                if (checkError) {
                    alert('Erreur lors de la vérification : ' + checkError.message);
                    return;
                }
                
                if (existing && existing.length > 0) {
                    alert('Cette personnalité existe déjà dans la base de données');
                    return;
                }
                
                // Ajouter la personnalité
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
    
    // ========== LISTE AVEC TRI ET FILTRES ==========
    function getStatutClass(statut) {
        if (statut === 1) return '_1';
        if (statut === 2) return '_2';
        if (statut === 3) return '_3';
        return ''; // statut 0
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
        
        let filtered = allPersonnalites;
        if (filterStatut !== 'all') {
            filtered = filtered.filter(p => p.statut === parseInt(filterStatut));
        }
        
        if (sortBy === 'alpha') {
            filtered.sort((a, b) => a.nom.localeCompare(b.nom));
            
            const grouped = {};
            filtered.forEach(perso => {
                const letter = perso.nom[0].toUpperCase();
                if (!grouped[letter]) grouped[letter] = [];
                grouped[letter].push(perso);
            });
            
            listContainer.innerHTML = Object.keys(grouped).sort().map(letter => `
                <div class="_3-tile-bloc-padd-20-left">
                    <h2 class="heading-31">${letter}</h2>
                </div>
                ${grouped[letter].map(perso => renderPersonnaliteCard(perso)).join('')}
            `).join('');
            
        } else if (sortBy === 'metier') {
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
                <div class="_3-tile-bloc-padd-20-left">
                    <h2 class="heading-31">${metier}</h2>
                </div>
                ${grouped[metier].map(perso => renderPersonnaliteCard(perso)).join('')}
            `).join('');
        }
    }
    
    function renderPersonnaliteCard(perso) {
        const statutClass = getStatutClass(perso.statut);
        const metier = perso.metiers && perso.metiers.length > 0 ? perso.metiers[0] : '';
        
        const user = getUserSession();
        const isAdmin = user && user.isAdmin;
        
        return `
            <div class="_3-grid-perso">
                <div class="nom-prenom-metier">
                    <a href="#" class="w-inline-block">
                        <div class="nom-pr-nom">
                            <h4 class="heading-4-nom-prenom">${perso.nom}</h4>
                            <h4 class="heading-4-nom-prenom">${perso.prenom}</h4>
                        </div>
                    </a>
                    ${metier ? `<div class="bloc-metier"><h4 class="heading-4-nom-prenom grey">${metier}</h4></div>` : ''}
                    <div class="fontello-statut ${statutClass}"></div>
                </div>
                <div class="boutons-perso-group">
                    <div class="like-bloc">
                        <div class="_2-picto-fontello-bouton black-stroke icon-heart"></div>
                        <div class="_w-courant _w-bold _w-pink"><sup>0</sup></div>
                    </div>
                    <a href="#" class="_2-mini-bouton mini w-inline-block">
                        <div class="_2-picto-fontello-bouton icon-pin"></div>
                        <h6 class="heading-dyn mini">épingler</h6>
                    </a>
                    <a href="#" class="_2-mini-bouton mini w-inline-block">
                        <div class="_2-picto-fontello-bouton icon-edit"></div>
                        <h6 class="heading-dyn mini">Brouillon</h6>
                    </a>
                    ${isAdmin ? `
                    <button onclick="deletePersonnaliteFromList('${perso.id}')" style="background:#ff4444;color:white;border:none;padding:6px 12px;border-radius:3px;cursor:pointer;font-size:12px;margin-left:5px;">
                        🗑️ Supprimer
                    </button>
                    ` : ''}
                </div>
                ${perso.bio_courte ? `<p class="short-bio">${perso.bio_courte}</p>` : ''}
            </div>
        `;
    }
    
    // Fonction globale pour supprimer depuis la liste
    window.deletePersonnaliteFromList = async function(id) {
        const user = getUserSession();
        if (!user || !user.isAdmin) {
            alert('Accès réservé aux administrateurs');
            return;
        }
        
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette personnalité ?')) {
            return;
        }
        
        try {
            const { error } = await supabase
                .from('personnalites')
                .delete()
                .eq('id', id);
            
            if (error) {
                alert('Erreur : ' + error.message);
                return;
            }
            
            alert('Personnalité supprimée avec succès');
            loadPersonnalitesList();
        } catch (err) {
            alert('Erreur lors de la suppression');
        }
    };
    
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-statut');
    
    if (sortSelect) sortSelect.addEventListener('change', renderPersonnalitesList);
    if (filterSelect) filterSelect.addEventListener('change', renderPersonnalitesList);
    
    const listeBouton = document.querySelector('[data-w-id="b9597464-fc2b-b33e-b4cb-35073abd0f03"]');
    if (listeBouton) {
        listeBouton.addEventListener('click', function() {
            setTimeout(loadPersonnalitesList, 100);
        });
    }
});
