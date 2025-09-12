// Script de validation de syntaxe JavaScript
const fs = require('fs');

try {
    // Lire le fichier HTML
    const content = fs.readFileSync('./calendrier-partage.html', 'utf-8');
    
    // Extraire juste la partie JavaScript entre <script type="text/babel"> et </script>
    const scriptStart = content.indexOf('<script type="text/babel">');
    const scriptEnd = content.indexOf('</script>', scriptStart);
    
    if (scriptStart === -1 || scriptEnd === -1) {
        console.error('Impossible de trouver les balises <script>');
        process.exit(1);
    }
    
    const jsContent = content.substring(scriptStart + 26, scriptEnd);
    
    // Essayer de parser le JavaScript
    try {
        // Utiliser la fonction eval juste pour tester la syntaxe
        new Function(jsContent);
        console.log('✅ Syntaxe JavaScript valide!');
    } catch (syntaxError) {
        console.error('❌ Erreur de syntaxe JavaScript:');
        console.error(syntaxError.message);
        
        // Analyser l'erreur pour extraire le numéro de ligne
        const match = syntaxError.message.match(/line (\d+)/i);
        if (match) {
            const errorLine = parseInt(match[1]);
            console.log(`\n🔍 Contexte autour de la ligne ${errorLine}:`);
            
            const lines = jsContent.split('\n');
            const start = Math.max(0, errorLine - 5);
            const end = Math.min(lines.length, errorLine + 5);
            
            for (let i = start; i < end; i++) {
                const lineNum = i + 1;
                const indicator = lineNum === errorLine ? '>>> ' : '    ';
                console.log(`${indicator}${lineNum.toString().padStart(4)}: ${lines[i]}`);
            }
        }
    }
    
} catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error.message);
}