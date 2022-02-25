angular.module("app.ganister.shared.modals.z2DataModal", [
  'agGrid',
  'ui-notification',
  'app.ganister.tool.aggrid'
]).controller("z2DataModalController", function ($scope, $rootScope, z2DataModel, Notification, agRenderMachine) {
  $scope.modalId = `z2DataModal-${$scope.node._id}`;
  $scope.cb;

  //  Initiate Grid
  $scope.gridOptions = {
    angularCompileRows: true,
    columnDefs: [
      {
        field: 'partID',
        name: 'Z2data Part ID'
      }, {
        field: 'partLifecycle',
        name: 'Lifecycle State'
      }, {
        field: 'partNumber',
        filter: 'agTextColumnFilter',
        name: 'Manufacturer Part Number'
      }, {
        field: 'companyName',
        name: 'Company'
      }, {
        field: 'familyName',
        name: 'Family'
      }, {
        field: 'rohs',
        name: 'ROHS'
      }, {
        field: 'productName',
        name: 'Name'
      }, {
        field: 'partDescription',
        name: 'Description'
      },
    ],
    defaultColDef: {
      editable: false,
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
    const { data, error, message } = await z2DataModel.searchParts({ ...formattedFilters, fetchPartDetails: false });
    if (error) {
      $scope.gridOptions.api.setRowData([]);
      return Notification.error(message);
    }
    $scope.gridOptions.api.setRowData(data);
  };

  // Listener to open the relationship Modal
  $rootScope.$on('openZ2dataModal', (e, node, resolve) => {
    if (node._id !== $scope.node._id) return;
    $scope.cb = resolve;
    //  Reset Filters
    if ($scope.gridOptions.api) $scope.gridOptions.api.setFilterModel(null);
    $(`#${$scope.modalId}`).modal('show');
  })
})