angular.module("app.ganister.shared.modals.assignmentsModal", [
  'agGrid',
  'ui-notification',
  'app.ganister.tool.aggrid'
]).controller("assignmentsModalController", function ($scope, $rootScope, nodesModel, Notification, agRenderMachine) {
  $scope.rowSelected = true;
  $scope.modal = {
    id: `modal-assignments-${$scope.node._id}-${$scope.nodeVersion}`,
    targetNodeType: $rootScope.datamodel.nodetypes.find((n) => n.name === "assignment"),
    sourceNode: $scope.node,
    modalLabel: "assignments",
    maxResults: 20,
    maxResultsClass: {},
    state: undefined,
  };

  // Listener to open the Modal
  $rootScope.$on('openAssignmentsModal', (e, nodeId, nodeVersion, state) => {
    if ($scope.node._id !== nodeId || $scope.node._version !== nodeVersion) {
      if ($scope.modal.gridOptions.api) {
        // $scope.modal.gridOptions.api.setFilterModel(null);
        $scope.modal.state = state;
        $scope.loadModalTable();
      }
    }    
  })

  //  Initiate Grid
  $scope.modal.gridOptions = {
    components: {
      datePicker: agRenderMachine.getDatePicker(),
      booleanEditor : agRenderMachine.getBooleanEditor(),
    },
    columnDefs: null,
    rowData: [],
    defaultColDef :{
      sortable: true,
      editable: false,
      resizable: true,
      filter: true, // set filtering on for all cols
    },
    floatingFilter: true, // turn on floating filters
    rowSelection: 'multiple',
    angularCompileRows: true,
    onRowSelected: () => {
      $scope.rowSelected = false;
      $scope.$apply();
    },
    onRowDoubleClicked: (row) => $scope.addRelationship(row.node.data),
    onFilterChanged: () => $scope.modal.executeFilter(),
  };

  //  Load Nodes using Grid Filters
  $scope.modal.executeFilter = () => {
    const filterModel = $scope.modal.gridOptions.api.getFilterModel();
    loadNodetypeNodes({
      maxResults: $scope.modal.maxResults,
      searchCriterias: filterModel,
    });
  }

  //  Clear Grid Filters
  $scope.modal.clearFilters = () => {
    $scope.modal.gridOptions.api.setFilterModel(null);
  }

  $scope.loadModalTable = () => {
    //  Get Column Defs
    if (!$scope.modal.targetNodeType.ui.gridColumns) return Notification.error({
      title: 'Error',
      message: 'Column Definition not found'
    });

    //  Translate Column Definitions and set them in grid
    $scope.modal.gridOptions.columnDefs = agRenderMachine.getColumnDefs($scope.modal.targetNodeType).map((item) => {
      item.editable = false;
      return item;
    });
    $scope.modal.gridOptions.api.setColumnDefs($scope.modal.gridOptions.columnDefs);
    // open the modal using jquery
    $(`#${$scope.modal.id}`).modal();

    //  Get Nodetype Nodes
    loadNodetypeNodes();
  };

  const loadNodetypeNodes = async (search = { maxResults: $scope.modal.maxResults }) => {
    const nodetype = { ...$scope.modal.targetNodeType };
    $scope.modal.gridOptions.api.setRowData([]);
    $scope.modal.gridOptions.api.showLoadingOverlay();

    const nodes = await nodesModel.getNodes(nodetype.name, search);
    if (nodes && nodes.data) {
      $scope.modal.gridOptions.data = nodes.data.map((item) => {
        item._typeObject = nodetype;
        return item;
      });
      $scope.modal.gridOptions.api.setRowData($scope.modal.gridOptions.data);
    }

    //  Check if nodes are less that the maxResults requested
    if (nodes.length < $scope.modal.maxResults) {
      $scope.modal.maxResultsClass = {
        background: 'none',
        color: '',
        border: '',
      };
    } else {
      $scope.modal.maxResultsClass = {
        background: '#f0ad4e',
        color: 'white',
        border: 'dashed 3px red',
      };
    }
  };

  $scope.addRelationship = async (row) => {
    const sourceNode = $scope.modal.sourceNode;
    try {
      const attachNode = await nodesModel.attachLifecycleAssignment(sourceNode, row._id, $scope.modal.state);
      if (attachNode.error) {
        return Notification.error({
          title: 'Error Attaching Node',
          ...attachNode,
          positionY: 'top',
          positionX: 'right',
          delay: 5000,
        });
      }
      $(`#${$scope.modal.id}`).modal('hide');
      $scope.returnAssignmentRel(attachNode);
    } catch (error) {
      Notification.error({
        title: 'Create Rel Error',
        message: error.message,
        positionY: 'bottom',
        positionX: 'right',
        delay: 3000,
      })
    }
  }

  $scope.addMultiRelationship = function () {
    for (target of $scope.modal.gridOptions.api.getSelectedRows()) {
      $scope.addRelationship(target)
    }
  }
})
