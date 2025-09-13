/**
 * Modal de gestion des congés
 * EXTRAIT DE LA VERSION COMPLÈTE B3hoWdZQh
 * Modal pour créer et modifier les demandes de congés
 */

const { useState, useEffect } = React;

export const CongesModal = ({ isOpen, onClose, onSave, personnel = null, allPersonnel = [], demandeExistante = null }) => {
    const [form, setForm] = useState({
        personnelId: personnel?.id || '',
        type: 'vacances', // 'vacances', 'maladie', 'personnel', 'formation'
        dateDebut: '',
        dateFin: '',
        motif: '',
        statut: 'en_attente', // 'en_attente', 'approuve', 'refuse'
        commentaire: ''
    });

    useEffect(() => {
        if (demandeExistante) {
            setForm(demandeExistante);
        } else if (personnel) {
            setForm(prev => ({
                ...prev,
                personnelId: personnel.id
            }));
        }
    }, [demandeExistante, personnel]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.personnelId || !form.dateDebut || !form.dateFin || !form.motif) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const selectedPersonnel = personnel || allPersonnel.find(p => p.id === form.personnelId);
        const congesData = {
            ...form,
            id: demandeExistante?.id || Date.now(),
            dateCreation: demandeExistante?.dateCreation || new Date().toISOString(),
            personnelNom: selectedPersonnel?.nom || 'Inconnu'
        };

        onSave(congesData);
        onClose();
    };

    if (!isOpen) return null;

    return React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" },
        React.createElement('div', { className: "bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" },
            React.createElement('h3', { className: "text-lg font-semibold mb-4" }, 
                demandeExistante ? 'Modifier la demande' : 'Nouvelle demande de congé'
            ),
            React.createElement('form', { onSubmit: handleSubmit, className: "space-y-4" },
                // Personnel - sélection ou lecture seule
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Personnel *"),
                    personnel ? 
                        React.createElement('input', {
                            type: "text",
                            value: personnel.nom,
                            readOnly: true,
                            className: "w-full p-2 border rounded-lg bg-gray-100"
                        }) :
                        React.createElement('select', {
                            value: form.personnelId,
                            onChange: (e) => setForm({...form, personnelId: e.target.value}),
                            className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                            required: true
                        },
                            React.createElement('option', { value: "" }, "Sélectionner un personnel"),
                            allPersonnel.map(p => 
                                React.createElement('option', { key: p.id, value: p.id }, p.nom)
                            )
                        )
                ),

                // Type de congé
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Type de congé *"),
                    React.createElement('select', {
                        value: form.type,
                        onChange: (e) => setForm({...form, type: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                        required: true
                    },
                        React.createElement('option', { value: "vacances" }, "Vacances"),
                        React.createElement('option', { value: "maladie" }, "Congé maladie"),
                        React.createElement('option', { value: "personnel" }, "Congé personnel"),
                        React.createElement('option', { value: "formation" }, "Formation"),
                        React.createElement('option', { value: "parental" }, "Congé parental")
                    )
                ),

                // Dates
                React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Date début *"),
                        React.createElement('input', {
                            type: "date",
                            value: form.dateDebut,
                            onChange: (e) => setForm({...form, dateDebut: e.target.value}),
                            className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                            required: true
                        })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Date fin *"),
                        React.createElement('input', {
                            type: "date",
                            value: form.dateFin,
                            onChange: (e) => setForm({...form, dateFin: e.target.value}),
                            className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                            required: true
                        })
                    )
                ),

                // Motif
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Motif *"),
                    React.createElement('textarea', {
                        value: form.motif,
                        onChange: (e) => setForm({...form, motif: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                        rows: 3,
                        required: true,
                        placeholder: "Décrivez le motif de votre demande..."
                    })
                ),

                // Statut (si modification par admin)
                demandeExistante && React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Statut"),
                    React.createElement('select', {
                        value: form.statut,
                        onChange: (e) => setForm({...form, statut: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    },
                        React.createElement('option', { value: "en_attente" }, "En attente"),
                        React.createElement('option', { value: "approuve" }, "Approuvé"),
                        React.createElement('option', { value: "refuse" }, "Refusé")
                    )
                ),

                // Commentaire
                React.createElement('div', null,
                    React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Commentaire"),
                    React.createElement('textarea', {
                        value: form.commentaire,
                        onChange: (e) => setForm({...form, commentaire: e.target.value}),
                        className: "w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500",
                        rows: 2,
                        placeholder: "Commentaire optionnel..."
                    })
                ),

                // Boutons
                React.createElement('div', { className: "flex gap-4 pt-4" },
                    React.createElement('button', {
                        type: "button",
                        onClick: onClose,
                        className: "flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    }, "Annuler"),
                    React.createElement('button', {
                        type: "submit",
                        className: "flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    }, demandeExistante ? 'Modifier' : 'Créer')
                )
            )
        )
    );
};