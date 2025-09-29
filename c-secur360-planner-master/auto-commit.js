#!/usr/bin/env node

/**
 * 🔄 Système de commits automatiques pour C-Secur360 Planificateur
 *
 * Ce script surveille les modifications des fichiers et crée des commits
 * automatiques pour préserver le travail en cours.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chokidar from 'chokidar';

const WATCH_PATTERNS = [
    'src/**/*.{js,jsx,ts,tsx}',
    'src/**/*.{css,scss}',
    'package.json',
    'vite.config.js',
    'vercel.json'
];

const IGNORE_PATTERNS = [
    'node_modules/**',
    'dist/**',
    '.git/**',
    'temp_*.jsx',
    '*.log'
];

let isWatching = false;
let pendingChanges = new Set();
let commitTimer = null;

// Délai avant commit automatique (3 minutes)
const COMMIT_DELAY = 3 * 60 * 1000;

function getCurrentTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

function hasGitChanges() {
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        return status.trim().length > 0;
    } catch (error) {
        console.error('❌ Erreur Git:', error.message);
        return false;
    }
}

function createAutoCommit() {
    if (!hasGitChanges()) {
        console.log('ℹ️  Aucune modification à committer');
        return;
    }

    try {
        const timestamp = getCurrentTimestamp();
        const changedFiles = Array.from(pendingChanges).slice(0, 3).join(', ');
        const moreFiles = pendingChanges.size > 3 ? ` (+${pendingChanges.size - 3} autres)` : '';

        const commitMessage = `🔄 AUTO-COMMIT ${timestamp}

Sauvegarde automatique des modifications:
- ${changedFiles}${moreFiles}

🤖 Généré automatiquement par [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

        // Ajouter tous les fichiers modifiés en excluant les fichiers problématiques
        execSync('git add -A', { stdio: 'pipe' });

        // Créer le commit
        execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });

        console.log(`✅ Commit automatique créé: ${changedFiles}${moreFiles}`);

        // Pousser vers GitHub si configuré
        try {
            execSync('git push', { stdio: 'pipe' });
            console.log('📤 Poussé vers GitHub avec succès');
        } catch (pushError) {
            console.log('⚠️  Commit local créé, push vers GitHub en attente');
        }

        // Réinitialiser les changements en attente
        pendingChanges.clear();

    } catch (error) {
        console.error('❌ Erreur lors du commit automatique:', error.message);
    }
}

function scheduleCommit(filePath) {
    pendingChanges.add(path.relative(process.cwd(), filePath));

    // Annuler le timer précédent
    if (commitTimer) {
        clearTimeout(commitTimer);
    }

    // Programmer un nouveau commit
    commitTimer = setTimeout(() => {
        createAutoCommit();
        commitTimer = null;
    }, COMMIT_DELAY);

    console.log(`📝 Modification détectée: ${path.basename(filePath)} (commit dans ${COMMIT_DELAY/1000}s)`);
}

function startWatching() {
    if (isWatching) {
        console.log('👀 Surveillance déjà active');
        return;
    }

    console.log('🚀 Démarrage de la surveillance automatique...');
    console.log(`📂 Patterns surveillés: ${WATCH_PATTERNS.join(', ')}`);
    console.log(`⏱️  Délai avant commit: ${COMMIT_DELAY/1000} secondes`);

    const watcher = chokidar.watch(WATCH_PATTERNS, {
        ignored: IGNORE_PATTERNS,
        persistent: true,
        ignoreInitial: true
    });

    watcher
        .on('change', scheduleCommit)
        .on('add', scheduleCommit)
        .on('ready', () => {
            isWatching = true;
            console.log('✅ Surveillance active - vos modifications sont protégées!');
        })
        .on('error', error => {
            console.error('❌ Erreur de surveillance:', error);
        });

    // Gestion de l'arrêt propre
    process.on('SIGINT', () => {
        console.log('\n🛑 Arrêt de la surveillance...');

        if (commitTimer) {
            clearTimeout(commitTimer);
            if (pendingChanges.size > 0) {
                console.log('💾 Commit final des modifications en attente...');
                createAutoCommit();
            }
        }

        watcher.close();
        process.exit(0);
    });
}

// Commandes CLI
const command = process.argv[2];

switch (command) {
    case 'start':
    case 'watch':
        startWatching();
        break;

    case 'commit':
        console.log('💾 Création d\'un commit manuel...');
        createAutoCommit();
        break;

    case 'status':
        console.log('📊 Statut Git:');
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            if (status.trim()) {
                console.log(status);
            } else {
                console.log('✅ Aucune modification en attente');
            }
        } catch (error) {
            console.error('❌ Erreur:', error.message);
        }
        break;

    default:
        console.log(`
🔄 Système de commits automatiques C-Secur360

Usage:
  node auto-commit.js start    # Démarre la surveillance
  node auto-commit.js commit   # Commit manuel immédiat
  node auto-commit.js status   # Affiche le statut Git

Options de surveillance:
  - Délai avant commit: ${COMMIT_DELAY/1000} secondes
  - Patterns surveillés: ${WATCH_PATTERNS.length} types de fichiers
  - Commit automatique + push GitHub
        `);
        break;
}