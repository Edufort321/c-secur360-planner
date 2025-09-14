// ============== LOGIN MODAL ==============
// Modal de connexion utilisateur

import React, { useState } from 'react';
import { Modal, ModalBody, ModalFooter } from '../../components/UI/Modal.jsx';
import { Icon } from '../../components/UI/Icon.jsx';
import { useAuth } from './AuthContext.jsx';

export function LoginModal({ isOpen, onClose }) {
    const { login, loading } = useAuth();
    const [formData, setFormData] = useState({
        nom: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setError(''); // Clear error on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.nom || !formData.password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        const result = await login(formData.nom, formData.password);

        if (result?.success) {
            onClose();
            setFormData({ nom: '', password: '' });
        } else {
            setError(result?.error || 'Erreur de connexion');
        }
    };

    const handleClose = () => {
        setFormData({ nom: '', password: '' });
        setError('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Connexion"
            size="sm"
        >
            <ModalBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                            <div className="flex">
                                <Icon name="error" size={20} className="text-red-400 mt-0.5 mr-2" />
                                {error}
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                            Nom d'utilisateur
                        </label>
                        <div className="relative">
                            <Icon
                                name="user"
                                size={20}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                id="nom"
                                name="nom"
                                value={formData.nom}
                                onChange={handleInputChange}
                                className="
                                    w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                "
                                placeholder="Alexandre Desrochers"
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <Icon
                                name="visibility"
                                size={20}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="
                                    w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                "
                                placeholder="••••••••"
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    {/* Aide pour les utilisateurs */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex">
                            <Icon name="info" size={16} className="text-blue-400 mt-0.5 mr-2" />
                            <div className="text-sm text-blue-700">
                                <p className="font-medium">Utilisateurs disponibles:</p>
                                <ul className="mt-1 space-y-1">
                                    <li>• Alexandre Desrochers</li>
                                    <li>• Marc-André Bisson</li>
                                    <li>• Jean-François Lemieux</li>
                                    <li>• Simon Dubois</li>
                                    <li>• Patrick Tremblay</li>
                                    <li>• Michel Gagnon</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </form>
            </ModalBody>

            <ModalFooter>
                <button
                    type="button"
                    onClick={handleClose}
                    className="
                        mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md
                        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    "
                    disabled={loading}
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    onClick={handleSubmit}
                    className="
                        px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md
                        hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                        disabled:opacity-50 disabled:cursor-not-allowed flex items-center
                    "
                    disabled={loading}
                >
                    {loading && <Icon name="arrow_forward" size={16} className="animate-spin mr-2" />}
                    Se connecter
                </button>
            </ModalFooter>
        </Modal>
    );
}

export default LoginModal;