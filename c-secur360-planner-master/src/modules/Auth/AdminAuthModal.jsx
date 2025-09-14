// ============== ADMIN AUTH MODAL ==============
// Modal d'authentification administrateur pour gestion des ressources

import React, { useState } from 'react';
import { Modal, ModalBody, ModalFooter } from '../../components/UI/Modal.jsx';
import { Icon } from '../../components/UI/Icon.jsx';
import { useAuth } from './AuthContext.jsx';

export function AdminAuthModal({ isOpen, onClose, onSuccess }) {
    const { loginAdmin, loading } = useAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!password) {
            setError('Veuillez entrer le mot de passe administrateur');
            return;
        }

        const result = await loginAdmin(password);

        if (result?.success) {
            setPassword('');
            onClose();
            onSuccess?.();
        } else {
            setError(result?.error || 'Mot de passe incorrect');
        }
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Authentification Administrateur"
            size="sm"
        >
            <ModalBody>
                <div className="space-y-4">
                    {/* Message d'avertissement */}
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                        <div className="flex">
                            <Icon name="warning" size={16} className="text-amber-400 mt-0.5 mr-2" />
                            <div className="text-sm text-amber-700">
                                <p className="font-medium">Accès Administrateur</p>
                                <p className="mt-1">
                                    Cette section permet de gérer les ressources (personnel et équipements).
                                    Un mot de passe administrateur est requis.
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                            <div className="flex">
                                <Icon name="error" size={20} className="text-red-400 mt-0.5 mr-2" />
                                {error}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mot de passe administrateur
                            </label>
                            <div className="relative">
                                <Icon
                                    name="settings"
                                    size={20}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="password"
                                    id="admin-password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError(''); // Clear error on input change
                                    }}
                                    className="
                                        w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md
                                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                                    "
                                    placeholder="••••••••••••"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>
                    </form>

                    {/* Information de contact */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex">
                            <Icon name="info" size={16} className="text-blue-400 mt-0.5 mr-2" />
                            <div className="text-sm text-blue-700">
                                <p className="font-medium">Besoin d'aide ?</p>
                                <p className="mt-1">
                                    Contactez votre coordinateur pour obtenir le mot de passe administrateur.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </ModalBody>

            <ModalFooter>
                <button
                    type="button"
                    onClick={handleClose}
                    className="
                        mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md
                        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                    "
                    disabled={loading}
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    onClick={handleSubmit}
                    className="
                        px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md
                        hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                        disabled:opacity-50 disabled:cursor-not-allowed flex items-center
                    "
                    disabled={loading}
                >
                    {loading && <Icon name="settings" size={16} className="animate-spin mr-2" />}
                    Accéder en tant qu'Admin
                </button>
            </ModalFooter>
        </Modal>
    );
}

export default AdminAuthModal;