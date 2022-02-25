angular.module("app.ganister.customPanel", [
  'agGrid',
  'app.ganister.tool.aggrid',
  'app.ganister',
  'chart.js',
])
  .controller('customController', async function ($scope, $rootScope, $translate, userconf, nodesModel, datamodelModel, agRenderMachine, helperFunctions) {

    // #region [FUNCTIONS]
    function formatRecentItems(items) {
      if (!items) return [];
      return items.reverse().map(item => {
        const nodetype = datamodelModel.getNodetype(item._type);
        if (!nodetype) return item;
        item._displayVersion = helperFunctions.filterSemVersionning(item._version, nodetype);
        return {
          ...item,
          nodetypeLabels: nodetype.name,
          nodetypeDefaultThumbnail: nodetype.ui.defaultThumbnail,
        };
      });
    }
    // #endregion

    // #region [SCOPE_FUNCTIONS]
    $scope.refreshAssignments = async () => {
      const nodetypeName = 'assignment';
      $scope.assignmentLoading = true;
      try {
        const user = $rootScope.appContext.user;
        const relationships = ['actor', 'requestor'];

        const results = await nodesModel.searchRelationships(user, { relationships }, { reverse: true});
        if (!results) {
          $scope.assignmentLoading = false;
          return;
        }
        $scope.tasks = results.map((r) => r.source);
        $scope.assignmentLoading = false;
        const groupedStated = _.groupBy($scope.tasks, 'properties._state');
        $scope.taskGraph = { labels: [], data: [], options: {} };
        Object.keys(groupedStated).forEach((key) => {
          $scope.taskGraph.labels.push(key);
          $scope.taskGraph.data.push(groupedStated[key].length);
        });

        //  Generate Nodes
        const nodes = $scope.tasks.map((task) => {
          task.locked = helperFunctions.getLockedState(task);
          // task._typeObject = nodetypeDM;
          return task;
        });
        $scope.gridWidgets[nodetypeName].api.setRowData(nodes);
      } catch (error) {
        console.error(error);
        $scope.assignmentLoading = false;
      }
    }

    $scope.createAssignmentsWidget = async () => {
      const nodetypeName = 'assignment';
      const nodetypeDM = datamodelModel.getNodetype(nodetypeName);
      $scope.gridWidgets[nodetypeName] = {
        components: {
          datePicker: agRenderMachine.getDatePicker(),
          booleanEditor: agRenderMachine.getBooleanEditor(),
        },
        defaultColDef: {
          enableValue: true,
          enableRowGroup: true,
          enablePivot: true,
          resizable: true,
          sortable: true,
          filter: true,
        },
        columnDefs: agRenderMachine.getColumnDefs(nodetypeDM),
        rowData: [],
        rowSelection: 'single',
        onRowDoubleClicked: (row) => {
          $rootScope.$broadcast('openNode', row.data)
        },
        onGridReady: async () => {
          await $scope.refreshAssignments();
          // prevent trying to set filtermondel if grid has disappeared (user logged out before data loaded)
          if ($scope.gridWidgets[nodetypeName].api) {
            $scope.gridWidgets[nodetypeName].api.setFilterModel({
              "assignment._state": {
                filterType: "set",
                values: ["commited", "new", "inprogress", "onhold"],
              }
            });
          }
        },
        columnTypes: {
          state: {
            cellRenderer: agRenderMachine.stateRenderer,
          },
          date: {
            cellRenderer: agRenderMachine.dateRenderer,
          },
          node: {
            cellRenderer: agRenderMachine.nodeRenderer,
          }
        },
        suppressClickEdit: true,
        angularCompileRows: true,
      }
    }

    //  Workflow Assignments
    $scope.switchWorkflow = () => {
      $scope.showActiveWorkflow = !$scope.showActiveWorkflow;
    }
    $scope.refreshWorkflows = async () => {
      $scope.activities = { active: [], inactive: [] };

      const relationships = await nodesModel.getRelationships($rootScope.appContext.user, 'lifecycleRole', { reverse: true})
      if (!relationships) return;

      relationships.forEach((relationship) => {
        const { target, source } = relationship;
        if (target.properties.stateOwner) {
          $scope.activities.active.push(source);
        } else {
          $scope.activities.inactive.push(source)
        }
      });

      let groupedStated = _.groupBy($scope.activities.active, 'properties._state');
      $scope.workflowStates = [];
      $scope.gridWidgets["activeWorkflows"].api.setRowData($scope.activities.active);
      $scope.gridWidgets["inactiveWorkflows"].api.setRowData($scope.activities.inactive);

      $scope.workflowStatesCount = [];
      Object.keys(groupedStated).forEach((key) => {
        $scope.workflowStates.push(key);
        $scope.workflowStatesCount.push(groupedStated[key].length);
      });
      $scope.activeWorkflowsGraph.data = $scope.workflowStatesCount;
    }

    $scope.renderWorkflows = async () => {
      $scope.activities = { active: [], inactive: [] };

      const relationships = await nodesModel.getRelationships($rootScope.appContext.user, 'lifecycleRole', { reverse: true})
      if (!relationships) return;

      relationships.forEach((relationship) => {
        const { target, source } = relationship;
        source.role = relationship.properties.role;

        if (target.properties.stateOwner) {
          $scope.activities.active.push(source);
        } else {
          $scope.activities.inactive.push(source)
        }
      });

      let groupedStated = _.groupBy($scope.activities.active, 'properties._state');
      $scope.workflowStates = [];
      $scope.workflowStatesCount = [];
      Object.keys(groupedStated).forEach((key) => {
        $scope.workflowStates.push(key);
        $scope.workflowStatesCount.push(groupedStated[key].length);
      });
      $scope.activeWorkflowsGraph = {
        labels: $scope.workflowStates,
        data: $scope.workflowStatesCount,
        options: {
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      }
      let columnDefs = [
        {
          headerName: "Type",
          field: "_type",
          width: 100,
          cellStyle: {
            "text-align": "center",
          },
        },
        {
          headerName: 'State',
          field: 'properties._state',
          type: 'state',
          cellRendered: true,
          cellStyle: {
            'text-align': 'center',
          },
          width: 80,
        },
        {
          headerName: "Ref",
          field: "properties._ref",
          width: 150,
        },
        {
          headerName: "Name",
          field: "properties.name",
          width: 200,
        },
        {
          headerName: "Role",
          field: "role",
          width: 90,
        },
        {
          headerName: "ID",
          field: "_id",
          hide: true,
        },
        {
          headerName: "Created On",
          field: "properties._createdOn",
          type: "date",
          cellRendered: true,
          cellStyle: {
            "text-align": "center",
          },
          width: 100,
        },
      ];

      columnDefs.forEach(column => {
        const [propertyName] = column.field.split('.').reverse();
        column.headerName = helperFunctions.translateProperty(`widget.workflows.${propertyName}`);
        agRenderMachine.getRendering(column);

        delete column.cellRendered;
        return column;
      })

      $scope.workflowLoading = false;
      $scope.gridWidgets["activeWorkflows"] = {
        components: {
          datePicker: agRenderMachine.getDatePicker(),
          booleanEditor: agRenderMachine.getBooleanEditor(),
        },
        defaultColDef: {
          // allow every column to be aggregated
          enableValue: true,
          // allow every column to be grouped
          enableRowGroup: true,
          // allow every column to be pivoted
          enablePivot: true,
          resizable: true,
          filter: true,
          sortable: true,
        },
        columnDefs,
        suppressClickEdit: true,
        rowData: $scope.activities.active,
        rowSelection: 'single',
        onRowDoubleClicked: function (row) {
          $rootScope.$broadcast('openNode', row.data)
        },
        columnTypes: {
          state: {
            cellRenderer: agRenderMachine.stateRenderer,
          },
          date: {
            cellRenderer: agRenderMachine.dateRenderer,
          },
        },
        angularCompileRows: true,
      }

      $scope.gridWidgets["inactiveWorkflows"] = {
        components: {
          datePicker: agRenderMachine.getDatePicker(),
          booleanEditor: agRenderMachine.getBooleanEditor(),
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
          filter: true,
        },
        columnDefs,
        rowData: $scope.activities.inactive,
        rowSelection: 'single',
        columnTypes: {
          state: {
            cellRenderer: agRenderMachine.stateRenderer,
          },
          date: {
            cellRenderer: agRenderMachine.dateRenderer,
          },
        },
        onRowDoubleClicked: function (row) {
          $rootScope.$broadcast('openNode', row.data)
        },
        angularCompileRows: true,
      }
    }

    $scope.openNodeTab = (data) => {
      $rootScope.$broadcast('openNode', data);
    }


    $scope.removeRecentItems = () => userconf.removeRecentItems();
    $scope.removeRecentItem = (node) => userconf.removeRecentItem(node._id);
    // #endregion

    // #region [INIT]


    $scope.$on('datamodelLoaded', () => {
      // set loaders to visible
      $scope.assignmentLoading = true;
      $scope.workflowLoading = true;
      $scope.gridWidgets = {};
      $scope.createAssignmentsWidget();
      $scope.showActiveWorkflow = true;
      $scope.renderWorkflows();
      $scope.recentItems = formatRecentItems(userconf.loadRecentItems());
    });


    // #endregion

    // #region [SCOPE_WATCH]
    // #endregion

    // #region [SCOPE_ON]

    //  Update Grid Columns on Language Change 
    $rootScope.$on('$translateChangeSuccess', function () {
      _.forEach($scope.gridWidgets, (grid, key) => {
        if ($scope.gridWidgets[key].columnDefs) {
          $scope.gridWidgets[key].columnDefs = $scope.gridWidgets[key].columnDefs.map(column => {
            const [propertyName] = column.field.split('.').reverse();
            if (key === 'activeWorkflows' || key === 'inactiveWorkflows') {
              column.headerName = helperFunctions.translateProperty(`widget.workflows.${propertyName}`);
            } else {
              column.headerName = helperFunctions.translateProperty(`nodetype.assignment.${propertyName}`);
            }
            return column;
          });
          if ($scope.gridWidgets[key].api) {
            $scope.gridWidgets[key].api.setColumnDefs([]);
            $scope.gridWidgets[key].api.setColumnDefs($scope.gridWidgets[key].columnDefs);
          }
        }
      })
    });


    $rootScope.$on('recentItemsUpdated', function (event, recentItems) {
      $scope.recentItems = formatRecentItems(recentItems);
    });
    // #endregion

  })
