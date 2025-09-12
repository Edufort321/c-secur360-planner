                                            },
                                            className: "text-sm border border-gray-300 rounded-lg px-2 py-2"
                                        },
                                            React.createElement('option', { value: "futur" }, "Futur"),
                                            React.createElement('option', { value: "passe" }, "Passé"),
                                            React.createElement('option', { value: "tous" }, "Tous")
                                        )
                                    ),
                                    
                                    // Dropdown résultats de recherche
                                    searchResults.length > 0 && React.createElement('div', {
                                        className: "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                                    },
                                        React.createElement('div', { className: "p-2 border-b bg-gray-50" },
                                            React.createElement('span', { className: "text-sm font-medium text-gray-700" }, 
                                                `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''} trouvé${searchResults.length > 1 ? 's' : ''}`
                                            )
                                        ),
                                        searchResults.map(job => 
                                            React.createElement('div', {
                                                key: job.id,
                                                className: "p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0",
                                                onClick: () => navigateToEvent(job)
                                            },
                                                React.createElement('div', { className: "flex justify-between items-start" },
                                                    React.createElement('div', { className: "flex-1" },
                                                        React.createElement('div', { className: "font-medium text-gray-900" },
                                                            job.numeroJob || 'Sans numéro'
                                                        ),
                                                        React.createElement('div', { className: "text-sm text-gray-600" },
                                                            job.client
                                                        ),
                                                        React.createElement('div', { className: "text-xs text-gray-500" },
                                                            job.localisation
                                                        )
                                                    ),
                                                    React.createElement('div', { className: "text-right" },
                                                        React.createElement('div', { className: "text-sm font-medium text-blue-600" },
                                                            job.displayDate
                                                        ),
                                                        React.createElement('div', { className: "text-xs text-gray-500" },
                                                            job.heureDebut ? `${job.heureDebut}` : ''
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    ),
                                
                                React.createElement('div', { className: "flex flex-wrap gap-2" },
                                    // Bouton déconnexion
