angular.module("app.ganister.shared.modals.contextualAttachNodeModal", [
  'agGrid',
  'ui-notification',
  'app.ganister.tool.aggrid'
]).controller("contextualAttachNodeModalController", function ($scope, $rootScope, $translate, nodesModel, Notification, agRenderMachine, helperFunctions) {
  $scope.modal = {
    name: `modal-attachNode-${$scope.node._id}-${$scope.nodetype._type}`,
    node: $scope.node,
    maxResultsClass: {},
  };

  $scope.modal.executeFilter = () => {
    const filterModel = $scope.modal.gridOptions.api.getFilterModel();
    loadNodetypeNodes($scope.modal.nodetype, {
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
    onRowSelected: function (row) {
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

  //  Load Nodes using Grid Filters
  $scope.modal.executeFilter = () => {
    const filterModel = $scope.modal.gridOptions.api.getFilterModel();
    loadNodetypeNodes({
      maxResults: $scope.modal.maxResults,
      searchCriterias: filterModel,
    });
  }

  let thisTab;
  // receives the signal from RootScope to open the modal.
  $rootScope.$on('openContextualAttachNodeModal', (e, currentNodeId, nodetype, relationship, node, tab, reverse=false) => {
    $scope.reverse = reverse;
    thisTab = tab;
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

  $scope.addMultiRelationship = () => {
    for (target of $scope.modal.gridOptions.api.getSelectedRows()) {
      $scope.addRelationship(target);
    }
  }

  /**
   * 
   * @param {*} node 
   * @returns 
   */
  $scope.addRelationship = async (node) => {
    const params = {
      _type: $scope.modal.relationship.name,
      source: $scope.modal.node,
      target: node,
      properties: {},
    };
    if ($scope.reverse) {
      params.source = node;
      params.target = $scope.modal.node;
    }
    debugger;
    const relMandatoryFields = await helperFunctions.askMandatoryFields($scope.modal.relationship, params.properties);
    if (!relMandatoryFields) {
      return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
    }

    params.properties = { ...params.properties, ...relMandatoryFields };
    nodesModel.addRelationship(params)
      .then((result) => {
        if (result.error) {
          Notification.error({ title: 'Create Rel Error', message: result.message });
          return false;
        } else {
          // notify success

          const nodeRef = result.target.properties._ref;
          if ($scope.modal.node.orgHierarchy) {
            result._parentType = result.startnodetype;
            result._parentId = result.startnodeId;
            const relType = $rootScope.datamodel.nodetypes.find(nodetype => nodetype.linkName === result.linkName);
            result._reltype = relType.name;
            result._relid = result._id;
          };

          const restoredOrg = [...$scope.modal.node.orgHierarchy]
          restoredOrg.unshift($scope.node._id)
          
          const relationship = { ...result };
          relationship.properties[$scope.rel.customTreeGridView.localizer] = restoredOrg;

          nodesModel.updateRelationship(relationship)
            .then((result) => {
              // notify success
              Notification.success({ title: 'Node Attached', message: `Node Ref: ${nodeRef}` });
              $(`.${thisTab}  #${$scope.modal.name}`).modal('hide');
              $scope.refreshTable();
              return true;
            })
            .catch((err) => {
              console.error(err);
            });
        }
      })
      .catch((error) => {
        Notification.error({ title: 'Create Rel Error', message: error.message });
      })
  };
});