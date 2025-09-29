// Script pour corriger la structure JSX du JobModal
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'modules', 'NewJob', 'JobModal.jsx');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Correction 1: Indenter correctement la div bg-white 
content = content.replace(
    'return (\n        <>\n            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">\n            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden">',
    'return (\n        <>\n            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">\n                <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden">'
);

// Correction 2: Ajouter la fermeture manquante de la div bg-white
content = content.replace(
    '                        )}\n                    </div>\n                </div>\n            </div>\n        </>\n    );',
    '                        )}\n                    </div>\n                </div>\n                </div>\n            </div>\n        </>\n    );'
);

// Sauvegarder le fichier corrigé
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fichier JobModal.jsx corrigé avec succès !');