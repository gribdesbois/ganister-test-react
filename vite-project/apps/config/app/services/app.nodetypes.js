angular.module('app.ganister.config.models', [])
    .service('datamodelModel', function ($http) {
        var datamodel = this,
            URLS = {
                FETCH: '/api/v0/nodetypes/datamodel',
                // BUILDPATCH: '/api/v0/nodetypes/datamodel/generatedatamodeldiff',
                PATCH: '/api/v0/nodetypes/datamodel/patch',
                GETDMPACKAGES: '/api/v0/nodetypes/datamodel/dmPackages',
                UPDATEDMPACKAGES: '/api/v0/nodetypes/datamodel/updateDmPackagesFromDatamodel',
                GENERATEGANISTERDATAMODEL: '/api/v0/nodetypes/datamodel/generateGanisterDM',
                RESTARTSERVER: '/api/v0/nodetypes/datamodel/restartServer',
                NODETYPES: '/api/v0/nodetypes/',
                PACKAGES: '/api/v0/nodetypes/_packages/',
                LOVS: '/api/v0/nodetypes/lovs/',
                REPORTS: '/api/v0/nodetypes/report/',
                METHODS: '/api/v0/nodetypes/methods/',
                CATEGORIES: '/api/v0/nodetypes/categories/',
                TRANSLATIONS: '/api/v0/translations/',
                IMPORTS: '/api/v0/imports/',
                CONFIG: '/api/v0/config/'
            }
        function extract(result) {
            return result.data
        }

        datamodel.getDatamodel = () => {
            return $http.get(URLS.FETCH).then(extract)
        }

        datamodel.patchDatamodel = (patch) => {
            return $http.post(URLS.PATCH, { patch }).then((result) => {
                return result;
            })
        }

        // datamodel.generateDmPatch = () => {
        //     return $http.post(URLS.BUILDPATCH).then((result) => {
        //         return result;
        //     })
        // }

        datamodel.updateDMPackages = (token) => {
            return $http.post(URLS.UPDATEDMPACKAGES, { token }).then((result) => {
                return result;
            })
        }

        datamodel.generateGanisterDatamodel = (packages) => {
            return $http.post(URLS.GENERATEGANISTERDATAMODEL, { packages }).then((result) => {
                return result;
            })
        }
        datamodel.restartServer = () => {
            return $http.post(URLS.RESTARTSERVER).then((result) => {
                return result;
            })
        }

        datamodel.getDMPackages = () => {
            return $http.get(URLS.GETDMPACKAGES).then(extract)
        }

        datamodel.grid = {
            loadData: function (gridAPI, rowData) {
                if (gridAPI) {
                    gridAPI.setRowData(rowData)
                }
            }
        }

        datamodel.packages = {
            add: function (name) {
                return $http.post(URLS.PACKAGES, {
                    packname: name,
                })
            },
            update: function (id, name) {
                return false
            },
            remove: function (id) {
                return $http.delete(URLS.PACKAGES + id)
            },
        }
        datamodel.methods = {
            add: function (methodName) {
                return $http.post(URLS.METHODS, { "name": methodName }).then(function (result) {
                    return result.data
                })
            },
            update: function (method) {
                return $http.put(URLS.METHODS + method.id, { method })
                    .then(function (result) {
                    return result.data
                })
            },
            remove: function (methodId) {
                return $http.delete(URLS.METHODS + methodId)
                    .then(function (result) {
                        return result.data
                    })
            }
        }

        datamodel.lovs = {
            add: function (name, items = [], packageId = "core") {
                return $http.post(URLS.LOVS, { name, items, packageId }).then(function (result) {
                    return result.data
                })
            },
            update: function (lovs) {
                return $http.put(URLS.LOVS + lovs.id, {
                    "lov": lovs
                }).then(function (result) {
                    return result.data
                })
            },
            remove: function (lovsId) {
                return $http.delete(URLS.LOVS + lovsId)
                    .then(function (result) {
                        return result.data
                    })
            }
        }

        datamodel.reports = {
            add: function (name, items = [], packageId = "core") {
                return $http.post(URLS.REPORTS, { name, items, packageId }).then(function (result) {
                    return result.data
                })
            },
            update: function (report) {
                return $http.put(URLS.REPORTS + report.id, {
                    report
                }).then(function (result) {
                    return result.data
                })
            },
            remove: function (reportId) {
                return $http.delete(URLS.REPORTS + reportId)
                    .then(function (result) {
                        return result.data
                    })
            }
        }

        datamodel.categories = {
            update: categories => $http.put(URLS.CATEGORIES, {
                categories,
            })
                .then((result) => {
                    return result;
                }),
        };

        datamodel.translations = {
            get: function (lang) {
                return $http.get(URLS.TRANSLATIONS + lang).then(function (result) {
                    return result
                })
            },
            update: function (lang, data) {
                return $http.put(URLS.TRANSLATIONS + lang, { data }).then(function (result) {
                    return result
                })
            },
            removeProps: function (data) {
                return $http.post(`${URLS.TRANSLATIONS}removeProps`, { data }).then(function (result) {
                    return result
                })
            },
            updateWhole: function (lang, data) {
                return $http.post(URLS.TRANSLATIONS + lang, { data }).then(function (result) {
                    return result
                })
            },
            getLanguages: function () {
                return $http.get(URLS.TRANSLATIONS + 'languages').then(function (result) {
                    return result
                })
            },
            updateConfigLanguages: function (data) {
                return $http.post(URLS.TRANSLATIONS + 'updateConfig', { data }).then(function (result) {
                    return result
                })
            },
            resetTranslationForCoreProperties: function () {
                return $http.get(URLS.TRANSLATIONS + 'resetTranslationForCoreProperties').then(function (result) {
                    return result;
                })
            },
            resetDefaultLangNodetypeTranslation: function (nodetypeName) {
                return $http.post(`${URLS.TRANSLATIONS}resetDefaultLangNodetypeTranslation/${nodetypeName}`).then(function (result) {
                    return result;
                })
            },
            updatePropertyName: function (nodetypeName, oldPropertyName, newPropertyName) {
                return $http.post(`${URLS.TRANSLATIONS}updatePropertyName/${nodetypeName}`, { oldPropertyName, newPropertyName }).then(function (result) {
                    return result;
                })
            }
        }

        datamodel.nodetypes = {
            add: function (nodetypeName, typeDefinition) {
                // type being an object (simple if node but more complex if it is a relationship)
                return $http.post(URLS.NODETYPES + nodetypeName, {
                    "name": nodetypeName,
                    "typeDefinition": typeDefinition
                }).then(function (result) {
                    return result.data
                })
            },
            updateMetadata: function (nodetypeId, property, value) {
                return $http.patch(URLS.NODETYPES + nodetypeId, {
                    "property": property,
                    "value": value
                }).then(function (result) {
                    return result.data
                })
            },
            remove: function (nodetypeId) {
                return $http.delete(URLS.NODETYPES + nodetypeId
                ).then(function (result) {
                    return result.data
                })
            },
            fullSave: function (nodetype, nodetypeId) {
                return $http.put(URLS.NODETYPES + nodetypeId, nodetype)
                    .then(function (result) {
                        return result
                    })
            },
            updatePermissions: (nodetypeName) => {
                return $http.post(`${URLS.NODETYPES}${nodetypeName}/updatePermission`).then((result) => {
                  return result.data;
                });
              },
            updateNodesStateConfig: (nodetypeName) => {
                return $http.put(`${URLS.NODETYPES}${nodetypeName}/updateStateConfig`).then((result) => {
                    return result;
                });
            },
            formDefinition: {
                update: function (nodetypeName, formDefinition) {
                    return $http.put(URLS.NODETYPES + nodetypeName + "/form/definition/", formDefinition).then(function (result) {
                        return result
                    })
                }
            },
            gridColumns: {
                add: function (nodetypeName, gridName, gridcolumn) {
                    return $http.post(URLS.NODETYPES + nodetypeName + "/columns/" + gridName, {
                        "gridColumn": {
                            "name": gridcolumn.name,
                            "property": gridcolumn.property
                        }
                    }).then(function (result) {
                        return result.data
                    })
                },
                update: function (nodetypeName, gridName, gridColumnId, attributeName, oldValue, newValue) {
                    if (newValue === "true") newValue = true
                    if (newValue === "false") newValue = false
                    return $http.patch(URLS.NODETYPES + nodetypeName + "/columns/" + gridName + '/' + gridColumnId, {
                        "gridColumn": {
                            "attribute": attributeName,
                            "oldValue": oldValue,
                            "newValue": newValue
                        }
                    }).then(function (result) {
                        return result.data
                    })
                },
                remove: function (nodetypeName, gridName, gridColumnId) {
                    return $http.delete(URLS.NODETYPES + nodetypeName + "/columns/" + gridName + '/' + gridColumnId)
                        .then(function (result) {
                            return result.data
                        })
                },
                moveUp: function (nodetypeName, gridName, columnIndex) {
                    return $http.patch(URLS.NODETYPES + nodetypeName + "/columns/" + gridName + "/move", {
                        "direction": "up",
                        "columnIndex": columnIndex
                    }).then(function (result) {
                        return result.data
                    })
                },
                moveDown: function (nodetypeName, gridName, columnIndex) {
                    return $http.patch(URLS.NODETYPES + nodetypeName + "/columns/" + gridName + "/move", {
                        "direction": "down",
                        "columnIndex": columnIndex
                    }).then(function (result) {
                        return result.data
                    })
                },
                move: function (nodetypeName, gridName, columnIndex, propId) {
                    return $http.patch(URLS.NODETYPES + nodetypeName + "/columns/" + gridName + "/move", {
                        "direction": "index",
                        columnIndex,
                        propId,
                    }).then(function (result) {
                        return result.data
                    })
                },
                updateAll: function (nodetypeName, gridName, columns) {
                    return $http.post(URLS.NODETYPES + nodetypeName + "/columns/" + gridName + "/updateAll", {
                        gridName,
                        columns,
                    }).then(function (result) {
                        return result;
                    })
                }
            },
            properties: {
                add: function (nodetypeName, property) {
                    return $http.post(URLS.NODETYPES + nodetypeName + "/properties", {
                        "property": {
                            "name": property.name,
                            "type": property.type
                        }
                    }).then(function (result) {
                        return result.data
                    })
                },
                updateAll: function (nodetypeName, properties) {
                    // not set
                },
                update: function (nodetypeName, propertyId, attributeName, oldValue, newValue) {
                    if (newValue === "true") newValue = true
                    if (newValue === "false") newValue = false
                    return $http.put(URLS.NODETYPES + nodetypeName + "/properties/" + propertyId, {
                        "property": {
                            "attribute": attributeName,
                            "oldValue": oldValue,
                            "newValue": newValue
                        }
                    }).then(function (result) {
                        return result
                    })
                },
                remove: function (nodetypeName, propertyId) {
                    return $http.delete(URLS.NODETYPES + nodetypeName + "/properties/" + propertyId
                    ).then(function (result) {
                        return result.data
                    })
                }
            },
            ui: {
                defaultThumbnail: {
                    update: function (nodetypeName, value) {
                        return $http.put(URLS.NODETYPES + nodetypeName + "/updateObject", {
                            "oPath": 'ui.defaultThumbnail',
                            "oContent": value
                        }).then(function (result) {
                            return result
                        })
                    },
                },
                tabs: {
                    update: function (nodetypeName, tabId, attributeName, oldValue, newValue) {
                        if (newValue === "true") newValue = true
                        if (newValue === "false") newValue = false
                        return $http.put(URLS.NODETYPES + nodetypeName + "/tabs/" + tabId, {
                            "tab": {
                                "attribute": attributeName,
                                "oldValue": oldValue,
                                "newValue": newValue
                            }
                        }).then(function (result) {
                            return result.data
                        })
                    },
                    add: function (nodetypeName, tab) {
                        return $http.post(URLS.NODETYPES + nodetypeName + "/tabs", {
                            tab,
                        }).then(function (result) {
                            return result.data
                        })
                    },
                    remove: function (nodetypeName, tabId) {
                        return $http.delete(URLS.NODETYPES + nodetypeName + "/tabs/" + tabId
                        ).then(function (result) {
                            return result.data
                        })
                    },
                    moveUp: function (nodetypeName, tabIndex) {
                        return $http.patch(URLS.NODETYPES + nodetypeName + "/tabs/move", {
                            "direction": "up",
                            "tabIndex": tabIndex
                        }).then(function (result) {
                            return result.data
                        })
                    },
                    moveDown: function (nodetypeName, tabIndex) {
                        return $http.patch(URLS.NODETYPES + nodetypeName + "/tabs/move", {
                            "direction": "down",
                            "tabIndex": tabIndex
                        }).then(function (result) {
                            return result.data
                        })
                    },
                    move: function (nodetypeName, tabIndex, tabId) {
                        return $http.patch(URLS.NODETYPES + nodetypeName + "/tabs/move", {
                            "direction": "index",
                            tabIndex,
                            tabId,
                        }).then(function (result) {
                            return result.data
                        })
                    },
                },
            },
            methods: {
                update: function (nodetypeName, methodId, attributeName, oldValue, newValue) {
                    return $http.put(URLS.NODETYPES + nodetypeName + "/methods/" + methodId, {
                        "method": {
                            "attribute": attributeName,
                            "oldValue": oldValue,
                            "newValue": newValue
                        }
                    }).then(function (result) {
                        return result.data
                    })
                },
                add: function (nodetypeName, method) {
                    return $http.post(URLS.NODETYPES + nodetypeName + "/methods", {
                        method
                    }).then(function (result) {
                        return result.data
                    })
                },
                remove: function (nodetypeName, methodId) {
                    return $http.delete(URLS.NODETYPES + nodetypeName + "/methods/" + methodId)
                        .then(function (result) {
                            return result.data
                        })
                }
            },
            lifecycle: {
                roles: {
                    add: function (nodetypeName, role) {
                        return $http.post(URLS.NODETYPES + nodetypeName + "/lifecycle/roles", {
                            "name": role.name
                        }).then(function (result) {
                            return result.data
                        })
                    },
                    update: function (nodetypeName, roleId, attributeName, oldValue, newValue) {
                        return $http.put(URLS.NODETYPES + nodetypeName + "/lifecycle/roles/" + roleId, {
                            "role": {
                                "attribute": attributeName,
                                "oldValue": oldValue,
                                "newValue": newValue
                            }
                        }).then(function (result) {
                            return result.data
                        })
                    },
                    remove: function (nodetypeName, roleId) {
                        return $http.delete(URLS.NODETYPES + nodetypeName + "/lifecycle/roles/" + roleId)
                            .then(function (result) {
                                return result.data
                            })
                    }
                },
                transitions: {
                    add: function (nodetypeName, transition) {
                        return $http.post(URLS.NODETYPES + nodetypeName + "/lifecycle/transitions", {
                            "transition": {
                                "from": transition.from,
                                "to": transition.to,
                                "premethod": "",
                                "postmethod": ""
                            }
                        }).then(function (result) {
                            return result.data
                        })
                    },
                    update: function (nodetypeName, transitionId, attribute, oldValue, newValue) {
                        return $http.put(URLS.NODETYPES + nodetypeName + "/lifecycle/transitions/" + transitionId, {
                            "transition": {
                                "attribute": attribute,
                                "oldValue": oldValue,
                                "newValue": newValue
                            }
                        }).then(function (result) {
                            return result.data
                        })
                    },
                    remove: function (nodetypeName, transitionId) {
                        return $http.delete(URLS.NODETYPES + nodetypeName + "/lifecycle/transitions/" + transitionId
                        ).then(function (result) {
                            return result.data
                        })
                    }
                },
                states: {
                    add: function (nodetypeName, state) {
                        return $http.post(URLS.NODETYPES + nodetypeName + "/lifecycle/states", {
                            "state": {
                                "name": state.name,
                                "label": state.label,
                                "labelClass": "",
                                "start": false,
                                "lockable": false
                            }
                        }).then(function (result) {
                            return result.data
                        })
                    },
                    update: function (nodetypeName, stateId, attributeName, oldValue, newValue) {
                        return $http.put(URLS.NODETYPES + nodetypeName + "/lifecycle/states/" + stateId, {
                            "state": {
                                "attribute": attributeName,
                                "oldValue": oldValue,
                                "newValue": newValue
                            }
                        }).then(function (result) {
                            return result.data
                        })
                    },
                    remove: function (nodetypeName, stateId) {
                        return $http.delete(URLS.NODETYPES + nodetypeName + "/lifecycle/states/" + stateId
                        ).then(function (result) {
                            return result.data
                        })
                    }
                }
            },
            actions: {
                add: function (nodetypeName, action) {
                    return $http.post(URLS.NODETYPES + nodetypeName + "/actions", { action })
                        .then(function (result) {
                            return result.data
                        })
                },
                update: function (nodetypeName, actionId, attribute, value) {
                    return $http.put(URLS.NODETYPES + nodetypeName + "/actions/" + actionId, { action: { attribute, value } })
                        .then(function (result) {
                            return result.data;
                        })
                },
                delete: function (nodetypeName, actionId) {
                    return $http.delete(URLS.NODETYPES + nodetypeName + "/actions/" + actionId)
                        .then(function (result) {
                            return result.data;
                        })
                },
            },
            instanciations: {
                update: function (nodetypeName, instanciationId, attributeName, oldValue, newValue) {
                    return $http.put(URLS.NODETYPES + nodetypeName + "/instanciations/" + instanciationId, {
                        "instanciation": {
                            "attribute": attributeName,
                            "oldValue": oldValue,
                            "newValue": newValue
                        }
                    }).then(function (result) {
                        return result.data;
                    })
                },
                add: function (nodetypeName, instanciation) {
                    return $http.post(URLS.NODETYPES + nodetypeName + "/instanciations", {
                        instanciation
                    }).then(function (result) {
                        return result.data;
                    })
                },
                remove: function (nodetypeName, instanciationId) {
                    return $http.delete(URLS.NODETYPES + nodetypeName + "/instanciations/" + instanciationId)
                        .then(function (result) {
                            return result.data;
                        })
                }
            },
            updateCodificationCounter: (nodetypeName, counter) => {
                return $http.post(`${URLS.NODETYPES}${nodetypeName}/updateCodificationCounter`, { counter })
                    .then((result) => {
                        return result;
                    })
            },
            externalAPIs: {
                update: (nodetypeName, data) => {
                    return $http.put(`${URLS.NODETYPES}${nodetypeName}/external-apis`, data)
                        .then(function (result) {
                            return result.data;
                        })
                }
            }
        }

        datamodel.config = {
            exportDB: function () {
                return $http.get(`${URLS.CONFIG}databases/export`).then((result) => {
                    return result.data;
                })
            },
            importDB: function (data) {
                return $http.post(`${URLS.CONFIG}databases/import`, data).then((result) => {
                    return result.data;
                })
            },
        }

    })
