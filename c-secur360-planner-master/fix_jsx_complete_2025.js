// Script complet pour corriger tous les patterns JSX adjacents selon les meilleures pratiques 2025
import fs from 'fs';
import path from 'path';

const filePath = 'src/modules/NewJob/JobModal.jsx';

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 Analyse complète des patterns JSX adjacents selon les meilleures pratiques 2025...');

// Patterns problématiques à identifier et corriger
const problematicPatterns = [
    // Pattern 1: return [<element>, ...spread]
    {
        name: 'Array return with JSX spread',
        regex: /return\s*\[\s*<[^>]+>[^<]*<\/[^>]+>,\s*\.\.\./g,
        description: 'Fonctions retournant des arrays avec spread JSX'
    },
    // Pattern 2: flatMap, map qui retournent plusieurs éléments
    {
        name: 'flatMap/map multiple elements',
        regex: /\.(flatMap|map)\([^)]*=>\s*\[.*?<[^>]+>.*?<[^>]+>.*?\]/gs,
        description: 'Array methods retournant plusieurs éléments JSX'
    },
    // Pattern 3: Conditional rendering sans wrapper
    {
        name: 'Conditional without wrapper',
        regex: /\?\s*<[^>]+>[^<]*<\/[^>]+>\s*<[^>]+>/g,
        description: 'Rendu conditionnel sans wrapper'
    },
    // Pattern 4: Multiple JSX elements séparés par whitespace/newlines
    {
        name: 'Adjacent JSX elements',
        regex: /<\/[^>]+>\s*\n\s*<[^/>][^>]*>/g,
        description: 'Éléments JSX adjacents sans wrapper'
    }
];

// Compter les balises pour vérification
const countTags = (text) => {
    const openDivs = (text.match(/<div[^>]*(?<!\/)\s*>/g) || []).length;
    const closeDivs = (text.match(/<\/div>/g) || []).length;
    const selfClosingDivs = (text.match(/<div[^>]*\/\s*>/g) || []).length;
    const openFragments = (text.match(/<>/g) || []).length;
    const closeFragments = (text.match(/<\/>/g) || []).length;

    return {
        openDivs,
        closeDivs,
        selfClosingDivs,
        openFragments,
        closeFragments,
        divBalance: openDivs - closeDivs,
        fragmentBalance: openFragments - closeFragments
    };
};

console.log('📊 État initial des balises:');
const initialCounts = countTags(content);
console.log(`   <div: ${initialCounts.openDivs}`);
console.log(`   </div>: ${initialCounts.closeDivs}`);
console.log(`   Balance div: ${initialCounts.divBalance}`);
console.log(`   <>: ${initialCounts.openFragments}`);
console.log(`   </>: ${initialCounts.closeFragments}`);
console.log(`   Balance fragment: ${initialCounts.fragmentBalance}`);

// Analyser patterns problématiques
console.log('\n🔍 Recherche de patterns problématiques...');
let foundProblems = false;

problematicPatterns.forEach((pattern, index) => {
    const matches = [...content.matchAll(pattern.regex)];
    if (matches.length > 0) {
        foundProblems = true;
        console.log(`\n${index + 1}. ${pattern.name}: ${matches.length} occurrence(s)`);
        console.log(`   Description: ${pattern.description}`);
        matches.slice(0, 3).forEach((match, i) => {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            console.log(`   Ligne ${lineNumber}: ${match[0].substring(0, 100)}...`);
        });
    }
});

// Analyser fonction par fonction les patterns de return avec arrays JSX
console.log('\n🔍 Analyse des fonctions avec return arrays JSX...');
const functionPattern = /const\s+(\w+)\s*=.*?=>\s*\{[^{}]*return\s*\[[^[\]]*<[^>]+>[^[\]]*\][^{}]*\}/gs;
const functionMatches = [...content.matchAll(functionPattern)];

functionMatches.forEach((match, i) => {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    console.log(`   Fonction ${match[1]} ligne ${lineNumber}`);
});

// Corrections selon les meilleures pratiques 2025
console.log('\n🔧 Application des corrections selon les meilleures pratiques 2025...');

// 1. Correction des fonctions retournant des arrays avec JSX spread
content = content.replace(
    /return\s*\[\s*(<[^>]+>[^<]*<\/[^>]+>),\s*\.\.\.(\w+)\([^)]*\)\s*\]/g,
    'return [\n            <React.Fragment key={$2}>\n                $1\n                {$2($3)}\n            </React.Fragment>\n        ]'
);

// 2. Wrapper pour les éléments JSX adjacents dans les arrays
content = content.replace(
    /return\s*\[\s*(<[^>]+>[^<]*<\/[^>]+>)\s*,\s*(<[^>]+>[^<]*<\/[^>]+>)/g,
    'return [\n            <React.Fragment key="wrapper">\n                $1\n                $2\n            </React.Fragment>\n        ]'
);

// 3. Wrapper pour les conditional renders adjacents
content = content.replace(
    /\?\s*(<[^>]+>[^<]*<\/[^>]+>)\s*(<[^>]+>)/g,
    '? <>\n                $1\n                $2\n            </>'
);

// 4. Correction spécifique pour renderHierarchicalOptions
content = content.replace(
    /return\s*\[\s*(<option[^>]*>[^<]*<\/option>),\s*\.\.\.renderHierarchicalOptions\([^)]*\)\s*\]/g,
    'return [\n            <React.Fragment key={etape.id}>\n                $1\n                {renderHierarchicalOptions(etape.id, level + 1)}\n            </React.Fragment>\n        ]'
);

// 5. Correction spécifique pour renderHierarchicalCheckboxes
content = content.replace(
    /return\s*\[\s*(<label[^>]*>[\s\S]*?<\/label>),\s*\.\.\.renderHierarchicalCheckboxes\([^)]*\)\s*\]/g,
    'return [\n            <React.Fragment key={etape.id}>\n                $1\n                {renderHierarchicalCheckboxes(etape.id, level + 1)}\n            </React.Fragment>\n        ]'
);

// Vérification finale et équilibrage des balises manquantes
console.log('\n🔍 Vérification finale et équilibrage...');
const finalCounts = countTags(content);

console.log(`📊 État final des balises:`);
console.log(`   <div: ${finalCounts.openDivs}`);
console.log(`   </div>: ${finalCounts.closeDivs}`);
console.log(`   Balance div: ${finalCounts.divBalance}`);
console.log(`   <>: ${finalCounts.openFragments}`);
console.log(`   </>: ${finalCounts.closeFragments}`);
console.log(`   Balance fragment: ${finalCounts.fragmentBalance}`);

// Ajouter les balises manquantes si nécessaire
if (finalCounts.divBalance > 0) {
    const missingDivs = '</div>\n            '.repeat(finalCounts.divBalance);
    const lastFragmentIndex = content.lastIndexOf('        </>');

    if (lastFragmentIndex !== -1) {
        const before = content.substring(0, lastFragmentIndex);
        const after = content.substring(lastFragmentIndex);
        content = before + '            ' + missingDivs + after;
        console.log(`🔧 Ajout de ${finalCounts.divBalance} balise(s) </div> manquante(s)`);
    }
}

// Sauvegarder le fichier corrigé
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fichier corrigé avec succès selon les meilleures pratiques 2025!');

// Vérification finale complète
const verifyContent = fs.readFileSync(filePath, 'utf8');
const verifyCounts = countTags(verifyContent);

console.log(`\n🔍 Vérification finale après sauvegarde:`);
console.log(`   <div: ${verifyCounts.openDivs}`);
console.log(`   </div>: ${verifyCounts.closeDivs}`);
console.log(`   Balance div: ${verifyCounts.divBalance === 0 ? '✅ Équilibré' : '❌ Déséquilibré (' + verifyCounts.divBalance + ')'}`);
console.log(`   <>: ${verifyCounts.openFragments}`);
console.log(`   </>: ${verifyCounts.closeFragments}`);
console.log(`   Balance fragment: ${verifyCounts.fragmentBalance === 0 ? '✅ Équilibré' : '❌ Déséquilibré (' + verifyCounts.fragmentBalance + ')'}`);

if (verifyCounts.divBalance === 0 && verifyCounts.fragmentBalance === 0) {
    console.log('\n🎉 Toutes les balises sont maintenant équilibrées selon les standards 2025!');
} else {
    console.log('\n⚠️  Il reste des déséquilibres à corriger manuellement.');
}