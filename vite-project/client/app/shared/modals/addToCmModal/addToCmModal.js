/* global angular, $ */
angular.module('app.ganister.shared.modals.addToCmModal', [])
  .controller('addToCmModalController', ($scope, $rootScope, nodesModel, plmModel, helperFunctions, Notification, $translate) => {
    const _version = $scope.node?.properties?._version;
    $scope.nodeVersion = _version ? _version.replace(/\./g, '') : '';
    $scope.modal = {};
    $scope.modal.id = $scope.node ? `${$scope.node._id}-${$scope.nodeVersion}` : 'mainNodeListing';
    $scope.modal.nodeId = $scope.node ? $scope.node._id : undefined;
    $scope.modal.nodeVersion = $scope.node ? $scope.node._version : undefined;

    // Handle the modal opening by querying the available change items
    $scope.$on('openAddToCmModal', async (e, modalId, changeElement, node) => {
      try {
        if (modalId !== $scope.modal.id) return;
        // define modal values
        if (node) $scope.node = node;
        $scope.modal.nodeId = $scope.node?._id;
        $scope.modal.nodeVersion = $scope.nodeVersion;
        $scope.modal.modalLabel = changeElement;

        $scope.changeElement = changeElement;
        $scope.selectedChangeElement = {};

        // load available changeElements
        let search;
        if (changeElement === 'eco') {
          $scope.modal.modalLabel = $translate.instant(`default.nodetype.${changeElement}`);
          const ecoDM = $rootScope.datamodel.nodetypes.find((n) => n.name === changeElement);
          const startStates = ecoDM.lifecycle.states.filter((s) => s.start).map((s) => s.name);
          search = {
            maxResults: 100,
            searchCriterias: {
              [`${ecoDM.name}._state`]: { filterType: 'set', values: startStates },
            }
          };
        }

        const nodes = await nodesModel.getNodes(changeElement, search);
        if (!nodes) return;

        nodes.forEach((node) => {
          const { _ref = '', name = '' } = node.properties;
          node.fullName = `${_ref} - ${name}`;
        });

        if (changeElement === 'eco') {
          $scope.ECOs = nodes;
        } else if (changeElement === 'pr') {
          $scope.PRs = nodes;
        }

        $(`#modal-addToCmModal-${$scope.modal.id}`).modal();
      } catch (error) {
        console.error(error);
      }
    });

    // Handle the action confirmation from the user
    $scope.addToChangeElement = async (changeElement, nodeID, nodeVersion, changeId) => {
      try {
        if (changeId === 'new') {
          switch (changeElement) {
            case 'eco':
              $(`#modal-addToCmModal-${$scope.modal.id}`).modal('hide');
              // create the ECO first
              const ecoDM = $rootScope.datamodel.nodetypes.find((n) => n.name === 'eco');
              const mandatoryFields = await helperFunctions.askMandatoryFields(ecoDM);
              if (mandatoryFields === false) {
                return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
              }
              const params = {
                _type: 'eco',
                properties: { ...mandatoryFields },
              };
              const node = await nodesModel.addNode(params);
              if (!node) return;

              await plmModel.addEcoControlledNode(nodeID, node._id);
              // close modal
              $(`#modal-addToCmModal-${$scope.modal.id}`).modal('hide');
              // open the ECO
              $rootScope.$broadcast('openNode', { _type: 'eco', _id: node._id });
              break;
            case 'pr':
              break;
            default:
              break;
          }
        } else {
          // process the ECO attachment
          switch (changeElement) {
            case 'eco':
              await plmModel.addEcoControlledNode(nodeID, changeId);
              // close modal
              $(`#modal-addToCmModal-${$scope.modal.id}`).modal('hide');
              // open the ECO
              $rootScope.$broadcast('openNode', { _type: 'eco', _id: changeId });
              break;
            case 'pr':
              break;
            default:
              break;
          }
        }
      } catch (error) {
        console.error(error);
      }
    };
  });