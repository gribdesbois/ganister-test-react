angular.module("app.ganister.shared.modals.nodeRelModal", [
  'agGrid',
  'ui-notification',
  'app.ganister.tool.aggrid'
]).controller("nodeRelModalController", function ($scope, $rootScope, nodesModel, Notification, agRenderMachine, $translate, helperFunctions) {


  //   _____                 _   _                 
  //  |  ___|   _ _ __   ___| |_(_) ___  _ __  ___ 
  //  | |_ | | | | '_ \ / __| __| |/ _ \| '_ \/ __|
  //  |  _|| |_| | | | | (__| |_| | (_) | | | \__ \
  //  |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|___/


  $scope.select = async () => {
    const selectedRows = $scope.modal.gridOptions.api.getSelectedRows();
    if (!selectedRows.length) {
      return Notification.error("Please select a node first!");
    }
    const row = selectedRows[0];
    $scope.addRelationship(row);
  }



  $scope.unselect = async () => {
    const selectedRows = $scope.modal.gridOptions.api.getSelectedRows();
    if (!selectedRows.length) {
      return Notification.error("Please select a node first!");
    }
    const row = selectedRows[0];

    const result = await nodesModel.deleteRelationship(row);
    if (!result) return;

    $(`#${$scope.modal.id}`).modal('hide');
    Notification.success({ message: $translate.instant('default.node.relationshipCreated') });
    // $scope.handleAttachedNode($scope.modal.relationshipId, result);
  }

  $scope.addRelationship = async (row) => {
    if (row) $scope.modal.row = row;
    const sourceNode = $scope.modal.sourceNode;

    const { name } = $scope.modal.relationshipDM;
    const params = {
      _type: name,
      source: sourceNode,
      target: row,
    };
    const relMandatoryFields = await helperFunctions.askMandatoryFields($scope.modal.relationshipDM, params.properties);
    if (!relMandatoryFields) {
      return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
    }

    params.properties = { ...params.properties, ...relMandatoryFields };
    const relationship = await nodesModel.addRelationship(params);
    if (!relationship) return;

    $(`#${$scope.modal.id}`).modal('hide');
    Notification.success({ message: $translate.instant('default.node.relationshipCreated') });
    $scope.handleAttachedNode(relationship, false);
  }

  $scope.loadModalTable = () => {
    //  Get Column Defs
    if (!$scope.modal.targetNodeType.ui.gridColumns) {
      return Notification.error({
        title: 'Error',
        message: 'Column Definition not found',
      });
    }

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

  const loadNodetypeNodes = async (maxResults, searchCriterias = {}) => {
    try {
      if (!maxResults) maxResults = $scope.maxResults;
      const nodes = await nodesModel.getNodes($scope.modal.targetNodeType.name, { maxResults, searchCriterias });
      if (!nodes) return;
      $scope.nodes = nodes;

      $scope.modal.gridOptions.api.setRowData($scope.nodes);
      $scope.modal.gridOptions.rowData = $scope.nodes;
      $scope.waitingResults = false;
    } catch (err) {
      console.error(err);
    }
  };

  $scope.getMaxResults = () => {
    const maxResults = Number.parseInt(localStorage['relModal_maxResults'], 10);
    if (Number.isNaN(maxResults)) {
      localStorage['relModal_maxResults'] = 50;
      return 100;
    }
    return maxResults;
  };


  //   ___       _ _   
  //  |_ _|_ __ (_) |_ 
  //   | || '_ \| | __|
  //   | || | | | | |_ 
  //  |___|_| |_|_|\__|

  const nodeVersion = $scope.node._version ? $scope.node._version.replace(/\./g, '') : '';
  $scope.modal = {
    id: `nodeRelModal-${$scope.rel.name}-${$scope.node._id}-${nodeVersion}`,
    maxResults: 20,
    maxResultsClass: {},
    executeFilter: () => {
      const filterModel = $scope.modal.gridOptions.api.getFilterModel();
      loadNodetypeNodes($scope.modal.maxResults, filterModel);
    },
    clearFilters: () => {
      $scope.modal.gridOptions.api.setFilterModel(null);
    }
  };

  //  Initiate Grid

  $scope.maxResults = $scope.getMaxResults();
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
    rowSelection: 'single',
    angularCompileRows: true,
    onRowSelected: ({ data }) => $scope.modal.row = data,
    onRowDoubleClicked: (row) => $scope.addRelationship(row.node.data),
    onFilterChanged: () => $scope.modal.executeFilter(),
  };

  //  __        __    _       _                   
  //  \ \      / /_ _| |_ ___| |__   ___ _ __ ___ 
  //   \ \ /\ / / _` | __/ __| '_ \ / _ \ '__/ __|
  //    \ V  V / (_| | || (__| | | |  __/ |  \__ \
  //     \_/\_/ \__,_|\__\___|_| |_|\___|_|  |___/


  // Listener to open the relationship Modal
  $scope.$on('openNodeRelModal', (e, relationshipDM, relationshipId, node, property, mainNodeListing = false) => {
    $scope.modal.sourceNode = node;
    $scope.modal.relationshipDM = relationshipDM;
    $scope.modal.relationshipId = relationshipId;
    $scope.modal.sourceNodetype = $rootScope.datamodel.nodetypes.find((n) => {
      const { elementType, hidden, id } = n;
      if (elementType === 'relationship' || hidden) return;
      return relationshipDM.directions.find((d) => d.source === id);
    });
    $scope.modal.targetNodetype = $rootScope.datamodel.nodetypes.find((n) => {
      return relationshipDM.directions.find((d) => {
        return d.source === $scope.modal.sourceNodetype.id && d.target === n.id;
      });
    });
    $scope.modal.property = property;
    if (mainNodeListing) {
      $scope.modal.id = `nodeRelModal-${$scope.rel.name}-${$scope.node._id}-${nodeVersion}`;
      if (!$scope.modal.id.includes('-mainNodeListing')) {
        $scope.modal.id = $scope.modal.id + '-mainNodeListing';
      }
    }
    $scope.$apply();
    //  Reset Filters
    if ($scope.modal.gridOptions.api) {
      // $scope.modal.gridOptions.api.setFilterModel(null);
      $scope.loadModalTable();
    }
  });


})
