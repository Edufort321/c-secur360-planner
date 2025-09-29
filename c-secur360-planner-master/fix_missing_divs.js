// Script pour identifier et corriger les 5 div manquantes dans JobModal.jsx
import fs from 'fs';

const filePath = 'src/modules/NewJob/JobModal.jsx';

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('🔍 Analyse des balises div manquantes...');

// Fonction pour trouver les balises non fermées
function findUnclosedDivs(lines) {
    let stack = [];
    let unclosedDivs = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Compter les <div et </div> dans la ligne
        const openDivs = (line.match(/<div[^>]*(?<!\/)\s*>/g) || []).length;
        const closeDivs = (line.match(/<\/div>/g) || []).length;
        const selfClosingDivs = (line.match(/<div[^>]*\/\s*>/g) || []).length;

        // Ajouter les ouvertures à la pile
        for (let j = 0; j < openDivs; j++) {
            stack.push({ line: lineNum, content: line.trim() });
        }

        // Retirer les fermetures de la pile
        for (let j = 0; j < closeDivs; j++) {
            if (stack.length > 0) {
                stack.pop();
            } else {
                console.log(`⚠️  Ligne ${lineNum}: </div> sans <div> correspondant`);
            }
        }

        // Les self-closing ne comptent pas dans la pile
    }

    return stack;
}

const unclosedDivs = findUnclosedDivs(lines);

console.log(`\n📊 Résultats:`);
console.log(`   Div non fermées: ${unclosedDivs.length}`);

if (unclosedDivs.length > 0) {
    console.log(`\n🔍 Div non fermées détectées:`);
    unclosedDivs.forEach((div, index) => {
        console.log(`   ${index + 1}. Ligne ${div.line}: ${div.content.substring(0, 100)}...`);
    });

    // Ajouter les fermetures manquantes avant la fin du Fragment
    const lastFragmentIndex = content.lastIndexOf('        </>');

    if (lastFragmentIndex !== -1) {
        const missingDivs = '</div>\n            '.repeat(unclosedDivs.length);
        const before = content.substring(0, lastFragmentIndex);
        const after = content.substring(lastFragmentIndex);

        // Insérer les divs manquantes avant le fragment de fermeture
        content = before + '            ' + missingDivs + after;

        console.log(`\n🔧 Ajout de ${unclosedDivs.length} balise(s) </div> avant </>`);

        // Sauvegarder le fichier corrigé
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Fichier corrigé avec succès!');

        // Vérification finale
        const newContent = fs.readFileSync(filePath, 'utf8');
        const newOpenDivs = (newContent.match(/<div[^>]*(?<!\/)\s*>/g) || []).length;
        const newCloseDivs = (newContent.match(/<\/div>/g) || []).length;

        console.log(`\n🔍 Vérification finale:`);
        console.log(`   <div: ${newOpenDivs}`);
        console.log(`   </div>: ${newCloseDivs}`);
        console.log(`   Équilibré: ${newOpenDivs === newCloseDivs ? '✅' : '❌'}`);
    } else {
        console.log('❌ Fragment de fermeture </> non trouvé');
    }
} else {
    console.log('✅ Toutes les div sont correctement fermées!');
}