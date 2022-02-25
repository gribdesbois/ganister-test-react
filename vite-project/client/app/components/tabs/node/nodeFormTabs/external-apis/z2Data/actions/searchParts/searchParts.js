angular.module('app.ganister.tabs.node.nodeFormTabs.externalAPIs.z2Data.searchTerm', [
  'app.ganister.externalAPIs.z2Data',
  'ui-notification',
]).controller('externalAPIsZ2DataSearchTermController', ($rootScope, $scope, Notification, z2DataModel) => {
  $scope.test = 'Z2 DATA Search Term Controller';

  const externalAPIsDM = _.get($scope.nodetype, 'externalAPIs', []);
  const externalAPIDM = externalAPIsDM.find((api) => api.name === $scope.rel.externalAPI);

  $scope.errors = [];

  $scope.appliedClass = (risk) => {
    switch (risk) {
      case 'Low Risk':
        return 'score-label low-risk';
      case 'Medium Risk':
        return 'score-label medium-risk';
      case 'High Risk':
        return 'score-label high-risk';
      case 'Strong':
        return 'score-label strong-risk';
      default:
        return 'score-label';
    }
  }

  $scope.data = {};

  const defaultOptions = {
    defaultColDef: {
      // allow every column to be aggregated
      enableValue: true,
      // allow every column to be grouped
      enableRowGroup: true,
      // allow every column to be pivoted
      enablePivot: true,
      resizable: true,
      sortable: true,
      cellStyle: { display: 'flex', alignItems: 'center' },
    },
    rowHeight: 40,
    sideBar: true,
    groupDefaultExpanded: -1,
    columnDefs: [],
    rowData: [],
    groupUseEntireRow: true,
    angularCompileRows: true,
  };

  $scope.pcnGridOptions = { ...defaultOptions, onGridReady: () => $scope.fetchData() };

  $scope.fetchData = async (showNotification = false) => {
    $scope.errors = [];
    const { partNumber } = externalAPIDM.mapping;
    if (!partNumber) $scope.errors.push('Part Number mappping is missing from configuration');
    
    $scope.pcnGridOptions.api.setRowData([]);
    $scope.$emit("objCountUpdate", $scope.rel.name, undefined);
    if (!_.isEmpty($scope.errors)) {
      if (showNotification) return Notification.error($scope.errors.join(', '));
      return;
    }

    if (!$scope.node.properties[partNumber]) {
      $scope.errors.push(`The following field is required: ${partNumber}`);
      $scope.$emit("objCountUpdate", $scope.rel.name, 0);
    } else {



      const { data, error, message } = await z2DataModel.getPartDetail({ partNumber: $scope.node.properties[partNumber] });
      if (error) {
        $scope.$emit("objCountUpdate", $scope.rel.name, 0);
        return Notification.error(message);
      }

      $scope.partScores = _.get(data, '0.partScores.0');

      //  Set Part Summary Columns and Data
      $scope.partSummaryData = {
        columns: Object.keys(data[0].partSummaryData).map((key) => ({
          headerName: _.capitalize(_.replace(key, '-', ' ')),
          field: key,
        })),
        data: _.get(data, '0.partSummaryData', {})
      };

      //  Set Part Summary Columns and Data
      $scope.parametricData = {
        columns: Object.keys(data[0].parametricData).map((key) => ({
          headerName: _.capitalize(_.replace(key, '-', ' ')),
          field: key,
        })),
        data: _.get(data, '0.parametricData', {})
      };

      if (_.get(data, '0.pcnData.0')) {
        let columnDefs = Object.keys(data[0].pcnData[0]).map((key) => ({
          headerName: _.capitalize(_.replace(key, '-', ' ')),
          field: key,
        }));
        const pcnSourceCol = columnDefs.find((c) => c.field === 'PCNSource');
        pcnSourceCol.cellRenderer = ({ value }) => `<a href="${value}" target="_blank">${value}</a>`,
          $scope.pcnGridOptions.api.setColumnDefs(columnDefs);
        $scope.pcnGridOptions.api.setRowData(data[0].pcnData);
      }

      $scope.$emit("objCountUpdate", $scope.rel.name, data.length);

      $scope.$on('refreshTabContent', () => {
        $scope.fetchData();
      })
    }

  };
});