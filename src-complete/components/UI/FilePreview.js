/**
 * Composant FilePreview pour aperçu des fichiers
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Prévisualisation des fichiers téléversés avec miniatures
 */

import { Icon } from './Icon.js';

export const FilePreview = ({ file, onRemove }) => {
    const isImage = file.type?.startsWith('image/');
    const fileUrl = URL.createObjectURL(file);

    return React.createElement('div', {
        className: `file-preview ${isImage ? 'image' : 'document'}`
    },
        isImage 
            ? React.createElement('img', {
                src: fileUrl,
                alt: file.name,
                className: 'w-12 h-12 object-cover rounded'
              })
            : React.createElement(Icon, { 
                name: 'file', 
                size: 24, 
                className: 'text-blue-500' 
              }),
        React.createElement('div', { className: 'flex-1' },
            React.createElement('div', { className: 'font-medium text-sm' }, file.name),
            React.createElement('div', { className: 'text-xs text-gray-500' }, 
                `${(file.size / 1024).toFixed(1)} KB`
            )
        ),
        React.createElement('button', {
            onClick: () => onRemove(file),
            className: 'text-red-500 hover:text-red-700'
        },
            React.createElement(Icon, { name: 'x', size: 16 })
        )
    );
};