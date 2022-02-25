/* global angular, $ */
angular.module('app.ganister.shared.modals.infoDataModal', [])
  .controller('infoDataModalController', ($scope, $rootScope, datamodelModel, plmModel, Notification) => {
    $scope.modal = {
      id: `${$scope.node._id}-${$scope.nodeVersion}`,
      label: 'Update Info Data',
      nodeId: $scope.node ? $scope.node._id : undefined,
      nodetype: $scope.node ? $scope.node._type : undefined,
      nodeVersion: $scope.node ? $scope.node._version : undefined,
      form: undefined,
      formDefinition: undefined,
      node: {},
    };

    $scope.saveInfoData = async () => {
      const result = await $scope.saveNode({ ...$scope.node, ...$scope.modal.node });
      $(`#modal-infoDataModal-${$scope.modal.id}`).modal('hide');
    }

    $scope.$on('openInfoDataModal', async (e, node) => {
      if (node._id === $scope.modal.nodeId && node._version === $scope.modal.nodeVersion) {
        //  Fetch Form if not already fetched
        if (!$scope.modal.form) {
          const infoDataForm = await datamodelModel.fetchInfoDataForm($scope.modal.nodetype);
          $scope.modal.formDefinition = _.cloneDeep(infoDataForm.form);
          infoDataForm.form.map((item) => $scope.translateItem(item, $scope.nodetype.name));
          $scope.modal.form = infoDataForm;
          $scope.modal.node = { ..._.pick(_.cloneDeep($scope.node), $scope.modal.form.properties) };
        }
        $(`#modal-infoDataModal-${$scope.modal.id}`).modal('show');
      }
    });

    const translateInfoDataForm = () => {
      if ($scope.modal.formDefinition) {
        const newForm = _.cloneDeep($scope.modal.formDefinition);
        newForm.map((item) => $scope.translateItem(item, $scope.modal.nodetype));
        $scope.modal.form.form = newForm;
      }
    }

    //  Update Forms on Language Change 
    $rootScope.$on('$translateChangeSuccess', translateInfoDataForm);
  });