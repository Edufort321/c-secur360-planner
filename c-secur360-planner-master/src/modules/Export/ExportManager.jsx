import { Icon } from '../../components/UI/Icon';

export class ExportManager {
    // Export vers CSV
    static exportToCSV(data, filename = 'export') {
        const csvContent = this.convertToCSV(data);
        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }

    // Export vers JSON
    static exportToJSON(data, filename = 'export') {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    }

    // Export vers PDF (basique)
    static async exportToPDF(data, filename = 'export') {
        // Version basique - à améliorer avec une lib PDF
        const htmlContent = this.generateHTMLReport(data);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
    }

    // Convertir données vers CSV
    static convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        // Ajouter les en-têtes
        csvRows.push(headers.join(','));

        // Ajouter les données
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                // Échapper les virgules et guillemets
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }

    // Générer rapport HTML
    static generateHTMLReport(data) {
        const title = data.title || 'Rapport C-Secur360';
        const date = new Date().toLocaleDateString('fr-FR');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                    .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                    .stat-value { font-size: 2em; font-weight: bold; color: #333; }
                    .stat-label { color: #666; margin-top: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                    <p>Généré le ${date}</p>
                </div>
                ${this.generateReportContent(data)}
            </body>
            </html>
        `;
    }

    // Générer contenu du rapport
    static generateReportContent(data) {
        let content = '';

        // Statistiques
        if (data.stats) {
            content += '<div class="stats">';
            Object.entries(data.stats).forEach(([key, value]) => {
                content += `
                    <div class="stat-card">
                        <div class="stat-value">${value}</div>
                        <div class="stat-label">${this.formatLabel(key)}</div>
                    </div>
                `;
            });
            content += '</div>';
        }

        // Tableaux
        if (data.tables) {
            data.tables.forEach(table => {
                content += `<h2>${table.title}</h2>`;
                if (table.data && table.data.length > 0) {
                    content += '<table>';

                    // En-têtes
                    const headers = Object.keys(table.data[0]);
                    content += '<thead><tr>';
                    headers.forEach(header => {
                        content += `<th>${this.formatLabel(header)}</th>`;
                    });
                    content += '</tr></thead>';

                    // Données
                    content += '<tbody>';
                    table.data.forEach(row => {
                        content += '<tr>';
                        headers.forEach(header => {
                            content += `<td>${row[header] || '-'}</td>`;
                        });
                        content += '</tr>';
                    });
                    content += '</tbody>';

                    content += '</table>';
                }
            });
        }

        return content;
    }

    // Formater les labels
    static formatLabel(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    // Télécharger fichier
    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

// Composant React pour l'interface d'export
export function ExportPanel({ data, onExport }) {
    const handleExport = (format) => {
        const filename = `c-secur360-export-${new Date().toISOString().split('T')[0]}`;

        switch (format) {
            case 'csv':
                ExportManager.exportToCSV(data, filename);
                break;
            case 'json':
                ExportManager.exportToJSON(data, filename);
                break;
            case 'pdf':
                ExportManager.exportToPDF(data, filename);
                break;
            default:
                console.warn('Format d\'export non supporté:', format);
        }

        onExport?.(format);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Export des Données</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Icon name="file" size={24} className="mr-3 text-green-600" />
                    <div className="text-left">
                        <div className="font-medium">Export CSV</div>
                        <div className="text-sm text-gray-500">Données tabulaires</div>
                    </div>
                </button>

                <button
                    onClick={() => handleExport('json')}
                    className="flex items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Icon name="code" size={24} className="mr-3 text-blue-600" />
                    <div className="text-left">
                        <div className="font-medium">Export JSON</div>
                        <div className="text-sm text-gray-500">Format structuré</div>
                    </div>
                </button>

                <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Icon name="printer" size={24} className="mr-3 text-red-600" />
                    <div className="text-left">
                        <div className="font-medium">Export PDF</div>
                        <div className="text-sm text-gray-500">Rapport imprimable</div>
                    </div>
                </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Options d'Export</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• CSV : Compatible avec Excel et Google Sheets</li>
                    <li>• JSON : Format technique pour intégrations</li>
                    <li>• PDF : Rapport formaté pour impression</li>
                </ul>
            </div>
        </div>
    );
}