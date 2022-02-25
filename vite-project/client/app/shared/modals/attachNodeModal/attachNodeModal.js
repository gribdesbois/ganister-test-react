angular.module("app.ganister.shared.modals.attachNodeModal", [
  'agGrid',
  'ui-notification',
  'app.ganister.tool.aggrid'
]).controller("attachNodeModalController", function ($scope, $rootScope, $translate, nodesModel, Notification, agRenderMachine) {
  $scope.modal = {};
  $scope.modal.name = `modal-attachNode-${$scope.node._id}-${$scope.nodetype._type}`;
  $scope.modal.modalLabel = $scope.nodetype.name;
  $scope.modal.node = $scope.node;
  $scope.modal.maxResults = 20;
  $scope.modal.maxResultsClass = {}; //  If max results is more than nodes in db

  $scope.modal.executeFilter = () => {
    const filterModel = $scope.modal.gridOptions.api.getFilterModel();
    loadNodetypeNodes({
      maxResults: $scope.modal.maxResults,
      searchCriterias: filterModel,
    });
  }

  $scope.modal.clearFilters = () => {
    $scope.modal.gridOptions.api.setFilterModel(null);
  }

  $scope.getMaxResults = () => {
    const maxResults = Number.parseInt(localStorage['relModal_maxResults'], 10);
    if (Number.isNaN(maxResults)) {
      localStorage['relModal_maxResults'] = 50;
      return 100;
    }
    return maxResults;
  };


  $scope.modal.maxResults = $scope.getMaxResults();

  $scope.modal.gridOptions = {
    components: {
      datePicker: agRenderMachine.getDatePicker(),
      booleanEditor: agRenderMachine.getBooleanEditor(),
    },
    columnDefs: null,
    rowData: [],
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true,
    },
    floatingFilter: true, // turn on floating filters
    rowSelection: 'multiple',
    onRowSelected: (row) => {
      $scope.rowSelected = false
      $scope.$apply()
    },
    onRowDoubleClicked: (row) => $scope.addRelationship(row.node.data, 'dlbclick'),
    onFilterChanged: () => $scope.modal.executeFilter(),
    angularCompileRows: true,
  }


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

  // receives the signal from RootScope to open the modal.
  $rootScope.$on('openAttachNodeModal', (e, currentNodeId, nodetype, relationship, node, tab, action) => {
    if ($scope.node._id !== currentNodeId) {
      return;
    }
    $scope.modal.node = node;
    $scope.modal.relationship = relationship;
    $scope.modal.nodetype = nodetype;

    //  Get Column Defs
    if (!$scope.modal.nodetype.ui.gridColumns) {
      Notification.error({ title: 'Error', message: 'Column Definition not found' });
      return;
    }
    //  Translate Column Definitions and set them in grid
    $scope.modal.gridOptions.columnDefs = agRenderMachine.getColumnDefs($scope.modal.nodetype).map((item) => {
      item.editable = false;
      return item;
    });
    $scope.modal.gridOptions.api.setColumnDefs($scope.modal.gridOptions.columnDefs);

    //  Reset Filters
    // $scope.modal.gridOptions.api.setFilterModel(null);

    //  Open Modal
    $(`.${tab}  #${$scope.modal.name}`).modal('show');

    //  Get Nodetype Nodes
    loadNodetypeNodes();
  });

  const loadNodetypeNodes = (search = {
    maxResults: $scope.modal.maxResults || 50,
  }) => {
    const nodetype = $scope.modal.nodetype;
    $scope.modal.gridOptions.api.setRowData([]);
    $scope.modal.gridOptions.api.showLoadingOverlay();
    nodesModel.getNodes(nodetype.name, search)
      .then((result) => {
        $scope.modal.gridOptions.data = result.map((item) => {
          item._typeObject = nodetype;
          return item;
        });
        $scope.modal.gridOptions.api.setRowData($scope.modal.gridOptions.data);

        //  Check if results are less that the maxResults requested
        if (result.length < $scope.modal.maxResults) {
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
      });
  };
  const addRelationship = (node) => new Promise((resolve) => {
    nodesModel.attachNode(
      $scope.modal.node,
      node,
      $scope.modal.relationship,
    ).then((result) => {
      if (result.error) {
        Notification.error({
          title: 'Create Rel Error',
          message: result.message,
        });
        resolve(false);
      } else {
        // notify success
        Notification.success({ title: 'Attached', message: `Node ${node._type} with id: ${node._id} attached` });
        resolve(true);
      }
    }, (error) => {
      Notification.error({ title: 'Create Rel Error', message: error.message });
    })

  });

  $scope.addMultiRelationship = () => {
    $(`#${$scope.modal.name}`).modal('hide');
    const promises = $scope.modal.gridOptions.api.getSelectedRows().map(node => addRelationship(node))
    Promise.all(promises).then((result) => {
      if (result[0]) {
        Notification.success('Attach Finished');
        $rootScope.$broadcast('refreshMultilevel', $scope.node._id);
      }
    });
  };
});