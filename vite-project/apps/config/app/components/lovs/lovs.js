angular.module('app.ganister.config.models.lovs', [
    'app.ganister.config.models'
])
    .controller('lovsController', function ($scope, Notification, datamodelModel, $location) {
        $location.search({page: 'lovs'});
        datamodelModel.getDatamodel()
            .catch(function (e) {
                console.error(e);
            })
            .then(function (result) {
                $scope.lovs = result.listOfValues;
                $scope.nodetypes = result.nodetypes;
            })

        $scope.readMode = true;

        $scope.selectLov = (lov) => {
            $scope.selectedLov = lov;
            $scope.readMode = true;
        }
        $scope.editLov = (lov,$event) => {
            $event.stopPropagation();
            $scope.selectedLov = lov;
            $scope.readMode = false;
        }
        $scope.addLovs = async () => {
            await Swal.fire({
                title: 'Type a List Name',
                input: 'text',
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value) {
                        return 'You need to write something'
                    } else {
                        datamodelModel.lovs.add(value)
                            .then((result) => {
                                $scope.lovs.push(result.newLovs);
                            })
                    }
                }
            });
        }

        /**
         * Save Lovs
         */
        $scope.saveLovs = (lov) => {
            $scope.saving = Notification.primary({
                message: '<i class="fas fa-spinner fa-spin"></i> Saving...',
                replaceMessage: true,
            });
            datamodelModel.lovs.update(lov).then(() => {
                $scope.saving.then(notification => notification.kill());
                Notification.success({
                    message: 'Saved',
                    delay: 500,
                });
            })
        }

        /**
         * move list value
         */
        $scope.move = (dir, pos) => {
            if (dir === 'up') {
                if (pos > 0) {
                    let elt = $scope.selectedLov.items.splice(pos, 1);
                    $scope.selectedLov.items.splice(pos - 1, 0, elt[0]);
                }
            } else {
                if (pos - 1 < $scope.selectedLov.items.length) {
                    let elt = $scope.selectedLov.items.splice(pos, 1);
                    $scope.selectedLov.items.splice(pos + 1, 0, elt[0]);
                }
            }
            $scope.saveLovs($scope.selectedLov);
        }

        /**
         * 
         */
        $scope.addValue = () => {
            $scope.selectedLov.items.push({
                value: '',
                label: '',
            })
        }

        $scope.deleteValue = (index) => {
            $scope.selectedLov.items.splice(index, 1);
            $scope.saveLovs($scope.selectedLov);
        }

        $scope.deleteLovs = (lov) => {
            const nodetypes = $scope.nodetypes.filter(nodetype => nodetype.properties.findIndex(prop => prop.listSource === lov.name) !== -1);
            if (nodetypes.length) {
                const nodetypeNames = nodetypes.map(n => n.name);
                Swal.fire({
                    title: 'Are you sure you want to remove this list?',
                    text: `This list is currently in use by the following nodetype/s: (${nodetypeNames.join(',')})`,
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, remove it'
                }).then((result) => {
                    if (result.value) {
                        deleteLov(lov);
                    }
                });
            } else {
                Swal.fire({
                    title: 'Are you sure you want to remove this list?',
                    text: ``,
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, remove it'
                }).then((result) => {
                    if (result.value) {
                        deleteLov(lov);
                    }
                });
            }
        }

        const deleteLov = (lov) => {
            $scope.deleting = Notification.primary(`<i class="fas fa-spinner fa-spin"></i> Deleting ${lov.name} lov...`);
            datamodelModel.lovs.remove(lov.id).then((result) => {
                $scope.deleting.then(notification => notification.kill());
                if (result.success) {
                    $scope.lovs = _.reject($scope.lovs, { "id": result.id });
                    $scope.selectedLov.items = [];
                }
            })
        }

    })