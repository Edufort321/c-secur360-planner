/**
 * Hook de gestion des données principales de l'application
 * Gère le localStorage et l'état global des données
 */

const { useState, useEffect, useCallback } = React;

export const useAppData = () => {
    // ============== ÉTATS PRINCIPAUX ==============
    const [jobs, setJobs] = useState([]);
    const [personnel, setPersonnel] = useState([]);
    const [equipements, setEquipements] = useState([]);
    const [sousTraitants, setSousTraitants] = useState([]);
    const [typesEquipements, setTypesEquipements] = useState([]);
    const [demandesConges, setDemandesConges] = useState([]);
    const [evenements, setEvenements] = useState([]);
    const [modeTheme, setModeTheme] = useState('light');
    const [viewMode, setViewMode] = useState('calendar');
    const [currentDate, setCurrentDate] = useState(new Date());

    // ============== CONFIGURATION PAR DÉFAUT ==============
    const initializeDefaultData = () => {
        const defaultPersonnel = [
            { id: 'p1', nom: 'Jean Dupont', specialite: 'Technicien senior', email: 'jean.dupont@c-secur360.com', telephone: '555-0101', disponible: true, couleur: '#3b82f6' },
            { id: 'p2', nom: 'Marie Martin', specialite: 'Spécialiste sécurité', email: 'marie.martin@c-secur360.com', telephone: '555-0102', disponible: true, couleur: '#ef4444' },
            { id: 'p3', nom: 'Pierre Bernard', specialite: 'Installateur', email: 'pierre.bernard@c-secur360.com', telephone: '555-0103', disponible: true, couleur: '#10b981' }
        ];

        const defaultEquipements = [
            { id: 'e1', nom: 'Caméra IP Pro', type: 'camera', disponible: true, modele: 'CAM-IP-4K', description: 'Caméra 4K avec vision nocturne' },
            { id: 'e2', nom: 'Détecteur mouvement', type: 'detecteur', disponible: true, modele: 'DET-PIR-360', description: 'Détecteur PIR 360°' },
            { id: 'e3', nom: 'Centrale alarme', type: 'centrale', disponible: true, modele: 'CENT-GSM-PRO', description: 'Centrale avec module GSM' }
        ];

        const defaultTypesEquipements = [
            { id: 'camera', nom: 'Caméras', couleur: '#3b82f6', icone: '📹' },
            { id: 'detecteur', nom: 'Détecteurs', couleur: '#ef4444', icone: '🔍' },
            { id: 'centrale', nom: 'Centrales', couleur: '#10b981', icone: '🏠' },
            { id: 'accessoire', nom: 'Accessoires', couleur: '#f59e0b', icone: '🔧' }
        ];

        return {
            personnel: defaultPersonnel,
            equipements: defaultEquipements,
            typesEquipements: defaultTypesEquipements,
            jobs: [],
            sousTraitants: [],
            demandesConges: [],
            evenements: []
        };
    };

    // ============== GESTION DU LOCALSTORAGE ==============
    const saveToLocalStorage = useCallback((key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`✅ Données sauvegardées: ${key}`);
        } catch (error) {
            console.error(`❌ Erreur sauvegarde ${key}:`, error);
        }
    }, []);

    const loadFromLocalStorage = useCallback((key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`❌ Erreur chargement ${key}:`, error);
            return null;
        }
    }, []);

    // ============== CHARGEMENT INITIAL ==============
    useEffect(() => {
        console.log('🔄 Chargement des données depuis localStorage...');
        
        const savedData = loadFromLocalStorage('c-secur360-data');
        if (savedData) {
            console.log('✅ Données trouvées dans localStorage');
            setJobs(savedData.jobs || []);
            setPersonnel(savedData.personnel || []);
            setEquipements(savedData.equipements || []);
            setSousTraitants(savedData.sousTraitants || []);
            setTypesEquipements(savedData.typesEquipements || []);
            setDemandesConges(savedData.demandesConges || []);
            setEvenements(savedData.evenements || []);
            if (savedData.modeTheme) setModeTheme(savedData.modeTheme);
        } else {
            console.log('ℹ️ Aucune donnée trouvée, initialisation par défaut');
            const defaultData = initializeDefaultData();
            setPersonnel(defaultData.personnel);
            setEquipements(defaultData.equipements);
            setTypesEquipements(defaultData.typesEquipements);
            setJobs(defaultData.jobs);
            setSousTraitants(defaultData.sousTraitants);
            setDemandesConges(defaultData.demandesConges);
            setEvenements(defaultData.evenements);
        }
    }, [loadFromLocalStorage]);

    // ============== SAUVEGARDE AUTOMATIQUE ==============
    useEffect(() => {
        const dataToSave = {
            jobs,
            personnel,
            equipements,
            sousTraitants,
            typesEquipements,
            demandesConges,
            evenements,
            modeTheme,
            lastModified: new Date().toISOString()
        };
        saveToLocalStorage('c-secur360-data', dataToSave);
    }, [jobs, personnel, equipements, sousTraitants, typesEquipements, demandesConges, evenements, modeTheme, saveToLocalStorage]);

    // ============== FONCTIONS UTILITAIRES ==============
    const addJob = useCallback((job) => {
        const newJob = {
            ...job,
            id: job.id || `job-${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        setJobs(prev => [...prev, newJob]);
    }, []);

    const updateJob = useCallback((jobId, updates) => {
        setJobs(prev => prev.map(job => 
            job.id === jobId 
                ? { ...job, ...updates, updatedAt: new Date().toISOString() }
                : job
        ));
    }, []);

    const deleteJob = useCallback((jobId) => {
        setJobs(prev => prev.filter(job => job.id !== jobId));
    }, []);

    const addPersonnel = useCallback((person) => {
        const newPerson = {
            ...person,
            id: person.id || `p-${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        setPersonnel(prev => [...prev, newPerson]);
    }, []);

    const updatePersonnel = useCallback((personId, updates) => {
        setPersonnel(prev => prev.map(person => 
            person.id === personId 
                ? { ...person, ...updates }
                : person
        ));
    }, []);

    const addEquipement = useCallback((equipement) => {
        const newEquipement = {
            ...equipement,
            id: equipement.id || `e-${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        setEquipements(prev => [...prev, newEquipement]);
    }, []);

    const updateEquipement = useCallback((equipementId, updates) => {
        setEquipements(prev => prev.map(equipement => 
            equipement.id === equipementId 
                ? { ...equipement, ...updates }
                : equipement
        ));
    }, []);

    const addSousTraitant = useCallback((sousTraitant) => {
        const newSousTraitant = {
            ...sousTraitant,
            id: sousTraitant.id || `st-${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        setSousTraitants(prev => [...prev, newSousTraitant]);
    }, []);

    // ============== EXPORT DES DONNÉES ==============
    const exportData = useCallback(() => {
        return {
            jobs,
            personnel,
            equipements,
            sousTraitants,
            typesEquipements,
            demandesConges,
            evenements,
            modeTheme,
            exportedAt: new Date().toISOString(),
            version: '6.7'
        };
    }, [jobs, personnel, equipements, sousTraitants, typesEquipements, demandesConges, evenements, modeTheme]);

    const importData = useCallback((data) => {
        if (data.jobs) setJobs(data.jobs);
        if (data.personnel) setPersonnel(data.personnel);
        if (data.equipements) setEquipements(data.equipements);
        if (data.sousTraitants) setSousTraitants(data.sousTraitants);
        if (data.typesEquipements) setTypesEquipements(data.typesEquipements);
        if (data.demandesConges) setDemandesConges(data.demandesConges);
        if (data.evenements) setEvenements(data.evenements);
        if (data.modeTheme) setModeTheme(data.modeTheme);
    }, []);

    return {
        // États
        jobs,
        personnel,
        equipements,
        sousTraitants,
        typesEquipements,
        demandesConges,
        evenements,
        modeTheme,
        viewMode,
        currentDate,
        
        // Setters
        setJobs,
        setPersonnel,
        setEquipements,
        setSousTraitants,
        setTypesEquipements,
        setDemandesConges,
        setEvenements,
        setModeTheme,
        setViewMode,
        setCurrentDate,
        
        // Fonctions utilitaires
        addJob,
        updateJob,
        deleteJob,
        addPersonnel,
        updatePersonnel,
        addEquipement,
        updateEquipement,
        addSousTraitant,
        
        // Import/Export
        exportData,
        importData,
        
        // Utils
        saveToLocalStorage,
        loadFromLocalStorage
    };
};