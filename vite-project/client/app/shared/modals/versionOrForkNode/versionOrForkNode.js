/* global angular, $ */
angular.module('app.ganister.shared.modals.versionOrForkModal', [])
  .controller('versionOrForkNodeController', ($scope, $rootScope, nodesModel, plmModel, agRenderMachine, Notification) => {
    const _version = $scope.node?.properties?._version;
    $scope.nodeVersion = _version ? _version.replace(/\./g, '') : '';
    $scope.modal = {};
    $scope.modal.modalLabel = 'Revision Impact Analysis';
    $scope.modal.id = $scope.node ? `${$scope.node._id}-${$scope.nodeVersion}` : 'mainNodeListing';
    $scope.modal.nodeId = $scope.node ? $scope.node._id : undefined;
    $scope.modal.nodetype = $scope.node ? $scope.node._type : undefined;
    $scope.modal.nodeVersion = $scope.node ? $scope.node._version : undefined;
    $scope.modal.newReference = undefined;
    $scope.versioningRuleOptions = [];

    //  Initiate Grid
    $scope.modal.gridOptions = {
      components: {
        datePicker: agRenderMachine.getDatePicker(),
        booleanEditor: agRenderMachine.getBooleanEditor(),
      },
      columnDefs: [
        {
          field: '_id',
          headerName: 'id',
          hide: true,
        },
        {
          field: '_type',
          headerName: 'Nodetype',
          hide: false,
        },
        {
          field: '_labelRef',
          headerName: 'Label',
          hide: false,
        },
        {
          field: '_version',
          headerName: 'Version',
          width: 110,
          cellStyle: {
            "text-align": "center"
          },
          cellRenderer: agRenderMachine.versionRenderer,
        },
        {
          field: '_relType',
          headerName: 'Relationship',
          hide: false,
        },
      ],
      rowData: [],
      defaultColDef: {
        sortable: true,
        editable: false,
        resizable: true,
        filter: true, // set filtering on for all cols
      },
      angularCompileRows: true,
      onRowDoubleClicked: (params) => $rootScope.$broadcast('openNode', {
        _id: params.data._id,
        _type: params.data._type,
      }),
    };

    $scope.runAction = async () => {
      $scope.actionBtnDisabled = true;
      const { action } = $scope.modal;
      if (!action) {
        $scope.actionBtnDisabled = false;
        return Swal.fire({ type: 'info', title: 'Action needed', text: 'Please select an action first' });
      }
      const fork = $scope.versioningRuleOptions.find((option) => option.value === 'fork');
      const supFork = $scope.versioningRuleOptions.find((option) => option.value === 'supFork');

      if ((action === fork.name || action === supFork.name) && (!$scope.modal.newReference || $scope.modal.newReference === $scope.node._ref)) {
        $scope.actionBtnDisabled = false;
        return Swal.fire({ type: 'warning', title: 'New Reference needed', text: 'Please enter a new reference for fork' });
      }
      try {
        const result = await plmModel.processECONode($scope.modal.nodetype, $scope.modal.nodeId, action, $scope.modal.newReference, false);
        if (result && result.error) {
          $scope.actionBtnDisabled = false;
          return Notification.error({ title: "Error running node action", ...result });
        }

        $scope.actionBtnDisabled = false;
        $(`#modal-versionOrForkNode-${$scope.modal.id}`).modal('hide');
        if (action === 'obsolete') {
          $rootScope.$broadcast("reloadNode", $scope.node);
        } else {
          if (result.properties) {
            $rootScope.$broadcast('openNode', {
              _id: result._id,
              _type: result._type,
              _version: result.properties._version,
            });
          } else {
            Notification.warning('No node returned');
          }
        }
      } catch (error) {
        $scope.actionBtnDisabled = false;
      }
    }

    $scope.$on('versionOrForkModal', async (e, modalId, nodetype, nodeId, nodeVersion) => {
      $scope.modal.newReference = undefined;
      $scope.modal.nodetype = nodetype;
      $scope.modal.nodeId = nodeId;
      $scope.modal.nodeVersion = nodeVersion;
      if (modalId === $scope.modal.id) {
        //  Update Versionning Rule Options
        const nodetypeDM = $rootScope.datamodel.nodetypes.find((n) => n.name === nodetype);
        const versioningRule = nodetypeDM.versioningRule;
        if (versioningRule) {
          const uxConfig = $rootScope.datamodel.uxConfig;
          $scope.versioningRuleOptions = uxConfig.versioningLabels.filter((label) => {
            const globalVersioningLabel = ['fork', 'supFork', 'obsolete'].includes(label.value);
            const nodetypeVersioningLabel = (Object.keys(versioningRule).includes(label.value) && versioningRule[label.value] !== "");
            return globalVersioningLabel || nodetypeVersioningLabel;
          });
        }
        $scope.modal.gridOptions.api.setRowData([]);
        $(`#modal-versionOrForkNode-${modalId}`).modal();
        $scope.modal.gridOptions.api.showLoadingOverlay();
        const nodes = await nodesModel.getNodeParents(nodetype, nodeId, nodeVersion);
        $scope.modal.gridOptions.api.setRowData(nodes);
      }
    });
  });
