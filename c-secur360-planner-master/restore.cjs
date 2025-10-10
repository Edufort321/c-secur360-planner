const fs = require('fs');

// Lire les fichiers
const backup = fs.readFileSync('JobModal_SAUVEGARDE_COMPLETE_20250929_183818.jsx', 'utf8');
const current = fs.readFileSync('src/modules/NewJob/JobModal.jsx', 'utf8');

// Séparer en lignes
const backupLines = backup.split('\n');
const currentLines = current.split('\n');

// Extraire le contenu des 4 onglets (lignes 3195-4381 dans la sauvegarde, index 3194-4380)
const tabsContent = backupLines.slice(3194, 4381).join('\n');

// Trouver le marqueur dans le fichier actuel
const markerText = 'SERA AJOUTÉ DANS LA PARTIE 2';
let markerIndex = -1;

for (let i = 0; i < currentLines.length; i++) {
    if (currentLines[i].includes(markerText)) {
        markerIndex = i;
        break;
    }
}

if (markerIndex === -1) {
    console.log('❌ ERREUR: Marqueur non trouvé');
    process.exit(1);
}

// Remplacer la ligne du marqueur par le contenu des onglets
const newContent = [
    ...currentLines.slice(0, markerIndex),
    tabsContent,
    ...currentLines.slice(markerIndex + 1)
].join('\n');

// Écrire le résultat
fs.writeFileSync('src/modules/NewJob/JobModal.jsx', newContent, 'utf8');

console.log('✅ Section restaurée avec succès!');
console.log(`📊 Lignes insérées: ${4381 - 3194}`);
console.log('📝 Les 4 onglets complets ont été restaurés');
