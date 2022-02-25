angular.module("app.ganister.shared.modals.ihsModal", [
  'agGrid',
  'ui-notification',
  'app.ganister.tool.aggrid'
]).controller("ihsModalController", function ($scope, $rootScope, ihsModel, Notification, agRenderMachine) {
  $scope.modalId = `ihsModal-${$scope.node._id}`;
  $scope.cb;

  //  Initiate Grid
  $scope.gridOptions = {
    angularCompileRows: true,
    columnDefs: [{
      field: 'object-id',
      headerName: 'Object Id'
    }, {
      field: 'mfr-name',
      headerName: 'Mfr Name'
    }, {
      field: 'manufacturer-part-number',
      headerName: 'Mfr Part Number'
    }, {
      field: 'part-status',
      headerName: 'Part Status'
    }, {
      field: 'mfr-obj-id',
      headerName: 'Mfr Object Id'
    }, {
      field: 'part-type',
      headerName: 'Part Type',
      filter: false,
    }, {
      field: 'category',
      headerName: 'Category',
      filter: false,
    }, {
      field: 'life-cycle-stage',
      headerName: 'Lifecycle Stage',
      filter: false,
    }, {
      field: 'part-description',
      headerName: 'Part Description',
      filter: false,
    }, {
      field: 'life-cycle-stage',
      headerName: 'Lifecycle Stage',
      filter: false,
    }, {
      field: 'full-mfr-name',
      headerName: 'Full Mfr Name',
      filter: false,
    }, {
      field: 'life-cycle-stage',
      headerName: 'Lifecycle Stage',
      filter: false,
    }, {
      field: 'category-path',
      headerName: 'Category Path',
      filter: false,
    }, {
      field: 'caps_categoryid',
      headerName: 'Caps Category Id',
      filter: false,
    }, {
      field: 'caps_partid',
      headerName: 'Caps Part Id',
      filter: false,
    }],
    defaultColDef: {
      editable: false,
      filter: 'agTextColumnFilter',
      filterParams: { debounceMs: 2000 },
      resizable: true,
      sortable: true
    },
    floatingFilter: true,
    onFilterChanged: () => loadData($scope.gridOptions.api.getFilterModel()),
    onRowDoubleClicked: ({ data }) => $scope.cb({ data }), 
    onRowSelected: ({ data }) => $scope.row = data,
    rowData: [],
    rowSelection: 'single'
  };

  const loadData = async (filters) => {
    if (_.isEmpty(filters)) return;
    const formattedFilters = {};
    Object.keys(filters).map((f) => formattedFilters[f] = filters[f].filter);
    $scope.gridOptions.api.setRowData([]);
    $scope.gridOptions.api.showLoadingOverlay();
    console.log(formattedFilters);
    const { data, error, message} = await ihsModel.searchParts({...formattedFilters, fetchPartDetails: false});
    if (error) {
      $scope.gridOptions.api.setRowData([]);
      return Notification.error(message);
    }
    $scope.gridOptions.api.setRowData(data);
  };

  // Listener to open the relationship Modal
  $rootScope.$on('openIhsModal', (e, node, resolve) => {
    if (node._id !== $scope.node._id) return;
    $scope.cb = resolve;
    //  Reset Filters
    if ($scope.gridOptions.api) $scope.gridOptions.api.setFilterModel(null);
    $(`#${$scope.modalId}`).modal('show');
  })
})
