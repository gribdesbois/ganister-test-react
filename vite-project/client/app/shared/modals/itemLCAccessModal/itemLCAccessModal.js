angular.module("app.ganister.shared.modals.itemLCAccessModal", [
    'agGrid',
    'ui-notification',
    'app.ganister.tool.aggrid'
]).controller("itemLCAccessModalController", function ($scope, $rootScope, nodesModel, Notification, agRenderMachine) {
    $scope.rowSelected = true

    $scope.modal = {}
    $scope.modal.nodeId = $scope.node._id
    $scope.modal.sourceNode = $scope.node
    $scope.modal.targetNodeType = _.find($rootScope.datamodel.nodetypes, { "name": "user" })
    $scope.modal.modalLabel = "user"
    $scope.loading = false;

    // the modal reference
    var relModal = $("#modal-itemLCAccess-" + $scope.modal.nodeId)

    // receives the signal from RootScope to open the modal.
    $rootScope.$on('openLCitemAccessModal', async (e, nodeId, role, lifecycleRoleArray) => {
        if (($scope.modal.nodeId == nodeId)) {
            $scope.modal.lifecycleRoleArray = lifecycleRoleArray
            // set role 
            $scope.lifecycleRole = role
            // load table content
            await $scope.loadModalTable();
            // open the modal using jquery
            $("#modal-itemLCAccess-" + nodeId).modal()
        }
    });

    $scope.loadModalTable = async () => {
        const users = await nodesModel.getNodes('user');
        // nodesModel.getUsers();
        if (!users) return;
        $scope.users = users;
    };

    $scope.addLCAccessRole = async (userId, role) => {
        try {
            $scope.loading = true;

            let roleToUpdate = $scope.modal.lifecycleRoleArray.find((lifecycleRole) => {
                if (!lifecycleRole._id) return;
                return lifecycleRole.properties.role === role;
            });
            if (roleToUpdate) {
                const response = await nodesModel.deleteRelationship(roleToUpdate);
                if (!response) return;
            }

            const params = {
                _type: 'lifecycleRole',
                properties: { role },
                source: $scope.node,
                target: {
                    _type: 'user',
                    _id: userId,
                },
            };
            const relationship = await nodesModel.addRelationship(params);
            if (!relationship) return;

            $scope.loading = false;
            if (roleToUpdate) roleToUpdate = relationship;
            $rootScope.$broadcast("reloadLifecycle", { nodeId: $scope.node._id });
            Notification.success({ title: 'Role added', message: "Role assigned successfully" });
        } catch (error) {
            console.error(error);
        }
        $("#modal-itemLCAccess-" + $scope.modal.nodeId).modal('hide');
    };
})