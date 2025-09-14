// ============== HOOK APP DATA ==============
// Hook principal pour la gestion des données de l'application

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_PERSONNEL, DEFAULT_EQUIPMENTS, STORAGE_CONFIG } from '../../config/constants.js';

export function useAppData() {
    // États principaux
    const [jobs, setJobs] = useState([]);
    const [personnel, setPersonnel] = useState(DEFAULT_PERSONNEL);
    const [equipements, setEquipements] = useState(DEFAULT_EQUIPMENTS);
    const [sousTraitants, setSousTraitants] = useState([]);
    const [conges, setConges] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [selectedView, setSelectedView] = useState('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [lastSaved, setLastSaved] = useState(null);

    // Charger les données depuis localStorage au montage
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(STORAGE_CONFIG.KEY);
            if (savedData) {
                const data = JSON.parse(savedData);

                if (data.jobs) setJobs(data.jobs);
                if (data.personnel) {
                    // Merger avec le personnel par défaut pour conserver les mots de passe
                    const mergedPersonnel = DEFAULT_PERSONNEL.map(defaultPerson => {
                        const savedPerson = data.personnel.find(p => p.id === defaultPerson.id);
                        return savedPerson ? { ...defaultPerson, ...savedPerson } : defaultPerson;
                    });
                    // Ajouter les nouveaux utilisateurs sauvegardés
                    data.personnel.forEach(savedPerson => {
                        if (!DEFAULT_PERSONNEL.find(p => p.id === savedPerson.id)) {
                            mergedPersonnel.push(savedPerson);
                        }
                    });
                    setPersonnel(mergedPersonnel);
                } else {
                    setPersonnel(DEFAULT_PERSONNEL);
                }

                if (data.equipements) setEquipements(data.equipements);
                if (data.sousTraitants) setSousTraitants(data.sousTraitants);
                if (data.conges) setConges(data.conges);
                if (data.selectedView) setSelectedView(data.selectedView);
                if (data.selectedDate) setSelectedDate(new Date(data.selectedDate));

                setLastSaved(new Date(data.lastSaved || Date.now()));
            } else {
                // Première utilisation, utiliser les données par défaut
                setPersonnel(DEFAULT_PERSONNEL);
                setEquipements(DEFAULT_EQUIPMENTS);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            // En cas d'erreur, utiliser les données par défaut
            setPersonnel(DEFAULT_PERSONNEL);
            setEquipements(DEFAULT_EQUIPMENTS);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Sauvegarder les données avec délai pour éviter les sauvegardes fréquentes
    const saveData = useCallback(() => {
        const dataToSave = {
            jobs,
            personnel: personnel.map(p => {
                // Exclure les mots de passe de la sauvegarde
                const { password, ...personSansPassword } = p;
                return personSansPassword;
            }),
            equipements,
            sousTraitants,
            conges,
            selectedView,
            selectedDate: selectedDate.toISOString(),
            lastSaved: new Date().toISOString()
        };

        try {
            localStorage.setItem(STORAGE_CONFIG.KEY, JSON.stringify(dataToSave));
            setLastSaved(new Date());
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    }, [jobs, personnel, equipements, sousTraitants, conges, selectedView, selectedDate]);

    // Auto-sauvegarde avec délai
    useEffect(() => {
        if (isLoading) return;

        const timeoutId = setTimeout(() => {
            saveData();
        }, STORAGE_CONFIG.AUTO_SAVE_DELAY);

        return () => clearTimeout(timeoutId);
    }, [saveData, isLoading]);

    // Fonctions utilitaires
    const addJob = useCallback((job) => {
        const newJob = {
            ...job,
            id: job.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dateCreation: new Date().toISOString(),
            dateModification: new Date().toISOString()
        };
        setJobs(prev => [...prev, newJob]);
    }, []);

    const updateJob = useCallback((jobId, updates) => {
        setJobs(prev => prev.map(job =>
            job.id === jobId
                ? { ...job, ...updates, dateModification: new Date().toISOString() }
                : job
        ));
    }, []);

    const deleteJob = useCallback((jobId) => {
        setJobs(prev => prev.filter(job => job.id !== jobId));
    }, []);

    const addPersonnel = useCallback((person) => {
        const newPerson = {
            ...person,
            id: person.id || `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        setPersonnel(prev => [...prev, newPerson]);
    }, []);

    const updatePersonnel = useCallback((personId, updates) => {
        setPersonnel(prev => prev.map(person =>
            person.id === personId ? { ...person, ...updates } : person
        ));
    }, []);

    const addEquipement = useCallback((equipement) => {
        const newEquipement = {
            ...equipement,
            id: equipement.id || `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        setEquipements(prev => [...prev, newEquipement]);
    }, []);

    const updateEquipement = useCallback((equipementId, updates) => {
        setEquipements(prev => prev.map(eq =>
            eq.id === equipementId ? { ...eq, ...updates } : eq
        ));
    }, []);

    // Fonctions d'authentification
    const login = useCallback((nom, password) => {
        const user = personnel.find(p =>
            p.nom === nom && p.password === password
        );

        if (user) {
            setCurrentUser(user);
            return { success: true, user };
        }

        return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' };
    }, [personnel]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        setIsAdminMode(false);
    }, []);

    // Fonction de réinitialisation des données
    const resetData = useCallback(() => {
        setJobs([]);
        setPersonnel(DEFAULT_PERSONNEL);
        setEquipements(DEFAULT_EQUIPMENTS);
        setSousTraitants([]);
        setConges([]);
        localStorage.removeItem(STORAGE_CONFIG.KEY);
    }, []);

    return {
        // Données
        jobs,
        personnel,
        equipements,
        sousTraitants,
        conges,
        currentUser,
        isAdminMode,
        selectedView,
        selectedDate,
        isLoading,
        lastSaved,

        // Setters pour les vues
        setSelectedView,
        setSelectedDate,
        setIsAdminMode,

        // Actions jobs
        setJobs,
        addJob,
        updateJob,
        deleteJob,

        // Actions personnel
        setPersonnel,
        addPersonnel,
        updatePersonnel,

        // Actions équipements
        setEquipements,
        addEquipement,
        updateEquipement,

        // Actions autres
        setSousTraitants,
        setConges,

        // Authentification
        login,
        logout,

        // Utilitaires
        saveData,
        resetData
    };
}