/**
 * Hook de gestion des données principales de l'application
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Gère le localStorage et l'état global avec toutes les données par défaut
 */

const { useState, useEffect, useCallback } = React;

export const useAppData = () => {
    const [jobs, setJobs] = useState([]);
    const [personnel, setPersonnel] = useState([
        { 
            id: 1, 
            nom: "Éric Dufort", 
            poste: "1.1 -TECH", 
            succursale: "MDL - Sherbrooke", 
            disponible: true, 
            email: "eric@mdl.com", 
            telephone: "450-123-4567", 
            type: "interne",
            motDePasse: "tech123",
            permissions: { peutModifier: true, estCoordonnateur: false }, 
            visibleChantier: true 
        },
        { 
            id: 2, 
            nom: "Carl Lévesque", 
            poste: "1.2 - ING.", 
            succursale: "MDL - Terrebonne", 
            disponible: true, 
            email: "carl@mdl.com", 
            telephone: "450-123-4568", 
            type: "interne",
            motDePasse: "ing123",
            permissions: { peutModifier: true, estCoordonnateur: false }, 
            visibleChantier: true 
        },
        { 
            id: 3, 
            nom: "Miguel Morin", 
            poste: "1.3 - CPI", 
            succursale: "MDL - Québec", 
            disponible: true, 
            email: "miguel@mdl.com", 
            telephone: "418-123-4567", 
            type: "interne",
            motDePasse: "cpi123",
            permissions: { peutModifier: true, estCoordonnateur: false }, 
            visibleChantier: true 
        },
        { 
            id: 4, 
            nom: "Chad Rodrigue", 
            poste: "1.4 - COORD.", 
            succursale: "DUAL - Électrotech", 
            disponible: true, 
            email: "chad@dual.com", 
            telephone: "819-123-4567", 
            type: "interne",
            motDePasse: "coord123",
            permissions: { peutModifier: true, estCoordonnateur: true }, 
            visibleChantier: false 
        },
        { 
            id: 5, 
            nom: "Alexandre Gariépy-Gauvin", 
            poste: "1.5 - D.T.", 
            succursale: "CFM", 
            disponible: true, 
            email: "alex@cfm.com", 
            telephone: "450-123-4569", 
            type: "interne",
            motDePasse: "dt123",
            permissions: { peutModifier: false, estCoordonnateur: false }, 
            visibleChantier: true 
        },
        { 
            id: 6, 
            nom: "Test Admin", 
            poste: "ADMIN", 
            succursale: "Test", 
            disponible: true, 
            email: "test@test.com", 
            telephone: "000-000-0000", 
            type: "interne",
            motDePasse: "admin123",
            permissions: { peutModifier: true, estCoordonnateur: true }, 
            visibleChantier: false 
        }
    ]);

    const [equipements, setEquipements] = useState([
        { id: 1, nom: "DOBLE M4000", type: "Analyseur de réponse", succursale: "MDL - Sherbrooke", disponible: true, numeroSerie: "DM4000-001", derniereMaintenance: "2025-08-15" },
        { id: 2, nom: "DOBLE SFRA", type: "Analyseur de réponse", succursale: "MDL - Terrebonne", disponible: true, numeroSerie: "SFRA-002", derniereMaintenance: "2025-08-10" },
        { id: 3, nom: "TTR", type: "Testeur de rapport", succursale: "MDL - Québec", disponible: true, numeroSerie: "TTR-003", derniereMaintenance: "2025-07-20" },
        { id: 4, nom: "WINDING", type: "Testeur d'enroulement", succursale: "DUAL - Électrotech", disponible: true, numeroSerie: "WIN-004", derniereMaintenance: "2025-08-01" }
    ]);

    const [sousTraitants, setSousTraitants] = useState([]);

    // Types d'équipements personnalisables
    const [typesEquipements, setTypesEquipements] = useState([
        "Analyseur de réponse",
        "Testeur de rapport", 
        "Testeur d'enroulement",
        "Analyseur de gaz dissous",
        "Mégohmmètre",
        "Testeur d'isolation",
        "Analyseur de qualité d'huile"
    ]);

    // Ajouter un nouveau type d'équipement
    const addTypeEquipement = useCallback((newType) => {
        if (newType && !typesEquipements.includes(newType)) {
            setTypesEquipements(prev => [...prev, newType]);
        }
    }, [typesEquipements]);

    // Ajouter un nouveau sous-traitant
    const addSousTraitant = useCallback((newSousTraitant) => {
        if (newSousTraitant && newSousTraitant.trim()) {
            const nouveauSousTraitant = {
                id: Date.now(),
                nom: newSousTraitant.trim(),
                specialite: "À spécifier",
                telephone: "",
                email: "",
                disponible: true,
                tarif: "À négocier"
            };
            setSousTraitants(prev => [...prev, nouveauSousTraitant]);
            return nouveauSousTraitant.id;
        }
        return null;
    }, []);

    // Nouvelles variables d'état
    const [demandesConges, setDemandesConges] = useState([]);
    const [modeTheme, setModeTheme] = useState('jour'); // 'jour' ou 'nuit'

    // Sauvegarde automatique
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('planificateur-data-v4', JSON.stringify({ 
                jobs, personnel, equipements, sousTraitants, typesEquipements, demandesConges, modeTheme
            }));
        }, 1000);
        return () => clearTimeout(timer);
    }, [jobs, personnel, equipements, sousTraitants, typesEquipements, demandesConges, modeTheme]);

    // Chargement des données
    useEffect(() => {
        const saved = localStorage.getItem('planificateur-data-v4');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.jobs) setJobs(data.jobs);
                if (data.personnel) {
                    console.log('🔍 DONNÉES PERSONNEL DEPUIS LOCALSTORAGE:', data.personnel[0]); // Premier utilisateur
                    // Vérifier si les mots de passe sont présents, sinon garder les données par défaut
                    if (data.personnel[0] && !data.personnel[0].motDePasse) {
                        console.log('⚠️ DONNÉES LOCALSTORAGE SANS MOT DE PASSE - IGNORÉES');
                        // Ne pas écraser les données par défaut qui ont les mots de passe
                    } else {
                        setPersonnel(data.personnel);
                    }
                }
                if (data.equipements) setEquipements(data.equipements);
                if (data.sousTraitants) {
                    // Filtrer les sous-traitants fictifs
                    const cleanSousTraitants = data.sousTraitants.filter(st => 
                        st.nom !== "TechElec Solutions" && 
                        st.nom !== "Électro Services Plus"
                    );
                    setSousTraitants(cleanSousTraitants);
                }
                if (data.typesEquipements) setTypesEquipements(data.typesEquipements);
                if (data.demandesConges) setDemandesConges(data.demandesConges);
                if (data.modeTheme) setModeTheme(data.modeTheme);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            }
        }
    }, []);

    return {
        jobs, setJobs,
        personnel, setPersonnel,
        equipements, setEquipements,
        sousTraitants, setSousTraitants, addSousTraitant,
        typesEquipements, setTypesEquipements, addTypeEquipement,
        demandesConges, setDemandesConges,
        modeTheme, setModeTheme
    };
};