angular.module('app.ganister.tabs.node.nodeFormTabs.externalAPIs.gitlab.listForRepo', [
  'app.ganister.externalAPIs.gitlab',
  'ui-notification',
]).controller('externalAPIsGitlabListForRepoController', ($scope, $rootScope, Notification, gitlabModel) => {

  const externalAPIsDM = _.get($scope.nodetype, 'externalAPIs', []);
  const externalAPIDM = externalAPIsDM.find((api) => api.name === $scope.rel.externalAPI);

  const formatIssues = (data) => {
    return data.map((item) => ({
      ...item,
      _labels: item.labels.map((label) => label.name).join(', '),
      _assignees: item.assignees.map((assignee) => assignee.login).join(', '),
    }));
  };

  $scope.fetchData = async () => {
    const { owner, repo } = externalAPIDM.mapping;
    if (!owner) return Notification.error({
      title: 'Cannot Fetch Issues',
      message: '"owner" property is not mapped',
    });
    if (!repo) return Notification.error({
      title: 'Cannot Fetch Issues',
      message: '"repo" property is not mapped',
    });
    $scope.gridOptions.api.showLoadingOverlay();
    const { data, error, message } = await gitlabModel.issues.listForRepo($scope.node.properties[owner], $scope.node.properties[repo]);
    if (error) return Notification.error(message);
    $scope.gridOptions.api.setRowData(formatIssues(data));
    $scope.$emit("objCountUpdate", $scope.rel.name, data.length);
  }

  $scope.gridOptions = {
    defaultColDef: {
      // allow every column to be aggregated
      enableValue: true,
      // allow every column to be grouped
      enableRowGroup: true,
      // allow every column to be pivoted
      enablePivot: true,
      resizable: true,
      sortable: true,
    },
    sideBar: true,
    groupDefaultExpanded: -1,
    columnDefs: [{
      headerName: "Id",
      field: "id",
    },{
      headerName: "Title",
      field: "title",
    },{
      headerName: "Latest Update",
      field: "updated_at",
    },{
      headerName: "Labels",
      field: "labels", 
      cellRenderer: params => {
        const labels = params.value.map((lab)=>{
          return `<span class='label' style='background-color:#${lab.color};' title='${lab.description}'>${lab.name}</span>`
        })
        return labels.join(' ');
      },
    },{
      headerName: "State",
      field: "state",
      cellRenderer: params => {
        return `<span class='label label-primary'>${params.value}</span>`;
      },
    },{
      headerName: "view on gitlab",
      field: "html_url",
      cellRenderer: params => {
        return `<a href="${params.value}" target="_blank">view on gitlab</a>`;
      },
    }],
    rowData: [],
    groupUseEntireRow: true,
    angularCompileRows: true,
    onGridReady: () => $scope.fetchData(),
  };

  $scope.$on('refreshTabContent', () => {
    $scope.fetchData();
  })
});