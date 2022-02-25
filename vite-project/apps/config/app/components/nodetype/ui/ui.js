/* globals angular */
angular.module('app.ganister.config.models.nodetypes.ui', [
  'app.ganister.config.helpers'
])
  .controller('uiController', function ($scope, $rootScope, $translate, datamodelModel, Notification, helperFunctions) {

    // #region FORM DESIGNER

    // Watch selected Itemtype ---------------------------------------------
    $scope.$watch('datamodel.openItem.name', () => {
      $scope.initDropzones = true;
      $scope.initLabelCase = true;
      $scope.nodetype = $scope.datamodel.openItem;
      if (!$scope.nodetype.ui.form.labelCase) $scope.nodetype.ui.form.labelCase = "capitalize";

      // update ui
      failPreventUI()

      // refresh form builder
      $scope.models = {
        selected: null,
        templates: [
          { type: "item", id: "it_" + helperFunctions.generateUUID(), size: "2" },
          { type: "container", id: "co_" + helperFunctions.generateUUID(), columns: [[]], size: "0/12", containerType: "accordion", }
        ],
        dropzones: $scope.nodetype.ui.form.definition,
      };

      $scope.calcTotalColumnsSize($scope.models.dropzones.A);
      $scope.initGrids();
      refreshUI();

    });

    $scope.initGrids = () => {
      $scope.grids = ['gridColumns'];
      $scope.reverseGridColumnsGridOptions = null;
      $scope.undirectedRelationship = $scope.nodetype.elementType === 'relationship' && $scope.nodetype.undirectedRelationship;

      // get reverseGridColumns if nodetype is an undirected relationship
      if ($scope.undirectedRelationship) {
        $scope.grids = ['gridColumns', 'reverseGridColumns'];
        $scope.reverseGridColumnsGridOptions = setGridOptions('reverseGridColumns');
      }
    }


    $scope.nodeProperties = [];
    $scope.$watch('models.selected', function () {
      if (_.isEmpty($scope.models.selected)) return;
      let visibleProp = $scope.viewableNodeTypes[0].properties;
      const prop = _.find(visibleProp, { 'name': $scope.models.selected.property });
      if (prop) {
        $scope.models.selected.propertyType = prop.type;
        if ($scope.models.selected.propertyType === 'node') {
          const property = $scope.nodetype.properties.find((p) => p.name === $scope.models.selected.property);
          if (!property) return;
          const { relationship } = property;
          if (!relationship) return;
          const relationshipDM = $scope.datamodel.nodetypes.find((n) => n.id === relationship);
          if (!relationshipDM) return;
          // next line won't work with multiple source/target
          const direction = relationshipDM.directions.find((d) => d.source === $scope.nodetype.id);
          const targetDM = $scope.datamodel.nodetypes.find((n) => n.id === direction.target);
          if (!targetDM) return;
          $scope.nodeProperties = targetDM.properties;
        }
      } else {
        console.info("Property missing: ", $scope.models.selected.property);
      }
    }, true);

    /*
        ANGULAR DRAG AND DROP
    */

    $scope.colSizes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
    $scope.offsetSizes = [0, ...$scope.colSizes];
    $scope.containerTypes = ['section', 'accordion', 'row'];
    $scope.models = {
      selected: null,
      templates: [
        { type: "item", id: "it_" + helperFunctions.generateUUID() },
        { type: "container", id: "co_" + helperFunctions.generateUUID(), columns: [[]], size: "0/12", }
      ],
      dropzones: $scope.nodetype.ui.form.definition,
    };

    $scope.$watch('models.dropzones', function (model) {
      if (!$scope.initDropzones) { // prevent saving schema definition on loading
        $scope.addPropertyTranslations(model.A);
        $scope.modelAsJson = angular.toJson(model, true);
        $scope.saveAndConvertDefinition($scope.modelAsJson);
        $scope.calcTotalColumnsSize(model.A);
      }
      $scope.initDropzones = false;
    }, true);

    $scope.$watch('nodetype.ui.form.labelCase', function () {
      if (!$scope.initLabelCase) { // prevent saving schema definition on loading
        $scope.saveAndConvertDefinition($scope.modelAsJson);
      }
      $scope.initLabelCase = false;
    }, false);

    $scope.nodetype = $scope.datamodel.openItem;
    failPreventUI()

    $scope.calcTotalColumnsSize = (containers) => {
      containers.forEach((container) => {
        if (container.type === 'container') {
          if (container.columns && container.columns[0].length > 0) {
            let size = 0;
            container.columns[0].forEach((column) => {
              if (column.type === 'container') {
                column.size = '12';
                if (column.columns && column.columns[0].length > 0) {
                  $scope.calcTotalColumnsSize([column]);
                }
              }
              size += parseInt(column.size);
            })
            container.size = `${size}`;
          } else if (container.columns) {
            container.size = '0';
          }
        }
      })
    }

    $scope.addPropertyTranslations = (model) => {
      model.forEach((container) => {
        if (container.columns) {
          container.columns[0].forEach((item) => {
            const propTranslate = $translate.instant(`nodetype.${$scope.nodetype.name}.${item.property}`);
            if (propTranslate.split(".").length > 2) {
              item.translation = item.property;
            } else {
              item.translation = propTranslate;
            }
          });
        }
      });
    };


    /**
     * autoGenerateForm
     */
    $scope.autoGenerateForm = () => {
      // retrieve properties
      $scope.models.selected = {};
      $scope.models.dropzones = { A: [] };
      let groups = _.groupBy($scope.nodetype.properties, 'group');
      let idContainerCounter = 0;
      let idItemCounter = 0;
      Object.entries(groups).forEach((group) => {
        if (group[0] !== 'hidden' && group[0] !== 'undefined' && group[0] !== '') {
          idContainerCounter = idContainerCounter + 1;
          let columns = [];
          group[1].forEach((prop) => {
            idItemCounter = idItemCounter + 1;
            columns.push({
              type: "item",
              id: "it_" + helperFunctions.generateUUID(),
              property: prop.name,
              size: "2",
              propertyType: prop.type,
            })
          })
          let isFolded = "false";
          if (idContainerCounter > 1) {
            isFolded = "true";
          }

          $scope.models.dropzones.A.push({
            type: "container",
            containerType: "accordion",
            foldedDefault: isFolded,
            id: "co_" + helperFunctions.generateUUID(),
            label: group[0],
            size: "12",
            columns: [columns],
          })
        }
      });
    }

    const addReadOnlys = (items) => {
      items.map((i) => {
        if (i.type === 'item') {
          const property = $scope.nodetype.properties.find((p) => p.name === i.property);
          if (!property) {
            Notification.warning({ message: 'A property is missing from an item and form cannot be saved', replaceMessage: true });
            $scope.validFormProperties = false;
          }
          if (property && property.generated) {
            i.readOnly = true;
          }
        }
        if (i.type === 'container') {
          addReadOnlys(i.columns[0]);
        }
        return i;
      })
      return items;
    }

    const deletePropertyTranslation = (containers) => {
      containers.forEach((container) => {
        if (container.columns) {
          container.columns[0].forEach((item) => {
            if (item.translation) delete item.translation;
          });
        }
      });
    }

    const setContainersSize = (containers) => {
      containers.forEach((container) => {
        if (container.type === 'container') {
          container.size = '12';
        }
        if (container.columns && container.columns[0].length) {
          setContainersSize(container.columns[0]);
        }
      });
    }

    /**
     * saveAndConvertDefinition
     */
    $scope.saveAndConvertDefinition = async (modelAsJson) => {
      $scope.validFormProperties = true;
      const model = JSON.parse(modelAsJson).A;
      deletePropertyTranslation(model);
      setContainersSize(model);
      addReadOnlys(model);
      const newObj = {
        A: model
      };
      if (!$scope.validFormProperties) {
        return false;
      }
      modelAsJson = angular.toJson(newObj, true)

      const formDefinition = {
        definition: JSON.parse(modelAsJson),
        labelCase: $scope.nodetype.ui.form.labelCase || "capitalize",
      };
      const result = await datamodelModel.nodetypes.formDefinition.update($scope.nodetype.name, formDefinition);
      if (result.status === 200) {
        Notification.success({ title: 'Updated', message: `Schema Definition updated`, replaceMessage: true });
      } else {
        Notification.error({ title: 'Error', message: `Schema Definition is not updated` });
      }
    }


    /**
     * failPreventUI - Makes all the health checks and corrections
     */
    function failPreventUI() {

      if (!$scope.nodetype.ui.form) {
        $scope.nodetype.ui.form = {
          definition: { "A": [] },
          ng: {
            schema: {},
            form: []
          }
        }
      }
      if (Object.keys($scope.nodetype.ui.form.definition).length === 0 && $scope.nodetype.ui.form.definition.constructor === Object) {
        $scope.nodetype.ui.form.definition = { "A": [] };
      }
      if (!($scope.nodetype.ui)) {
        $scope.nodetype.ui = {
          ng: {
            schema: {},
            form: []
          }
        }
      } else {
        if (!($scope.nodetype.ui.form.ng)) {
          $scope.nodetype.ui.form.ng = {
            schema: {},
            form: []
          }
        } else {
          if (!($scope.nodetype.ui.form.ng.schema)) {
            $scope.nodetype.ui.form.ng.schema = {}
          }
          if (!($scope.nodetype.ui.form.ng.form)) {
            $scope.nodetype.ui.form.ng.form = []
          }
        }
      }
    }
    // #endregion FORM DESIGNER


    // Grid Columns Editor ---------------------------------------------

    // #region UTILITY FUNCTIONS

    // returns nodetypes array from a relationship id
    const getVisibleNodetypes = (nodetype) => {
      const nodetypes = [nodetype];

      const { elementType, hidden, undirectedRelationship, directions = [] } = nodetype;
      if (hidden || elementType === 'node') return nodetypes;


      $scope.datamodel.nodetypes.forEach((n) => {
        if (n.hidden || n.elementType === 'relationship') return;

        const target = directions.find((d) => d.target === n.id)
        if (target) nodetypes.push(n)

        if (undirectedRelationship) {
          const source = directions.find((d) => d.source === n.id)
          if (source) nodetypes.push(n)
        }
      })

      return nodetypes;
    }

    const getPropertyType = (property) => {
      if (!property) return false;
      const propertyArray = property.split('.');
      const nodetypeName = propertyArray[0];
      const propertyName = propertyArray[1];
      const nodetype = $scope.viewableNodeTypes.find((n) => n.name === nodetypeName);
      if (!nodetype) return false;
      const propertyDM = nodetype.properties.find((p) => p.name === propertyName);
      if (!propertyDM) return false;
      return propertyDM.type;
    }

    const setGridOptions = (gridName = 'gridColumns') => {
      const gridOptions = {
        defaultColDef: {
          resizable: true
        },
        rowDragManaged: true,
        animateRows: true,
        columnDefs,
        rowSelection: "multiple",
        getRowNodeId: (data) => data.id,
        onRowSelected: function (params) {
          // update the properties detail
          if (params.node.selected) {
            $scope.selectedColumnCss = JSON.stringify(params.node.data.cellStyle)
            $scope.selectedColumn = params.node.data;
            $scope.$apply();
          }
        },
        onCellValueChanged: function (params) {
          const rowNode = this.api.getRowNode(params.data.id);
          if (params.oldValue != params.newValue) {
            datamodelModel.nodetypes.gridColumns.update(
              $scope.nodetype.name,
              gridName,
              params.data.id,
              params.colDef.field,
              params.oldValue,
              params.newValue,
            ).catch(function (e) {
              console.error(e);
              // alert message and restore values
            }).then(function (result) {
              if (result.error) {
                return Notification.error({ ...result });
              }
              Notification.success({ message: 'Column Updated', replaceMessage: true });
              $scope.nodetype = Object.assign($scope.nodetype, result.nodetype);
              $scope.$emit('nodetypeUpdate', result.nodetype, 'ui');
              //  If column is type and value is date, datetime or node, update cellRendered to true
              if (params.colDef.field === 'type' && renderedByDedfaultList.includes(params.newValue)) {
                rowNode.setDataValue('cellRendered', true);
                if (params.newValue === 'markdown') {
                  rowNode.setDataValue('autoHeight', true);
                }
              }
              //  If column changed was property, update PropertyType Column
              if (params.colDef.field === 'property') {
                if (params.newValue) {
                  const propertyType = getPropertyType(params.newValue);
                  if (propertyType) {
                    if (columnTypes.includes(propertyType)) {
                      rowNode.setDataValue('type', propertyType);
                      if (['date', 'dateTime']) {
                        rowNode.setDataValue('cellRendered', true);
                      }
                    }
                  }
                }
                params.api.refreshCells({ rowNodes: [rowNode], force: true });
              }
            })
          }

          // test if holder has changed, then set the right property list
        },
        onGridReady: function (params) {
          $scope.nodetype = $scope.datamodel.openItem;
          // refreshUI();
        },
        onRowDragEnd: function (e) {
          datamodelModel.nodetypes.gridColumns.move(
            $scope.nodetype.name,
            gridName,
            e.overIndex,
            e.node.data.id,
          ).catch(function (e) {
            console.error(e);
            Notification.error({ title: 'Error', message: e.message });
          }).then(function (result) {
            $scope.nodetype.ui[gridName] = result.nodetype.ui[gridName];
            loadData($scope.nodetype.ui[gridName], gridName);
            Notification.success({ title: 'Updated', message: `Grid column Moved`, replaceMessage: true });
          })
        },
        rowData: []
      }
      return gridOptions;
    }

    const getGridOptions = (gridName) => {
      let gridOptions = $scope.gridColumnsGridOptions;
      if (gridName === 'reverseGridColumns') {
        gridOptions = $scope.reverseGridColumnsGridOptions;
      }
      return gridOptions;
    }

    // #endregion UTILITY FUNCTIONS

    // #region INIT

    const renderedByDedfaultList = ['multiselect', 'integer', 'date', 'dateTime', 'node', 'user', 'markdown', 'url', 'filesize', 'image', 'indice', 'version', 'state', 'tags', 'boolean', 'nutriscore', 'serialization', 'dropdown'];
    // viewable properties (merging Relationship properties and related item properties)
    $scope.viewableProperties = []

    // #endregion INIT

    // #region GRID OPTIONS INIT

    const columnTypes = [
      "boolean",
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
      "serialization",
      "mimetype",
      "nutriscore",
      "node",
      "version",
      "progress",
      "state",
      "string",
      "tags",
      "text",
      "url",
      "user",
    ].sort();

    // UI Columns Table
    const columnDefs = [
      {
        headerName: "property",
        field: "property",
        width: 190,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: $scope.viewableProperties
        },
        editable: true,
        pinned: 'left',
        rowDrag: true,
      },
      {
        headerName: "property type",
        field: "propertyType",
        width: 125,
        cellRenderer: (params) => {
          const { data } = params;
          return getPropertyType(data.property) || '';
        }
      },
      {
        headerName: `translation (${$rootScope.appContext.user.language.name})`,
        headerTooltip: 'Translation for the selected language',
        field: "translation",
        width: 200,
        editable: false,
        cellStyle: { background: '#aaa' },
      },
      {
        headerName: "type",
        field: "type",
        width: 100,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: columnTypes
        },
        editable: true
      },
      {
        headerName: "node property",
        field: "nodeProperty",
        width: 190,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: (params) => ({
          values: $scope.selectColumnProperties
        }),
        editable: (params) => {
          const { data } = params;
          if (!data.property) return false;
          const propertyArray = data.property.split('.');
          const nodetypeName = propertyArray[0];
          const propertyName = propertyArray[1];
          const nodetypeDM = $scope.datamodel.nodetypes.find(nodetype => nodetype.name === nodetypeName);
          const propertyDM = nodetypeDM.properties.find((p) => p.name === propertyName);
          if (propertyDM.type !== 'node') return false;
          const relationshipDM = $scope.datamodel.nodetypes.find((n) => n.id === propertyDM.relationship);
          const direction = relationshipDM.directions.find((d) => d.source === $scope.nodetype.id);
          const targetNodetypeDM = $scope.datamodel.nodetypes.find((n) => n.id === direction.target);
          $scope.selectColumnProperties = ["", ...targetNodetypeDM.properties.map((p) => p.name)];
          return true;
        },
      },
      {
        headerName: "width",
        field: "width",
        width: 90,
        editable: true,
        valueParser: (params) => {
          return Number.isInteger(parseInt(params.newValue)) ? parseInt(params.newValue) : null;
        }
      },
      {
        headerName: "height",
        field: "height",
        width: 90,
        editable: true,
        valueParser: (params) => {
          return Number.isInteger(parseInt(params.newValue)) ? parseInt(params.newValue) : null;
        }
      },
      {
        headerName: "Auto Height",
        field: "autoHeight",
        width: 115,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [
            true, false
          ]
        },
        editable: true
      },
      {
        headerName: "Hide",
        width: 70,
        field: "hide",
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [
            true, false
          ]
        },
        editable: true
      },
      {
        headerName: "Cell Class",
        field: "cellClass",
        width: 180,
        editable: true
      },
      {
        headerName: "Editable",
        field: "editable",
        width: 90,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [
            false, true
          ]
        }
      },
      {
        headerName: "Row Group",
        field: "rowGroup",
        width: 110,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [
            false, true
          ]
        }
      },
      {
        headerName: "Sort By",
        field: "rowSortBy",
        width: 110,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [
            'none', 'asc', 'desc'
          ]
        }
      },
      {
        headerName: "Cell Rendered",
        field: "cellRendered",
        width: 120,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [
            true, false
          ]
        }
      },
      {
        headerName: "Org Cell Rendered",
        field: "orgCellRendered",
        width: 150,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [
            true, false
          ]
        }
      }
    ];

    $scope.gridColumnsGridOptions = setGridOptions('gridColumns');
    if ($scope.undirectedRelationship) {
      $scope.reverseGridColumnsGridOptions = setGridOptions('reverseGridColumns');
    }

    // #endregion GRID OPTIONS INIT


    /**
     * refreshUI
     */
    function refreshUI() {
      $scope.viewableProperties = [];
      $scope.viewableNodeTypes = getVisibleNodetypes($scope.nodetype);

      $scope.viewableNodeTypes.forEach((nodetype) => {
        nodetype.properties.forEach((property) => $scope.viewableProperties.push(nodetype.name + "." + property.name));
      })
      // get a reference to the column
      const col = columnDefs.find((c) => c.field === "property");
      // obtain the column definition from the column

      // update the header name
      col.cellEditorParams = { values: $scope.viewableProperties };
      $scope.initGrids();
      // the column is now updated. to reflect the header change, get the grid refresh the header
      $scope.grids?.forEach((gridName) => {
        const gridOptions = getGridOptions(gridName);
        if (gridOptions.api) {
          gridOptions.api.refreshHeader();
          gridOptions.api.setColumnDefs(columnDefs);
          loadData($scope.nodetype.ui[gridName], gridName);
        } else {
          console.info('Grid api not loaded or Dismissed by User for ', gridName);
        }
      });
    }

    // add property
    $scope.addColumn = function (gridName) {
      datamodelModel.nodetypes.gridColumns.add(
        $scope.nodetype.name,
        gridName,
        { type: "string" }
      ).catch(function (e) {
        console.error(e);
        Notification.error({ title: 'Error', message: e.message });
      }).then(function (result) {
        $scope.nodetype.ui[gridName] = result.nodetype.ui[gridName];
        loadData($scope.nodetype.ui[gridName], gridName);
      })
    }

    // delete property
    $scope.removeSelectedColumns = function (gridName) {
      let selectedRows = [];
      const gridOptions = getGridOptions(gridName);
      selectedRows = gridOptions.api.getSelectedRows();
      if (selectedRows.length > 0) {
        // remove selected items from $scope properties
        selectedRows.forEach((col) => {
          datamodelModel.nodetypes.gridColumns.remove(
            $scope.nodetype.name,
            gridName,
            col.id
          ).catch((e) => {
            console.error(e)
          }).then((result) => {
            $scope.nodetype.ui[gridName] = result.nodetype.ui[gridName];
            loadData($scope.nodetype.ui[gridName], gridName);
            Notification.success({ title: 'Removed', message: `grid column was removed`, replaceMessage: true });
          })
        });
      } else {
        Notification.warning({ message: `Select a grid column first` });
      }
    }

    // move the grid line up
    $scope.moveUp = (gridName) => {
      const gridOptions = getGridOptions(gridName);
      var selectedNodes = gridOptions.api.getSelectedNodes()
      if (selectedNodes.length == 1) {
        datamodelModel.nodetypes.gridColumns.moveUp(
          $scope.nodetype.name,
          gridName,
          selectedNodes[0].childIndex
        ).catch(function (e) {
          console.error(e)
        }).then(function (result) {
          $scope.nodetype.ui[gridName] = result.nodetype.ui[gridName];
          loadData($scope.nodetype.ui[gridName], gridName);
        })
      }
    }

    // move the grid line down
    $scope.moveDown = (gridName) => {
      const gridOptions = getGridOptions(gridName);
      var selectedNodes = gridOptions.api.getSelectedNodes()
      if (selectedNodes.length == 1) {
        datamodelModel.nodetypes.gridColumns.moveDown(
          $scope.nodetype.name,
          gridName,
          selectedNodes[0].childIndex
        ).catch(function (e) {
          console.error(e)
        }).then(function (result) {
          $scope.nodetype.ui[gridName] = result.nodetype.ui[gridName];
          loadData($scope.nodetype.ui[gridName], gridName);
        })
      }
    }

    async function loadData(rowData, gridName = 'gridColumns') {
      const gridOptions = getGridOptions(gridName);
      if (gridOptions.api) {
        $scope.nodetype.ui[gridName] = _.orderBy(rowData, 'order');
        const promises = $scope.nodetype.ui[gridName].map(async (column) => {
          if (column.property) {
            const propertyArray = column.property.split('.');
            const nodetypeName = propertyArray[0];
            const propertyName = propertyArray[1];
            const propertyPath = `nodetype.${nodetypeName}.${propertyName}`;
            const translation = $translate.instant(propertyPath);
            if (translation === propertyPath) {
              column.translation = '';
            } else {
              column.translation = translation;
            }
          }
          return column;
        });
        $scope.nodetype.ui[gridName] = await Promise.all(promises);
        gridOptions.api.setRowData($scope.nodetype.ui[gridName]);
      }
    }

    $scope.copyTargetNodetypeUIColumns = (relationship, gridName = 'gridColumns') => {
      if (relationship.directions.length>1) {
        Notification.warning('Too many directions on this relationship');
        return;
      }
      // 1. Find Target Nodetype
      let targetNodetype;
      if (gridName === 'reverseGridColumns') {
        targetNodetype = $scope.datamodel.nodetypes.find(nodetype => nodetype.id === relationship.directions[0].source);
      } else {
        targetNodetype = $scope.datamodel.nodetypes.find(nodetype => nodetype.id === relationship.directions[0].target);
      }
      if (!targetNodetype) {
        return Notification.error('Nodetype does not exists for this relationship');
      }
      const targetColumns = targetNodetype.ui.gridColumns;
      datamodelModel.nodetypes.gridColumns.updateAll(
        $scope.nodetype.name,
        gridName,
        targetColumns,
      ).catch(function (e) {
        console.error(e)
      }).then(function (result) {
        if (result.status === 200) {
          $scope.nodetype.ui[gridName] = result.data;
          loadData($scope.nodetype.ui[gridName], gridName);
          Notification.success({ title: 'Updated', message: `Grid columns copied` });
        } else {
          Notification.error('Columns not copied');
        }
      })

    };


    // #region WATCHERS

    $rootScope.$on("updateCellValue", function (events, args) {
      const { nodetypeName, column, field, value } = args;
      if ($scope.nodetype.name === nodetypeName) {
        $scope.gridColumnsGridOptions.api.forEachNode(rowNode => {
          if (rowNode.data[field] === column[field]) rowNode.setDataValue(field, value);
        });
        refreshUI();
      }
    });

    // Listen to an update of the gridcolumn list event and reload the columns grid
    $rootScope.$on("newGridColumnAdded", function (events, args) {
      refreshUI();
    });

    //  Grid UI Columns Updated Listener
    $scope.$on("updateGridUI", (event, nodetype) => {
      if ($scope.nodetype.id === nodetype.id) {
        loadData(nodetype.ui.gridColumns, 'gridColumns');
        if ($scope.undirectedRelationship) {
          loadData(nodetype.ui.reverseGridColumns, 'reverseGridColumns')
        }
      }
    });

    $rootScope.$on('$translateChangeSuccess', () => {
      const translationColumn = columnDefs.find((c) => c.field === 'translation');
      translationColumn.headerName = `translation (${$rootScope.appContext.user.language.name})`;
      $scope.grids.forEach((gridName) => {
        const gridOptions = getGridOptions(gridName);
        if (gridOptions.api) {
          gridOptions.api.setColumnDefs(columnDefs);
          loadData($scope.nodetype.ui[gridName], gridName);
        } else {
          console.info('Grid api not available');
        }
      });

      // translate properties for form editor
      $scope.nodetype.properties = $scope.nodetype.properties.map((prop) => {
        if (prop.core) {
          prop.coreGroup = 'Core Properties';
        } else {
          prop.coreGroup = 'Custom Properties';
        }

        prop.translation = $translate.instant(`nodetype.${$scope.nodetype.name}.${prop.name}`);
        if (prop.translation.split(".").length > 2) {
          prop.translation = prop.name;
        }
        return prop;
      });

      addReadOnlys($scope.models.dropzones.A);
    });

    // #endregion WATCHERS
  })
