/**
 * Composant DropZone pour téléverser des fichiers
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Zone de glisser-déposer avec support de sélection de fichiers
 */

const { useState } = React;

export const DropZone = ({ onFilesAdded, acceptedTypes = [], children, className = '' }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onFilesAdded(files);
        }
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onFilesAdded(files);
        }
    };

    return React.createElement('div', {
        className: `drop-zone ${isDragOver ? 'drag-over' : ''} ${className}`,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop
    },
        children,
        React.createElement('input', {
            type: 'file',
            multiple: true,
            accept: acceptedTypes.join(','),
            onChange: handleFileInput,
            className: 'hidden',
            id: 'file-input'
        }),
        React.createElement('label', {
            htmlFor: 'file-input',
            className: 'cursor-pointer text-blue-500 hover:text-blue-600'
        }, "ou cliquez pour sélectionner")
    );
};