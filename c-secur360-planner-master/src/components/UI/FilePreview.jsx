import { useState } from 'react';
import { Icon } from './Icon';

export function FilePreview({ files, onRemove, onPreview, className = "" }) {
    const [previewIndex, setPreviewIndex] = useState(null);

    if (!files || files.length === 0) {
        return null;
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (type) => {
        if (type.startsWith('image/')) return 'image';
        if (type.includes('pdf')) return 'document';
        if (type.includes('word')) return 'document';
        if (type.includes('excel') || type.includes('spreadsheet')) return 'document';
        return 'file';
    };

    const isImage = (type) => type.startsWith('image/');

    const handlePreview = (file, index) => {
        if (isImage(file.type)) {
            setPreviewIndex(index);
            onPreview?.(file, index);
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {files.map((fileData, index) => {
                const file = fileData.file || fileData;
                const fileUrl = fileData.url || fileData;
                const fileName = fileData.name || file.name || `Fichier ${index + 1}`;
                const fileSize = fileData.size || file.size || 0;
                const fileType = fileData.type || file.type || '';

                return (
                    <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                    >
                        {/* Miniature ou icône */}
                        <div className="flex-shrink-0">
                            {isImage(fileType) ? (
                                <div
                                    className="relative w-12 h-12 rounded overflow-hidden border cursor-pointer hover:opacity-80"
                                    onClick={() => handlePreview(fileData, index)}
                                >
                                    <img
                                        src={fileUrl}
                                        alt={fileName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div className="hidden w-full h-full bg-gray-200 items-center justify-center">
                                        <Icon name="image" size={20} className="text-gray-400" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                                    <Icon name={getFileIcon(fileType)} size={20} className="text-blue-600" />
                                </div>
                            )}
                        </div>

                        {/* Informations du fichier */}
                        <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatFileSize(fileSize)}
                                {fileType && (
                                    <span className="ml-2 text-gray-400">
                                        {fileType.split('/')[1]?.toUpperCase()}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                            {isImage(fileType) && (
                                <button
                                    onClick={() => handlePreview(fileData, index)}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Prévisualiser"
                                >
                                    <Icon name="eye" size={16} />
                                </button>
                            )}

                            <button
                                onClick={() => onRemove?.(index)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Supprimer"
                            >
                                <Icon name="close" size={16} />
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* Résumé si plusieurs fichiers */}
            {files.length > 1 && (
                <div className="text-xs text-gray-500 text-center pt-2 border-t">
                    {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
                    ({formatFileSize(files.reduce((total, f) => total + (f.size || f.file?.size || 0), 0))})
                </div>
            )}
        </div>
    );
}