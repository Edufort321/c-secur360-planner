import React from 'react';

export function JobModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden">
                <div className="flex-shrink-0 flex items-center justify-between p-6 bg-gray-900 rounded-t-xl">
                    <h2 className="text-xl font-bold text-white">Test Modal</h2>
                    <button onClick={onClose} className="text-white">×</button>
                </div>
                
                <div className="flex-1 overflow-hidden min-h-0 p-6">
                    <p>Contenu du modal de test - FONCTIONNE !</p>
                </div>
                
                <div className="flex-shrink-0 flex justify-between items-center p-6 border-t bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 border rounded-lg">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}