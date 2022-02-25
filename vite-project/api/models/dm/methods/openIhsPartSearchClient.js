
module.exports = {
  id: 'method_d40c45a0-08bc-11eb-8fb9-d177697e0286',
  package: 'purchasing',
  name: 'openIhsPartSearchClient',
  serverOrClient: 'client',
  code: `return new Promise((resolve, reject) => {
  $scope.$emit('openIhsModal', $scope.node, resolve);
}).finally(() => $(\`#ihsModal-\${$scope.node._id}\`).modal('hide'));`,
  createdOn: 1602089266930,
  createdBy: {
    id: 'ea6b17e0-3b9e-11ea-b206-e7610aa23593',
    name: 'Yoann Maingon',
  },
  updatedOn: 1602090254436,
  updatedBy: {
    id: 'ea6b17e0-3b9e-11ea-b206-e7610aa23593',
    name: 'Yoann Maingon',
  },
}