/**
 * Modal de gestion du personnel
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Modal complète avec photo, authentification et permissions
 */

import { Modal } from '../Modal.js';
import { Icon } from '../UI/Icon.js';
import { DropZone } from '../UI/DropZone.js';
import { getBureauOptions } from '../../utils/bureauUtils.js';

const { useState, useEffect } = React;

export const PersonnelModal = ({ isOpen, onClose, onSave, personnel = null }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        nom: '',
        poste: '1.1 -TECH',
        succursale: '',
        email: '',
        telephone: '',
        disponible: true,
        type: 'interne',
        photo: null,
        motDePasse: '',
        permissions: {
            peutModifier: true,
            estCoordonnateur: false
        },
        visibleChantier: true
    });

    useEffect(() => {
        if (isOpen) {
            if (personnel) {
                setForm({ 
                    ...personnel,
                    motDePasse: personnel.motDePasse || '',
                    permissions: personnel.permissions || { peutModifier: true, estCoordonnateur: false },
                    visibleChantier: personnel.visibleChantier !== undefined ? personnel.visibleChantier : true
                });
            } else {
                setForm({
                    nom: '',
                    poste: '1.1 -TECH',
                    succursale: '',
                    email: '',
                    telephone: '',
                    disponible: true,
                    type: 'interne',
                    photo: null,
                    motDePasse: '',
                    permissions: {
                        peutModifier: true,
                        estCoordonnateur: false
                    },
                    visibleChantier: true
                });
            }
        }
    }, [isOpen, personnel]);

    // Fonctions de gestion de la photo
    const handlePhotoAdded = (files) => {
        if (files.length > 0) {
            const file = files[0];
            const photoData = {
                id: Date.now(),
                name: file.name,
                url: URL.createObjectURL(file),
                file: file
            };
            setForm(prev => ({ ...prev, photo: photoData }));
        }
    };

    const removePhoto = () => {
        setForm(prev => ({ ...prev, photo: null }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.nom || !form.poste) {
            alert('Veuillez remplir les champs obligatoires');
            return;
        }

        const personData = {
            ...form,
            id: personnel ? personnel.id : Date.now()
        };

        onSave(personData);
        onClose();
    };

    return React.createElement(Modal, {
        isOpen,
        onClose,
        title: personnel ? 'Modifier le Personnel' : 'Ajouter du Personnel',
        size: 'lg'
    },
        React.createElement('form', { onSubmit: handleSubmit, className: "p-6 space-y-4" },
            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
                // Photo de profil
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Photo de profil"),
                    form.photo 
                        ? React.createElement('div', { className: "relative" },
                            React.createElement('img', {
                                src: form.photo.url,
                                alt: "Photo de profil",
                                className: "w-24 h-24 object-cover rounded-full mx-auto border-2 border-gray-200"
                            }),
                            React.createElement('button', {
                                type: 'button',
                                onClick: removePhoto,
                                className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            },
                                React.createElement(Icon, { name: 'x', size: 12 })
                            )
                          )
                        : React.createElement(DropZone, {
                            onFilesAdded: handlePhotoAdded,
                            acceptedTypes: ['image/*'],
                            className: "h-24 flex items-center justify-center"
                          },
                            React.createElement(Icon, { name: 'camera', size: 24, className: 'text-gray-400' })
                          )
                ),

                // Informations de base
                React.createElement('div', { className: "md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4" },
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Nom complet *"),
                    React.createElement('input', {
                        type: "text",
                        value: form.nom,
                        onChange: (e) => setForm({...form, nom: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                        required: true,
                        placeholder: "Ex: Jean Tremblay"
                    })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Poste *"),
                    React.createElement('select', {
                        value: form.poste,
                        onChange: (e) => setForm({...form, poste: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                        required: true
                    },
                        React.createElement('option', { value: "1.1 -TECH" }, "1.1 - TECH"),
                        React.createElement('option', { value: "1.2 - ING." }, "1.2 - ING."),
                        React.createElement('option', { value: "1.3 - CPI" }, "1.3 - CPI"),
                        React.createElement('option', { value: "1.4 - COORD." }, "1.4 - COORD."),
                        React.createElement('option', { value: "1.5 - D.T." }, "1.5 - D.T."),
                        React.createElement('option', { value: "2.1 - ADMIN" }, "2.1 - ADMIN")
                    )
                )
            ),

            React.createElement('div', null,
                React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Succursale"),
                React.createElement('select', {
                    value: form.succursale,
                    onChange: (e) => setForm({...form, succursale: e.target.value}),
                    className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                },
                    React.createElement('option', { value: "" }, "Sélectionner une succursale"),
                    ...getBureauOptions().slice(1).map(bureau => 
                        React.createElement('option', { key: bureau.value, value: bureau.value }, bureau.label)
                    )
                )
            )
        ),

        React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
            React.createElement('div', null,
                React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Email"),
                    React.createElement('input', {
                        type: "email",
                        value: form.email,
                        onChange: (e) => setForm({...form, email: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                        placeholder: "jean@entreprise.com"
                    })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Téléphone"),
                    React.createElement('input', {
                        type: "tel",
                        value: form.telephone,
                        onChange: (e) => setForm({...form, telephone: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                        placeholder: "450-123-4567"
                    })
                )
            ),

            React.createElement('div', { className: "flex items-center gap-4" },
                React.createElement('label', { className: "flex items-center gap-2" },
                    React.createElement('input', {
                        type: "checkbox",
                        checked: form.disponible,
                        onChange: (e) => setForm({...form, disponible: e.target.checked}),
                        className: "rounded"
                    }),
                    React.createElement('span', { className: "text-sm" }, "Disponible")
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Type"),
                    React.createElement('select', {
                        value: form.type,
                        onChange: (e) => setForm({...form, type: e.target.value}),
                        className: "p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    },
                        React.createElement('option', { value: "interne" }, "Interne"),
                        React.createElement('option', { value: "contractuel" }, "Contractuel"),
                        React.createElement('option', { value: "stagiaire" }, "Stagiaire")
                    )
                )
            ),

            // Authentification
            React.createElement('div', { className: "p-4 bg-blue-50 rounded-lg space-y-3" },
                React.createElement('h4', { className: "font-medium text-blue-800 mb-2" }, "🔐 Accès et authentification"),
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1 text-blue-700" }, "Mot de passe"),
                    React.createElement('div', { className: "relative" },
                        React.createElement('input', {
                            type: showPassword ? "text" : "password",
                            value: form.motDePasse,
                            onChange: (e) => setForm({...form, motDePasse: e.target.value}),
                            className: "w-full p-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500",
                            placeholder: "Entrez le mot de passe",
                            required: true
                        }),
                        React.createElement('button', {
                            type: "button",
                            onClick: () => setShowPassword(!showPassword),
                            className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none",
                            title: showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                        }, showPassword ? "👁️‍🗨️" : "👁️")
                    )
                )
            ),

            // Permissions et rôles
            React.createElement('div', { className: "p-4 bg-gray-50 rounded-lg space-y-3" },
                React.createElement('h4', { className: "font-medium text-gray-800 mb-2" }, "👥 Permissions et rôle"),
                React.createElement('div', { className: "flex flex-col gap-3" },
                    React.createElement('label', { className: "flex items-center gap-2" },
                        React.createElement('input', {
                            type: "checkbox",
                            checked: form.permissions.peutModifier,
                            onChange: (e) => setForm({
                                ...form, 
                                permissions: {...form.permissions, peutModifier: e.target.checked}
                            }),
                            className: "rounded"
                        }),
                        React.createElement('span', { className: "text-sm" }, "Peut modifier les événements"),
                        React.createElement('span', { className: "text-xs text-gray-500" }, "(sinon consultation seulement)")
                    ),
                    React.createElement('label', { className: "flex items-center gap-2" },
                        React.createElement('input', {
                            type: "checkbox",
                            checked: form.permissions.estCoordonnateur,
                            onChange: (e) => setForm({
                                ...form, 
                                permissions: {...form.permissions, estCoordonnateur: e.target.checked}
                            }),
                            className: "rounded"
                        }),
                        React.createElement('span', { className: "text-sm" }, "Coordonnateur"),
                        React.createElement('span', { className: "text-xs text-gray-500" }, "(accès étendu)")
                    ),
                    React.createElement('label', { className: "flex items-center gap-2" },
                        React.createElement('input', {
                            type: "checkbox",
                            checked: form.visibleChantier,
                            onChange: (e) => setForm({...form, visibleChantier: e.target.checked}),
                            className: "rounded"
                        }),
                        React.createElement('span', { className: "text-sm" }, "Visible dans le personnel de chantier"),
                        React.createElement('span', { className: "text-xs text-gray-500" }, "(décocher pour rôles administratifs)")
                    )
                )
            ),

            React.createElement('div', { className: "flex justify-end gap-3 pt-4 border-t" },
                React.createElement('button', {
                    type: "button",
                    onClick: onClose,
                    className: "px-6 py-2 border rounded-lg hover:bg-gray-50"
                }, "Annuler"),
                React.createElement('button', {
                    type: "submit",
                    className: "flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                },
                    React.createElement(Icon, { name: 'save', size: 16 }),
                    personnel ? "Modifier" : "Ajouter"
                )
            )
        )
    );
};