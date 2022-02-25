agGrid.initialiseAgGridWithAngular1(angular);
angular.module("app.ganister.shared.modals.nodePropModal", [
	'agGrid',
	'ui-notification',
	'app.ganister.tool.aggrid',
	'ngFileUpload',
]).controller("nodePropModalController", function ($scope, $rootScope, nodesModel, Notification, datamodelModel, Upload, helperFunctions, agRenderMachine) {

	// FUNCTIONS
	// receives the signal from RootScope to open the modal.
	$scope.select = async () => {
		const selectedRows = $scope.gridOptions.api.getSelectedRows();
		if (!selectedRows.length) {
			return Notification.error("Please select a node first!");
		}
		const row = selectedRows[0];
		$scope.targetNode = { ...row };
		$scope.loading = true;

		try {

			// if rel exists delete it
			const nodePropValue = $scope.node.properties[$scope.propertyName];
			if (nodePropValue && nodePropValue.relationshipId) {
				const existingRel = {
					_type: nodePropValue.relationshipType,
					_id: nodePropValue.relationshipId,
					source: $scope.node,
				}
				const deletion = await nodesModel.deleteRelationship(existingRel);
				if (!deletion) return;
			}

			// create new rel
			const result = await nodesModel.attachNode($scope.node, $scope.targetNode, $scope.relationship);
			if (!result) return;

			//  Update node in scope
			const targetNode = {
				_id: result.target._id,
				_type: result.target._type,
				properties: result.target.properties,
				relationshipId: result._id,
				relationshipType: result._type,
			}
			$scope.node.properties[$scope.propertyName] = targetNode;

			Notification.success("Node Property Updated");
			$("#nodePropmodal-" + $scope.node._type + "-" + $scope.node._id).modal('hide');
			// clear filters
			$scope.clearFilters();
			//  Ask to send an email notification if _type is a user and not the current logged in!
			if (row._type === 'user' && row._id !== $rootScope.appContext.user._id) {
				Swal.fire({
					title: 'Do you want to send an email notification to the user?',
					type: 'warning',
					showCancelButton: true,
					confirmButtonText: 'Yes',
					cancelButtonText: 'No',
				}).then((result) => {
					if (result.value) {
						const prop = $scope.$parent.nodetype.properties.find(prop => prop.name === $scope.propName);
						nodesModel.notifyIdentityChange(result._type, result._id, prop.relationship).then((result) => {
							if (result) {
								Notification.success('User Notified');
							} else {
								Notification.success('Error: User Not Notified');
							}
						})
					}
				});
			}
		} catch (err) {
			console.error("$scope.select -> err", err)
			Notification.error(err.message);
		} finally {
			$scope.loading = false;
		}
	}

	$scope.createNew = async (nodetype) => {
		const data = {
			_type: nodetype.name,
			properties: {},
		};

		await helperFunctions.runTriggeredMethods('beforeCreate', data, $scope);

		const mandatoryFields = await helperFunctions.askMandatoryFields(nodetype, data.properties);
		if (!mandatoryFields) {
			return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
		}

		data.properties = { ...data.properties, ...mandatoryFields };
		const node = await nodesModel.addNode(data);
		if (!node) return;

		//just for ag-grid, will be removed later
		node.properties._typeObject = nodetype;

		await helperFunctions.runTriggeredMethods('afterCreate', node, $scope);


		// Detach if prop already has a node
		await $scope.detachActualRel();
		// attach new
		await $scope.attachNewRel(node);

		$scope.openNode(node);
	};

	$scope.unselect = async () => {
		if ($scope.node.properties[$scope.propertyName]) {
			$scope.loading = true;
			const relationshipId = $scope.node.properties[$scope.propertyName].relationshipId;
			try {
				const result = await nodesModel.deleteRelationshipById($scope.node, $scope.relationship.name, relationshipId);
				if (result && !result.error) {
					//  Update node in scope
					$scope.node.properties[$scope.propertyName] = {}
					Notification.success("Node Updated");
					$("#nodePropmodal-" + $scope.node._type + "-" + $scope.node._id).modal('hide');
				} else {
					const translatedResult = helperFunctions.translateFields($scope.nodetype, result);
					Notification.error({
						title: translatedResult.title || 'Node Property not updated',
						message: translatedResult.message || 'Error occured when trying to delete relationship'
					})
				}
			} finally {
				$scope.loading = false;
			}
		}
	}

	$scope.getMaxResults = () => {
		const maxResults = Number.parseInt(localStorage['relModal_maxResults'], 10);
		if (Number.isNaN(maxResults)) {
			localStorage['relModal_maxResults'] = 50;
			return 100;
		}
		return maxResults;
	};

	$scope.editMaxResult = () => {
		Swal.fire({
			title: 'Edit the max result count',
			type: 'info',
			input: 'number',
			inputValue: $scope.maxResults,
			showCancelButton: true,
			confirmButtonText: 'Yes',
			confirmButtonColor: '#f0ad4e',
			cancelButtonText: 'Cancel',
		}).then((swalResult) => {
			if (swalResult.value > 0) {
				$scope.maxResults = swalResult.value;
			} else if (swalResult.value < 1) {
				$scope.maxResults = 1;
				Notification.warning('Minimum result size must be 1');
			}
			localStorage['relModal_maxResults'] = $scope.maxResults;
			$scope.$apply();
			$scope.executeFilter();
		});
	};

	//Reload Grid with filters
	$scope.executeFilter = () => {
		const filters = $scope.gridOptions.api.getFilterModel();
		$scope.loadNodetypeNodes($scope.maxResults, filters);
	}
	//  Clear Grid Filters
	$scope.clearFilters = () => {
		$scope.gridOptions.api.setFilterModel(null);
	}

	$scope.loadNodetypeNodes = async (maxResults, searchCriterias = {}) => {
		try {
			if (!maxResults) maxResults = $scope.maxResults;

			const nodes = await nodesModel.getNodes($scope.targetNodetype.name, { maxResults, searchCriterias });
			nodesModel.getNodetypeCreationRight($scope.targetNodetype.name)
			.then((result) => {
				if (result.canCreate) {
					$scope.nodeTypeCreationAllowed = true;
				}
			})
			if (!nodes) return;

			$scope.nodes = nodes;
			$scope.gridOptions.api.setRowData($scope.nodes);

			console.info("Update RowData");
			$scope.waitingResults = false;
		} catch (err) {
			console.error(err);
		}
	};

	// INIT
	$scope.loading = false;
	$scope.propertyName = "";
	$scope.maxResults = $scope.getMaxResults();
	$scope.waitingResults = true;

	$scope.files = [];
	$scope.fileUpload = {};
	$scope.$watch("fileUpload", (file, oldValue) => {
		if (file === oldValue || file === null) return;
		$scope.runFileUploadCreation(file);
	});


	$scope.gridOptions = {
		components: {
			datePicker: agRenderMachine.getDatePicker(),
			booleanEditor: agRenderMachine.getBooleanEditor(),
		},
		columnDefs: null,
		rowData: [],
		defaultColDef: {
			editable: false,
			resizable: true,
			sortable: true,
			filter: true,
		},
		floatingFilter: true,
		angularCompileRows: true,
		rowSelection: 'single',
		onRowDoubleClicked: $scope.select,
		onFilterChanged: () => $scope.executeFilter(),
	}

	$scope.nodeTypeCreationAllowed = false;



	$scope.attachNewRel = async (targetNode) => {

		try {

			// if rel exists delete it
			const nodePropValue = $scope.node.properties[$scope.propertyName];
			if (nodePropValue && nodePropValue.relationshipId) {
				const existingRel = {
					_type: nodePropValue.relationshipType,
					_id: nodePropValue.relationshipId,
					source: $scope.node,
				}
				const deletion = await nodesModel.deleteRelationship(existingRel);
				if (!deletion) return;
			}

			// create new rel
			const result = await nodesModel.attachNode($scope.node, targetNode, $scope.relationship);
			if (!result) return;

			//  Update node in scope

			nodePropValue.properties = result.target.properties;
			nodePropValue._id = result.target._id;
			nodePropValue._type = result.target._type;
			nodePropValue.relationshipId = result._id;
			nodePropValue.relationshipType = result._type;


			Notification.success("Node Property Updated");
			$("#nodePropmodal-" + $scope.node._type + "-" + $scope.node._id).modal('hide');
			// clear filters
			$scope.clearFilters();
			//  Ask to send an email notification if _type is a user and not the current logged in!
			if (targetNode._type === 'user' && targetNode._id !== $rootScope.appContext.user._id) {
				Swal.fire({
					title: 'Do you want to send an email notification to the user?',
					type: 'warning',
					showCancelButton: true,
					confirmButtonText: 'Yes',
					cancelButtonText: 'No',
				}).then((result) => {
					if (result.value) {
						const prop = $scope.$parent.nodetype.properties.find(prop => prop.name === $scope.propName);
						nodesModel.notifyIdentityChange(result._type, result._id, prop.relationship).then((result) => {
							if (result) {
								Notification.success('User Notified');
							} else {
								Notification.success('Error: User Not Notified');
							}
						})
					}
				});
			}
		} catch (err) {
			console.error("$scope.select -> err", err)
			Notification.error(err.message);
		} finally {
			$scope.loading = false;
		}
	}

	/**
	 * getFileLogo
	 */
	function getFileLogo(mimetype) {
		// load file fileLogo
		let fileLogo = _.find($rootScope.fileMimetypeImages, { 'mimetype': mimetype })
		if (!fileLogo) {
			fileLogo = { img: "any128.png" };
			console.warn("no file logo set for mimetype: " + mimetype)
		}
		return fileLogo.img;
	}

	/**
	 * humanFileSize
	 * transforms a byte size of file into human readable format
	 * @param {*} bytes 
	 * @param {*} si 
	 */
	function humanFileSize(bytes, si) {
		const thresh = si ? 1000 : 1024;
		if (Math.abs(bytes) < thresh) {
			return `${bytes} B`;
		}
		const units = si
			? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
			: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
		let u = -1;
		do {
			bytes /= thresh;
			++u;
		} while (Math.abs(bytes) >= thresh && u < units.length - 1);
		return `${bytes.toFixed(1)} ${units[u]}`;
	}

	function timeout(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * runFileUpload
	 * Runs the file upload process
	 * @param {file} file 
	 */
	$scope.runFileUploadCreation = async (file) => {
		try {
			const loadingNotification = Notification.primary({
				title: `Uploading ${file.name}`,
				message: `<div class="messageDiv"><div class="lds-ellipsis fileUpload"><div></div><div></div><div></div><div></div></div></div>`,
			});
			const response = await Upload.upload({ url: 'api/v0/uploads', data: { file } });
			const { data } = response;

			if (data && data.url) {
				const file = {
					_type: 'file',
					properties: { ...data },
				};
				await helperFunctions.runTriggeredMethods('beforeCreate', file, $scope);


				const node = await nodesModel.addNode(file, false);
				if (!node) return;
				await helperFunctions.runTriggeredMethods('afterCreate', node, $scope);

				node.properties.filesize = humanFileSize(node.properties.filesize);
				node.properties.fileLogo = getFileLogo(node.properties.mimetype);
				node.properties.formatedCreatedOn = moment(parseInt(node.properties._createdOn)).format('DD/MM/YYYY HH:mm');

				loadingNotification.then((notification) => notification.kill());


				if (node.properties?.generated?.source === 'cadExchanger') {
					const processingNotification = Notification.primary({
						title: `CAD Exchanger: Processing file...`,
						message: `<div class="messageDiv"><div class="lds-ellipsis fileUpload"><div></div><div></div><div></div><div></div></div></div>`,
					});
					let stopped = false;
					let counter = 0;
					let ms = 10000;
					// infinite loop
					while (!stopped) {
						counter++;
						const res = await plmModel.getRevisionCADDocument(node.properties?.generated?.data?.activeRevision);
						if (res.status === 'ready') {
							stopped = true;
							processingNotification.then((notification) => notification.kill());
							Notification.success({ title: 'Cad Exchanger file is ready' });
						}
						if (counter > 7) {
							processingNotification.then((notification) => notification.kill());
							Notification.warning({
								title: 'Cad Exchanger processing...',
								message: `Processing takes too long! Try opening a file in a while...`,
							});
							stopped = true;
						}
						if (counter > 5) {
							ms = 60000;
						}
						await timeout(ms);
					}
				}
				await $scope.attachNewRel(node);
			} else if (data) {
				const { title, message } = data;
				Notification.error({ title: title || 'Upload Failed', message });
				loadingNotification.then((notification) => notification.kill());
			}
		} catch (error) {
			console.error("error", error);

		}
	};

	// WATCHERS

	$scope.$on('openNodePropModal', async (e, node, nodetype, propertyId) => {
		if ($scope.gridOptions.api) {
			$scope.gridOptions.api.setRowData([]);
		}
		if (node._id == $scope.node._id) {
			$scope.node = node;
			$scope.targetNodetype = datamodelModel.getNodetype(nodetype);
			$scope.nodetype = datamodelModel.getNodetype(node._type);
			$scope.propertyDM = $scope.nodetype.properties.find((property) => {
				return property.id === propertyId;
			});
			$scope.propertyName = $scope.propertyDM.name;
			$scope.relationship = $rootScope.datamodel.nodetypes.find((nodetype) => {
				return nodetype.id === $scope.propertyDM.relationship;
			})
			$scope.nodes = [];
			$scope.gridOptions.api.showLoadingOverlay();
			try {
				const columnDefs = agRenderMachine.getColumnDefs($scope.targetNodetype);
				if (columnDefs) {
					// Make all cells not editable
					columnDefs.map(item => item.editable = false);
					$scope.gridOptions.api.setColumnDefs(columnDefs);
				} else {
					console.info("Column Definitions not exists");
				}
				$scope.loadNodetypeNodes();
			} catch (error) {
				console.error(error);
			}
			$("#nodePropmodal-" + $scope.node._type + "-" + $scope.node._id).modal();
		}

	});
})