// Script pour vérifier les parenthèses autour de la ligne d'erreur
const fs = require('fs');

try {
    const content = fs.readFileSync('./calendrier-partage.html', 'utf-8');
    const lines = content.split('\n');
    
    // Vérifier les lignes 5960-6000
    let openParens = 0;
    let errors = [];
    
    for (let i = 5959; i < Math.min(lines.length, 6000); i++) {
        const line = lines[i];
        const lineNum = i + 1;
        
        let lineOpenParens = 0;
        let lineCloseParens = 0;
        
        // Ignorer les parenthèses dans les chaînes de caractères
        let inString = false;
        let stringChar = null;
        let escaped = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (escaped) {
                escaped = false;
                continue;
            }
            
            if (char === '\\') {
                escaped = true;
                continue;
            }
            
            if (char === '"' || char === "'") {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
                continue;
            }
            
            if (!inString) {
                if (char === '(') {
                    openParens++;
                    lineOpenParens++;
                } else if (char === ')') {
                    openParens--;
                    lineCloseParens++;
                    
                    if (openParens < 0) {
                        errors.push(`Ligne ${lineNum}: Parenthèse fermante sans ouverture à la position ${j + 1}`);
                        openParens = 0; // Reset pour continuer la vérification
                    }
                }
            }
        }
        
        console.log(`${lineNum.toString().padStart(4)}: ${lineOpenParens.toString().padStart(2)}( ${lineCloseParens.toString().padStart(2)}) | ${openParens.toString().padStart(3)} | ${line.trim().substring(0, 80)}`);
    }
    
    console.log('\n=== RÉSUMÉ ===');
    console.log(`Parenthèses ouvertes non fermées: ${openParens}`);
    console.log(`Erreurs détectées: ${errors.length}`);
    
    if (errors.length > 0) {
        console.log('\nERREURS:');
        errors.forEach(error => console.log(error));
    }
    
} catch (error) {
    console.error('Erreur:', error.message);
}