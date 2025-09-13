/**
 * Hook de gestion de l'intégration Google Drive
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Gère l'authentification OAuth2, la sauvegarde et le chargement automatiques
 */

const { useState, useEffect } = React;

export const useGoogleDrive = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [error, setError] = useState(null);

    // Configuration Google Drive - avec fallbacks sécurisés
    const GOOGLE_CLIENT_ID = (typeof process !== 'undefined' && process.env?.GOOGLE_CLIENT_ID) || 'demo-mode';
    const GOOGLE_API_KEY = (typeof process !== 'undefined' && process.env?.GOOGLE_API_KEY) || 'demo-mode';
    const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
    const SCOPES = 'https://www.googleapis.com/auth/drive.file';
    const DATA_FILE_NAME = 'c-secur360-planificateur-data.json';
    
    // Vérifier si Google Drive est disponible
    const isGoogleDriveAvailable = GOOGLE_CLIENT_ID !== 'demo-mode' && GOOGLE_API_KEY !== 'demo-mode';

    // Initialisation Google API avec gestion d'erreur robuste
    const initializeGoogleAPI = async () => {
        // Si Google Drive n'est pas configuré, ne pas essayer d'initialiser
        if (!isGoogleDriveAvailable) {
            console.log('ℹ️ Google Drive en mode démo - credentials non configurés');
            setError('Configuration Google Drive requise');
            setIsInitialized(true); // Marquer comme initialisé pour éviter les boucles
            return;
        }
        
        // Vérifier que les APIs Google sont chargées
        if (typeof gapi === 'undefined' || typeof google === 'undefined') {
            console.warn('⚠️ APIs Google non disponibles');
            setError('APIs Google non disponibles');
            setIsInitialized(true);
            return;
        }

        try {
            console.log('🚀 Initialisation Google Drive API...');
            
            // Initialiser gapi avec timeout
            const gapiLoaded = await Promise.race([
                new Promise((resolve) => {
                    gapi.load('client', resolve);
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout gapi.load')), 5000)
                )
            ]);

            await Promise.race([
                gapi.client.init({
                    apiKey: GOOGLE_API_KEY,
                    discoveryDocs: [DISCOVERY_DOC],
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout gapi.client.init')), 5000)
                )
            ]);

            // Initialiser Google Identity Services
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: SCOPES,
                callback: (tokenResponse) => {
                    if (tokenResponse.access_token) {
                        setIsAuthenticated(true);
                        setError(null);
                        console.log('✅ Authentification Google Drive réussie');
                    }
                },
            });

            window.googleTokenClient = tokenClient;
            setIsInitialized(true);
            console.log('✅ Google Drive API initialisée');
            
            // Vérifier si l'utilisateur est déjà connecté
            if (gapi.client.getToken()) {
                setIsAuthenticated(true);
            }

        } catch (error) {
            console.error('❌ Erreur initialisation Google Drive:', error);
            setError('Google Drive indisponible');
            setIsInitialized(true); // Marquer comme initialisé même en cas d'erreur
        }
    };

    // Connexion Google Drive
    const signIn = () => {
        if (!isGoogleDriveAvailable) {
            setError('Configuration Google Drive requise');
            return;
        }
        
        if (!isInitialized) {
            setError('Google Drive pas encore initialisé');
            return;
        }
        
        try {
            console.log('🔐 Demande de connexion Google Drive...');
            if (window.googleTokenClient) {
                window.googleTokenClient.requestAccessToken();
            } else {
                throw new Error('Token client non disponible');
            }
        } catch (error) {
            console.error('❌ Erreur connexion Google Drive:', error);
            setError('Erreur de connexion');
        }
    };

    // Déconnexion Google Drive
    const signOut = () => {
        try {
            const token = gapi.client.getToken();
            if (token !== null) {
                google.accounts.oauth2.revoke(token.access_token, () => {
                    console.log('🚪 Déconnexion Google Drive');
                });
                gapi.client.setToken(null);
            }
            setIsAuthenticated(false);
            setLastSync(null);
        } catch (error) {
            console.error('❌ Erreur déconnexion Google Drive:', error);
        }
    };

    // Rechercher le fichier de données
    const findDataFile = async () => {
        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${DATA_FILE_NAME}' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name, modifiedTime)',
            });

            const files = response.result.files;
            return files && files.length > 0 ? files[0] : null;
        } catch (error) {
            console.error('❌ Erreur recherche fichier:', error);
            throw error;
        }
    };

    // Sauvegarder les données sur Google Drive
    const saveToGoogleDrive = async (data) => {
        if (!isAuthenticated) {
            throw new Error('Non connecté à Google Drive');
        }

        setIsSyncing(true);
        setError(null);

        try {
            console.log('💾 Sauvegarde vers Google Drive...');

            const dataToSave = {
                ...data,
                lastModified: new Date().toISOString(),
                version: '1.0'
            };

            const existingFile = await findDataFile();

            const metadata = {
                name: DATA_FILE_NAME,
                parents: ['appDataFolder']
            };

            const multipart = 
                '--314159265358979323846\n' +
                'Content-Type: application/json\n\n' +
                JSON.stringify(metadata) + '\n' +
                '--314159265358979323846\n' +
                'Content-Type: application/json\n\n' +
                JSON.stringify(dataToSave) + '\n' +
                '--314159265358979323846--';

            const request = existingFile
                ? gapi.client.request({
                    path: `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}`,
                    method: 'PATCH',
                    params: { uploadType: 'multipart' },
                    headers: { 'Content-Type': 'multipart/related; boundary="314159265358979323846"' },
                    body: multipart
                })
                : gapi.client.request({
                    path: 'https://www.googleapis.com/upload/drive/v3/files',
                    method: 'POST',
                    params: { uploadType: 'multipart' },
                    headers: { 'Content-Type': 'multipart/related; boundary="314159265358979323846"' },
                    body: multipart
                });

            await request;
            setLastSync(new Date());
            console.log('✅ Sauvegarde Google Drive réussie');

        } catch (error) {
            console.error('❌ Erreur sauvegarde Google Drive:', error);
            setError('Erreur de sauvegarde');
            throw error;
        } finally {
            setIsSyncing(false);
        }
    };

    // Charger les données depuis Google Drive
    const loadFromGoogleDrive = async () => {
        if (!isAuthenticated) {
            return null;
        }

        setIsSyncing(true);
        setError(null);

        try {
            console.log('📥 Chargement depuis Google Drive...');
            
            const file = await findDataFile();
            if (!file) {
                console.log('ℹ️ Aucun fichier de données trouvé');
                return null;
            }

            const response = await gapi.client.drive.files.get({
                fileId: file.id,
                alt: 'media'
            });

            const data = JSON.parse(response.body);
            setLastSync(new Date(file.modifiedTime));
            console.log('✅ Chargement Google Drive réussi');
            
            return data;

        } catch (error) {
            console.error('❌ Erreur chargement Google Drive:', error);
            setError('Erreur de chargement');
            return null;
        } finally {
            setIsSyncing(false);
        }
    };

    // Initialisation au montage du composant
    React.useEffect(() => {
        // Approche défensive pour l'initialisation Google Drive
        const safeInitialize = async () => {
            try {
                // Vérification approfondie de la disponibilité des APIs
                if (typeof gapi === 'undefined' || typeof google === 'undefined') {
                    console.warn('⚠️ APIs Google non disponibles - fonctionnement en mode local');
                    setError('APIs Google non chargées');
                    setIsInitialized(true);
                    return;
                }

                // Vérifier que les objects gapi et google sont complètement chargés
                if (!gapi.load || !google.accounts) {
                    console.warn('⚠️ APIs Google incomplètement chargées');
                    setError('APIs Google non prêtes');
                    setIsInitialized(true);
                    return;
                }

                // Si tout est OK, initialiser
                await initializeGoogleAPI();
            } catch (error) {
                console.error('❌ Erreur lors de l\'initialisation sécurisée:', error);
                setError('Erreur d\'initialisation Google Drive');
                setIsInitialized(true);
            }
        };

        // Délai pour s'assurer que les scripts Google sont complètement chargés
        const initTimer = setTimeout(safeInitialize, 100);
        
        return () => clearTimeout(initTimer);
    }, []);

    return {
        isAuthenticated,
        isInitialized,
        isSyncing,
        lastSync,
        error,
        signIn,
        signOut,
        saveToGoogleDrive,
        loadFromGoogleDrive
    };
};