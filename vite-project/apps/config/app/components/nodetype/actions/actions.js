angular.module('app.ganister.config.models.nodetypes.actions', [])
  .controller('actionsController', function ($scope, $rootScope, datamodelModel, Notification, $translate) {

    // retrieve opened nodetype
    $scope.nodetype = $scope.datamodel.openItem;

    // create list of available method names
    const clientMethods = $scope.datamodel.methods
      .filter((m) => m.serverOrClient === 'client')
      .map((elt) => {
        return elt.name;
      }).sort();
    clientMethods.unshift('');

    const serverMethods = $scope.datamodel.methods
      .filter((m) => m.serverOrClient === 'server')
      .map((elt) => {
        return elt.name;
      }).sort();
    serverMethods.unshift('');


    // define grid columns
    const columnDefs = [{
      headerName: "name",
      field: "name",
      editable: true,
      width: 180,
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
      headerName: "Available On",
      field: "availableOn",
      cellEditor: 'agSelectCellEditor',
      width: 120,
      cellEditorParams: {
        values: ['node', 'nodetype']
      },
      editable: true
    },
    {
      headerName: "Access Level",
      field: "accessLevel",
      width: 120,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['visitor', 'reader', 'writer', 'manager']
      },
      editable: true
    },
    {
      headerName: "Pre Client method",
      field: "preClientMethod",
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: clientMethods
      },
      editable: true
    },
    {
      headerName: "Server method",
      children: [
        {
          headerName: "Method Name",
          field: "serverMethod",
          valueGetter: params => {
            return params.serverMethod.name;
          },
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: serverMethods
          },
          valueGetter: (params) => {
            if (params && params.data.serverMethod) return params.data.serverMethod.name;
          },
          valueSetter: (params) => {
            if (!params.data.serverMethod) params.data.serverMethod = {};
            params.data.serverMethod.name = params.newValue;
            return true;
          },
          editable: true,
        },
        {
          headerName: "Method Params",
          valueGetter: (params) => {
            if (params && params.data.serverMethod) return JSON.stringify(params.data.serverMethod.params);
          },
          valueSetter: (params) => {
            try {
              if (!params.data.serverMethod) params.data.serverMethod = {};
              if (!params.newValue || params.newValue === "") return false;
              params.data.serverMethod.params = JSON.parse(params.newValue);
              return true;
            } catch (error) {
              return Notification.error('Not a valid JSON');
            }
          },
          field: "serverMethod",
          editable: true,
        }
      ],
    },
    {
      headerName: "Post Client method",
      field: "postClientMethod",
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: clientMethods
      },
      editable: true
    }];

    // init actions grid
    $scope.actionsGridOptions = {
      rowData: [],
      defaultColDef: {
        resizable: true
      },
      columnDefs,
      rowSelection: "multiple",
      onGridReady: async (params) => {
        $scope.nodetype = $scope.datamodel.openItem;
        await loadData($scope.actionsGridOptions.api, $scope.nodetype.actions, 'actions');
      },
      onCellValueChanged: async (params) => {
        const actionId = params.data.id;
        let propertyName = params.colDef.field;
        let newValue = params.newValue;

        if (params.oldValue !== newValue) {
          if (propertyName === 'translation') {
            datamodelModel.translations.update($rootScope.appContext.user.language.key, {
              path: `nodetype.${$scope.nodetype.name}.${params.data.name}`,
              value: newValue,
            }).then(async (result) => {
              if (result.status === 200) {
                $scope.$emit('nodetypeUpdate', $scope.nodetype, 'actions');
                return Notification.success(`Action Name updated in translation file. (${$rootScope.appContext.user.language.key})`);
              } else {
                return Notification.error("Action Name not updated in translation file.");
              }
            });
          } else {
            if (propertyName === 'serverMethod') {
              newValue = params.data.serverMethod;
            }
            await datamodelModel.nodetypes.actions.update(
              $scope.nodetype.name,
              actionId,
              propertyName,
              newValue
            );
          }
        }
        Notification.success('Action updated');
      }
    }

    $scope.updateGridData = async (data, translate = true) => {
      if (!$scope.actionsGridOptions.api) return;
      if (translate && data) {
        await data.forEach(async (r) => {
          await $translate(`nodetype.${$scope.nodetype.name}.${r.name}`).then((trans) => {
            r.translation = trans;
          }, (translationId) => {
            r.translation = translationId;
          });
        });
      }
      const selectedNode = $scope.actionsGridOptions.api.getSelectedNodes()[0];
      $scope.actionsGridOptions.api.setRowData(data);
      if (selectedNode) {
        // re select the last selected node (=== the updated one)
        const selectedRowIndex = selectedNode.rowIndex;
        if ($scope.actionsGridOptions.api.getDisplayedRowAtIndex(selectedRowIndex)) {
          $scope.actionsGridOptions.api.getDisplayedRowAtIndex(selectedRowIndex).setSelected(true);
        }
      }
    };

    const loadData = async (gridAPI, rowData, type) => {
      if (gridAPI) {
        if (type === 'actions' && rowData) {
          let actions = [];
          const promises = rowData.map(async (row) => {
            const action = { ...row };
            await $translate(`nodetype.${$scope.nodetype.name}.${row.name}`).then((trans) => {
              action.translation = trans;
            }, (translationId) => {
              action.translation = translationId;
            });
            actions.push(action);
          });
          await Promise.all(promises);
          gridAPI.setRowData(actions);
        } else {
          gridAPI.setRowData(rowData);
        }
      }
    }


    $scope.addNodetypeAction = async () => {
      const { value: actionName } = await Swal.fire({
        title: 'Enter new action name',
        input: 'text',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to write something'
          }
        }
      });

      if (actionName) {
        const result = await datamodelModel.nodetypes.actions.add(
          $scope.nodetype.name,
          { name: actionName },
        );
        if (!$scope.nodetype.actions) $scope.nodetype.actions = [];
        $scope.nodetype.actions.push(result.newItem);
        Notification.success('Action added');
        loadData($scope.actionsGridOptions.api, $scope.nodetype.actions, 'actions');
      }
    }

    $scope.deleteNodetypeActions = async () => {
      const selectedRows = $scope.actionsGridOptions.api.getSelectedRows();
      const results = await Promise.all(selectedRows.map(async (row) => {
        return await datamodelModel.nodetypes.actions.delete(
          $scope.nodetype.name,
          row.id,
        ).catch((err) => {
          Notification.error({ title: 'Action delete failed', message: err.message });
          return { row, error: true };
        }).then(() => {
          Notification.success('Action deleted');
          $scope.nodetype.actions = _.reject($scope.nodetype.actions, { id: row.id });
          return { row, error: false };
        });
      }));
      results.filter((r) => r.error).map((r) => {
        Notification.error(`Action ${r.name} was not deleted`);
      });
      loadData($scope.actionsGridOptions.api, $scope.nodetype.actions, 'actions');
    }

    $scope.$watch('datamodel.openItem.name', () => {
      // retrieve opened nodetype
      $scope.nodetype = $scope.datamodel.openItem;
      // update actions
      loadData($scope.actionsGridOptions.api, $scope.nodetype.actions, 'actions');
    });

    $rootScope.$on('$translateChangeSuccess', async () => {
      $scope.nodetype = $scope.datamodel.openItem;
      if ($scope.nodetype.elementType === 'node') {
        $scope.selectedTab = null;
        $scope.selectedTabType = null;
        $scope.selectedRelValues = null;
        const translationColumn = columnDefs.find((c) => c.field === 'translation');
        translationColumn.headerName = `translation (${$rootScope.appContext.user.language.name})`;
        if ($scope.actionsGridOptions && $scope.actionsGridOptions.api) {
          $scope.actionsGridOptions.api.setColumnDefs(columnDefs);
          datamodelModel.grid.loadData($scope.actionsGridOptions.api, $scope.nodetype.actions, 'actions');
          $scope.updateGridData($scope.nodetype.actions);
        } else {
          console.info('Grid api not loaded or Dismissed by User');
        }
      }
    });

  });
