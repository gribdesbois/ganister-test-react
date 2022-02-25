/* globals swal */
angular.module('app.ganister.config.models.nodetypes.methods', [
])
    .controller('methodsController', function ($scope, datamodelModel, Notification) {


        // ██╗   ██╗ █████╗ ██████╗ ██╗ █████╗ ██████╗ ██╗     ███████╗███████╗
        // ██║   ██║██╔══██╗██╔══██╗██║██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝
        // ██║   ██║███████║██████╔╝██║███████║██████╔╝██║     █████╗  ███████╗
        // ╚██╗ ██╔╝██╔══██║██╔══██╗██║██╔══██║██╔══██╗██║     ██╔══╝  ╚════██║
        //  ╚████╔╝ ██║  ██║██║  ██║██║██║  ██║██████╔╝███████╗███████╗███████║
        //   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚══════╝



        // ███████╗ ██████╗ ██████╗ ██████╗ ███████╗   ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
        // ██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝   ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
        // ███████╗██║     ██║   ██║██████╔╝█████╗     █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
        // ╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝     ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
        // ███████║╚██████╗╚██████╔╝██║     ███████╗██╗██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
        // ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝



        $scope.addNodetypeMethod = () => {
            const methodsOptions = {};
            $scope.datamodel.methods.forEach((method) => {
                methodsOptions[method.name] = method.name;
            })

            Swal.fire({
                title: 'Select Method',
                input: 'select',
                inputOptions: methodsOptions,
                inputPlaceholder: 'Select a Method',
                showCancelButton: true,
                inputValidator: (value) => {
                    if (value && value != "") {
                        const newNodetypeMethod = {
                            trigger: "",
                            description: "",
                            name: value,
                        };
                        datamodelModel.nodetypes.methods.add(
                            $scope.nodetype.name,
                            newNodetypeMethod,
                        ).catch(function (err) {
                            Notification.error({ title: 'Add Method failed', message: err.message });
                            console.log(err);
                            // alert message and restore values
                        }).then(function (result) {
                            Notification.success('Method added');
                            if (!$scope.nodetype.methods) $scope.nodetype.methods = [];
                            $scope.nodetype.methods.push(result.newItem);
                            datamodelModel.grid.loadData($scope.methodsGridOptions.api, $scope.nodetype.methods);
                        });
                    }
                }
            })
        }

        $scope.removeNodetypeMethod = () => {
            const selectedRows = $scope.methodsGridOptions.api.getSelectedRows();

            if (selectedRows.length > 0) {
                // remove selected items from $scope properties
                for (method of selectedRows) {
                    datamodelModel.nodetypes.methods.remove(
                        $scope.nodetype.name,
                        method.id,
                    ).catch(function (err) {
                        Notification.error({ title: 'Method delete failed', message: err.message });
                        console.log(err);
                        // alert message and restore values
                    }).then(function (result) {
                        Notification.success('Method deleted');
                        $scope.nodetype.methods = _.reject($scope.nodetype.methods, { "id": result.id })
                        datamodelModel.grid.loadData($scope.methodsGridOptions.api, $scope.nodetype.methods)
                    })
                }
            }
        }


        // ███████╗ ██████╗ ██████╗ ██████╗ ███████╗   ██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗
        // ██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝   ██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║
        // ███████╗██║     ██║   ██║██████╔╝█████╗     ██║ █╗ ██║███████║   ██║   ██║     ███████║
        // ╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝     ██║███╗██║██╔══██║   ██║   ██║     ██╔══██║
        // ███████║╚██████╗╚██████╔╝██║     ███████╗██╗╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║
        // ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝


        $scope.$watch('datamodel.openItem.name', function () {

            // retrieve opened nodetype
            $scope.nodetype = $scope.datamodel.openItem

            // update methods
            datamodelModel.grid.loadData($scope.methodsGridOptions.api, $scope.nodetype.methods)
        });


        // ██╗███╗   ██╗██╗████████╗
        // ██║████╗  ██║██║╚══██╔══╝
        // ██║██╔██╗ ██║██║   ██║   
        // ██║██║╚██╗██║██║   ██║   
        // ██║██║ ╚████║██║   ██║   
        // ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   


        // retrieve opened nodetype
        $scope.nodetype = $scope.datamodel.openItem;

        // create list of available method names
        const methods = $scope.datamodel.methods.map((elt) => {
            return elt.name
        });

        // init actions grid
        $scope.methodsGridOptions = {
            defaultColDef: {
                resizable: true
            },
            columnDefs: [
                {
                    headerName: "Location",
                    field: "serverOrClient",
                    cellEditor: 'agSelectCellEditor',
                    width: 80,
                    cellEditorParams: {
                        values: ['server','client']
                    },
                    editable: true
                },
                {
                    headerName: "Trigger",
                    width: 170,
                    field: "trigger",
                    cellEditor: 'agSelectCellEditor',
                    cellEditorParams: (params) => {
                        const values = [
                            'afterGetAll',
                            'beforeGet',
                            'afterGet',
                            'beforeCreate',
                            'afterCreate',
                            'beforeUpdate',
                            'afterUpdate',
                            'beforeDelete',
                            'afterDelete',
                        ]
                        return { values };
                    },
                    editable: true
                },
                {
                    headerName: "Description",
                    width: 200,
                    field: "description",
                    editable: true
                },
                {
                    headerName: "Method",
                    width: 180,
                    field: "name",
                    cellEditor: 'agSelectCellEditor',
                    cellEditorParams: {
                        values: methods.sort()
                    },
                    editable: true
                },
                {
                    headerName: "Params",
                    width: 200,
                    field: "params",
                    editable: true,
                }
            ],
            rowSelection: "multiple",
            onGridReady: function (params) {
                $scope.nodetype = $scope.datamodel.openItem

                if ($scope.nodetype.methods) {
                    const methods = $scope.nodetype.methods.map((method) => {
                        const stringParams = JSON.stringify(method.params);
                        method.params = stringParams;
                        return method;
                    });
                    datamodelModel.grid.loadData($scope.methodsGridOptions.api, methods)
                }
            },
            onRowSelected: (params) => {
                // check if actual method has changes
                // ask for save confirmation
                // update actual method
                // open selected method

            },
            onCellValueChanged: (params) => {
                const methodId = params.data.id
                const field = params.colDef.field;
                const oldValue = params.oldValue;
                let newValue = params.newValue;
                if (params.oldValue != params.newValue) {
                    if (field === 'params') {
                        newValue = JSON.parse(params.newValue);
                    }
                    datamodelModel.nodetypes.methods.update(
                        $scope.nodetype.name,
                        methodId,
                        params.colDef.field,
                        oldValue,
                        newValue
                    ).then((result) => {
                        Notification.success('Method Updated');
                    }).catch((err) => Notification.error({ title: 'Method not Updated', message: err.message }));
                }
            }
        }


    })
