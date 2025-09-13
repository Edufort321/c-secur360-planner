/**
 * Modal de gestion des équipements
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Modal complète avec photos, gestion des bris, types personnalisés
 */

import { Modal } from '../Modal.js';
import { Icon } from '../UI/Icon.js';
import { DropZone } from '../UI/DropZone.js';
import { PhotoCarousel } from '../UI/PhotoCarousel.js';
import { getBureauOptions } from '../../utils/bureauUtils.js';

const { useState, useEffect } = React;

export const EquipementModal = ({ isOpen, onClose, onSave, equipement = null, typesEquipements, addTypeEquipement }) => {
    const [form, setForm] = useState({
        nom: '',
        type: '',
        succursale: '',
        numeroSerie: '',
        derniereMaintenance: '',
        disponible: true,
        photos: [],
        statut: 'disponible', // disponible, en_reparation, hors_service
        bris: null // { date, description, photos, statut }
    });

    const [newType, setNewType] = useState('');
    const [showNewTypeInput, setShowNewTypeInput] = useState(false);
    const [showBrisModal, setShowBrisModal] = useState(false);
    const [brisForm, setBrisForm] = useState({
        description: '',
        photos: [],
        statut: 'en_reparation'
    });

    useEffect(() => {
        if (isOpen) {
            if (equipement) {
                setForm({ ...equipement });
            } else {
                setForm({
                    nom: '',
                    type: '',
                    succursale: '',
                    numeroSerie: '',
                    derniereMaintenance: '',
                    disponible: true,
                    photos: [],
                    statut: 'disponible',
                    bris: null
                });
            }
            setNewType('');
            setShowNewTypeInput(false);
        }
    }, [isOpen, equipement]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.nom || !form.type) {
            alert('Veuillez remplir les champs obligatoires');
            return;
        }

        const equipData = {
            ...form,
            id: equipement ? equipement.id : Date.now()
        };

        onSave(equipData);
        onClose();
    };

    const handleAddNewType = () => {
        if (newType.trim()) {
            addTypeEquipement(newType.trim());
            setForm({...form, type: newType.trim()});
            setNewType('');
            setShowNewTypeInput(false);
        }
    };

    // Fonctions de gestion des photos
    const handlePhotosAdded = (files) => {
        const newPhotos = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            url: URL.createObjectURL(file),
            file: file
        }));
        setForm(prev => ({
            ...prev,
            photos: [...prev.photos, ...newPhotos]
        }));
    };

    const removePhoto = (photoToRemove) => {
        setForm(prev => ({
            ...prev,
            photos: prev.photos.filter(p => p.id !== photoToRemove.id)
        }));
    };

    // Fonctions de gestion des bris
    const handleBrisSubmit = () => {
        const nouveauBris = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            description: brisForm.description,
            photos: brisForm.photos,
            statut: brisForm.statut
        };

        setForm(prev => ({
            ...prev,
            bris: nouveauBris,
            statut: brisForm.statut,
            disponible: false
        }));

        setShowBrisModal(false);
        setBrisForm({ description: '', photos: [], statut: 'en_reparation' });
    };

    const resoudreBris = () => {
        setForm(prev => ({
            ...prev,
            bris: null,
            statut: 'disponible',
            disponible: true
        }));
    };

    return React.createElement(Modal, {
        isOpen,
        onClose,
        title: equipement ? 'Modifier l\'Équipement' : 'Ajouter un Équipement',
        size: 'lg'
    },
        React.createElement('form', { onSubmit: handleSubmit, className: "p-6 space-y-4" },
            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Nom de l'équipement *"),
                    React.createElement('input', {
                        type: "text",
                        value: form.nom,
                        onChange: (e) => setForm({...form, nom: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                        required: true,
                        placeholder: "Ex: DOBLE M4000"
                    })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Type *"),
                    !showNewTypeInput ? 
                    React.createElement('div', { className: "flex gap-2" },
                        React.createElement('select', {
                            value: form.type,
                            onChange: (e) => {
                                if (e.target.value === '__nouveau__') {
                                    setShowNewTypeInput(true);
                                } else {
                                    setForm({...form, type: e.target.value});
                                }
                            },
                            className: "flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                            required: true
                        },
                            React.createElement('option', { value: "" }, "Sélectionner un type"),
                            ...((typesEquipements && Array.isArray(typesEquipements)) ? typesEquipements : []).map(type => 
                                React.createElement('option', { key: type, value: type }, type)
                            ),
                            React.createElement('option', { value: "__nouveau__" }, "➕ Nouveau type...")
                        )
                    ) :
                    React.createElement('div', { className: "flex gap-2" },
                        React.createElement('input', {
                            type: "text",
                            value: newType,
                            onChange: (e) => setNewType(e.target.value),
                            placeholder: "Nom du nouveau type",
                            className: "flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        }),
                        React.createElement('button', {
                            type: "button",
                            onClick: handleAddNewType,
                            className: "px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        }, "✓"),
                        React.createElement('button', {
                            type: "button",
                            onClick: () => setShowNewTypeInput(false),
                            className: "px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        }, "✗")
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
            ),

            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Numéro de série"),
                    React.createElement('input', {
                        type: "text",
                        value: form.numeroSerie,
                        onChange: (e) => setForm({...form, numeroSerie: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                        placeholder: "Ex: DM4000-001"
                    })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Dernière maintenance"),
                    React.createElement('input', {
                        type: "date",
                        value: form.derniereMaintenance,
                        onChange: (e) => setForm({...form, derniereMaintenance: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    })
                )
            ),

            React.createElement('div', null,
                React.createElement('label', { className: "flex items-center gap-2" },
                    React.createElement('input', {
                        type: "checkbox",
                        checked: form.disponible,
                        onChange: (e) => setForm({...form, disponible: e.target.checked}),
                        className: "rounded"
                    }),
                    React.createElement('span', { className: "text-sm" }, "Disponible")
                )
            ),

            // Photos de l'équipement
            React.createElement('div', null,
                React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Photos de l'équipement"),
                React.createElement(DropZone, {
                    onFilesAdded: handlePhotosAdded,
                    acceptedTypes: ['image/*'],
                    className: form.photos.length > 0 ? 'has-files' : ''
                },
                    React.createElement('div', { className: "text-center" },
                        React.createElement(Icon, { name: 'camera', size: 32, className: 'mx-auto text-gray-400 mb-2' }),
                        React.createElement('p', { className: 'text-sm text-gray-600' }, "Glissez vos photos ici"),
                        React.createElement('p', { className: 'text-xs text-gray-500' }, "JPG, PNG, GIF")
                    )
                ),
                form.photos.length > 0 && React.createElement('div', { className: "mt-4" },
                    React.createElement(PhotoCarousel, {
                        photos: form.photos,
                        className: "h-48"
                    })
                )
            ),

            // Gestion des bris
            React.createElement('div', { className: "border-t pt-4" },
                React.createElement('div', { className: "flex items-center justify-between mb-4" },
                    React.createElement('h4', { className: "text-lg font-medium" }, "Gestion des bris"),
                    form.bris 
                        ? React.createElement('button', {
                            type: 'button',
                            onClick: resoudreBris,
                            className: "px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                          }, "Marquer comme réparé")
                        : React.createElement('button', {
                            type: 'button',
                            onClick: () => setShowBrisModal(true),
                            className: "px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          }, "Signaler un bris")
                ),

                form.bris && React.createElement('div', {
                    className: `p-4 rounded-lg border ${
                        form.bris.statut === 'hors_service' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                    }`
                },
                    React.createElement('div', { className: "flex items-center gap-2 mb-2" },
                        React.createElement(Icon, { 
                            name: 'alertTriangle', 
                            size: 20, 
                            className: form.bris.statut === 'hors_service' ? 'text-red-500' : 'text-yellow-500'
                        }),
                        React.createElement('span', { className: "font-medium" },
                            form.bris.statut === 'hors_service' ? 'Hors service' : 'En réparation'
                        ),
                        React.createElement('span', { className: "text-sm text-gray-500" }, 
                            `- ${form.bris.date}`
                        )
                    ),
                    React.createElement('p', { className: "text-sm mb-2" }, form.bris.description),
                    form.bris.photos && form.bris.photos.length > 0 && 
                        React.createElement(PhotoCarousel, {
                            photos: form.bris.photos,
                            className: "h-32"
                        })
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
                    equipement ? "Modifier" : "Ajouter"
                )
            )
        ),

        // Modal de bris
        showBrisModal && React.createElement(Modal, {
            isOpen: showBrisModal,
            onClose: () => setShowBrisModal(false),
            title: "Signaler un bris",
            size: 'md'
        },
            React.createElement('div', { className: "p-6 space-y-4" },
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Statut"),
                    React.createElement('select', {
                        value: brisForm.statut,
                        onChange: (e) => setBrisForm({...brisForm, statut: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    },
                        React.createElement('option', { value: "en_reparation" }, "En réparation"),
                        React.createElement('option', { value: "hors_service" }, "Hors service")
                    )
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Description du bris"),
                    React.createElement('textarea', {
                        value: brisForm.description,
                        onChange: (e) => setBrisForm({...brisForm, description: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                        rows: 3,
                        required: true
                    })
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Photos du bris"),
                    React.createElement(DropZone, {
                        onFilesAdded: (files) => {
                            const newPhotos = files.map(file => ({
                                id: Date.now() + Math.random(),
                                name: file.name,
                                url: URL.createObjectURL(file),
                                file: file
                            }));
                            setBrisForm(prev => ({
                                ...prev,
                                photos: [...prev.photos, ...newPhotos]
                            }));
                        },
                        acceptedTypes: ['image/*']
                    },
                        React.createElement('div', { className: "text-center" },
                            React.createElement(Icon, { name: 'camera', size: 24, className: 'mx-auto text-gray-400 mb-2' }),
                            React.createElement('p', { className: 'text-xs text-gray-500' }, "Photos du problème")
                        )
                    )
                ),
                React.createElement('div', { className: "flex justify-end gap-3 pt-4" },
                    React.createElement('button', {
                        type: "button",
                        onClick: () => setShowBrisModal(false),
                        className: "px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    }, "Annuler"),
                    React.createElement('button', {
                        type: "button",
                        onClick: handleBrisSubmit,
                        className: "px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600",
                        disabled: !brisForm.description
                    }, "Signaler le bris")
                )
            )
        )
    );
};