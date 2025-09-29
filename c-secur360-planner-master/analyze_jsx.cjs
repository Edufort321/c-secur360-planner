const fs = require('fs');

// Lire le fichier
const content = fs.readFileSync('./src/modules/NewJob/JobModal.jsx', 'utf8');
const lines = content.split('\n');

let divStack = [];
let openTags = 0;
let closeTags = 0;

lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Compter les div ouvrantes
    const openMatches = line.match(/<div[^>]*>/g);
    if (openMatches) {
        openTags += openMatches.length;
        openMatches.forEach(() => {
            divStack.push(lineNum);
        });
    }

    // Compter les div fermantes
    const closeMatches = line.match(/<\/div>/g);
    if (closeMatches) {
        closeTags += closeMatches.length;
        closeMatches.forEach(() => {
            if (divStack.length > 0) {
                divStack.pop();
            } else {
                console.log(`⚠️  Ligne ${lineNum}: Balise </div> fermante sans ouverture correspondante`);
            }
        });
    }

    // Afficher les déséquilibres significatifs
    if (divStack.length > 10) {
        console.log(`📊 Ligne ${lineNum}: ${divStack.length} div ouvertes non fermées`);
    }
});

console.log('\n=== RÉSULTATS ===');
console.log(`Total div ouvertes: ${openTags}`);
console.log(`Total div fermées: ${closeTags}`);
console.log(`Différence: ${openTags - closeTags}`);
console.log(`Div non fermées: ${divStack.length}`);

if (divStack.length > 0) {
    console.log('\n=== DIV NON FERMÉES (lignes) ===');
    console.log(divStack.slice(-10)); // Afficher les 10 dernières
}