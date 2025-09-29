// Script pour corriger la structure JSX complète
import fs from 'fs';
import path from 'path';

const filePath = 'src/modules/NewJob/JobModal.jsx';

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

console.log('📂 Analyse de la structure JSX...');

// Compter les balises ouvertes et fermées
const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;

console.log(`🔍 Balises trouvées:`);
console.log(`   <div: ${openDivs}`);
console.log(`   </div>: ${closeDivs}`);
console.log(`   Différence: ${openDivs - closeDivs}`);

if (openDivs === closeDivs) {
    console.log('✅ Les balises div sont déjà équilibrées!');
} else {
    const missing = openDivs - closeDivs;
    console.log(`⚠️  Il manque ${missing} balise(s) </div>`);

    // Trouver la position du dernier </> et ajouter les fermetures manquantes
    const lastFragmentIndex = content.lastIndexOf('        </>');

    if (lastFragmentIndex !== -1) {
        const missingDivs = '</div>\n            '.repeat(missing);
        const before = content.substring(0, lastFragmentIndex);
        const after = content.substring(lastFragmentIndex);

        // Insérer les divs manquantes avant le fragment de fermeture
        content = before + '            ' + missingDivs + after;

        console.log(`🔧 Ajout de ${missing} balise(s) </div> avant </>`);
    }
}

// Sauvegarder le fichier corrigé
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fichier corrigé avec succès!');

// Vérification finale
const newContent = fs.readFileSync(filePath, 'utf8');
const newOpenDivs = (newContent.match(/<div/g) || []).length;
const newCloseDivs = (newContent.match(/<\/div>/g) || []).length;

console.log(`🔍 Vérification finale:`);
console.log(`   <div: ${newOpenDivs}`);
console.log(`   </div>: ${newCloseDivs}`);
console.log(`   Équilibré: ${newOpenDivs === newCloseDivs ? '✅' : '❌'}`);