/* globals swal */
angular.module('app.ganister.config.models.nodetypes.instanciations', [])
  .controller('instanciationsController', function ($rootScope, $scope, $translate, datamodelModel, Notification) {


    // ██╗   ██╗ █████╗ ██████╗ ██╗ █████╗ ██████╗ ██╗     ███████╗███████╗
    // ██║   ██║██╔══██╗██╔══██╗██║██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝
    // ██║   ██║███████║██████╔╝██║███████║██████╔╝██║     █████╗  ███████╗
    // ╚██╗ ██╔╝██╔══██║██╔══██╗██║██╔══██║██╔══██╗██║     ██╔══╝  ╚════██║
    //  ╚████╔╝ ██║  ██║██║  ██║██║██║  ██║██████╔╝███████╗███████╗███████║
    //   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚══════╝



    // ███████╗ ██████╗ ██████╗ ██████╗ ███████╗   ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
    // ██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝   ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
    // ███████╗██║     ██║   ██║██████╔╝█████╗     █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
    // ╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝     ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
    // ███████║╚██████╗╚██████╔╝██║     ███████╗██╗██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
    // ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝



    $scope.addInstanciation = async () => {
      await Swal.fire({
        title: 'Please enter instanciation name',
        input: 'text',
        showCancelButton: true,
        inputValidator: async (name) => {
          if (!name) return 'You need to write something';
          if (Number.isInteger(parseInt(name.charAt(0), 10))) return 'Instanciation name cannot start with a number';
          try {
            const result = await datamodelModel.nodetypes.instanciations.add($scope.nodetype.name, { name });
            if (result.hasOwnProperty('error')) return Notification.error(result.error);
            const { newItem } = result;
            if (!$scope.nodetype.instanciations) $scope.nodetype.instanciations = [];
            $scope.nodetype.instanciations.push(newItem);
            datamodelModel.grid.loadData($scope.instanciationsGridOptions.api, $scope.nodetype.instanciations, 'instanciations');
          } catch (err) {
            console.log(err);
            return Notification.error(err.message);
          }
        }
      });
    }

    $scope.removeInstanciation = () => {
      const selectedRows = $scope.instanciationsGridOptions.api.getSelectedRows();
      if (selectedRows.length > 0) {
        // remove selected items from $scope properties
        for (row of selectedRows) {
          datamodelModel.nodetypes.instanciations.remove(
            $scope.nodetype.name,
            row.id,
          ).catch(function (err) {
            Notification.error({
              title: 'Instanciation delete failed',
              message: err.message
            });
            console.log(err);
            // alert message and restore values
          }).then(function (result) {
            Notification.success('Instanciation deleted');
            $scope.nodetype.instanciations = _.reject($scope.nodetype.instanciations, {
              "id": result.id
            });
            datamodelModel.grid.loadData($scope.instanciationsGridOptions.api, $scope.nodetype.instanciations);
          })
        }
      }
    }

    $scope.updateInstanciationTranslation = async (params) => {
      try {
        const data = {
          path: `nodetype.${$scope.nodetype.name}.${params.data.name}`,
          value: params.data.translation,
        };
        const result = await datamodelModel.translations.update($rootScope.appContext.user.language.key, data);
        if (result.error) {
          return Notification.error({ title: 'Instanciation translation not Updated', message: result.data.message });
        } else {
          $scope.$emit('nodetypeUpdate', $scope.nodetype, 'instanciations');
          return Notification.success(`Instanciation Name updated in translation file. (${$rootScope.appContext.user.language.key})`);
        }
      } catch (err) {
        console.error(err);
        Notification.error({ title: 'Instanciation translation not Updated', message: err.message });
      }
    }

    // FUNCTIONS

    const translateInstanciations = () => {
      if (!$scope.nodetype || !$scope.nodetype.instanciations) return;
      return [...$scope.nodetype.instanciations].map((instanciation) => {
        const translationPath = `nodetype.${$scope.nodetype.name}.${instanciation.name}`;
        instanciation.translation = $translate.instant(translationPath);
        return instanciation;
      });
    }


    // ███████╗ ██████╗ ██████╗ ██████╗ ███████╗   ██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗
    // ██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝   ██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║
    // ███████╗██║     ██║   ██║██████╔╝█████╗     ██║ █╗ ██║███████║   ██║   ██║     ███████║
    // ╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝     ██║███╗██║██╔══██║   ██║   ██║     ██╔══██║
    // ███████║╚██████╗╚██████╔╝██║     ███████╗██╗╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║
    // ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝


    $scope.$watch('datamodel.openItem.name', function () {

      // retrieve opened nodetype
      $scope.nodetype = $scope.datamodel.openItem;

      // update grid
      datamodelModel.grid.loadData($scope.instanciationsGridOptions.api, $scope.nodetype.instanciations);
    });


    // ██╗███╗   ██╗██╗████████╗
    // ██║████╗  ██║██║╚══██╔══╝
    // ██║██╔██╗ ██║██║   ██║   
    // ██║██║╚██╗██║██║   ██║   
    // ██║██║ ╚████║██║   ██║   
    // ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   


    // retrieve opened nodetype
    $scope.nodetype = $scope.datamodel.openItem;

    // create list of available method names
    const instanciations = _.get($scope, 'datamodel.instanciations', []).map((elt) => elt.name);

    // get instanciations with translations
    $scope.nodetype.instanciations = translateInstanciations();

    // init actions grid
    $scope.instanciationsGridOptions = {
      defaultColDef: {
        resizable: true
      },
      columnDefs: [{
        headerName: "name",
        field: "name",
        editable: true
      },
      {
        headerName: `translation (${$rootScope.appContext.user.language.name})`,
        headerTooltip: 'Translation for the selected language',
        field: "translation",
        width: 200,
        editable: true,
        onCellValueChanged: function (params) {
          $scope.updateInstanciationTranslation(params);
        },
      },
      {
        headerName: "sourceBOM",
        field: "sourceBOM",
        cellRenderer: ({
          value
        }) => {
          if (!value) return '';
          const relationship = $scope.datamodel.nodetypes.find((r) => r.id === value);
          return `${relationship.name} [${relationship.linkName}]`;
        },
        cellEditor: 'agRichSelectCellEditor',
        cellEditorParams: () => {
          const relationships = $scope.datamodel.nodetypes.filter((nodetype) => {
            const { elementType, hidden, directions = [] } = nodetype;
            if (hidden || elementType === 'node') return;
            
            const direction = directions.find((d) => {
              return d.source === $scope.nodetype.id && d.target === $scope.nodetype.id
            });
            return direction;
          });
          return {
            values: relationships.map((r) => r.id).sort(),
            cellRenderer: ({
              value
            }) => {
              if (!value) return '';
              const relationship = $scope.datamodel.nodetypes.find((r) => r.id === value);
              return `${relationship.name} [${relationship.linkName}]`;
            },
          }
        },
        editable: true
      }, {
        headerName: "targetRel",
        field: "targetRel",
        cellEditor: 'agSelectCellEditor',
        cellRenderer: ({
          value
        }) => {
          if (!value) return '';
          const relationship = $scope.datamodel.nodetypes.find((r) => r.id === value);
          return `${relationship.name} [${relationship.linkName}]`;
        },
        cellEditor: 'agRichSelectCellEditor',
        cellEditorParams: () => {
          const relationships = $scope.datamodel.nodetypes.filter((nodetype) => {
            const { elementType, hidden, directions = [] } = nodetype;
            if (hidden || elementType === 'node') return;
            
            const direction = directions.find((d) => {
              return d.target === $scope.nodetype.id;
            });
            return direction;
          });
          return {
            values: relationships.map((r) => r.id).sort(),
            cellRenderer: ({
              value
            }) => {
              if (!value) return '';
              const relationship = $scope.datamodel.nodetypes.find((r) => r.id === value);
              return `${relationship.name} [${relationship.linkName}]`;
            },
          }
        },
        editable: true
      }, {
        headerName: "targetBOM",
        field: "targetBOM",
        cellRenderer: ({
          value
        }) => {
          if (!value) return '';
          const relationship = $scope.datamodel.nodetypes.find((r) => r.id === value);
          return `${relationship.name} [${relationship.linkName}]`;
        },
        cellEditor: 'agRichSelectCellEditor',
        cellEditorParams: ({
          data
        }) => {
          const targetRel = _.get(data, 'targetRel');
          if (!targetRel) return {
            values: []
          };
          const targetRelationshipDM = $scope.datamodel.nodetypes.find((r) => r.id === targetRel);
          const relationships = $scope.datamodel.nodetypes.filter((nodetype) => {
            const { elementType, hidden, directions = [] } = nodetype;
            if (hidden || elementType === 'node') return;
            
            const direction = directions.find((d) => {
              return d.source === $scope.nodetype.id && d.target === $scope.nodetype.id
            });
            return direction;
          });
          return {
            values: relationships.map((r) => r.id).sort(),
            cellRenderer: ({
              value
            }) => {
              if (!value) return '';
              const relationship = $scope.datamodel.nodetypes.find((r) => r.id === value);
              return `${relationship.name} [${relationship.linkName}]`;
            },
          }
        },
        editable: true
      }],
      rowSelection: "multiple",
      onGridReady: function (params) {
        $scope.nodetype = $scope.datamodel.openItem;
        datamodelModel.grid.loadData(params.api, $scope.nodetype.instanciations);
      },
      onCellValueChanged: function (params) {
        const instanciationId = params.data.id;
        if (params.colDef.field === 'translation') return;
        if (params.oldValue != params.newValue) {
          datamodelModel.nodetypes.instanciations.update(
            $scope.nodetype.name,
            instanciationId,
            params.colDef.field,
            params.oldValue,
            params.newValue
          ).then(function (result) {
            console.log(result);
            Notification.success('Instanciation Updated');
          })
            .catch((err) => Notification.error({ title: 'Instanciation not Updated', message: err.message }));
        }
      },
    }
  })