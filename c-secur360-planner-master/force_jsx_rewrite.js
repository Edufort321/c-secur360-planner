// Script pour forcer la réécriture du fichier et éliminer le cache Babel/Vite persistant
import fs from 'fs';

const filePath = 'src/modules/NewJob/JobModal.jsx';

console.log('🔧 Force rewrite pour éliminer le cache Babel/Vite persistant...');

// Lire le fichier actuel
let content = fs.readFileSync(filePath, 'utf8');

console.log('📊 Statistiques actuelles:');
console.log(`   Lignes: ${content.split('\n').length}`);
console.log(`   Taille: ${(content.length / 1024).toFixed(1)} KB`);

// Vérifier les patterns spécifiques qui posent problème
const fragmentPattern = /<>\s*$/gm;
const closeFragmentPattern = /^\s*<\/>/gm;

const openFragments = (content.match(fragmentPattern) || []).length;
const closeFragments = (content.match(closeFragmentPattern) || []).length;

console.log(`   Fragments ouverts (<>): ${openFragments}`);
console.log(`   Fragments fermés (</>): ${closeFragments}`);

// Si on trouve encore des fragments, les remplacer de force
if (openFragments > 0 || closeFragments > 0) {
    console.log('🚫 Fragments détectés - suppression forcée...');

    // Remplacer TOUS les fragments par des divs
    content = content.replace(/<>\s*$/gm, '<div className="jsx-fragment-wrapper">');
    content = content.replace(/^\s*<\/>/gm, '</div>');

    console.log('✅ Fragments remplacés par des div wrappers');
}

// Forcer une réécriture en créant un nouveau fichier temporaire puis en le renommant
const tempPath = filePath + '.temp';

// Écrire dans un fichier temporaire
fs.writeFileSync(tempPath, content, 'utf8');

// Supprimer l'original
fs.unlinkSync(filePath);

// Renommer le temporaire
fs.renameSync(tempPath, filePath);

console.log('🔥 Fichier réécrit physiquement pour forcer le cache bust');

// Vérification finale
const newContent = fs.readFileSync(filePath, 'utf8');
const newOpenFragments = (newContent.match(fragmentPattern) || []).length;
const newCloseFragments = (newContent.match(closeFragmentPattern) || []).length;

console.log('🔍 Vérification finale:');
console.log(`   Fragments ouverts (<>): ${newOpenFragments}`);
console.log(`   Fragments fermés (</>): ${newCloseFragments}`);
console.log(`   ${newOpenFragments === 0 && newCloseFragments === 0 ? '✅' : '❌'} État des fragments`);