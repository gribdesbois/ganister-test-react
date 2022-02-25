/* globals agGrid, angular */
agGrid.initialiseAgGridWithAngular1(angular);
angular.module('app.ganister.tabs.node.nodeFormTabs.reverseEcos', [
  'agGrid',
  'ui-notification',
  'app.ganister.tool.aggrid',
  'app.ganister.models.nodetypes',
])
  .controller('reverseEcosControllerToolbar', function ($scope, $rootScope) {
    $scope.overallRelsCount = 0;
    $scope.reloadTables = () => {
      $scope.overallRelsCount = 0;
      $scope.$broadcast("reloadTables");
    }
    $rootScope.$on('reverseEcosObjCount', function (event, data, relName) {
      if (data.nodeId === $scope.node._id && $scope.rel.name === relName) {
        $scope.overallRelsCount += data.count;
        $scope.$emit("objCountUpdate", $scope.rel.name, $scope.overallRelsCount);
      }
    });

  })
  .controller('reverseEcosController', function ($scope, $rootScope, $translate, nodesModel, Notification, agRenderMachine) {

    
    const ecoDm = $rootScope.datamodel.nodetypes.find((n) => n.name == 'eco');

    // #region [FUNCTIONS]

    $scope.setRowsData = (nodes) => {
      if (nodes.length>0){
        $scope.gridOptions.api.setRowData(nodes);
      } else {
        $scope.gridOptions.api.setRowData([]);
      }
    };

    // #endregion


    // #region [SCOPE_FUNCTIONS]

    $scope.loadTables = async (reload = false) => {
      const relatedNodes = await nodesModel.getReverseEcos($scope.node);
    
      if (relatedNodes.error) {
        const error = relatedNodes.data;
        return Notification.error({ title: error.title, message: error.message });
      }


      // define grid if it wasn't defined already


      if (!reload) {

        const columnDefs = agRenderMachine.getColumnDefs(ecoDm);

        $scope.gridOptions = {
          columnDefs,
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
          //onModelUpdated: onModelUpdated,
          onGridReady: (params) => {
            $scope.setRowsData(relatedNodes)
          },
          onCellDoubleClicked: (params) => {
            if (!params.colDef.editable) {
              $scope.openNode(params.data);
            }
          },
          onDisplayedColumnsChanged(params) {
            const { primaryColumns } = params.columnApi.columnController;
            agRenderMachine.setGridRowHeight(primaryColumns, this);
          },
        };
      } else {
        $scope.setRowsData(relatedNodes)
      }
      $scope.nodesCount = relatedNodes.length;
      $rootScope.$broadcast("reverseEcosObjCount", { nodeId: $scope.node._id, count: relatedNodes.length }, $scope.rel.name);
    };

    $scope.openNode = (node) => {
      if (node && node._id) {
        $rootScope.$broadcast('openNode', {
          _id: node._id,
          _type: node._type,
        });
      }
    };

    // #endregion



    // #region [INIT]
    $scope.loadTables();
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
        let columnDefs;
        if ($scope.gridOptions.api && ecoDm.ui.gridColumns.length > 0) {
          columnDefs = agRenderMachine.getColumnDefs(ecoDm);
          $scope.gridOptions.api.setColumnDefs(columnDefs);
        }
    });
    // #endregion


  });