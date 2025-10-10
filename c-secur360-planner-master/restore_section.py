#!/usr/bin/env python3
"""Script pour restaurer la section complète Personnel par jour"""

# Lire le fichier de sauvegarde
with open('JobModal_SAUVEGARDE_COMPLETE_20250929_183818.jsx', 'r', encoding='utf-8') as f:
    backup_content = f.readlines()

# Lire le fichier actuel
with open('src/modules/NewJob/JobModal.jsx', 'r', encoding='utf-8') as f:
    current_content = f.readlines()

# Extraire la section à restaurer depuis la sauvegarde (lignes 3016-4384, index 3015-4383)
section_to_restore = backup_content[3015:4384]

# Trouver où insérer dans le fichier actuel
# Chercher le marqueur temporaire que nous avons ajouté
marker = "                                            {/* Onglet Horaires par jour - SERA AJOUTÉ DANS LA PARTIE 2 */}\n"

# Trouver l'index du marqueur
marker_index = -1
for i, line in enumerate(current_content):
    if "SERA AJOUTÉ DANS LA PARTIE 2" in line:
        marker_index = i
        break

if marker_index == -1:
    print("❌ ERREUR: Marqueur non trouvé")
    exit(1)

# Extraire seulement le contenu des onglets (lignes 3195-4381 dans la sauvegarde)
# Ce sont les 4 onglets complets
tabs_content = backup_content[3194:4381]

# Remplacer le marqueur par le contenu complet
new_content = current_content[:marker_index] + tabs_content + current_content[marker_index+1:]

# Écrire le résultat
with open('src/modules/NewJob/JobModal.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print("✅ Section restaurée avec succès!")
print(f"📊 Lignes insérées: {len(tabs_content)}")
