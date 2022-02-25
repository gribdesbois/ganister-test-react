/* globals _, agGrid, angular */
agGrid.initialiseAgGridWithAngular1(angular);
angular.module('app.ganister.tabs.node.nodeFormTabs.customTableView', [
  'agGrid',
  'ui-notification',
  'app.ganister.shared.modals.relationshipModal',
  'app.ganister.tool.aggrid',
  'app.ganister.tool.helperFunctions',
  'app.ganister.models.nodetypes',
])
  .controller('customTableViewController', ($scope, $rootScope, $translate, nodesModel, Notification, agRenderMachine, helperFunctions) => {

    $scope.customViewRowsNodes = {};
    
    $scope.$on('nodeformTabSelection', (e, data) => { 
      const { index, rel } = data; 
      if (!$scope.loaded && ($scope.rel.autoloads === false) && $scope.rel.id === rel.id) { 
        $scope.refreshTable(); 
        $scope.loaded = true; 
      } 
    }); 

    $scope.gridOptions = {
      components: {
        datePicker: agRenderMachine.getDatePicker(),
        booleanEditor : agRenderMachine.getBooleanEditor(),
      },
      defaultColDef: {
        // allow every column to be aggregated
        enableValue: true,
        // allow every column to be grouped
        enableRowGroup: true,
        // allow every column to be pivoted
        enablePivot: true,
        resizable: true,
        sortable: true,
      },
      groupDefaultExpanded: -1,
      groupMultiAutoColumn: true,
      columnDefs: [],
      getContextMenuItems: (params) => {
        return [
          {
            // custom item
            name: 'Open node ',
            action: function () {
              // retrieve nodetype and id
              const nodeElement = params.column.colDef.field;
              const rowId = params.node.data.id;
              const nodes = $scope.customViewRowsNodes[rowId];
              const node = _.find(nodes, { 'element': nodeElement });
              $scope.openNode(node._type, node._id);
            },
          },
          'copy',
          'copyWithHeaders',
          'export',
        ];
      },
      rowData: []
    }
    $scope.openNode = (_type, _id) => { $rootScope.$broadcast('openNode', { _id, _type }) };
    $scope.refreshTable = () => {
      nodesModel.getCustomTableView($scope.node, $scope.rel.name)
        .then((resultNodes) => {
          // build table
          let columnDefs = [];
          resultNodes.columns.forEach((col) => {
            col.cellRendered = true;
            let column = {
              headerName: col.name,
              field: col.name,
              colId: col.mapping,
              width: parseInt(col.width, 10),
              cellRendered: true,
              columnGroupShow: false,
              type: col.type,
            }

            if (col.groupOrder && parseInt(col.groupOrder, 10) > 0) {
              column.rowGroupIndex = parseInt(col.groupOrder, 10);
              column.rowGroup = true,
                column.hide = true;
            }

            column = agRenderMachine.getRendering(column, column);
            if (col.visible) columnDefs.push(column);

          });


          // load the content
          const data = [];

          resultNodes.data.forEach((item) => {
            dataRow = {};
            dataRow.id = helperFunctions.generateUUID();
            $scope.customViewRowsNodes[dataRow.id] = [];
            columnDefs.forEach((colDef) => {
              if (colDef.colId.split('.').length > 1) {
                let object = [colDef.colId.split('.')[0]];
                let prop = [colDef.colId.split('.')[1]];
                dataRow[colDef.field] = item[object][prop];
                colDef.mapping = `${colDef.colId}###${item[object]._type}`;
                colDef.nodetype = item[object]._type;
                $scope.customViewRowsNodes[dataRow.id].push({
                  element: colDef.field,
                  _type: item[object]._type,
                  _id: item[object]._id
                })
              } else {
                dataRow[colDef.field] = item[colDef.colId];
              }
            });
            data.push(dataRow);

          });

          columnDefs = columnDefs.map((col) => {
            col.colId = col.mapping;
            delete col.mapping;
            return col;
          });

          // group columns

          const sortedColumns = _.orderBy(columnDefs, 'nodetype', 'asc');
          const groupColumnDefs = _.chain(sortedColumns)
            .groupBy("nodetype")
            // `key` is group's name (color), `value` is the array of objects
            .map((value, key) => ({ headerName: key, children: value }))
            .value()

          // remove undefined top column name, replaced by empty
          groupColumnDefs.forEach((col) => {
            if (col.headerName === "undefined") col.headerName = '';
          })

          $scope.gridOptions.api.setColumnDefs(groupColumnDefs);
          $scope.gridOptions.api.setRowData(data);
          $scope.$emit("objCountUpdate", $scope.rel.name, resultNodes.data.length);

        })
        .catch((error) => {
          $scope.$emit("objCountUpdate", $scope.rel.name, 0);

        });

    }
    if ($scope.rel.autoloads != false) { 
      $scope.refreshTable(); 
      $scope.loaded = true; 
    } 
 

    $scope.$on('refreshTabContent', () => {
      $scope.refreshTable();
    })

  });