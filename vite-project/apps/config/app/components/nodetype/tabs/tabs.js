angular.module('app.ganister.config.models.nodetypes.ui.tabs', [
]).controller('tabsController', function ($scope, $rootScope, $translate, datamodelModel, Notification) {

  const getNodetypeIndex = () => {
    return $scope.datamodel.nodetypes.findIndex(item => item.id === $scope.nodetype.id);
  }

  //                       _         _  _   
  //                      (_)       (_)| |  
  //  __   __ __ _  _ __   _  _ __   _ | |_ 
  //  \ \ / // _` || '__| | || '_ \ | || __|
  //   \ V /| (_| || |    | || | | || || |_ 
  //    \_/  \__,_||_|    |_||_| |_||_| \__|

  // Tabs table
  const tabTypes = [
    "custom",
    "customTableView",
    "customTreeGridView",
    "ECOimpactMatrix",
    "externalAPI",
    "fileGallery",
    "ganttView",
    "graphView",
    "multilevelView",
    "relatedObject",
    "reverseECOs",
    "reverseRelationships",
    "undirectedRelationship",
    "kanbanView",
    "klayGraphView"
  ];

  $scope.externalAPIs = [{
    name: 'github',
    actions: [
      'Issues: List For Repo',
      'Commits: List Commits',
    ],
  },
  // {
  //   name: 'gitlab',
  //   actions: [
  //     'Issues: List For Repo',
  //     'Commits: List Commits',
  //   ],
  // },
  {
    name: 'element14',
    actions: [
      'Search Term',
    ],
  }, {
    name: 'ihs',
    actions: [
      'Search Parts',
    ],
  }, {
    name: 'z2Data',
    actions: [
      'Search Parts',
    ],
  }];


  const columnDefsCustomTableView = [
    {
      headerName: "name",
      field: "name",
      editable: true,
      width: 200,
      pinned: 'left',
      rowDrag: true,
    },
    {
      headerName: "mapping",
      field: "mapping",
      editable: true,
      width: 220,
    },
    {
      headerName: "Width",
      field: "width",
      editable: true,
      width: 100,
    },
    {
      headerName: "Data Type",
      field: "type",
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          "date",
          "dateTime",
          "dropdown",
          "filesize",
          "image",
          "indice",
          "double",
          "integer",
          "lock",
          "markdown",
          "mimetype",
          "multiselect",
          "node",
          "nutriscore",
          "version",
          "state",
          "string",
          "tags",
          "text",
          "user",
        ]
      },
      editable: true,
      width: 100,
    },
    {
      headerName: "Group Order",
      field: "groupOrder",
      editable: true
    },
    {
      headerName: "Visible",
      field: "visible",
      editable: true,
      cellRenderer: (params) => {
        var input = document.createElement('input');
        input.type = "checkbox";
        input.checked = params.value;
        input.addEventListener('click', (event) => {
          params.value = !params.value;
          params.node.data.visible = params.value;
          datamodelModel.nodetypes.ui.tabs.update(
            $scope.nodetype.name,
            $scope.selectedTab.id,
            "customTableView",
            {},
            $scope.selectedTab.customTableView
          ).then((result) => {
          })
        });
        return input;
      },
      width: 50,
    }
  ];

  const columnDefs = [
    {
      headerName: "name",
      field: "name",
      editable: true,
      width: 180,
      pinned: 'left',
      rowDrag: true,
    },
    {
      headerName: `translation (${$rootScope.appContext.user.language.name})`,
      headerTooltip: 'Translation for the selected language',
      field: "translation",
      width: 200,
      editable: true,
      cellStyle: (params) => params.data.core ? { 'background-color': null } : {},
    },
    {
      headerName: "Content Type",
      field: "tabContentType",
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: tabTypes.sort()
      },
      editable: true
    },
    {
      headerName: "Property",
      field: "property",
      editable: true,
      cellRenderer: (params) => {
        const propId = params.data.property;
        if (propId) {
          const property = $scope.nodetype.properties.find(p => p.id === propId);
          return property.name;
        } else {
          return;
        }
      }
    },
    {
      headerName: "Relationships",
      field: "relationships",
      editable: false,
      cellRenderer: (params) => {
        if (['customTreeGridView'].includes(params.data.tabContentType)) return '';
        const tabName = params.data.name;
        const tabRels = params.data.relationships;
        if (Array.isArray(tabRels)) {
          const relationships = tabRels.map((r) => {
            const relationship = $scope.datamodel.nodetypes.find(item => item.id === r);
            if (relationship) {
              return `${relationship.name} (${relationship.linkName})`;
            } else {
              console.error(`Relationship ID: ${r} is not valid in tab ${tabName}`);
            }
          });
          return relationships.join(', ');
        } else if (tabRels) {
          const relationship = $scope.datamodel.nodetypes.find(item => item.id === tabRels);
          if (relationship) {
            return `${relationship.name} (${relationship.linkName})`;
          } else {
            console.error(`Relationship ID: ${tabRels} is not valid in tab ${tabName}`);
          }
        } else {
          return '';
        }
      },
    },
    {
      headerName: "Autoloads",
      field: "autoloads",
      width: 80,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [true, false]
      },
      editable: (params) => {
        const allowedTabTypes = ['relatedObject', 'reverseRelationships', 'multilevelView', 'customTreeGridView', 'customTableView' , 'graphView'];
        return allowedTabTypes.includes(params.data.tabContentType) ? true : false;
      },
      cellStyle: (params) => {
        const allowedTabTypes = ['relatedObject', 'reverseRelationships', 'multilevelView', 'customTreeGridView', 'customTableView', 'graphView'];
        return allowedTabTypes.includes(params.data.tabContentType) ? {} : { 'background-color': '#aaa' };
      }
    },
    {
      headerName: "Disable updates",
      field: "disableUpdates",
      width: 80,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [true, false]
      },
      editable: (params) => {
        const allowedTabTypes = ['relatedObject', 'reverseRelationships', 'multilevelView', 'customTreeGridView', 'customTableView', 'graphView'];
        return allowedTabTypes.includes(params.data.tabContentType) ? true : false;
      },
      cellStyle: (params) => {
        const allowedTabTypes = ['relatedObject', 'reverseRelationships', 'multilevelView', 'customTreeGridView', 'customTableView', 'graphView'];
        return allowedTabTypes.includes(params.data.tabContentType) ? {} : { 'background-color': '#aaa' };
      }
    }
  ];



  $scope.customTableViewGridOptions = {
    defaultColDef: {
      resizable: true
    },
    rowDragManaged: true,
    animateRows: true,
    columnDefs: columnDefsCustomTableView,
    rowSelection: 'multiple',
    onRowSelected: (params) => {
    },
    onGridReady: (params) => {
    },
    onCellValueChanged: (params) => {
      if (params.oldValue != params.newValue) {
        datamodelModel.nodetypes.ui.tabs.update(
          $scope.nodetype.name,
          $scope.selectedTab.id,
          "customTableView",
          {},
          $scope.selectedTab.customTableView
        ).then((result) => {
          Notification.success("Custom Table View Columns Updated");
        })
      }
    },
    onRowDragEnd: (e) => {
      const columns = [];
      e.api.forEachNode((n) => columns.push(n.data));
      $scope.selectedTab.customTableView.columns = columns;
      datamodelModel.nodetypes.ui.tabs.update(
        $scope.nodetype.name,
        $scope.selectedTab.id,
        "customTableView",
        {},
        $scope.selectedTab.customTableView
      ).then((result) => {
        Notification.success("Custom Table View Columns Updated");
      })
    },
    rowData: []
  }


  //#region customtreegridview

  $scope.addCustomTreeGridViewColumn = () => {
    if (!($scope.selectedTab.customTreeGridView)) {
      $scope.selectedTab.customTreeGridView = {
        columns: [],
        cypher: "",
      }
    }
    if (!($scope.selectedTab.customTreeGridView.columns)) {
      $scope.selectedTab.customTreeGridView.columns = [];
    }
    $scope.selectedTab.customTreeGridView.columns.push({
      name: "col_" + $scope.selectedTab.customTreeGridView.columns.length,
      mapping: "",
      width: "100",
      type: "string",
      visible: true,
      editable: false,
    });
    datamodelModel.nodetypes.ui.tabs.update(
      $scope.nodetype.name,
      $scope.selectedTab.id,
      "customTreeGridView",
      {},
      $scope.selectedTab.customTreeGridView
    ).then((result) => {
      Notification.success("Custom Table View Columns Updated");
      datamodelModel.grid.loadData($scope.customTreeGridViewGridOptions.api, $scope.selectedTab.customTreeGridView.columns)
    })

  }


  $scope.updateCustomTreeGridView = (element) => {
    datamodelModel.nodetypes.ui.tabs.update(
      $scope.nodetype.name,
      $scope.selectedTab.id,
      "customTreeGridView",
      {},
      $scope.selectedTab.customTreeGridView
    ).then((result) => {
      Notification.success(element + ' Updated');
    })
  }

  
  $scope.updateGraphView = (element) => {
    datamodelModel.nodetypes.ui.tabs.update(
      $scope.nodetype.name,
      $scope.selectedTab.id,
      "graphView",
      {},
      $scope.selectedTab.graphView
    ).then((result) => {
      Notification.success(element + ' Updated');
    })
  }


  $scope.removeCustomTreeGridViewColumns = () => {
    var selectedRows = $scope.customTreeGridViewGridOptions.api.getSelectedRows()
    if (selectedRows.length > 0) {
      // remove selected items from $scope tabs
      for (col of selectedRows) {
        $scope.selectedTab.customTreeGridView.columns = _.filter($scope.selectedTab.customTreeGridView.columns, (currentObject) => {
          return currentObject.name !== col.name;
        });
      }

      datamodelModel.nodetypes.ui.tabs.update(
        $scope.nodetype.name,
        $scope.selectedTab.id,
        "customTreeGridView",
        {},
        $scope.selectedTab.customTreeGridView
      ).then(function (result) {
        datamodelModel.grid.loadData($scope.customTreeGridViewGridOptions.api, $scope.selectedTab.customTreeGridView.columns)
        Notification.success("Custom Table View Columns Updated");
      })
    } else {
      // notify user to select a row first
    }
  };

  const columnDefsCustomTreeGridView = [
    {
      headerName: "name",
      field: "name",
      editable: true,
      width: 200,
      pinned: 'left',
      rowDrag: true,
    },
    {
      headerName: "mapping",
      field: "mapping",
      editable: true,
      width: 90,
    },
    {
      headerName: "nodetype",
      field: "Nodetype",
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: $scope.datamodel.nodetypes.map(nt => nt.name),
      },
      editable: true,
      width: 220,
    },
    {
      headerName: "property",
      field: "Property",
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
        ]
      },
      editable: true,
      width: 220,
    },
    {
      headerName: "Width",
      field: "width",
      editable: true,
      width: 100,
    },
    {
      headerName: "Data Type",
      field: "type",
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          "date",
          "dateTime",
          "dropdown",
          "filesize",
          "image",
          "indice",
          "double",
          "integer",
          "lock",
          "markdown",
          "mimetype",
          "multiselect",
          "node",
          "nutriscore",
          "version",
          "state",
          "string",
          "tags",
          "text",
          "treeStructure",
          "user",
        ]
      },
      editable: true,
      width: 100,
    },
    {
      headerName: "Sort",
      field: "rowSortBy",
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          "none",
          "asc",
          "desc",
        ]
      },
      editable: true,
      width: 100,
    },
    {
      headerName: "Sort Index",
      field: "sortIndex",
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [1, 2, 3, 4, 5, 6]
      },
      editable: true,
      width: 100,
    },
    {
      headerName: "Visible",
      field: "visible",
      editable: true,
      cellRenderer: (params) => {
        var input = document.createElement('input');
        input.type = "checkbox";
        input.checked = params.value;
        input.addEventListener('click', (event) => {
          params.value = !params.value;
          params.node.data.visible = params.value;
          datamodelModel.nodetypes.ui.tabs.update(
            $scope.nodetype.name,
            $scope.selectedTab.id,
            "customTreeGridView",
            {},
            $scope.selectedTab.customTreeGridView
          ).then((result) => {
          })
        });
        return input;
      },
      width: 50,
    },
    {
      headerName: "Editable",
      field: "editable",
      editable: true,
      cellRenderer: (params) => {
        var input = document.createElement('input');
        input.type = "checkbox";
        input.checked = params.value;
        input.addEventListener('click', (event) => {
          params.value = !params.value;
          params.node.data.editable = params.value;
          datamodelModel.nodetypes.ui.tabs.update(
            $scope.nodetype.name,
            $scope.selectedTab.id,
            "customTreeGridView",
            {},
            $scope.selectedTab.customTreeGridView
          ).then((result) => {
          })
        });
        return input;
      },
      width: 50,
    },
    {
      headerName: "Localized",
      field: "localized",
      editable: true,
      cellRenderer: (params) => {
        var input = document.createElement('input');
        input.type = "checkbox";
        input.checked = params.value;
        input.addEventListener('click', (event) => {
          params.value = !params.value;
          params.node.data.localized = params.value;
          datamodelModel.nodetypes.ui.tabs.update(
            $scope.nodetype.name,
            $scope.selectedTab.id,
            "customTreeGridView",
            {},
            $scope.selectedTab.customTreeGridView
          ).then((result) => {
          })
        });
        return input;
      },
      width: 50,
    }
  ];


  const nodetypesPropertiesSet = {};
  $scope.customTreeGridViewGridOptions = {
    defaultColDef: {
      resizable: true
    },
    rowDragManaged: true,
    animateRows: true,
    columnDefs: columnDefsCustomTreeGridView,
    rowSelection: 'multiple',
    onRowClicked: function (params) {
      propsCol = this.columnDefs.find(col => col.field === 'Property');
      // load nodetypes
      const nodetypeName = params.data.Nodetype;
      if (nodetypesPropertiesSet[nodetypeName]) {
        propsCol.cellEditorParams.values = nodetypesPropertiesSet[nodetypeName];
      } else {
        const nodetype = $scope.datamodel.nodetypes.find(nt => nt.name === nodetypeName);
        if (nodetype) {
          nodetypesPropertiesSet[nodetypeName] = nodetype.properties.map(prop => prop.name);
          propsCol.cellEditorParams.values = nodetypesPropertiesSet[nodetypeName];
        }
      }

    },
    onGridReady: function (params) {
    },

    onCellValueChanged: function (params) {


      if (params.oldValue != params.newValue) {
        if (params.colDef.field === "Nodetype") {
          // load properties
          this.api.forEachNode((r) => {
            if (r.data.mapping === params.data.mapping) {
              console.log('log update', r.id);
              const updateRow = this.api.getRowNode(r.id);
              updateRow.setDataValue('Nodetype', params.newValue);
            }
          })
        }


        datamodelModel.nodetypes.ui.tabs.update(
          $scope.nodetype.name,
          $scope.selectedTab.id,
          "customTreeGridView",
          {},
          $scope.selectedTab.customTreeGridView
        ).then(function (result) {
          Notification.success("Custom TreeGrid View Columns Updated");
        })
      }
    },
    onRowDragEnd: function (e) {
      const columns = [];
      e.api.forEachNode((n) => columns.push(n.data));
      $scope.selectedTab.customTreeGridView.columns = columns;
      datamodelModel.nodetypes.ui.tabs.update(
        $scope.nodetype.name,
        $scope.selectedTab.id,
        "customTreeGridView",
        {},
        $scope.selectedTab.customTreeGridView
      ).then(function (result) {
        Notification.success("Custom TreeGrid View Columns Updated");
      })
    },
    rowData: []
  }


  //#endregion customtreegridview

  $scope.tabsGridOptions = {
    defaultColDef: {
      resizable: true
    },
    rowDragManaged: true,
    getRowNodeId: (r) => r.id,
    animateRows: true,
    columnDefs,
    rowSelection: "single",
    onRowSelected: function (params) {
      // test if row is really selected
      if (params.node.selected) {
        $scope.getTabTypeRelationships(params);
      }
    },
    onGridReady: function (params) {
      $scope.nodetype = $scope.datamodel.openItem;
      $scope.nodetype.ui.tabs.sort((a, b) => {
        return a.order - b.order;
      })
      $scope.updateGridData($scope.nodetype.ui.tabs);
    },
    onCellValueChanged: function (params) {
      var tabId = params.data.id
      if (params.oldValue != params.newValue) {
        $scope.getTabTypeRelationships(params);
        //  If column changed is translation, update translation and return
        if (params.colDef.field === 'translation') {
          datamodelModel.translations.update($rootScope.appContext.user.language.key, {
            path: `nodetype.${$scope.nodetype.name}.${params.data.name}`,
            value: params.newValue,
          }).then((result) => {
            if (result.status === 200) {
              return Notification.success(`Tab Name updated in translation file. (${$rootScope.appContext.user.language.key})`);
            }
            return Notification.error("Tab Name not updated in translation file.");
          });
          return;
        }
        if (params.colDef.field === 'name') {
          //  Remove spaces from values if exists
          params.oldValue = params.oldValue.replace(/\s/g, '');
          params.newValue = params.newValue.replace(/\s/g, '');
        }
        datamodelModel.nodetypes.ui.tabs.update(
          $scope.nodetype.name,
          tabId,
          params.colDef.field,
          params.oldValue,
          params.newValue,
        ).catch(function (e) {
          console.error(e);
          return Notification.error('Nodetype tab did not update');
        }).then(function (result) {
          $scope.nodetype = Object.assign($scope.nodetype, result.nodetype);
          Notification.success({ message: 'Tab Updated' });
          $scope.selectedTabType = params.node.data.tabContentType;
          if (params.colDef.field === 'name') {
            const column = $scope.nodetype.ui.gridColumns.find(c => c.tab === `${$scope.nodetype.name}.${params.oldValue}`);
            if (column) {
              params.newValue = params.newValue.replace(/\s/g, '');
              $rootScope.$broadcast('updateCellValue', {
                nodetypeName: $scope.nodetype.name,
                column,
                field: 'tab',
                value: `${$scope.nodetype.name}.${params.newValue}`,
              });
            }
            const rowNode = $scope.tabsGridOptions.api.getRowNode(params.data.id);
            const rowData = { ...params.data };
            rowData[params.colDef.field] = params.newValue;
            rowNode.setData(rowData);
            //  TODO: Update Translation Property Name for all languages
            datamodelModel.translations.updatePropertyName(
              $scope.nodetype.name,
              params.oldValue,
              params.newValue,
            ).then((result) => {
              if (result.status !== 200) return Notification.error("Tab Name is not updated in translation files!");
            });
          }
        });
      }
    },
    onRowDragEnd: function (e) {
      const propIndex = $scope.nodetype.ui.tabs.findIndex(item => item.id === e.node.data.id);
      $scope.nodetype.ui.tabs.move(propIndex, e.overIndex);
      datamodelModel.nodetypes.ui.tabs.move(
        $scope.nodetype.name,
        e.overIndex,
        e.node.data.id,
      ).catch(function (e) {
        $scope.nodetype.ui.tabs.move(e.overIndex, propIndex);
        Notification.error('Tabs Reordering failed');
        console.error(e);
      }).then(function (result) {
        Notification.success("Tabs Order Updated");
        $scope.updateGridData($scope.nodetype.ui.tabs, false);
      })
    },
    rowData: []
  }

  $scope.editorOptions = {
    lineWrapping: true,
    smartIndent: true,
    lineNumbers: true,
    readOnly: false,
    theme: 'midnight',
    mode: { name: "javascript", json: false },
  };


  //  ______                    _    _                    
  // |  ____|                  | |  (_)                   
  // | |__  _   _  _ __    ___ | |_  _   ___   _ __   ___ 
  // |  __|| | | || '_ \  / __|| __|| | / _ \ | '_ \ / __|
  // | |   | |_| || | | || (__ | |_ | || (_) || | | |\__ \
  // |_|    \__,_||_| |_| \___| \__||_| \___/ |_| |_||___/




  // move function to be put in an utility file
  Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
      var k = new_index - this.length;
      while ((k--) + 1) {
        this.push(undefined);
      }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
  };


  //    _                                    ______                    _    _                    
  //   | |                                  |  ____|                  | |  (_)                   
  //  / __) ___   ___  ___   _ __    ___    | |__  _   _  _ __    ___ | |_  _   ___   _ __   ___ 
  //  \__ \/ __| / __|/ _ \ | '_ \  / _ \   |  __|| | | || '_ \  / __|| __|| | / _ \ | '_ \ / __|
  //  (   /\__ \| (__| (_) || |_) ||  __/ _ | |   | |_| || | | || (__ | |_ | || (_) || | | |\__ \
  //   |_| |___/ \___|\___/ | .__/  \___|(_)|_|    \__,_||_| |_| \___| \__||_| \___/ |_| |_||___/
  //                        | |                                                                  
  //       

  $scope.updateGridData = async (data, translate = true) => {
    if (!$scope.tabsGridOptions.api) return;
    if (translate) {
      await data.forEach(async (r) => {
        await $translate(`nodetype.${$scope.nodetype.name}.${r.name}`).then((trans) => {
          r.translation = trans;
        }, (translationId) => {
          r.translation = translationId;
        });
      });
    }
    const selectedNode = $scope.tabsGridOptions.api.getSelectedNodes()[0];
    $scope.tabsGridOptions.api.setRowData(data);
    if (selectedNode) {
      // re select the last selected node (=== the updated one)
      const selectedRowIndex = selectedNode.rowIndex;
      if ($scope.tabsGridOptions.api.getDisplayedRowAtIndex(selectedRowIndex)) {
        $scope.tabsGridOptions.api.getDisplayedRowAtIndex(selectedRowIndex).setSelected(true);
      }
    }
  };

  $scope.addCustomTableViewColumn = () => {
    if (!($scope.selectedTab.customTableView)) {
      $scope.selectedTab.customTableView = {
        columns: [],
        cypher: "",
      }
    }
    if (!($scope.selectedTab.customTableView.columns)) {
      $scope.selectedTab.customTableView.columns = [];
    }
    $scope.selectedTab.customTableView.columns.push({
      name: "col_" + $scope.selectedTab.customTableView.columns.length,
      mapping: "",
      width: "100",
      type: "string",
      visible: true,
    });
    datamodelModel.nodetypes.ui.tabs.update(
      $scope.nodetype.name,
      $scope.selectedTab.id,
      "customTableView",
      {},
      $scope.selectedTab.customTableView
    ).then((result) => {
      Notification.success("Custom Table View Columns Updated");
      datamodelModel.grid.loadData($scope.customTableViewGridOptions.api, $scope.selectedTab.customTableView.columns)
    })

  }


  $scope.updateCypher = () => {
    datamodelModel.nodetypes.ui.tabs.update(
      $scope.nodetype.name,
      $scope.selectedTab.id,
      "customTableView",
      {},
      $scope.selectedTab.customTableView
    ).then((result) => {
      Notification.success("Cypher Query Updated");
      datamodelModel.grid.loadData($scope.customTableViewGridOptions.api, $scope.selectedTab.customTableView.columns)
    })
  }

  $scope.removeCustomTableViewColumns = () => {
    var selectedRows = $scope.customTableViewGridOptions.api.getSelectedRows()
    if (selectedRows.length > 0) {
      // remove selected items from $scope tabs
      for (col of selectedRows) {
        $scope.selectedTab.customTableView.columns = _.filter($scope.selectedTab.customTableView.columns, (currentObject) => {
          return currentObject.name !== col.name;
        });
      }

      datamodelModel.nodetypes.ui.tabs.update(
        $scope.nodetype.name,
        $scope.selectedTab.id,
        "customTableView",
        {},
        $scope.selectedTab.customTableView
      ).then((result) => {
        datamodelModel.grid.loadData($scope.customTableViewGridOptions.api, $scope.selectedTab.customTableView.columns)
        Notification.success("Custom Table View Columns Updated");
      })
    } else {
      // notify user to select a row first
    }
  };







  /**
   * getTabTypeRelationships
   * @param {*} params 
   */
  $scope.getTabTypeRelationships = (params) => {
    $scope.selectedTab = params.node.data;
    $scope.selectedTabType = params.node.data.tabContentType;
    datamodelModel.grid.loadData($scope.customTableViewGridOptions.api, []);
    switch ($scope.selectedTabType) {
      case "relatedObject":
        $scope.attachmentMode = $scope.selectedTab.attachMode;
        $scope.openOnCreation = $scope.selectedTab.openOnCreation;
        $scope.relationships = $scope.datamodel.nodetypes.filter((nodetype) => {
          return !nodetype.undirectedRelationship;
        });
      case "fileGallery":
        $scope.selectedRelValue = _.find($scope.datamodel.nodetypes, { "id": params.node.data.relationships });
        break;
      case "multilevelView":
        $scope.relationships = $scope.datamodel.nodetypes.filter((nodetype) => nodetype.elementType === 'relationship');
        if (!Array.isArray(params.node.data.relationships)) params.node.data.relationships = [];
        $scope.selectedRelValues = params.node.data.relationships.map((elt) => {
          return _.find($scope.datamodel.nodetypes, { "id": elt });
        });
        break;
      case "reverseRelationships":
        if (!Array.isArray(params.node.data.relationships)) params.node.data.relationships = [];
        $scope.selectedRelValues = params.node.data.relationships
          .filter((elt) => {
            return _.find($scope.datamodel.nodetypes, { "id": elt });
          })
          .map((elt) => {
            return _.find($scope.datamodel.nodetypes, { "id": elt });
          });
        break;
      case "undirectedRelationship":
        $scope.relationships = $scope.datamodel.nodetypes.filter((nodetype) => {
          const { elementType, hidden, undirectedRelationship, directions = [] } = nodetype;

          const isRelationship = elementType === 'relationship';
          const direction = directions.find((d) => {
            return d.source === $scope.nodetype.id || d.target === $scope.nodetype.id;
          })
          return !hidden && isRelationship && undirectedRelationship && direction;
        });
        break;
      case "customTableView":
        if ($scope.selectedTab.customTableView) {
          datamodelModel.grid.loadData($scope.customTableViewGridOptions.api, $scope.selectedTab.customTableView.columns);
        } else {
          datamodelModel.grid.loadData($scope.customTableViewGridOptions.api, []);
        }
        break;
      case "customTreeGridView":
        if ($scope.selectedTab.customTreeGridView) {
          datamodelModel.grid.loadData($scope.customTreeGridViewGridOptions.api, $scope.selectedTab.customTreeGridView.columns);
        } else {
          datamodelModel.grid.loadData($scope.customTreeGridViewGridOptions.api, []);
        }
        break;
      case "kanbanView":
      case "klayGraphView":
      case "externalAPI":
        const externalAPI = $scope.selectedTab.externalAPI;
        const externalAPIAction = $scope.selectedTab.externalAPIAction;
        $scope.selectedExternalAPI = $scope.externalAPIs.find(a => a.name === externalAPI);
        $scope.selectedExternalAPITabContent = externalAPIAction;
        break;
      default:
        break;
    }
    if ($scope.noSelection) $scope.noSelection = false;
  };

  /**
   * filterRelBySourceType
   * @param {*} rel 
   * @returns 
   */
  $scope.filterRelBySourceType = (rel) => {
    const { elementType, hidden, undirectedRelationship, cardinality, directions = [] } = rel;

    var filterSuccess = elementType == 'relationship' && !hidden;
    filterSuccess = filterSuccess && (cardinality === "1toN" || cardinality === "NtoN" || cardinality === "free" || !cardinality)

    const direction = directions.find((d) => d.source === $scope.nodetype.id)
    filterSuccess = filterSuccess && (direction || undirectedRelationship);
    return filterSuccess;
  };

  /**
   * filterRelByTargetType
   * @returns 
   */
  $scope.filterRelByTargetType = () => {
    return (item) => {
      const { elementType, hidden, directions = [] } = item;

      if (elementType === 'node' || hidden) return;

      const direction = directions.find((d) => d.target === $scope.nodetype.id);
      return direction;
    };
  };

  /**
   * addTab
   */
  $scope.addTab = async () => {
    if (!($scope.nodetype.ui.tabs)) {
      $scope.nodetype.ui.tabs = []
    }
    await Swal.fire({
      title: 'Please enter property name',
      input: 'text',
      showCancelButton: true,
      inputValidator: (tabName) => {
        if (!tabName) {
          return 'You need to write something';
        } else if (Number.isInteger(parseInt(tabName.charAt(0), 10))) {
          return 'Property name cannot start with a number';
        } else {
          tabName = tabName.replace(/\s/g, '');
          var newTab = {
            "name": tabName,
            "tabContentType": "relatedObject",
            "relationships": null,
          }
          datamodelModel.nodetypes.ui.tabs.add(
            $scope.nodetype.name,
            newTab
          ).catch((e) => {
            console.error(e);
          }).then((result) => {
            $scope.nodetype.ui.tabs.push(result.tab);
            datamodelModel.translations.update($rootScope.appContext.user.language.key, {
              path: `nodetype.${$scope.nodetype.name}.${tabName}`,
              value: _.startCase(tabName),
            }).then((result) => {
              if (result.status === 200) {
                $scope.$emit('translateUpdatedProps');
                $scope.updateGridData($scope.nodetype.ui.tabs, true);

                return Notification.success('Tab added');
              }
              return Notification.error("Tab Name not updated in translation file.");
            });
          })
        }
      }
    });

  }



  // move the grid line up
  $scope.moveTabUp = () => {
    var selectedNodes = $scope.tabsGridOptions.api.getSelectedNodes()
    if (selectedNodes.length == 1) {
      $scope.nodetype.ui.tabs.move(selectedNodes[0].childIndex, selectedNodes[0].childIndex - 1)
      datamodelModel.nodetypes.ui.tabs.moveUp(
        $scope.nodetype.name,
        selectedNodes[0].childIndex
      ).catch((e) => {
        $scope.nodetype.ui.tabs.move(selectedNodes[0].childIndex - 1, selectedNodes[0].childIndex)
        console.log(e)
      }).then((result) => {
        Notification.success("Tabs Order Updated");
        $scope.updateGridData($scope.nodetype.ui.tabs);
      })
    }
  }

  // move the grid line down
  $scope.moveTabDown = () => {
    var selectedNodes = $scope.tabsGridOptions.api.getSelectedNodes()
    if (selectedNodes.length == 1) {
      $scope.nodetype.ui.tabs.move(selectedNodes[0].childIndex, selectedNodes[0].childIndex + 1)
      datamodelModel.nodetypes.ui.tabs.moveDown(
        $scope.nodetype.name,
        selectedNodes[0].childIndex
      ).catch((e) => {
        $scope.nodetype.ui.tabs.move(selectedNodes[0].childIndex + 1, selectedNodes[0].childIndex)
        console.log(e)
      }).then((result) => {
        Notification.success("Tabs Order Updated");
        $scope.updateGridData($scope.nodetype.ui.tabs);
      })
    }
  }


  // delete property
  $scope.removeSelectedTabs = () => {
    var selectedRows = $scope.tabsGridOptions.api.getSelectedRows()
    if (selectedRows.length > 0) {
      // remove selected items from $scope tabs
      for (tab of selectedRows) {
        datamodelModel.nodetypes.ui.tabs.remove(
          $scope.nodetype.name,
          tab.id
        ).catch((e) => {
          console.error(e)
          // alert message and restore values
        }).then((result) => {
          $scope.nodetype.ui.tabs = _.reject($scope.nodetype.ui.tabs, { "id": result.id });
          $scope.updateGridData($scope.nodetype.ui.tabs);
          return Notification.success('Tab removed');
        })
      }
    } else {
      // notify user to select a row first
    }
    if ($scope.noSelection === false) {
      $scope.noSelection = true;
      $scope.selectedTabType = "";
      $scope.selectedTab = {};
    }
  }

  /**
   * updateRelSources
   * @param {*} relArray 
   */
  $scope.updateRelSources = (relArray) => {
    datamodelModel.nodetypes.ui.tabs.update(
      $scope.nodetype.name,
      $scope.selectedTab.id,
      "relationships",
      "[]",
      relArray
    ).then((result) => {
      if (result && result.nodetype) {
        Object.assign($scope.nodetype, result.nodetype);

        const nodetypeIndex = $scope.datamodel.nodetypes.findIndex(item => item.id === result.nodetype.id);
        $scope.datamodel.nodetypes[nodetypeIndex] = result.nodetype;

        const tabIndex = $scope.datamodel.nodetypes[$scope.nodetypeIndex].ui.tabs.findIndex((item) => {
          return item.id === $scope.selectedTab.id
        });

        const relationships = $scope.datamodel.nodetypes[$scope.nodetypeIndex].ui.tabs[tabIndex].relationships;
        $scope.selectedRelValues = relationships.map((elt) => {
          return _.find($scope.datamodel.nodetypes, { "id": elt });
        });
        $scope.updateGridData($scope.nodetype.ui.tabs);
        Notification.success("Tab Relationships Updated!");
      }
    }).catch((err) => {
      console.error(err);
    })
  }

  /**
   * addRelValue
   * @param {*} optId 
   */
  $scope.addRelValue = (optId) => {
    if (!$scope.selectedRelValues) $scope.selectedRelValues = [];
    const relArray = $scope.selectedRelValues.map(rel => rel.id);
    const sameRelation = relArray.find(rel => rel === optId);
    if (!sameRelation) relArray.push(optId);
    $scope.updateRelSources(relArray);
  }

  /**
   * removeRelValue
   * @param {*} value 
   */
  $scope.removeRelValue = (value) => {
    let relArray = $scope.selectedRelValues.map(rel => rel.id);
    relArray = relArray.filter((rel) => rel !== value.id);
    $scope.updateRelSources(relArray);
  }

  /**
   * updateRelSource
   */
  $scope.updateRelSource = () => {
    if ($scope.selectedRelValue) {
      datamodelModel.nodetypes.ui.tabs.update(
        $scope.nodetype.name,
        $scope.selectedTab.id,
        "relationships",
        "[]",
        $scope.selectedRelValue.id
      ).then((result) => {
        $scope.datamodel.nodetypes[$scope.nodetypeIndex] = result.nodetype;
        $scope.updateGridData(result.nodetype.ui.tabs);
        Notification.success("Tab Relationships Updated!");
      });
    }
  }

  $scope.updateRelAttachMode = () => {
    if ($scope.attachmentMode) {
      datamodelModel.nodetypes.ui.tabs.update(
        $scope.nodetype.name,
        $scope.selectedTab.id,
        "attachMode",
        "",
        $scope.attachmentMode
      ).then((result) => {
        $scope.datamodel.nodetypes[$scope.nodetypeIndex] = result.nodetype;
        $scope.updateGridData(result.nodetype.ui.tabs);
        Notification.success("Tab Attach Mode Updated!");
      });
    }
  }

  /**
   * updateOpenOnCreation
   * @param {*} param0 
   */
  $scope.updateOpenOnCreation = ({ openOnCreation }) => {
    if ($scope.selectedTab && $scope.selectedTab.openOnCreation !== openOnCreation) {
      datamodelModel.nodetypes.ui.tabs.update(
        $scope.nodetype.name,
        $scope.selectedTab.id,
        "openOnCreation",
        "",
        openOnCreation
      ).then((result) => {
        $scope.datamodel.nodetypes[$scope.nodetypeIndex] = result.nodetype;
        $scope.updateGridData(result.nodetype.ui.tabs);
        Notification.success("Tab Open On Creation Updated!");
      });
    }
  }

  /**
   * updateProperty
   */
  $scope.updateProperty = () => {
    if ($scope.selectedProperty) {
      datamodelModel.nodetypes.ui.tabs.update(
        $scope.nodetype.name,
        $scope.selectedTab.id,
        "property",
        "",
        $scope.selectedProperty.id
      ).then((result) => {
        $scope.datamodel.nodetypes[$scope.nodetypeIndex] = result.nodetype;
        $scope.updateGridData(result.nodetype.ui.tabs);
        Notification.success("Tab Property Updated!");
      });
    }
  }

  /**
   * updateConditionalDisplay
   */
  $scope.updateConditionalDisplay = async () => {
    const result = await datamodelModel.nodetypes.ui.tabs.update(
      $scope.nodetype.name,
      $scope.selectedTab.id,
      "conditionalDisplay",
      "",
      $scope.selectedTab.conditionalDisplay
    )
    if (result.nodetype) {
      $scope.datamodel.nodetypes[$scope.nodetypeIndex] = result.nodetype;
      Notification.success("Tab conditional display updated!");
    }
  }

  /**
   * updateKanbasCard
   */
  $scope.updateKanbasCard = () => {
    datamodelModel.nodetypes.ui.tabs.update(
      $scope.nodetype.name,
      $scope.selectedTab.id,
      "kanbasCard",
      "",
      $scope.selectedTab.kanbasCard
    ).then((result) => {
      $scope.datamodel.nodetypes[$scope.nodetypeIndex] = result.nodetype;
      $scope.updateGridData(result.nodetype.ui.tabs);
      Notification.success("Tab Kanbas Card Updated!");
    });
  }

  $scope.$on('nodetypeMainUpdate', (event, nodetype, datatype) => {
    $scope.nodetype = nodetype;
    if (datatype === "tabs") {
      $scope.updateGridData($scope.nodetype.ui.tabs);
    }
  });

  //  External APIs
  $scope.updateExternalAPI = () => {
    if ($scope.selectedExternalAPI) {
      datamodelModel.nodetypes.ui.tabs.update(
        $scope.nodetype.name,
        $scope.selectedTab.id,
        "externalAPI",
        "",
        $scope.selectedExternalAPI.name
      ).then((result) => {
        $scope.datamodel.nodetypes[$scope.nodetypeIndex] = result.nodetype;
        datamodelModel.grid.loadData($scope.tabsGridOptions.api, result.nodetype.ui.tabs);
      });
    }
  }

  /**
   * updateExternalAPITabContent
   */
  $scope.updateExternalAPITabContent = () => {
    if ($scope.selectedExternalAPITabContent) {
      datamodelModel.nodetypes.ui.tabs.update(
        $scope.nodetype.name,
        $scope.selectedTab.id,
        "externalAPIAction",
        "",
        $scope.selectedExternalAPITabContent
      ).then((result) => {
        $scope.datamodel.nodetypes[$scope.nodetypeIndex] = result.nodetype;
        datamodelModel.grid.loadData($scope.tabsGridOptions.api, result.nodetype.ui.tabs);
      });
    }
  }

  //    _                                                  _         _     
  //   | |                                                | |       | |    
  //  / __) ___   ___  ___   _ __    ___  __      __ __ _ | |_  ___ | |__  
  //  \__ \/ __| / __|/ _ \ | '_ \  / _ \ \ \ /\ / // _` || __|/ __|| '_ \ 
  //  (   /\__ \| (__| (_) || |_) ||  __/ _\ V  V /| (_| || |_| (__ | | | |
  //   |_| |___/ \___|\___/ | .__/  \___|(_)\_/\_/  \__,_| \__|\___||_| |_|
  //                        | |                                            
  //                        |_|                                            



  $rootScope.$on('$translateChangeSuccess', () => {
    $scope.nodetype = $scope.datamodel.openItem;
    if ($scope.nodetype.elementType === 'node') {
      $scope.selectedTab = null;
      $scope.selectedTabType = null;
      $scope.selectedRelValues = null;
      const translationColumn = columnDefs.find((c) => c.field === 'translation');
      translationColumn.headerName = `translation (${$rootScope.appContext.user.language.name})`;
      if ($scope.tabsGridOptions && $scope.tabsGridOptions.api) {
        $scope.tabsGridOptions.api.setColumnDefs(columnDefs);
        datamodelModel.grid.loadData($scope.tabsGridOptions.api, $scope.nodetype.ui.tabs, 'tabs');
        $scope.updateGridData($scope.nodetype.ui.tabs);
      } else {
        console.info('Grid api not loaded or Dismissed by User');
      }
    }
  });


  //  _____         _  _   
  // |_   _|       (_)| |  
  //   | |   _ __   _ | |_ 
  //   | |  | '_ \ | || __|
  //  _| |_ | | | || || |_ 
  // |_____||_| |_||_| \__|

  $scope.noSelection = true;
  $scope.nodetype = $scope.datamodel.openItem;
  $scope.nodetypeIndex = getNodetypeIndex();
  $scope.selectedProperty;
  $scope.selectedExternalAPI;
  $scope.selectedExternalAPITabContent;

});