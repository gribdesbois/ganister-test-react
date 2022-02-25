angular.module("app.ganister.shared.modals.itemAccessModal", [
  'agGrid',
  'ui-notification',
  'app.ganister.tool.aggrid'
]).controller("itemAccessModalController", function ($scope, $rootScope, nodesModel, Notification) {
  $scope.rowSelected = true

  $scope.modal = {}
  $scope.modal.nodeId = $scope.node._id
  $scope.modal.sourceNode = $scope.node
  $scope.modal.targetNodeType = _.find($rootScope.datamodel.nodetypes, { "name": "user" })
  $scope.modal.modalLabel = "user"
  // $scope.modal.roles;
  $scope.loading = false;

  // the modal reference
  var relModal = $("#modal-itemAccess-" + $scope.modal.nodeId)

  // receives the signal from RootScope to open the modal.
  /**
   * Listen the the openitemAccessModal call
   * e : event
   * nodeid: contextual node
   * role : the access role of the selected user
   * 
   */
  $scope.$on('openitemAccessModal', async (e, nodeid, role, modalType, user = "", roles = []) => {
    if (($scope.modal.nodeId === nodeid)) {
      $scope.modal.user = user
      $scope.user = user
      $scope.modal.userRole = role
      $scope.modal.roles = roles
      $scope.modalType = {
        input: modalType,
        add: false,
        edit: false,
        remove: false,
        permissionSet: false
      }

      switch ($scope.modalType.input) {
        case "add":
          $scope.modalType.add = true
          break
        case "edit":
          $scope.modalType.edit = true
          break
        case "remove":
          $scope.modalType.remove = true
          break
        case "permissionSet":
          $scope.modalType.permissionSet = true
          break
      }
      // load table content
      await $scope.loadModalTable();
      // open the modal using jquery
      $("#modal-itemAccess-" + nodeid).modal()
    }
  });

  $scope.selectingUser = true;
  $scope.loadModalTable = async () => {
    const users = await nodesModel.getNodes('user');
    if (!users) return;

    $scope.users = users;
    $scope.groups = [];
    nodesModel.getGroups()
      .then(function (groups) {
        for (group of groups) {
          if (group.groupType == 'team') {
            $scope.groups.push({
              _labelRef: group.title,
              _type: "group",
              _id: group._id
            });
          }
        }
      });

  };

  $scope.addAccessRole = async () => {
    try {
      if ((!$scope.modal.user && $scope.selectingUser) || (!$scope.modal.group && !$scope.selectingUser) || !$scope.modal.userRole) {
        console.error('User/Group or Role not selected');
        return;
      }

      $scope.loading = true;
      const source = {
        _type: $scope.selectingUser ? 'user' : 'Group',
        _id: $scope.selectingUser ? $scope.modal.user._id : $scope.modal.group._id,
      };
      const properties = { role: $scope.modal.userRole };

      const params = {
        _type: 'accessRole',
        properties,
        source,
        target: $scope.node,
      };
      const relationship = await nodesModel.addRelationship(params);
      $scope.loading = false;
      if (!relationship) return;

      Notification.success({ message: 'Access created.' });
      $scope.node.accessRoles.push(relationship);
      $rootScope.$broadcast('rolesUpdate', { nodeId: $scope.node._id, relationships: $scope.node.accessRoles });
    } catch (error) {
      console.error(error);
    }
    $("#modal-itemAccess-" + $scope.modal.nodeId).modal('hide');
  };

  $scope.editAccessRole = async () => {
    try {
      $scope.loading = true;
      const accessRole = $scope.node.accessRoles.find((a) => {
        return a.source._id === $scope.modal.user._id;
      });
      const properties = { role: $scope.modal.userRole };
      const relationshipParams = {
        ...accessRole,
        properties,
        target: $scope.node,
      };
      const relationship = await nodesModel.updateRelationship(relationshipParams);
      $scope.loading = false;
      if (!relationship) return;

      Notification.success({ message: 'Access updated.' });
      accessRole.properties = relationship.properties;
      $rootScope.$broadcast('rolesUpdate', { nodeId: $scope.node._id, relationships: $scope.node.accessRoles });
    } catch (error) {
      console.error(error);
    }
    $("#modal-itemAccess-" + $scope.modal.nodeId).modal('hide');
  };

  $scope.removeAccessRole = async () => {
    try {
      $scope.loading = true;
      const accessRole = $scope.node.accessRoles.find((a) => {
        return a.source._id === $scope.modal.user._id;
      });

      const result = await nodesModel.deleteRelationship(accessRole);
      $scope.loading = false;
      if (!result) return;

      Notification.success({ message: 'Access deleted.' });
      const index = $scope.node.accessRoles.findIndex((a) => {
        return a.source._id === $scope.modal.user._id;
      });
      $scope.node.accessRoles.splice(index, 1);
      $rootScope.$broadcast('rolesUpdate', { nodeId: $scope.node._id, relationships: $scope.node.accessRoles });
    } catch (error) {
      console.error(error);
    }
    $("#modal-itemAccess-" + $scope.modal.nodeId).modal('hide');
  };


  $scope.$watch('selectingUser', (newVal, oldVal) => {
    if (!newVal) {
      $scope.modal.userRole = 'manager';
    }
  });
})