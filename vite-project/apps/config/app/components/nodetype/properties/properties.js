angular.module('app.ganister.config.models.nodetypes.properties', [
  'ui.codemirror',
]).controller('propertiesController', function ($scope, $rootScope, $translate, datamodelModel, Notification) {

  /******************************************************************************** */
  /*                          Handling Properties                                   */
  /******************************************************************************** */

  var propertypes = [
    "string",
    "select",
    "dateTime",
    "date",
    "richText",
    "double",
    "integer",
    "boolean",
    "multiselect",
    "nutriscore",
    "node",
    "state",
    "image",
    "email",
    "json",
    "tags",
  ]

  $scope.filterByNodeProps = function (rel) {
    const {elementType, hidden, cardinality, directions = []} = rel;
    var filterSuccess = elementType == 'relationship' && !hidden;
    filterSuccess = filterSuccess && (cardinality === "1to1" || cardinality === "Nto1" || cardinality === "free" || !cardinality)
    const direction = directions.find((d) => d.source === $scope.nodetype.id);
    filterSuccess = filterSuccess && direction;
    return filterSuccess;
  };

  $scope.nodetype = $scope.datamodel.openItem
  const columnDefs = [
    {
      headerName: "name",
      field: "name",
      pinned: 'left',
      width: 110,
      sortable: true,
      sort: 'asc',
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
      headerName: "core",
      field: "core",
      width: 70,
      editable: false,
      cellStyle: { 'background-color': '#aaa' },
    },
    {
      headerName: "group",
      field: "group",
      width: 120,
      editable: true,
      cellStyle: (params) => params.data.core ? { 'background-color': null } : {},
    },
    {
      headerName: "type",
      field: "type",
      width: 100,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: propertypes.sort()
      },
    },
    {
      headerName: "unique",
      field: "unique",
      width: 90,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ["true", "false"]
      },
    },
    {
      headerName: "mandatory",
      field: "mandatory",
      width: 100,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ["true", "false"]
      },
      editable: true,
      cellStyle: (params) => params.data.core ? { 'background-color': null } : {},
    },
    {
      headerName: "generated",
      field: "generated",
      width: 110,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ["false", "api", "codification"]
      },
      editable: true,
      cellStyle: (params) => params.data.core ? { 'background-color': null } : {},
    },
    {
      headerName: "infoData",
      field: "infoData",
      width: 90,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ["true", "false"]
      },
      editable: true,
      cellStyle: (params) => params.data.core ? { 'background-color': null } : {},
    },
    {
      headerName: "Relationship",
      field: "relationship",
      editable: false,
      cellStyle: { 'background-color': '#aaa' },
      cellRenderer: (params) => {
        let cell = '';
        if (params.value) {
          const relationship = $scope.datamodel.nodetypes.find(item => item.id === params.value);
          if (relationship) {
            cell = `${relationship.name} (${relationship.linkName})`;
            const targetNodetype = $scope.datamodel.nodetypes.find((n) => {
              return relationship.directions.find((d) => d.target === n.id);
            })
            if (targetNodetype) {
              cell = `${cell} => ${targetNodetype.name}`;
            }
          }
        }
        return cell;
      },
    },
    {
      headerName: "listSource",
      field: "listSource",
      editable: false,
      cellStyle: { 'background-color': '#aaa' },
    },
    {
      headerName: "Default Value",
      field: "default",
    },
    {
      headerName: "Order",
      field: "order",
      editable: true,
      valueSetter: function (params) {
        const { newValue, data } = params;
        if (newValue) {
          data.order = Number.parseInt(newValue);
        }
        return true;
      }
    }
  ];
  // Properties Table
  $scope.gridOptions = {
    defaultColDef: {
      resizable: true,
      editable: (params) => params.data.core !== true,
      cellStyle: (params) => params.data.core ? { 'background-color': '#aaa' } : {},
    },
    columnDefs,
    rowSelection: "single",
    getRowNodeId: (r) => r.id,
    onGridReady: function (params) {
      $scope.nodetype = $scope.datamodel.openItem;
      loadData($scope.gridOptions.api, $scope.nodetype.properties, 'properties');
    },
    onRowSelected: function (params) {
      // update the properties detail
      if (params.node.selected) {
        $scope.selectedPropType = params.node.data.type;
        $scope.selectedPropName = params.node.data.name;
        $scope.selectedProperty = params.node.data.id;

        if (params.node.data.listSource) {
          $scope.selectedListValue = _.find($scope.datamodel.listOfValues, { "name": params.node.data.listSource })
        } else {
          $scope.selectedListValue = ""
        }
        if (params.node.data.relationship) {
          $scope.selectedRelationship = _.find($scope.datamodel.nodetypes, { "id": params.node.data.relationship })
        } else {
          $scope.selectedRelationship = ""
        }
        $scope.$apply()
      }
    },
    onCellValueChanged: function (params) {
      if (params.oldValue != params.newValue) {
        //  If column changed is translation, update translation and return
        if (params.colDef.field === 'translation') {
          const translation = params.newValue.charAt(0).toUpperCase() + params.newValue.slice(1);

          datamodelModel.translations.update($rootScope.appContext.user.language.key, {
            path: `nodetype.${$scope.nodetype.name}.${params.data.name}`,
            value: translation,
          }).then(async (result) => {
            if (result.status === 200) {
              $scope.$emit('nodetypeUpdate', $scope.nodetype, 'properties');
              return Notification.success(`Property Name updated in translation file. (${$rootScope.appContext.user.language.key})`);
            } else {
              return Notification.error("Property Name not updated in translation file.");
            }
          });
          return;
        } else {
          if (params.colDef.field === 'name') {
            //  Remove spaces from values if exists
            params.oldValue = params.oldValue.replace(/\s/g, '');
            params.newValue = params.newValue.replace(/\s/g, '');
          }
          datamodelModel.nodetypes.properties.update(
            $scope.nodetype.name,
            params.data.id,
            params.colDef.field,
            params.oldValue,
            params.newValue
          ).catch(function (e) {
            console.error(e)
            return Notification.error('Property did not update');
          }).then(function (result) {
            $scope.nodetype = Object.assign($scope.nodetype, result.data.nodetype);
            if (result.status !== 200) {
              Notification.error({
                title: 'Error Updating Property',
                message: result.data.message,
              });
              //  TODO: Update cell value to old value if its failed!
            } else {
              Notification.success({ message: 'Property Updated' });
              if (params.colDef.field === 'name') {
                const column = $scope.nodetype.ui.gridColumns.find(c => c.property === `${$scope.nodetype.name}.${params.oldValue}`);
                if (column) {
                  params.newValue = params.newValue.replace(/\s/g, '');
                  $rootScope.$broadcast('updateCellValue', {
                    nodetypeName: $scope.nodetype.name,
                    column,
                    field: 'property',
                    value: `${$scope.nodetype.name}.${params.newValue}`,
                  });
                }
                const rowNode = $scope.gridOptions.api.getRowNode(params.data.id);
                const rowData = { ...params.data };
                rowData[params.colDef.field] = params.newValue;
                rowNode.setData(rowData);
                //  TODO: Update Translation Property Name for all languages
                datamodelModel.translations.updatePropertyName(
                  $scope.nodetype.name,
                  params.oldValue,
                  params.newValue,
                ).then((result) => {
                  if (result.status !== 200) return Notification.error("Property Name is not updated in translation files!");
                });
              }
            }
          })
        }
        
      }
      // update the property detail form when changing the type
      if (params.colDef.field === "type") {
        $scope.selectedPropType = params.newValue
        $scope.$apply()
      }
    },
    rowData: [],
  }

  // add property
  $scope.addProperty = async () => {
    await Swal.fire({
      title: 'Please enter property name',
      input: 'text',
      showCancelButton: true,
      inputValidator: (propname) => {
        if (!propname) {
          return 'You need to write something';
        } else if (Number.isInteger(parseInt(propname.charAt(0), 10))) {
          return 'Property name cannot start with a number';
        } else {
          propname = propname.replace(/\s/g, '');
          let newProp = {
            "name": propname,
            "type": "string",
          }
          datamodelModel.nodetypes.properties.add($scope.nodetype.name, newProp)
            .catch(function (e) {
              console.error(e);
            })
            .then(function (result) {
              if (result.hasOwnProperty('error')) {
                Notification.error(result.error);
              } else {
                newProp = result.newItem;
                $scope.nodetype.properties.push(newProp);
                datamodelModel.translations.update('default', {
                  path: `nodetype.${$scope.nodetype.name}.${newProp.name}`,
                  value: _.startCase(newProp.name),
                }).then(function (result) {
                  datamodelModel.translations.update($rootScope.appContext.user.language.key, {
                    path: `nodetype.${$scope.nodetype.name}.${newProp.name}`,
                    value: _.startCase(newProp.name),
                  }).then(function (result) {
                    if (result.status === 200) {
                      Notification.success("Property Name updated in translation file!");
                      $translate.use($rootScope.appContext.user.language.key);
                    } else {
                      Notification.error("Property Name not updated in translation file!");
                    }
                  })
                })
                loadData($scope.gridOptions.api, $scope.nodetype.properties, 'properties');
                Swal.fire({
                  title: `Do you want to add this property on table?`,
                  type: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'Yes',
                  cancelButtonText: 'No',
                }).then((result) => {
                  if (result.value) {
                    var newCol = {
                      "property": $scope.nodetype.name + "." + propname,
                      "type": "string",
                    }
                    datamodelModel.nodetypes.gridColumns.add(
                      $scope.nodetype.name,
                      'gridColumns',
                      newCol,
                    ).catch(function (e) {
                      console.error(e);
                    }).then(function (result) {
                      newCol = result.newItem;
                      $scope.nodetype.ui.gridColumns.push(newCol);
                      // Update Grid Column UI
                      $rootScope.$emit("newGridColumnAdded");
                    })
                  }
                })
              }
            })
        }
      }
    });
  }

  // delete property
  $scope.removeSelectedProperties = () => {
    var selectedRows = $scope.gridOptions.api.getSelectedRows();
    if (selectedRows.length > 0) {
      // remove selected items from $scope properties
      selectedRows.forEach((prop) => {
        datamodelModel.nodetypes.properties.remove($scope.nodetype.name, prop.id)
          .catch((e) => {
            console.error(e);
          })
          .then((result) => {
            if (result.error) {
              if (!result.error.popup) Notification.error({
                title: 'Cannot remove Property',
                ...result,
                positionY: 'bottom',
                positionX: 'right',
                delay: 5000,
              });
            } else {
              $scope.nodetype.properties = result.nodetype.properties;
              loadData($scope.gridOptions.api, $scope.nodetype.properties, 'properties');
              $rootScope.$broadcast('updateGridUI', result.nodetype);
              Notification.success({
                message: `property ${prop.name} was removed`,
                positionY: 'bottom',
                positionX: 'right',
                delay: 2000,
              });
              console.info("property deleted");
            }
          })
      })

    } else {
      // notify user to select a row first
    }
  }

  $scope.$watch('datamodel.openItem.name', function () {
    $scope.nodetype = $scope.datamodel.openItem;
    // update properties
    $scope.selectedPropType = "";
    $scope.selectedProperty = "";
    $scope.selectedListValue = "";
    $scope.selectedNodetype = "";
    loadData($scope.gridOptions.api, $scope.nodetype.properties, 'properties');
  })

  $scope.updateListSource = function () {
    datamodelModel.nodetypes.properties.update(
      $scope.nodetype.name,
      $scope.selectedProperty,
      "listSource",
      "",
      $scope.selectedListValue.name,
    ).then((result) => {
      if (result.status !== 200) {
        Notification.error({
          title: 'Error',
          message: `Not updated`,
          positionY: 'bottom',
          positionX: 'right',
          delay: 5000,
        });
      } else {
        Notification.success({ message: 'Property Updated' });
        const nodetypeIndex = $scope.datamodel.nodetypes.findIndex(item => item.id === result.data.nodetype.id);
        $scope.datamodel.nodetypes[nodetypeIndex] = result.data.nodetype;
        loadData($scope.gridOptions.api, result.data.nodetype.properties, 'properties');
      }
    });
  }

  $scope.updateSelectedRelationship = () => {
    if ($scope.selectedRelationship) {
      datamodelModel.nodetypes.properties.update(
        $scope.nodetype.name,
        $scope.selectedProperty,
        "relationship",
        "",
        $scope.selectedRelationship.id,
      ).then((result) => {
        if (result.status !== 200) {
          return Notification.error({
            title: 'Error updating property for selected relationship',
            message: result.data.message,
          });
        }
        loadData($scope.gridOptions.api, result.data.nodetype.properties, 'properties');
      })
    }
  }

  async function loadData(gridAPI, rowData, type) {
    if (gridAPI) {
      if (type === 'properties') {
        let properties = rowData;
        if (!$scope.showCoreProperties) properties = rowData.filter(p => !p.core);
        await properties.forEach(async (prop) => {
          await $translate(`nodetype.${$scope.nodetype.name}.${prop.name}`).then(function (trans) {
            prop.translation = trans;
          }, function (translationId) {
            prop.translation = translationId;
          });
        });
        gridAPI.setRowData(properties);
      } else {
        gridAPI.setRowData(rowData);
      }
    }
  }

  $scope.propertyHeaders = {
    defaultColDef: {
      resizable: true,
    },
    rowDragManaged: true,
    animateRows: true,
    columnDefs: [
      {
        headerName: "name",
        field: "name",
        editable: true,
        pinned: 'left',
        width: 110,
        rowDrag: true,
      },
      {
        headerName: "key",
        field: "key",
        editable: true,
      },
      {
        headerName: "type",
        field: "type",
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [
            "date",
            "image",
            "double",
            "integer",
            "markdown",
            "version",
            "string",
          ]
        },
        editable: true,
      },
      {
        headerName: "editable",
        field: "editable",
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: [
            false, true,
          ],
        },
      },
      {
        headerName: "cell Class",
        field: "cellClass",
        editable: true,
      },
    ],
    rowSelection: "multiple",
    onCellValueChanged: function (params) {
      const selectedProperty = $scope.nodetype.properties.find(p => p.id === $scope.selectedProperty);
      updatePropertyHeaders([], selectedProperty.headers);
    },
    onRowDragEnd: function (e) {
      const newValue = [];
      $scope.propertyHeaders.api.forEachNode((node, index) => {
        newValue.push(node.data);
      })
      updatePropertyHeaders([], newValue);
    },
    rowData: [],
  }

  const updatePropertyHeaders = (oldValue, newValue) => {
    datamodelModel.nodetypes.properties.update(
      $scope.nodetype.name,
      $scope.selectedProperty,
      'headers',
      oldValue,
      newValue,
    ).catch(function (e) {
      console.error(e);
      // alert message and restore values
    }).then(function (result) {
      if (result.status !== 200) {
        Notification.error({
          title: 'Error Updating Property Headers',
          messsage: result.data.message,
        });
      }
      //  Get Updated Property
      const property = result.data.property;
      //  Find property in nodetype's properties
      const propertyIndex = $scope.nodetype.properties.findIndex(p => p.id === property.id);
      //  Get headers
      const headers = result.data.property.headers;
      //  Update Nodetype's property with the new headers
      $scope.nodetype.properties[propertyIndex].headers = headers;
      loadData($scope.propertyHeaders.api, headers, 'headers');
    })
  }
  // add property
  $scope.addPropertyHeader = async () => {
    const property = $scope.nodetype.properties.find(p => p.id === $scope.selectedProperty);
    if (property) {
      await Swal.fire({
        title: 'Please enter header name:',
        input: 'text',
        showCancelButton: true,
        inputValidator: (headerName) => {
          if (!headerName) {
            return 'You need to write something';
          } else {
            const newHeader = {
              name: headerName,
              key: headerName,
              type: 'string',
              cellClass: '',
              editable: true,
            }
            if (Array.isArray(property.headers)) {
              property.headers.push(newHeader);
            } else {
              property.headers = [newHeader];
            }
            updatePropertyHeaders([], property.headers);
          }
        }
      });
    }
  }

  // delete property
  $scope.removeSelectedPropertyHeaders = function () {
    let newValue = JSON.parse(JSON.stringify($scope.nodetype.properties.find(p => p.id === $scope.selectedProperty).headers));
    $scope.propertyHeaders.api.getSelectedRows().map((header) => {
      // remove all dead enemies
      newValue = newValue.filter(e => e.key !== header.key);
    })
    updatePropertyHeaders([], newValue);
  };

  $scope.showCoreProperties = true;
  $scope.corePropertiesMessage = 'Hide Core Properties';
  $scope.showHideCoreProperties = () => {
    $scope.showCoreProperties = !$scope.showCoreProperties;
    if ($scope.showCoreProperties) {
      $scope.corePropertiesMessage = 'Hide Core Properties';
    } else {
      $scope.corePropertiesMessage = 'Show Core Properties';
    }
    loadData($scope.gridOptions.api, $scope.nodetype.properties, 'properties');
  }

  $scope.addListOfValues = async () => {
    Swal.fire({
      title: 'Add a list of values',
      html:
        `<div class="form-group">
                    <label for="addLOVName">Name</label>
                    <input type="text" class="form-control" id="addLOVName" placeholder="List of Values Name">
                </div>
                <div class="form-group">
                    <label for="addLOVValues">Values</label>
                    <input type="text" class="form-control" id="addLOVValues" placeholder="Add values separate by comma">
                </div>
                <div class="form-group">
                    <label for="addLOVPackage">Package</label>
                    <select
                        class="form-control"
                        id="addLOVPackage">
                        ${$scope.datamodel.packages.map((p) => `<Option value="${p.id}" ${p.id === $scope.nodetype.package ? 'selected' : ''}>${p.label}</Option>`)}
                    </select>
                </div>`,
      focusConfirm: false,
      showCancelButton: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: () => {
        const name = document.getElementById('addLOVName').value;
        const valuesString = document.getElementById('addLOVValues').value;
        const packageId = document.getElementById('addLOVPackage').value;
        if (!name || !valuesString) {
          return Swal.showValidationMessage('Both Name and Values is required');
        }
        values = valuesString.split(',').map((v) => v.trim());
        const items = values.map((value) => ({ value, label: value }));
        return datamodelModel.lovs.add(name, items, packageId).then((result) => {
          return result;
        })
      }
    }).then(({ value }) => {
      if (!value) {
        return;
      }
      const { id, newLovs } = value;
      if (!id) {
        return Swal.fire({ type: 'error', title: 'List of Value not created' })
      }
      Swal.fire({ type: 'success', title: `${newLovs.name} list created` });
      $scope.datamodel.listOfValues.push(newLovs);
      $scope.$apply();
    })
  }

  // UPDATE SIBLINGS CONTROLLERS
  $scope.$watch('nodetype.properties', function (newVal, oldVal) {
    $scope.$emit('nodetypeUpdate', $scope.nodetype, 'properties');
  }, true);

  $scope.$on('nodetypeMainUpdate', (event, nodetype) => {
    // $scope.nodetype = nodetype;
  });

  $rootScope.$on('$translateChangeSuccess', function () {
    const translationColumn = columnDefs.find((c) => c.field === 'translation');
    translationColumn.headerName = `translation (${$rootScope.appContext.user.language.name})`;
    if ($scope.gridOptions && $scope.gridOptions.api) {
      $scope.gridOptions.api.setColumnDefs(columnDefs);
      loadData($scope.gridOptions.api, $scope.nodetype.properties, 'properties');
    } else {
      console.info('Grid api not loaded or Dismissed by User');
    }
  });

});
