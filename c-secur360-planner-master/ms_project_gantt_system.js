// ============== SYSTÈME DE GESTION DES DÉPENDANCES MS PROJECT ==============
// Types de dépendances supportées
const DEPENDENCY_TYPES = {
    FS: 'FS', // Finish to Start (défaut) - Fin → Début
    SS: 'SS', // Start to Start - Début → Début
    FF: 'FF', // Finish to Finish - Fin → Fin
    SF: 'SF'  // Start to Finish - Début → Fin (rare)
};

// Fonction pour calculer les dates d'une tâche selon ses dépendances
const calculateTaskDates = (task, allTasks, projectStart) => {
    const taskDuration = task.duration || 1;
    let calculatedStartHours = 0;
    let calculatedEndHours = taskDuration;

    console.log(`📅 CALC - Calcul pour "${task.text}" (durée: ${taskDuration}h)`);

    // 1. Vérifier les dépendances explicites
    if (task.dependencies && task.dependencies.length > 0) {
        console.log(`📎 DEPS - ${task.dependencies.length} dépendance(s) trouvée(s)`);

        task.dependencies.forEach(dep => {
            const depTask = allTasks.find(t => t.id === dep.id);
            if (depTask) {
                const depStartHours = (depTask.calculatedStart.getTime() - projectStart.getTime()) / (1000 * 60 * 60);
                const depEndHours = (depTask.calculatedEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60);
                const lag = dep.lag || 0;

                switch (dep.type || 'FS') {
                    case 'FS': // Fin → Début (défaut)
                        calculatedStartHours = Math.max(calculatedStartHours, depEndHours + lag);
                        console.log(`🔗 FS - "${task.text}" commence après fin de "${depTask.text}" à ${depEndHours + lag}h`);
                        break;
                    case 'SS': // Début → Début
                        calculatedStartHours = Math.max(calculatedStartHours, depStartHours + lag);
                        console.log(`🔗 SS - "${task.text}" commence avec "${depTask.text}" à ${depStartHours + lag}h`);
                        break;
                    case 'FF': // Fin → Fin
                        calculatedStartHours = Math.max(calculatedStartHours, depEndHours - taskDuration + lag);
                        console.log(`🔗 FF - "${task.text}" finit avec "${depTask.text}" à ${depEndHours + lag}h`);
                        break;
                    case 'SF': // Début → Fin (rare)
                        calculatedStartHours = Math.max(calculatedStartHours, depStartHours - taskDuration + lag);
                        console.log(`🔗 SF - "${task.text}" finit quand "${depTask.text}" commence`);
                        break;
                }
            }
        });
    }
    // 2. Gestion du mode parallèle explicite
    else if (task.isParallel && task.parallelWith && task.parallelWith.length > 0) {
        const parallelTasks = allTasks.filter(t => task.parallelWith.includes(t.id));
        if (parallelTasks.length > 0) {
            // Démarrer en même temps que la première tâche parallèle
            const firstParallelStart = Math.min(...parallelTasks.map(t =>
                (t.calculatedStart.getTime() - projectStart.getTime()) / (1000 * 60 * 60)
            ));
            calculatedStartHours = firstParallelStart;
            console.log(`🔄 PARALLEL - "${task.text}" démarre en parallèle à ${calculatedStartHours}h`);
        }
    }
    // 3. Succession séquentielle par défaut (cas par défaut)
    else {
        // Trouver la tâche précédente au même niveau hiérarchique
        const sameLevelTasks = allTasks.filter(t => t.parentId === task.parentId && t.order < task.order);
        if (sameLevelTasks.length > 0) {
            const previousTask = sameLevelTasks.sort((a, b) => b.order - a.order)[0];
            const prevEndHours = (previousTask.calculatedEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60);
            calculatedStartHours = Math.max(calculatedStartHours, prevEndHours);
            console.log(`➡️  SEQ - "${task.text}" suit "${previousTask.text}" à ${calculatedStartHours}h`);
        }
    }

    calculatedEndHours = calculatedStartHours + taskDuration;

    const calculatedStart = new Date(projectStart.getTime() + (calculatedStartHours * 60 * 60 * 1000));
    const calculatedEnd = new Date(projectStart.getTime() + (calculatedEndHours * 60 * 60 * 1000));

    console.log(`✅ FINAL - "${task.text}": ${calculatedStartHours}h → ${calculatedEndHours}h`);

    return { calculatedStart, calculatedEnd };
};

// Fonction pour générer les données Gantt hiérarchiques avec gestion complète des dépendances
const generateHierarchicalGanttData = () => {
    if (!formData.etapes || formData.etapes.length === 0) {
        return [];
    }

    console.log('🚀 GANTT - Génération des données Gantt avec dépendances MS Project');
    const projectStart = new Date(formData.dateDebut || new Date());

    // 1. Préparer les tâches avec leur structure hiérarchique
    const taskList = formData.etapes.map((etape, index) => {
        const hasChildren = formData.etapes.some(e => e.parentId === etape.id);
        const level = calculateTaskLevel(etape.id, formData.etapes);
        const isCritical = etape.isCritical || formData.criticalPath?.includes(etape.id);
        const displayName = etape.text || `Étape ${level > 0 ? `${level}.` : ''}${index + 1}`;

        return {
            ...etape,
            level,
            hasChildren,
            isCritical,
            indent: level * 20,
            displayName,
            order: etape.order ?? index, // Assurer un ordre par défaut
            // Initialisation temporaire
            calculatedStart: projectStart,
            calculatedEnd: new Date(projectStart.getTime() + ((etape.duration || 1) * 60 * 60 * 1000))
        };
    });

    // 2. Trier les tâches pour le traitement (parents avant enfants, ordre croissant)
    const sortedTasks = taskList.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return (a.order || 0) - (b.order || 0);
    });

    // 3. Calculer les dates pour chaque tâche (ordre de dépendance)
    const processedTasks = [];
    sortedTasks.forEach(task => {
        const { calculatedStart, calculatedEnd } = calculateTaskDates(task, processedTasks, projectStart);

        const finalTask = {
            ...task,
            dateDebut: calculatedStart.toISOString(),
            dateFin: calculatedEnd.toISOString(),
            calculatedStart,
            calculatedEnd
        };

        processedTasks.push(finalTask);
    });

    // 4. Mise à jour des tâches parent (propagation hiérarchique)
    const finalTasks = updateParentTasks(processedTasks);

    console.log('✅ GANTT - Génération terminée:', finalTasks.length, 'tâches');
    return finalTasks;
};

// Fonction utilitaire pour calculer le niveau hiérarchique d'une tâche
const calculateTaskLevel = (taskId, allTasks, level = 0) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task || !task.parentId) return level;
    return calculateTaskLevel(task.parentId, allTasks, level + 1);
};

// Fonction pour mettre à jour les dates des tâches parent selon leurs enfants
const updateParentTasks = (tasks) => {
    const taskMap = new Map(tasks.map(t => [t.id, { ...t }]));

    // Traiter de bas en haut (niveaux décroissants)
    const maxLevel = Math.max(...tasks.map(t => t.level));
    for (let level = maxLevel; level >= 0; level--) {
        const tasksAtLevel = tasks.filter(t => t.level === level && t.hasChildren);

        tasksAtLevel.forEach(parentTask => {
            const children = tasks.filter(t => t.parentId === parentTask.id);
            if (children.length > 0) {
                // Mode parallèle : le parent couvre du début du premier à la fin du dernier
                const startTimes = children.map(c => taskMap.get(c.id).calculatedStart);
                const endTimes = children.map(c => taskMap.get(c.id).calculatedEnd);

                const earliestStart = new Date(Math.min(...startTimes));
                const latestEnd = new Date(Math.max(...endTimes));

                const updatedParent = taskMap.get(parentTask.id);
                updatedParent.calculatedStart = earliestStart;
                updatedParent.calculatedEnd = latestEnd;
                updatedParent.dateDebut = earliestStart.toISOString();
                updatedParent.dateFin = latestEnd.toISOString();

                console.log(`👨‍👩‍👧‍👦 PARENT - "${parentTask.text}": ${earliestStart.toLocaleTimeString()} → ${latestEnd.toLocaleTimeString()}`);
            }
        });
    }

    return Array.from(taskMap.values());
};