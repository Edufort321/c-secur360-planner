import { useState, useEffect } from 'react';
import { Icon } from './Icon';

export function PhotoCarousel({ photos, onClose, startIndex = 0 }) {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setCurrentIndex(startIndex);
    }, [startIndex]);

    const handlePrevious = () => {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowLeft') handlePrevious();
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'Escape') onClose?.();
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!photos || photos.length === 0) {
        return null;
    }

    const currentPhoto = photos[currentIndex];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            {/* Bouton fermer */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-60 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
                <Icon name="close" size={24} />
            </button>

            {/* Compteur */}
            <div className="absolute top-4 left-4 z-60 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
                {currentIndex + 1} / {photos.length}
            </div>

            {/* Navigation précédent */}
            {photos.length > 1 && (
                <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-60 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                >
                    <Icon name="chevron-left" size={24} />
                </button>
            )}

            {/* Navigation suivant */}
            {photos.length > 1 && (
                <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-60 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
                >
                    <Icon name="chevron-right" size={24} />
                </button>
            )}

            {/* Image principale */}
            <div className="relative max-w-full max-h-full flex items-center justify-center p-8">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                )}

                <img
                    src={currentPhoto.url || currentPhoto}
                    alt={currentPhoto.nom || `Photo ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                />
            </div>

            {/* Miniatures en bas */}
            {photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-60">
                    <div className="flex space-x-2 bg-black bg-opacity-50 p-2 rounded-lg">
                        {photos.map((photo, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`relative w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                                    index === currentIndex
                                        ? 'border-blue-500 transform scale-110'
                                        : 'border-gray-400 hover:border-white'
                                }`}
                            >
                                <img
                                    src={photo.url || photo}
                                    alt={`Miniature ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}