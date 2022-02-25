angular.module("app.ganister.shared.modals.relationshipModal", [
  'agGrid',
  'ui-notification',
  'app.ganister.tool.aggrid'
]).controller("relModalController", function ($scope, $rootScope, nodesModel, Notification, agRenderMachine, helperFunctions, $translate) {
  $scope.rowSelected = true;

  $scope.getTargetNodetype = () => {
    let targetId;
    // for undirectRelationship, check if the current nodetype is the same as the target nodetype
    const sameNodetype = $scope.rel._definition.directions.find((d) => d.target === $scope.nodetype.id)
    // if so, then use the sourceNodetype as the targetNodetype to always get the 'opposite' nodetype
    if ($scope.rel._definition.undirectedRelationship && sameNodetype) {
      targetId = $scope.rel._definition.directions[0].source; // will not work with multiple source/target relationships
    } else {
      targetId = $scope.rel._definition.directions[0].target; // will not work with multiple source/target relationships
    }
    return $rootScope.datamodel.nodetypes.find((nodetype) => nodetype.id === targetId);
  }

  $scope.modal = {
    id: `modal-${$scope.rel.name}-${$scope.node._id}-${$scope.nodeVersion}`,
    targetNodeType: $scope.getTargetNodetype(),
    sourceNode: $scope.node,
    // modalLabel: $scope.modal.targetNodeType.name,
    maxResults: 50,
    maxResultsClass: {},
    tabContentType: $scope.rel.tabContentType,
  };

  // Listener to open the relationship Modal
  $rootScope.$on('openRelModal', (e, relationshipId, nodeId, nodeVersion) => {
    const sameRelationshipId = $scope.rel.id === relationshipId;
    const sameNodeId = $scope.node._id === nodeId;
    const sameVersion = $scope.node.properties._version === nodeVersion;
    if (!sameRelationshipId || !sameNodeId || !sameVersion) {
      return false;
    }
    //  Reset Filters
    if ($scope.modal.gridOptions.api) {
      // $scope.modal.gridOptions.api.setFilterModel(null);
      $scope.loadModalTable();
    }
  })

  $scope.getMaxResults = () => {
    const maxResults = Number.parseInt(localStorage['relModal_maxResults'], 10);
    if (Number.isNaN(maxResults)) {
      localStorage['relModal_maxResults'] = 50;
      return 100;
    }
    return maxResults;
  };

  $scope.modal.maxResults = $scope.getMaxResults();


  //  Initiate Grid
  $scope.modal.gridOptions = {
    components: {
      datePicker: agRenderMachine.getDatePicker(),
      booleanEditor: agRenderMachine.getBooleanEditor(),
    },
    columnDefs: null,
    rowData: [],
    defaultColDef: {
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
    onRowDoubleClicked: (row) => $scope.addRelationship(row.node.data, 'dlbclick'),
    onFilterChanged: () => $scope.modal.executeFilter(),
  };



  $scope.editMaxResult = () => {
    Swal.fire({
      title: 'Edit the max result count',
      type: 'info',
      input: 'number',
      inputValue: $scope.modal.maxResults,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      confirmButtonColor: '#f0ad4e',
      cancelButtonText: 'Cancel',
    }).then((swalResult) => {
      if (swalResult.value > 0) {
        $scope.modal.maxResults = swalResult.value;
      } else if (swalResult.value < 1) {
        $scope.modal.maxResults = 1;
        Notification.warning('Minimum result size must be 1');
      }
      localStorage['relModal_maxResults'] = $scope.modal.maxResults;
      $scope.$apply();
      $scope.modal.executeFilter();
    });
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
      message: 'Column Definition not found',
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

  $scope.waitingResults = false;
  const loadNodetypeNodes = async (search = { maxResults: $scope.modal.maxResults }) => {
    // forcing evident search criterias
    search.searchDate = Date.now();
    search.searchType = "currentOn";
    $scope.waitingResults = true;
    $scope.modal.gridOptions.api.setRowData([]);
    $scope.modal.gridOptions.api.showLoadingOverlay();

    const nodetype = { ...$scope.modal.targetNodeType };
    const nodes = await nodesModel.getNodes(nodetype.name, search);
    if (!nodes) return;

    $scope.modal.gridOptions.data = nodes.map((node) => {
      node._typeObject = nodetype;
      node.locked = helperFunctions.getLockedState(node);
      return node;
    });
    $scope.waitingResults = false;

    // load rowData if the grid is still there (in case the user already logged out for example)
    if ($scope.modal.gridOptions.api) {
      $scope.modal.gridOptions.api.setRowData($scope.modal.gridOptions.data);
    }

    //  Check if nodes are less that the maxResults requested
    if (nodes.length < $scope.modal.maxResults) {
      $scope.modal.maxResultsClass = false;
    } else {
      $scope.modal.maxResultsClass = true;
    }
  };

  $scope.addRelationship = async (row, event = 'submit') => {
    try {
      const source = $scope.modal.sourceNode;
      const target = row;
      const relation = $scope.rel._definition;
      const params = {
        _type: relation.name,
        source,
        target,
      };

      const relMandatoryFields = await helperFunctions.askMandatoryFields(relation, params.properties);
      if (!relMandatoryFields) {
        return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
      }

      params.properties = { ...params.properties, ...relMandatoryFields };
      const relationship = await nodesModel.addRelationship(params);
      if (!relationship) return;

      if (event === 'submit') {
        $(`#${$scope.modal.id}`).modal('hide');
      } else {
        $(`#${$scope.modal.id}`);
      }
      Notification.success({ message: $translate.instant('default.node.relationshipCreated') });
      return $scope.handleAttachedNode(relationship);
    } catch (error) {
      console.error(error);
    }
  };

  $scope.addMultiRelationship = function () {
    for (target of $scope.modal.gridOptions.api.getSelectedRows()) {
      $scope.addRelationship(target);
    }
  };
});
