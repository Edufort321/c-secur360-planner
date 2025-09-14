import { useState, useCallback } from 'react';
import { Icon } from './Icon';

export function DropZone({ onFilesSelected, accept = "image/*", multiple = true, className = "" }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        // Vérifier si on sort vraiment de la zone
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            setIsUploading(true);
            await handleFiles(files);
            setIsUploading(false);
        }
    }, []);

    const handleFileInput = useCallback(async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setIsUploading(true);
            await handleFiles(files);
            setIsUploading(false);
            // Reset input pour permettre la resélection du même fichier
            e.target.value = '';
        }
    }, []);

    const handleFiles = async (files) => {
        try {
            // Filtrer les fichiers selon le type accepté
            const filteredFiles = files.filter(file => {
                if (accept === "image/*") {
                    return file.type.startsWith('image/');
                }
                return true;
            });

            if (filteredFiles.length === 0) {
                console.warn('Aucun fichier valide sélectionné');
                return;
            }

            // Limiter à 1 fichier si multiple = false
            const filesToProcess = multiple ? filteredFiles : [filteredFiles[0]];

            // Convertir les fichiers en base64 ou URL d'objet
            const processedFiles = await Promise.all(
                filesToProcess.map(async (file) => {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            resolve({
                                file,
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                url: e.target.result,
                                lastModified: file.lastModified
                            });
                        };
                        reader.readAsDataURL(file);
                    });
                })
            );

            onFilesSelected?.(processedFiles);
        } catch (error) {
            console.error('Erreur lors du traitement des fichiers:', error);
        }
    };

    return (
        <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
            } ${className}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
            />

            <div className="flex flex-col items-center space-y-3">
                {isUploading ? (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <p className="text-gray-600">Traitement des fichiers...</p>
                    </>
                ) : (
                    <>
                        <div className={`p-3 rounded-full ${
                            isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                            <Icon name="upload" size={32} />
                        </div>

                        {isDragOver ? (
                            <p className="text-blue-600 font-medium">
                                Relâchez pour déposer les fichiers
                            </p>
                        ) : (
                            <>
                                <p className="text-gray-600">
                                    Glissez-déposez vos fichiers ici ou{' '}
                                    <span className="text-blue-600 font-medium cursor-pointer hover:underline">
                                        cliquez pour sélectionner
                                    </span>
                                </p>

                                <div className="text-sm text-gray-500">
                                    {accept === "image/*" && (
                                        <p>Images acceptées : JPG, PNG, GIF, WebP</p>
                                    )}
                                    {multiple && (
                                        <p>Sélection multiple autorisée</p>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}