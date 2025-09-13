/**
 * Composant PhotoCarousel pour l'affichage de photos
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Carrousel d'images avec navigation et indicateurs
 */

import { Icon } from './Icon.js';

const { useState } = React;

export const PhotoCarousel = ({ photos, className = '' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!photos || photos.length === 0) {
        return React.createElement('div', {
            className: `${className} flex items-center justify-center bg-gray-100 text-gray-500`
        }, "Aucune photo");
    }

    const nextPhoto = () => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
    };

    const prevPhoto = () => {
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    return React.createElement('div', {
        className: `carousel-container ${className}`
    },
        React.createElement('div', {
            className: "carousel-track",
            style: { transform: `translateX(-${currentIndex * 100}%)` }
        },
            photos.map((photo, index) =>
                React.createElement('div', {
                    key: index,
                    className: "carousel-slide"
                },
                    React.createElement('img', {
                        src: photo.url || photo,
                        alt: photo.name || `Photo ${index + 1}`,
                        className: "carousel-image"
                    })
                )
            )
        ),
        photos.length > 1 && [
            React.createElement('button', {
                key: 'prev',
                className: "carousel-nav prev",
                onClick: prevPhoto
            },
                React.createElement(Icon, { name: 'chevronLeft', size: 16 })
            ),
            React.createElement('button', {
                key: 'next',
                className: "carousel-nav next",
                onClick: nextPhoto
            },
                React.createElement(Icon, { name: 'chevronRight', size: 16 })
            ),
            React.createElement('div', {
                key: 'indicators',
                className: "carousel-indicators"
            },
                photos.map((_, index) =>
                    React.createElement('div', {
                        key: index,
                        className: `carousel-indicator ${index === currentIndex ? 'active' : ''}`,
                        onClick: () => setCurrentIndex(index)
                    })
                )
            )
        ]
    );
};