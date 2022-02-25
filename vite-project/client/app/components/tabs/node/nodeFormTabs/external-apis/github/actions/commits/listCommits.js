angular.module('app.ganister.tabs.node.nodeFormTabs.externalAPIs.github.listCommits', [
  'app.ganister.externalAPIs.github',
  'ui-notification',
]).controller('externalAPIsGithubListCommitsController', ($rootScope, $scope, Notification, githubModel) => {

  const externalAPIsDM = _.get($scope.nodetype, 'externalAPIs', []);
  const externalAPIDM = externalAPIsDM.find((api) => api.name === $scope.rel.externalAPI);

  $scope.fetchData = async () => {
    const { owner, repo } = externalAPIDM.mapping;
    if (!owner) return Notification.error({
      title: 'Cannot Fetch Commits',
      message: '"owner" property is not mapped',
    });
    if (!repo) return Notification.error({
      title: 'Cannot Fetch Commits',
      message: '"repo" property is not mapped',
    });
    $scope.gridOptions.api.showLoadingOverlay();
    const { data, error, message } = await githubModel.commits.listCommits($scope.node.properties[owner], $scope.node.properties[repo]);
    if (error) return Notification.error(message);
    $scope.gridOptions.api.setRowData([]);
    $scope.gridOptions.api.setRowData(data);
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
    columnDefs: [{
      headerName: "Commit Date",
      field: "commit.author.date",
    }, {
      headerName: "Author",
      field: "author.login",
      width: 80,
      cellRenderer: params => {
        return `<a href="${params.data.author.html_url}" target="_blank" title="${params.data.author.login}">
        <img width="50" src="${params.data.author.avatar_url}" /></a>`;
      }
    }, {
      headerName: "Message",
      field: "commit.message",
      width: 500,
    }, {
      headerName: "Sha",
      field: "sha",
      width: 200,
    }, {
      headerName: "Url",
      field: "url",
      cellRenderer: params => {
        return `<a href="${params.data.html_url}" target="_blank">view on github</a>`;
      }
    }],
    rowHeight: 50,
    rowData: [],
    angularCompileRows: true,
    onGridReady: () => $scope.fetchData(),
  };

  $scope.$on('refreshTabContent', () => {
    $scope.fetchData();
  })
});