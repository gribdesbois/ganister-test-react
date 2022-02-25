angular.module('app.ganister.tabs.node.nodeFormTabs.externalAPIs.ihs.searchTerm', [
  'app.ganister.externalAPIs.ihs',
  'ui-notification',
]).controller('externalAPIsIhsSearchTermController', ($rootScope, $scope, Notification, ihsModel) => {
  $scope.test = 'IHS Search Term Controller';

  const externalAPIsDM = _.get($scope.nodetype, 'externalAPIs', []);
  const externalAPIDM = externalAPIsDM.find((api) => api.name === $scope.rel.externalAPI);

  $scope.errors = [];

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

  $scope.alertsGridOptions = { ...defaultOptions };
  $scope.altGridOptions = { ...defaultOptions };
  $scope.altCombinedGridOptions = { ...defaultOptions };
  $scope.detailsGridOptions = { ...defaultOptions };
  $scope.docsGridOptions = { ...defaultOptions };
  $scope.hazmatGridOptions = { ...defaultOptions };
  $scope.latestDatasheetGridOptions = { ...defaultOptions };
  $scope.lifecycleGridOptions = { ...defaultOptions };
  $scope.nsnGridOptions = { ...defaultOptions };
  $scope.transfersGridOptions = { ...defaultOptions, onGridReady: () => $scope.fetchData() };

  $scope.viewPDF = (value) => {
    $('#fileViewerCADOptions').hide("slow");
    $("#fileViewer").css('width', 5 + ($(document).width() / 2.2));
    $("#fileViewerContent").css('width', ($("#fileViewer").width() - 22) + "px");
    $("#fileViewerItem").css('height', ($(document).height() - 60) + 'px');
    $("#fileViewerItem").html("<embed class='pdfEmbed' src='" + value + "' />");
    $("#fileViewer").show("slow");
  }

  $scope.fetchData = async (showNotification = false) => {
    $scope.errors = [];
    const { partNumber, manufacturer } = externalAPIDM.mapping;
    if (!partNumber) $scope.errors.push('Part Number mappping is missing from configuration');
    if (!manufacturer) $scope.errors.push('Manufacturer mappping is missing from configuration');
    if (!$scope.node.properties[partNumber]) $scope.errors.push(`At least one of this properties is required: ${partNumber} ${manufacturer}`);
    $scope.alertsGridOptions.api.setRowData([]);
    $scope.altGridOptions.api.setRowData([]);
    $scope.altCombinedGridOptions.api.setRowData([]);
    $scope.detailsGridOptions.api.setRowData([]);
    $scope.docsGridOptions.api.setRowData([]);
    $scope.hazmatGridOptions.api.setRowData([]);
    $scope.latestDatasheetGridOptions.api.setRowData([]);
    $scope.lifecycleGridOptions.api.setRowData([]);
    $scope.nsnGridOptions.api.setRowData([]);
    $scope.transfersGridOptions.api.setRowData([]);
    $scope.$emit("objCountUpdate", $scope.rel.name, undefined);
    if (!_.isEmpty($scope.errors)) {
      if (showNotification) return Notification.error($scope.errors.join(', '));
      return;
    }

    const partNumberVal = !_.isEmpty($scope.node.properties[partNumber]) ? $scope.node.properties[partNumber] : undefined;
    let manufacturerVal;
    if (!_.isEmpty($scope.node.properties[manufacturer])) {
      if (typeof($scope.node.properties[manufacturer]) === 'object') {
        manufacturerVal = $scope.node.properties[manufacturer].label;
      } else {
        manufacturerVal = $scope.node.properties[manufacturer];
      }
    }
    const { data, error, message } = await ihsModel.searchParts({
      limit: 1,
      'part-number': partNumberVal,
      'mfr-name': manufacturerVal,
      fetchPartDetails: true,
    });

    if (error) {
      $scope.$emit("objCountUpdate", $scope.rel.name, 0);
      return Notification.error(message);
    }

    if (!_.isEmpty(data)) {
      //  Update ColumnDefs
      Object.keys(data[0]).filter((k) => k.startsWith('_')).map((k) => {
        const property = data[0][k];
        const keys = Object.keys(property[0]);
        let _docPropExists = keys.find((k) => k === '_doc');
        let columnDefs = Object.keys(property[0]).filter((key) => key !== '_doc').map((key) => {
          if (key === 'latest_doc_url' || key === 'doc_url') {
            return {
              headerName: _.capitalize(_.replace(key, '-',' ')),
              field: key,
              cellRenderer: ({ value }) => `<button class="btn btn-sm btn-primary" ng-click="viewPDF('${value}')">View File</button>`,
            };
          }
          return {
            headerName: _.capitalize(_.replace(key, '-',' ')),
            field: key,
          };
        });
        if (_docPropExists) {
          columnDefs = [
            ...columnDefs,
            ...[{
              headerName: 'Doc Type',
              field: '_doc.doc-type',
            }, {
              headerName: 'Doc Title',
              field: '_doc.doc_title',
            }, {
              headerName: 'Doc URL',
              field: '_doc.doc_url',
              cellRenderer: ({ value }) => `<button class="btn btn-sm btn-primary" ng-click="viewPDF('${value}')">View File</button>`,
            }, {
              headerName: 'Pub Date',
              field: '_doc.pub_date',
            }]
          ]
        }
        switch (k) {
          case '_alerts':
            $scope.alertsGridOptions.api.setColumnDefs(columnDefs);
            $scope.alertsGridOptions.api.setRowData(data[0]._alerts);
            break;
          case '_alt':
            $scope.altGridOptions.api.setColumnDefs(columnDefs);
            $scope.altGridOptions.api.setRowData(data[0]._alt);
            break;
          case '_altCombined':
            $scope.altCombinedGridOptions.api.setColumnDefs(columnDefs);
            $scope.altCombinedGridOptions.api.setRowData(data[0]._altCombined);
            break;
          case '_details':
            $scope.detailsGridOptions.api.setColumnDefs(columnDefs);
            $scope.detailsGridOptions.api.setRowData(data[0]._details);
            break;
          case '_docs':
            $scope.docsGridOptions.api.setColumnDefs(columnDefs);
            $scope.docsGridOptions.api.setRowData(data[0]._docs);
            break;
          case '_hazmat':
            $scope.hazmatGridOptions.api.setColumnDefs(columnDefs);
            $scope.hazmatGridOptions.api.setRowData(data[0]._hazmat);
            break;
          case '_latestDatasheet':
            $scope.latestDatasheetGridOptions.api.setColumnDefs(columnDefs);
            $scope.latestDatasheetGridOptions.api.setRowData(data[0]._latestDatasheet);
            break;
          case '_lifecycle':
            $scope.lifecycleGridOptions.api.setColumnDefs(columnDefs);
            $scope.lifecycleGridOptions.api.setRowData(data[0]._lifecycle);
            break;
          case '_nsn':
            $scope.nsnGridOptions.api.setColumnDefs(columnDefs);
            $scope.nsnGridOptions.api.setRowData(data[0]._nsn);
            break;
          case '_transfers':
            $scope.transfersGridOptions.api.setColumnDefs(columnDefs);
            $scope.transfersGridOptions.api.setRowData(data[0]._transfers);
            break;
        }
      });
    }
    $scope.$emit("objCountUpdate", $scope.rel.name, data.length);
  };

  $scope.$on('refreshTabContent', () => {
    $scope.fetchData();
  })
});