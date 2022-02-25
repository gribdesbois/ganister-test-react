/* globals agGrid, angular */
agGrid.initialiseAgGridWithAngular1(angular);
angular.module('app.ganister.tabs.node.nodeFormTabs.reverseRelationship', [
  'agGrid',
  'ui-notification',
  'app.ganister.tool.aggrid',
  'app.ganister.models.nodetypes',
])
  .controller('reverseRelationshipControllerToolbar', function ($scope, $rootScope) {
    $scope.overallRelsCount = 0;
    $scope.reloadTables = () => {
      $scope.overallRelsCount = 0;
      $scope.$broadcast("reloadTables");
    }
    $rootScope.$on('reverseRelsObjCount', function (event, data, relName) {
      if (data.nodeId === $scope.node._id && $scope.rel.name === relName) {
        $scope.overallRelsCount += data.count;
        $scope.$emit("objCountUpdate", $scope.rel.name, $scope.overallRelsCount);
      }
    });

  })
  .controller('reverseRelationshipController', function ($scope, $rootScope, $translate, nodesModel, Notification, agRenderMachine) {

    // #region [FUNCTIONS]

    setColumnAsEditable = (columns) => {
      return columns.map((column) => {
        if (column.editable) {
          if ($scope.rel.disableUpdates) {
            column.editable = false;
          } else if ($scope.lockedByCurrentUser || (!$scope.rel.lockLinked && $scope.rel.lockLinked != undefined)) {
            column.editable = true;
          } else {
            column.editable = false;
          }
        }
        return column;
      });
    };

    $scope.setRowsData = (relationship) => {
      relationship.gridOptions.api.setRowData(relationship.rows);
    };


    // #endregion


    // #region [SCOPE_FUNCTIONS]

    $scope.reverseRelationships = angular.copy($scope.rel._definition);
    $scope.reverseRelationships = $scope.reverseRelationships.filter((r) => r);

    $scope.reverseRelationships.forEach((relationship) => {
      const direction = relationship.directions.find((d) => d.target === $scope.nodetype.id)
      relationship.sourceNode = $rootScope.datamodel.nodetypes.find((n) => {
        if (n.elementType === 'relationship' || n.hidden) return;
        return direction.source === n.id;
      })
    })

    $scope.loadTables = async (reload = false) => {
      try {
        const relationshipNames = $scope.reverseRelationships.map((r) => r.name);
        const params = { relationships: relationshipNames };
        const relationships = await nodesModel.searchRelationships($scope.node, params, { reverse: true });
        if (!relationships) return;

        const countResults = [];
        $scope.reverseRelationships.forEach((relationshipDM) => {
          // define grid if it wasn't defined already
          relationshipDM.rows = relationships.filter((relationship) => {
            return relationship._type === relationshipDM.name;
          });

          countResults.push(relationshipDM.rows.length);

          if (!reload) {
            relationshipDM.gridOptions = {
              components: {
                datePicker: agRenderMachine.getDatePicker(),
                booleanEditor: agRenderMachine.getBooleanEditor(),
              },
              columnDefs: agRenderMachine.getColumnDefs(relationshipDM, false, {}, true),
              defaultColDef: {
                enableValue: true,
                enableRowGroup: true,
                enablePivot: true,
                resizable: true,
                sortable: true,
                filter: true,
              },
              rowSelection: 'multiple',
              angularCompileRows: true,
              sideBar: true,
              //onModelUpdated: onModelUpdated,
              onGridReady: (params) => {
                $scope.setRowsData(relationshipDM);
              },
              onCellDoubleClicked: (params) => {
                if (!params.colDef.editable) {
                  $scope.openNode(params.data.source);
                }
              },
              onDisplayedColumnsChanged(params) {
                const { primaryColumns } = params.columnApi.columnController;
                agRenderMachine.setGridRowHeight(primaryColumns, this);
              },
            };
          } else {
            $scope.setRowsData(relationshipDM);
          }
          relationshipDM.nodesCount = relationshipDM.rows.length;
        });
        const reducer = (accumulator, curr) => accumulator + curr;
        const totalResult = countResults.reduce(reducer, 0);
        $rootScope.$broadcast("reverseRelsObjCount", { nodeId: $scope.node._id, count: relationships.length }, $scope.rel.name);
      } catch (error) {
        console.error(error);
      }
    };

    $scope.openNode = (node) => {
      if (node && node._id) {
        $rootScope.$broadcast('openNode', node);
      }
    };

    // #endregion



    // #region [INIT]
    $scope.loaded = false;
    if ($scope.rel.autoloads != false) {
      $scope.loadTables();
      $scope.loaded = true;
    }
    $scope.$on('nodeformTabSelection', (e, data) => {
      const { index, rel } = data;
      if (!$scope.loaded && ($scope.rel.autoloads === false) && $scope.rel.id === rel.id) {
        $scope.loadTables();
        $scope.loaded = true;
      }
    });
    // #endregion



    // #region WATCHES (Object Watcher)
    // #endregion

    // #region ON (Event Listener)

    $scope.$on('reloadTables', function (event, data) {
      $scope.loadTables(true);
    });

    $rootScope.$on('refreshTabContent', () => {
      $scope.reloadTables();
    })

    //  Update Grid Columns on Language Change 
    $rootScope.$on('$translateChangeSuccess', function () {
      $scope.reverseRelationships.forEach((relationship) => {
        let columnDefs;
        if (relationship.gridOptions.api && relationship.ui.gridColumns.length > 0) {
          columnDefs = agRenderMachine.getColumnDefs(relationship, false, {}, true)
          relationship.gridOptions.api.setColumnDefs(columnDefs);
        }
      })
    });
    // #endregion


  });