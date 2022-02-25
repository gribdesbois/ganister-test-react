
module.exports = {
  id: 'method_45c97b20-08bf-11eb-921f-313a8e1d0aae',
  package: 'core',
  name: 'openZ2dataPartSearchClient',
  serverOrClient: 'client',
  code: `const z2DataModal = new Promise((resolve, reject) => {
  $scope.$emit('openZ2dataModal', $scope.node, (data)=>{
    $(\`#z2dataModal-\${$scope.node._id}\`).modal('hide');
    resolve(data);
  });
});
const result = await z2DataModal;
Object.assign(data,result.data);
return;`,
  createdOn: 1602090316748,
  createdBy: {
    id: 'ea6b17e0-3b9e-11ea-b206-e7610aa23593',
    name: 'Yoann Maingon',
  },
  updatedOn: 1634894985079,
  updatedBy: {
    id: '0700d950-654f-11eb-bcc0-c5cae311491a',
    name: 'undefined',
  },
}