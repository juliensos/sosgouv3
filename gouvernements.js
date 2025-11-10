// ==========================================
// GOUVERNEMENTS.JS - Gestion composition gouvernements
// ==========================================

(function() {
    'use strict';

    // Variables globales
    let currentGouvernement = {
        id: null,
        titre: '',
        description: '',
        postesRegaliens: [], // Array des 6 postes régaliens
        postesNonRegaliens: [], // Array des ministères ajoutés
        delegues: [] // Array des délégués
    };

    let allSecteurs = [];
    let allSousSecteurs = [];
    let currentPosteForPersonnalite = null; // Pour savoir quel poste on est en train de remplir

    // ==========================================
    // INITIALISATION
    // ==========================================

    async function initGouvernements() {
        console.log('🏛️ Initialisation gouvernements.js');

        // Charger les secteurs et sous-secteurs depuis la DB
        await loadSecteursFromDB();

        // Initialiser les event listeners
        initEventListeners();

        // Générer les 6 postes régaliens au chargement de la page
        generatePostesRegaliens();
    }

    // ==========================================
    // CHARGEMENT DES DONNÉES
    // ==========================================

    async function loadSecteursFromDB() {
        try {
            // Charger tous les secteurs
            const { data: secteurs, error: secteursError } = await supabase
                .from('secteurs')
                .select('*')
                .order('ordre', { ascending: true });

            if (secteursError) throw secteursError;
            allSecteurs = secteurs || [];

            // Charger tous les sous-secteurs
            const { data: sousSecteurs, error: souSecteursError } = await supabase
                .from('sous_secteurs')
                .select('*');

            if (souSecteursError) throw souSecteursError;
            allSousSecteurs = sousSecteurs || [];

            console.log('✅ Secteurs chargés:', allSecteurs.length);
            console.log('✅ Sous-secteurs chargés:', allSousSecteurs.length);
        } catch (error) {
            console.error('❌ Erreur chargement secteurs:', error);
            alert('Erreur lors du chargement des secteurs');
        }
    }

    // ==========================================
    // GÉNÉRATION DES POSTES RÉGALIENS
    // ==========================================

    async function generatePostesRegaliens() {
        const container = document.getElementById('ministeres-regaliens-container');
        if (!container) return;

        // Filtrer les secteurs régaliens
        const secteursRegaliens = allSecteurs.filter(s => s.type === 'regalien');

        for (const secteur of secteursRegaliens) {
            // Charger les sous-secteurs par défaut pour ce secteur
            const { data: sousSecteurs, error } = await supabase
                .from('secteurs_sous_secteurs_defaut')
                .select(`
                    sous_secteur_id,
                    sous_secteurs (
                        id,
                        nom
                    )
                `)
                .eq('secteur_id', secteur.id);

            const sousSecteursList = error ? [] : (sousSecteurs || []).map(ss => ss.sous_secteurs);

            const posteHTML = createPosteMinistereHTML(secteur, sousSecteursList, 'regalien');
            container.insertAdjacentHTML('beforeend', posteHTML);

            // Ajouter à l'objet gouvernement
            currentGouvernement.postesRegaliens.push({
                secteur_id: secteur.id,
                nom_secteur: secteur.nom,
                intitule_poste: secteur.intitule_poste_defaut,
                personnalite_id: null,
                personnalite_nom: '',
                sous_secteurs: sousSecteursList
            });
        }

        // Réattacher les event listeners sur les nouveaux éléments
        attachPosteEventListeners();
    }

    // ==========================================
    // CRÉATION HTML POSTE MINISTÈRE
    // ==========================================

    function createPosteMinistereHTML(secteur, sousSecteurs, type, customNom = null) {
        const posteId = `poste-${type}-${secteur.id}-${Date.now()}`;
        const sousSecteurText = sousSecteurs.map(ss => ss.nom).join(', ');
        const nomAffiche = customNom || secteur.nom;
        const showDeleteBtn = type !== 'regalien'; // Pas de suppression pour régaliens

        return `
            <div class="_3-bloc-min-r" data-poste-id="${posteId}" data-secteur-id="${secteur.id}" data-type="${type}">
                <div class="_3-gov-line-1">
                    <input class="mon-input3 w-input ministre-input" maxlength="256" 
                           placeholder="nom du ministre" type="text" 
                           data-poste-id="${posteId}"/>
                    <div class="_3-gov-mini-buttons">
                        <a href="#" class="_2-mini-bouton loupe w-inline-block btn-loupe" data-poste-id="${posteId}">
                            <div class="_2-picto-fontello-bouton"></div>
                        </a>
                        <a href="#" class="_2-mini-bouton people w-inline-block btn-people" data-poste-id="${posteId}">
                            <div class="_2-picto-fontello-bouton"></div>
                        </a>
                        ${showDeleteBtn ? `
                        <a href="#" class="_2-picto-fontello-bouton x w-inline-block btn-delete-poste" data-poste-id="${posteId}">
                            <div class="fontello-icon pink"></div>
                        </a>
                        ` : ''}
                    </div>
                </div>
                <div class="_3-gov-line-2">
                    <h3 class="heading-23">
                        ${nomAffiche}
                        ${type === 'non_regalien' ? `<a href="#" class="btn-modifier-intitule _2-code-link-button" data-poste-id="${posteId}">modifier l'intitulé</a>` : ''}
                    </h3>
                    <div class="_2-sous-secteurs">
                        <span class="sous-secteurs-text">${sousSecteurText || 'Aucun sous-secteur'}</span>
                        <a href="#" class="btn-modifier-sous-secteurs _2-code-link-button" data-poste-id="${posteId}">modifier</a>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // CRÉATION HTML DÉLÉGUÉ
    // ==========================================

    function createDelegueHTML(fonction, ministeresRattachement) {
        const delegueId = `delegue-${Date.now()}`;
        const ministeresText = ministeresRattachement.map(m => m.nom).join(', ');

        return `
            <div class="_3-bloc-del-nr-step2" data-delegue-id="${delegueId}">
                <div class="_3-gov-line-1">
                    <input class="mon-input3 w-input ministre-input" maxlength="256" 
                           placeholder="nom du delegué ministériel" type="text" 
                           data-delegue-id="${delegueId}"/>
                    <div class="_3-gov-mini-buttons">
                        <a href="#" class="_2-mini-bouton loupe w-inline-block btn-loupe-delegue" data-delegue-id="${delegueId}">
                            <div class="_2-picto-fontello-bouton"></div>
                        </a>
                        <a href="#" class="_2-mini-bouton people w-inline-block btn-people-delegue" data-delegue-id="${delegueId}">
                            <div class="_2-picto-fontello-bouton"></div>
                        </a>
                        <a href="#" class="_2-picto-fontello-bouton x w-inline-block btn-delete-delegue" data-delegue-id="${delegueId}">
                            <div class="fontello-icon pink"></div>
                        </a>
                    </div>
                </div>
                <div class="_3-gov-line-2">
                    <h3 class="heading-23">
                        ${fonction}
                        <a href="#" class="btn-modifier-fonction-delegue _2-code-link-button" data-delegue-id="${delegueId}">modifier la fonction</a>
                    </h3>
                    <div class="_2-sous-secteurs no">
                        Rattaché à: ${ministeresText}
                        <a href="#" class="btn-modifier-rattachement _2-code-link-button" data-delegue-id="${delegueId}">modifier</a>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    function initEventListeners() {
        // Bouton "Ajouter ministère"
        const btnAjouterMinistere = document.getElementById('btn-ajouter-ministere');
        if (btnAjouterMinistere) {
            btnAjouterMinistere.addEventListener('click', function(e) {
                e.preventDefault();
                openModalSecteur();
            });
        }

        // Bouton "Ajouter délégué"
        const btnAjouterDelegue = document.getElementById('btn-ajouter-delegue');
        if (btnAjouterDelegue) {
            btnAjouterDelegue.addEventListener('click', function(e) {
                e.preventDefault();
                openModalDelegue();
            });
        }

        // Bouton Brouillon
        const btnBrouillon = document.getElementById('btn-brouillon');
        if (btnBrouillon) {
            btnBrouillon.addEventListener('click', function(e) {
                e.preventDefault();
                saveGouvernement(false); // false = brouillon
            });
        }

        // Bouton Publier
        const btnPublier = document.getElementById('btn-publier');
        if (btnPublier) {
            btnPublier.addEventListener('click', function(e) {
                e.preventDefault();
                saveGouvernement(true); // true = publié
            });
        }

        // Validation modal secteur
        const btnSecteurValider = document.getElementById('secteur-valider-btn');
        if (btnSecteurValider) {
            btnSecteurValider.addEventListener('click', function(e) {
                e.preventDefault();
                validateModalSecteur();
            });
        }

        // Validation modal délégué
        const btnDelegueValider = document.getElementById('delegue-valider-btn');
        if (btnDelegueValider) {
            btnDelegueValider.addEventListener('click', function(e) {
                e.preventDefault();
                validateModalDelegue();
            });
        }

        // Fermeture modaux
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                closeAllModals();
            });
        });
    }

    function attachPosteEventListeners() {
        // Boutons loupe (liste personnalités)
        document.querySelectorAll('.btn-loupe').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const posteId = this.dataset.posteId;
                openPersonnalitesList(posteId);
            });
        });

        // Boutons people (liste personnalités)
        document.querySelectorAll('.btn-people').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const posteId = this.dataset.posteId;
                openPersonnalitesList(posteId);
            });
        });

        // Boutons modifier sous-secteurs
        document.querySelectorAll('.btn-modifier-sous-secteurs').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const posteId = this.dataset.posteId;
                openModalModifierSousSecteurs(posteId);
            });
        });

        // Boutons modifier intitulé
        document.querySelectorAll('.btn-modifier-intitule').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const posteId = this.dataset.posteId;
                modifierIntitulePoste(posteId);
            });
        });

        // Boutons supprimer poste
        document.querySelectorAll('.btn-delete-poste').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const posteId = this.dataset.posteId;
                if (confirm('Supprimer ce ministère ?')) {
                    deletePoste(posteId);
                }
            });
        });

        // Input ministre (recherche autocomplete)
        document.querySelectorAll('.ministre-input').forEach(input => {
            let timeout;
            input.addEventListener('input', function() {
                clearTimeout(timeout);
                const query = this.value.trim();
                const posteId = this.dataset.posteId || this.dataset.delegueId;
                
                if (query.length < 2) return;
                
                timeout = setTimeout(() => {
                    searchPersonnaliteAutocomplete(query, posteId, this);
                }, 300);
            });
        });
    }

    // ==========================================
    // MODAL SECTEUR MINISTÉRIEL
    // ==========================================

    function openModalSecteur() {
        const modal = document.getElementById('modal-secteur');
        const listContainer = document.getElementById('secteur-list');
        
        if (!modal || !listContainer) return;

        // Générer la liste des secteurs non-régaliens
        const secteursNonRegaliens = allSecteurs.filter(s => s.type === 'non_regalien');
        
        listContainer.innerHTML = secteursNonRegaliens.map(secteur => `
            <div role="listitem" class="w-dyn-item">
                <label class="w-checkbox _w-checkbox">
                    <div class="w-checkbox-input w-checkbox-input--inputType-custom checkbox"></div>
                    <input type="checkbox" class="secteur-checkbox" value="${secteur.id}" 
                           data-nom="${secteur.nom}" style="opacity:0;position:absolute;z-index:-1"/>
                    <span class="checkbox-label-2 w-form-label">${secteur.nom}</span>
                </label>
            </div>
        `).join('');

        modal.style.display = 'block';
    }

    async function validateModalSecteur() {
        const selectedCheckboxes = document.querySelectorAll('.secteur-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            alert('Veuillez sélectionner au moins un secteur');
            return;
        }

        const container = document.getElementById('ministeres-non-regaliens-container');
        const btnAjouter = document.getElementById('btn-ajouter-ministere');

        for (const checkbox of selectedCheckboxes) {
            const secteurId = checkbox.value;
            const secteur = allSecteurs.find(s => s.id === secteurId);
            
            if (!secteur) continue;

            // Charger les sous-secteurs par défaut
            const { data: sousSecteurs, error } = await supabase
                .from('secteurs_sous_secteurs_defaut')
                .select(`
                    sous_secteur_id,
                    sous_secteurs (
                        id,
                        nom
                    )
                `)
                .eq('secteur_id', secteur.id);

            const sousSecteursList = error ? [] : (sousSecteurs || []).map(ss => ss.sous_secteurs);

            // Créer le HTML et l'insérer AVANT le bouton
            const posteHTML = createPosteMinistereHTML(secteur, sousSecteursList, 'non_regalien');
            btnAjouter.insertAdjacentHTML('beforebegin', posteHTML);

            // Ajouter à l'objet gouvernement
            currentGouvernement.postesNonRegaliens.push({
                secteur_id: secteur.id,
                nom_secteur: secteur.nom,
                intitule_poste: secteur.intitule_poste_defaut,
                personnalite_id: null,
                personnalite_nom: '',
                sous_secteurs: sousSecteursList
            });
        }

        // Réattacher les event listeners
        attachPosteEventListeners();

        // Fermer le modal
        closeAllModals();
    }

    // ==========================================
    // MODAL DÉLÉGUÉ MINISTÉRIEL
    // ==========================================

    function openModalDelegue() {
        const modal = document.getElementById('modal-delegue');
        const listContainer = document.getElementById('delegue-ministeres-list');
        
        if (!modal || !listContainer) return;

        // Générer la liste de TOUS les ministères (régaliens + non-régaliens ajoutés)
        const tousLesMinisteres = [
            ...currentGouvernement.postesRegaliens,
            ...currentGouvernement.postesNonRegaliens
        ];

        listContainer.innerHTML = tousLesMinisteres.map((poste, index) => `
            <div role="listitem" class="w-dyn-item">
                <label class="w-checkbox _w-checkbox">
                    <div class="w-checkbox-input w-checkbox-input--inputType-custom checkbox"></div>
                    <input type="checkbox" class="ministere-checkbox" value="${index}" 
                           data-nom="${poste.nom_secteur}" style="opacity:0;position:absolute;z-index:-1"/>
                    <span class="checkbox-label-2 w-form-label">${poste.nom_secteur}</span>
                </label>
            </div>
        `).join('');

        modal.style.display = 'block';
    }

    function validateModalDelegue() {
        const selectedCheckboxes = document.querySelectorAll('.ministere-checkbox:checked');
        const fonction = document.getElementById('delegue-fonction').value.trim();

        if (selectedCheckboxes.length === 0) {
            alert('Veuillez sélectionner au moins un ministère de rattachement');
            return;
        }

        if (!fonction) {
            alert('Veuillez définir la fonction du délégué');
            return;
        }

        const ministeresRattachement = Array.from(selectedCheckboxes).map(cb => ({
            nom: cb.dataset.nom
        }));

        const container = document.getElementById('delegues-container');
        const btnAjouter = document.getElementById('btn-ajouter-delegue');

        // Créer le HTML et l'insérer AVANT le bouton
        const delegueHTML = createDelegueHTML(fonction, ministeresRattachement);
        btnAjouter.insertAdjacentHTML('beforebegin', delegueHTML);

        // Ajouter à l'objet gouvernement
        currentGouvernement.delegues.push({
            fonction: fonction,
            ministeres_rattachement: ministeresRattachement,
            personnalite_id: null,
            personnalite_nom: ''
        });

        // Réattacher les event listeners
        attachPosteEventListeners();

        // Réinitialiser le formulaire
        document.getElementById('delegue-fonction').value = '';
        document.querySelectorAll('.ministere-checkbox').forEach(cb => cb.checked = false);

        // Fermer le modal
        closeAllModals();
    }

    // ==========================================
    // RECHERCHE PERSONNALITÉ
    // ==========================================

    function openPersonnalitesList(posteId) {
        currentPosteForPersonnalite = posteId;
        // TODO: Ouvrir un modal avec la liste complète des personnalités
        // Pour l'instant, on utilise un simple prompt
        const nom = prompt('Entrez le nom de la personnalité :');
        if (nom) {
            assignPersonnaliteToPoste(posteId, null, nom);
        }
    }

    async function searchPersonnaliteAutocomplete(query, posteId, inputElement) {
        try {
            const { data, error } = await supabase
                .from('personnalites')
                .select('id, nom, prenom')
                .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%`)
                .limit(5);

            if (error) throw error;

            if (data && data.length > 0) {
                // Créer un dropdown d'autocomplete
                showAutocompleteDropdown(data, posteId, inputElement);
            }
        } catch (error) {
            console.error('Erreur recherche personnalité:', error);
        }
    }

    function showAutocompleteDropdown(personnalites, posteId, inputElement) {
        // Supprimer ancien dropdown s'il existe
        const oldDropdown = document.querySelector('.autocomplete-dropdown');
        if (oldDropdown) oldDropdown.remove();

        // Créer nouveau dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown';
        dropdown.style.cssText = 'position:absolute;background:white;border:1px solid #ddd;z-index:1000;max-height:200px;overflow-y:auto;';

        dropdown.innerHTML = personnalites.map(p => `
            <div class="autocomplete-item" data-perso-id="${p.id}" data-nom="${p.prenom} ${p.nom}" 
                 style="padding:10px;cursor:pointer;border-bottom:1px solid #eee;">
                ${p.prenom} ${p.nom}
            </div>
        `).join('');

        // Positionner le dropdown
        const rect = inputElement.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.width = rect.width + 'px';

        document.body.appendChild(dropdown);

        // Event listeners sur les items
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', function() {
                const persoId = this.dataset.persoId;
                const nom = this.dataset.nom;
                assignPersonnaliteToPoste(posteId, persoId, nom);
                inputElement.value = nom;
                dropdown.remove();
            });
        });

        // Fermer si on clique ailleurs
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target) && e.target !== inputElement) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 100);
    }

    function assignPersonnaliteToPoste(posteId, persoId, nom) {
        // Trouver le poste dans l'objet gouvernement et mettre à jour
        const posteElement = document.querySelector(`[data-poste-id="${posteId}"]`);
        if (!posteElement) return;

        const secteurId = posteElement.dataset.secteurId;
        const type = posteElement.dataset.type;

        if (type === 'regalien') {
            const poste = currentGouvernement.postesRegaliens.find(p => p.secteur_id === secteurId);
            if (poste) {
                poste.personnalite_id = persoId;
                poste.personnalite_nom = nom;
            }
        } else if (type === 'non_regalien') {
            const poste = currentGouvernement.postesNonRegaliens.find(p => p.secteur_id === secteurId);
            if (poste) {
                poste.personnalite_id = persoId;
                poste.personnalite_nom = nom;
            }
        }

        console.log('✅ Personnalité assignée:', nom, 'au poste', posteId);
    }

    // ==========================================
    // MODIFIER INTITULÉ
    // ==========================================

    function modifierIntitulePoste(posteId) {
        const posteElement = document.querySelector(`[data-poste-id="${posteId}"]`);
        if (!posteElement) return;

        const h3 = posteElement.querySelector('.heading-23');
        const currentText = h3.textContent.split('modifier')[0].trim();
        
        const newIntitule = prompt('Nouvel intitulé du poste:', currentText);
        if (newIntitule && newIntitule.trim()) {
            h3.innerHTML = `${newIntitule.trim()} <a href="#" class="btn-modifier-intitule _2-code-link-button" data-poste-id="${posteId}">modifier l'intitulé</a>`;
            
            // Mettre à jour dans l'objet
            const secteurId = posteElement.dataset.secteurId;
            const poste = currentGouvernement.postesNonRegaliens.find(p => p.secteur_id === secteurId);
            if (poste) {
                poste.intitule_poste = newIntitule.trim();
            }
            
            // Réattacher l'event listener
            attachPosteEventListeners();
        }
    }

    // ==========================================
    // MODIFIER SOUS-SECTEURS
    // ==========================================

    function openModalModifierSousSecteurs(posteId) {
        // TODO: Ouvrir un modal avec checkboxes des sous-secteurs
        alert('Fonctionnalité "Modifier sous-secteurs" à venir');
    }

    // ==========================================
    // SUPPRIMER POSTE
    // ==========================================

    function deletePoste(posteId) {
        const posteElement = document.querySelector(`[data-poste-id="${posteId}"]`);
        if (!posteElement) return;

        const secteurId = posteElement.dataset.secteurId;
        
        // Supprimer de l'objet gouvernement
        const index = currentGouvernement.postesNonRegaliens.findIndex(p => p.secteur_id === secteurId);
        if (index !== -1) {
            currentGouvernement.postesNonRegaliens.splice(index, 1);
        }

        // Supprimer du DOM
        posteElement.remove();
    }

    // ==========================================
    // SAUVEGARDE GOUVERNEMENT
    // ==========================================

    async function saveGouvernement(isPublished) {
        const titre = document.getElementById('gouv-titre').value.trim();
        const description = document.getElementById('gouv-description').value.trim();

        if (!titre) {
            alert('Veuillez donner un nom à votre gouvernement');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Vous devez être connecté pour sauvegarder un gouvernement');
                return;
            }

            // 1. Créer ou mettre à jour le gouvernement
            const gouvernementData = {
                titre: titre,
                description: description,
                created_by: user.id,
                is_published: isPublished
            };

            let gouvernementId;

            if (currentGouvernement.id) {
                // UPDATE
                const { error } = await supabase
                    .from('gouvernements')
                    .update(gouvernementData)
                    .eq('id', currentGouvernement.id);

                if (error) throw error;
                gouvernementId = currentGouvernement.id;
            } else {
                // INSERT
                const { data, error } = await supabase
                    .from('gouvernements')
                    .insert([gouvernementData])
                    .select()
                    .single();

                if (error) throw error;
                gouvernementId = data.id;
                currentGouvernement.id = gouvernementId;
            }

            // 2. Sauvegarder tous les postes (régaliens + non-régaliens + délégués)
            await saveAllPostes(gouvernementId);

            alert(isPublished ? 'Gouvernement publié !' : 'Gouvernement sauvegardé en brouillon');
            
        } catch (error) {
            console.error('Erreur sauvegarde gouvernement:', error);
            alert('Erreur lors de la sauvegarde : ' + error.message);
        }
    }

    async function saveAllPostes(gouvernementId) {
        // Supprimer tous les anciens postes
        await supabase
            .from('postes_gouvernement')
            .delete()
            .eq('gouvernement_id', gouvernementId);

        let ordre = 1;

        // Sauvegarder les postes régaliens
        for (const poste of currentGouvernement.postesRegaliens) {
            await savePoste(gouvernementId, poste, 'regalien', ordre++);
        }

        // Sauvegarder les postes non-régaliens
        for (const poste of currentGouvernement.postesNonRegaliens) {
            await savePoste(gouvernementId, poste, 'non_regalien', ordre++);
        }

        // Sauvegarder les délégués
        for (const delegue of currentGouvernement.delegues) {
            await saveDelegue(gouvernementId, delegue, ordre++);
        }
    }

    async function savePoste(gouvernementId, poste, type, ordre) {
        const posteData = {
            gouvernement_id: gouvernementId,
            type: type,
            secteur_id: poste.secteur_id,
            personnalite_id: poste.personnalite_id,
            nom_poste_personnalise: poste.intitule_poste !== poste.nom_secteur ? poste.intitule_poste : null,
            ordre: ordre
        };

        const { data: posteCreated, error: posteError } = await supabase
            .from('postes_gouvernement')
            .insert([posteData])
            .select()
            .single();

        if (posteError) throw posteError;

        // Sauvegarder les sous-secteurs associés
        if (poste.sous_secteurs && poste.sous_secteurs.length > 0) {
            const sousSecteurData = poste.sous_secteurs.map(ss => ({
                poste_id: posteCreated.id,
                sous_secteur_id: ss.id
            }));

            const { error: ssError } = await supabase
                .from('postes_sous_secteurs')
                .insert(sousSecteurData);

            if (ssError) throw ssError;
        }
    }

    async function saveDelegue(gouvernementId, delegue, ordre) {
        const delegueData = {
            gouvernement_id: gouvernementId,
            type: 'delegue',
            personnalite_id: delegue.personnalite_id,
            fonction_delegue: delegue.fonction,
            ministeres_rattachement: [], // TODO: récupérer les IDs des postes
            ordre: ordre
        };

        const { error } = await supabase
            .from('postes_gouvernement')
            .insert([delegueData]);

        if (error) throw error;
    }

    // ==========================================
    // UTILITAIRES
    // ==========================================

    function closeAllModals() {
        document.getElementById('modal-secteur').style.display = 'none';
        document.getElementById('modal-delegue').style.display = 'none';
        document.getElementById('modal-add-perso-gouv').style.display = 'none';
    }

    // ==========================================
    // DÉMARRAGE
    // ==========================================

    // Attendre que Supabase soit initialisé
    if (typeof supabase !== 'undefined') {
        initGouvernements();
    } else {
        console.error('❌ Supabase non initialisé');
    }

})();
