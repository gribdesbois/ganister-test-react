/* globals agGrid, angular, _ */
agGrid.initialiseAgGridWithAngular1(angular);
angular.module('app.ganister.tabs.mainNodeListing', [
  'agGrid',
  'app.ganister.tool.aggrid',
  'app.ganister.tool.helperFunctions',
  'app.ganister.shared.modals.addToCmModal',
  'app.ganister.shared.modals.versionOrForkModal',
  'ui-notification',
  'ngFileUpload',
])
  .controller('nodetypelistController', ($scope, $window, $rootScope, $translate, nodesModel, plmModel, agRenderMachine, helperFunctions, Notification, clientMethodsService, Upload) => {

    const getFilterModel = () => {
      const filterModel = $scope.context.mainGridOptions.api.getFilterModel();
      if (Object.keys(filterModel).length === 0 && filterModel.constructor === Object) {
        $scope.noFilter = true;
      }
      //  convert all date values to miliseconds
      Object.keys(filterModel).map((i) => {
        if (filterModel[i].operator) {
          Object.keys(filterModel[i]).filter(k => k !== 'operator').map(k => {
            if (filterModel[i][k].filterType === 'date') {
              if (filterModel[i][k].dateFrom) filterModel[i][k].dateFrom = moment(filterModel[i][k].dateFrom).valueOf();
              if (filterModel[i][k].dateTo) filterModel[i][k].dateTo = moment(filterModel[i][k].dateTo).valueOf();
            }
          })
        } else {
          Object.keys(filterModel[i]).map(k => {
            if (filterModel[i].filterType === 'date') {
              if (filterModel[i].dateFrom) filterModel[i].dateFrom = moment(filterModel[i].dateFrom).valueOf();
              if (filterModel[i].dateTo) filterModel[i].dateTo = moment(filterModel[i].dateTo).valueOf();
            }
          })
        }
      });
      return filterModel;
    }

    function getInstanciationContextMenu(params) {
      const instanciationMenuArray = [];
      const nodetypeName = params.node.data._type || 'none';
      const node = params.node.data;
      let nodetype;
      if (nodetypeName !== 'none') {
        nodetype = $rootScope.datamodel.nodetypes.find(nodetype => nodetype.name === nodetypeName);
        if (nodetype.instanciations) {
          nodetype.instanciations.forEach((inst) => {
            const translationPath = `nodetype.${nodetype.name}.${inst.name}`;
            const translation = $translate.instant(translationPath);
            if (translation !== translationPath) inst.translation = translation;
            // create sub menu element
            instanciationMenuArray.push({
              name: `🔀 ${inst.translation || inst.name}`,
              action: () => {
                if (node.properties._serialized === undefined) node.properties._serialized = [];
                nodesModel.serializeNode(node._type, node._id, inst.id, node.properties._serialized.includes(inst.id))
                  .then((result) => {
                    params.node.setDataValue(`properties._serialized`, result.properties._serialized);
                    Notification.success({ title: "Serialized", message: "Instanciation updated" });
                  }, (error) => {
                    Notification.error({ title: 'Error Serializing Node', message: error });
                    console.error(error);
                  })
              },
            })
          })
        }
      }
      return instanciationMenuArray;
    }
    // #region [SCOPE_FUNCTIONS]  

    $scope.nodeReportingProcess = false;
    $scope.launchNodetypeReport = async (reportId) => {
      $scope.nodeReportingProcess = true;
      const reportContent = await nodesModel.runReport(reportId, {});
      var win = window.open("", "Ganister Report", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes");
      win.document.body.innerHTML = reportContent;
      $scope.nodeReportingProcess = false;
    };



    /**
     * openCardFile
     * Request a reachable URL from the file id and ask for viewing it
     */
    $scope.openCardFile = async (file) => {
      const selectedNodes = $scope.context.mainGridOptions.api.getSelectedNodes();

      if (selectedNodes.length > 1) {
        Notification.warning(`Node report only work for a single node selection`);
      } else {
        if (!file._id) file = selectedNodes[0].data;
        if (file.properties.mimetype === 'application/octet-stream' && file.properties.generated) {
          try {
            if (typeof (file.properties.generated) === 'string') {
              file.generated = JSON.parse(file.properties.generated);
            }
            if (file.generated.source === 'cadExchanger') {
              const { id, public = false } = file.generated.data;
              //  Make file public
              if (!public) {
                const result = await plmModel.publicCADDocument(file._id);
                if (result.error) {
                  return Notification.error({
                    title: 'Error Generating Public URL for CAD Document',
                    message: result.message,
                  });
                }
              }
              return $scope.openFile(file);
            }
          } catch (error) {
            console.error(error);
            Notification.error({
              title: 'Error Generating Public URL - 1',
              message: error.message,
            });
          }
        } else {
          if (file.source === 'local') {
            if (file.mimetype === 'application/octet-stream') {
              return $scope.openFile(file, true);
            }
            return $scope.openFile(file);
          }
          nodesModel.generatePublicURL(file._id)
            .then((result) => {
              if (result.error) {
                Notification.error({
                  title: 'Error Generating Public URL - 2',
                  ...result,
                });
              } else {
                file.url = result.url;
                file.mimetype = result.mimetype;
                if (file.mimetype === 'application/octet-stream') {
                  return $scope.openFile(file, true);
                }
                return $scope.openFile(file);
              }
            }).catch((err) => {
              Notification.error({
                title: 'Error Generating Public URL - 3',
                ...err,
              });
            })
        }
      }

    }


    /**
   * openFile
   * Open a right side panel with the file viewable
   * @param {*} file 
   * @param {*} forceDownload 
   */
    $scope.openFile = (file, forceDownload = false) => {
      // open viewable or download
      if (forceDownload) {
        $window.open(file.url, '_blank');
      } else {
        $('#fileViewerCADOptions').hide("slow");
        $scope.openedFile = file;
        $("#fileViewerName").text(`(${file.properties.filename})`);
        switch (file.properties.mimetype) {
          case "image/jpeg":
            $("#fileViewer").css('width', 5 + ($(document).width() / 2.2));
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 22) + "px");
            $("#fileViewerItem").html("<img style='max-width:" + $(document).width() / 2.2 + "px';max-height:" + $(document).height() + "px'  src='" + file.url + "' />");
            $("#fileViewer").show("slow");
            break;
          case "image/png":
            $("#fileViewer").css('width', 5 + ($(document).width() / 2.2));
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 22) + "px");
            $("#fileViewerItem").html("<img style='max-width:" + $(document).width() / 2.2 + "px';max-height:" + $(document).height() + "px'  src='" + file.url + "' />");
            $("#fileViewer").show("slow");
            break;
          case "application/pdf":
            $("#fileViewer").css('width', 5 + ($(document).width() / 2.2));
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 22) + "px");
            $("#fileViewerItem").css('height', ($(document).height() - 60) + 'px');
            $("#fileViewerItem").html("<embed class='pdfEmbed' src='" + file.url + "' />");
            $("#fileViewer").show("slow");
            break;
          case "application/octet-stream":
            $("#fileViewer").css('width', 5 + ($(document).width() / 2.2));
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 42) + "px");
            $("#fileViewerItem").css('height', ($(document).height() - 160) + 'px');
            $scope.generateCADViewerURL();
            $('#fileViewerCADOptions').show("slow");
            $("#fileViewer").show("slow");
            break;
          default:
            Notification.warning("no viewer available, the file will open in a new tab");
            $window.open(file.url, '_blank');
            break;
        }
      }
    }
    $scope.cadViewerOptions = {
      autoPlay: 1, // 0,1
      showViewCube: 1, // 0,1
      cameraType: 'perspective', // isometric, perspective
      displayMode: 'auto', // auto, wireframe, shaded, shadedWithBoundaries
      representation: 'auto', // auto, brep, finePoly, mediumPoly, coarsePoly
      bg: '#ffffff',
    };

    $scope.generateCADViewerURL = () => {
      try {
        if ($scope.openedFile.properties.generated) {
          const generatedFile = JSON.parse($scope.openedFile.properties.generated);
          const generatedFileId = generatedFile.data.id;
          let url = `https://cloud.cadexchanger.com/embedded.html?fileId=${generatedFileId}&autoPlay=false`;
          Object.keys($scope.cadViewerOptions).map((key) => {
            url += `&${key}=${$scope.cadViewerOptions[key]}`;
          })
          $scope.cadViewerURL = url;
          $("#fileViewerItem").html(`<iframe src="${$scope.cadViewerURL}" frameborder="0" style="overflow:hidden;height:100%;width:100%" height="100%" width="100%"></iframe>`);
        }
      } catch (error) {
        console.log("LOG / file: mainNodeListing.js / line 216 / .controller / error", error);

      }
    }

    /**
   * downloadFile
   * Request a reachable URL from the file id and ask for dowloading it
   */
    $scope.downloadFile = (selectedFile) => {

      const selectedNodes = $scope.context.mainGridOptions.api.getSelectedNodes();

      if (selectedNodes.length > 1) {
        Notification.warning(`Node report only work for a single node selection`);
      } else {
        if (!selectedFile._id) selectedFile = selectedNodes[0].data;
        if (selectedFile.source !== 'local') {
          nodesModel.generatePublicURL(selectedFile._id)
            .then((result) => {
              if (result.error) {
                Notification.error({
                  title: 'Error Generating Public URL - 6',
                  ...result,
                });
              } else {
                selectedFile.url = result.url;
                $scope.openFile(selectedFile, true);
              }
            })
        } else {
          $scope.openFile(selectedFile, true);
        }
      }
    };

    $scope.launchNodeReport = async (reportId, nodeid) => {
      $scope.nodeReportingProcess = true;
      const selectedNodes = $scope.context.mainGridOptions.api.getSelectedNodes();
      if (selectedNodes.length > 1) {
        Notification.warning(`Node report only work for a single node selection`);
      } else {
        const sourceNode = selectedNodes[0].data;
        const reportContent = await nodesModel.runReport(reportId, {
          reportConfig: {
            nodeId: sourceNode._id,
            nodetype: sourceNode._type,
          }
        });
        var win = window.open("", "Ganister Report", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes");
        win.document.body.innerHTML = reportContent;
        $scope.nodeReportingProcess = false;
      }
      $scope.nodeReportingProcess = false;

    };

    $scope.loadNodetypeReports = (nodetype) => {
      $scope.context.currentNodetype.reports = _.filter($scope.datamodel.reports, { 'sourceNodetype': $scope.context.nodetype.id });
      if ($scope.context.currentNodetype.reports.length > 0) {
        $scope.context.hasReports = true;
      } else {
        $scope.context.hasReports = false;
      }
    };

    $scope.loadNodetypeActions = (nodetype) => {
      if (_.size(nodetype.actions) > 0) {
        $scope.context.hasActions = true;
      } else {
        $scope.context.hasActions = false;
      }
    };

    $scope.checkUserRightsForCreations = (nodetypeName) => {
      $scope.nodeTypeCreationAllowed = false;
      nodesModel.getNodetypeCreationRight(nodetypeName.name)
        .then((result) => {
          if (result.canCreate) {
            $scope.nodeTypeCreationAllowed = true;
          }
        })
    };

    $scope.getContextMenuItems = (params) => {
      const contextMenuItems = [
        {
          name: 'Unlock',
          cssClasses: [],
          icon: '<i class="fa fa-unlock"></i>',
          disabled: params.node.data.locked === 0 || (params.node.data.locked === 2 && !$rootScope.appContext.user.properties._isAdmin),
          action: () => {
            $scope.unlockNode(params.node.data);
          },
        },
        {
          name: 'Lock',
          cssClasses: [],
          icon: '<i class="fa fa-lock"></i>',
          disabled: params.node.data.locked !== 0,
          action: () => {
            $scope.lockNode(params.node.data);
          },
        },
        {
          name: 'edit',
          cssClasses: [],
          icon: '<i class="fa fa-edit"></i>',
          disabled: params.node.data.locked == 2,
          action: () => {
            $scope.editNode(params.node.data)
          },
        },
        {
          name: 'delete',
          cssClasses: [],
          icon: '<i class="fa fa-trash"></i>',
          disabled: params.node.data.locked == 2,
          action: () => {
            $scope.delete($scope.context.currentNodetype, params.node.data)
          },
        },
        'separator',
        'copy',
        'copyWithHeaders',
        'export',
      ];

      // add file specific menu entries
      if ($scope.context.currentNodetype.name === 'file') {
        contextMenuItems.push('separator')
        contextMenuItems.push({
          name: $translate.instant(`default.node.fileOpen`),
          icon: '<i class="glyphicon glyphicon-eye-open"></i>',
          disabled: false,
          action: () => {
            $scope.openCardFile(params.node.data);
          },
        }, {
          name: $translate.instant(`default.node.fileDownload`),
          icon: '<i class="glyphicon glyphicon-cloud-download"></i>',
          disabled: false,
          action: () => {
            $scope.downloadFile(params.node.data);
          },
        });
      }

      const changeMethod = $scope.context.currentNodetype.changeMethod;
      if (changeMethod === 'eco') {
        contextMenuItems.push('separator')
        contextMenuItems.push({
          name: $translate.instant(`default.node.addToECO`),
          icon: '<i class="glyphicon glyphicon-retweet"></i>',
          disabled: false,
          action: () => {
            $rootScope.$broadcast('openAddToCmModal', 'mainNodeListing', 'eco', params.node.data);
          },
        });
      }
      if (changeMethod === 'manual') {
        contextMenuItems.push('separator');
        contextMenuItems.push({
          name: $translate.instant(`default.node.versionOrForkNode`),
          icon: '<i class="glyphicon glyphicon-retweet"></i>',
          disabled: false,
          action: () => {
            $rootScope.$broadcast('versionOrForkModal', 'mainNodeListing', params.node.data._type, params.node.data._id, params.node.data._version);
          },
        });
      }
      // add instanciation menu if instanciations are available and if _serialized is available

      const instanceMenu = getInstanciationContextMenu(params);
      if (instanceMenu.length > 0) {
        contextMenuItems.push(
          {
            name: 'Instanciation',
            subMenu: instanceMenu,
          }
        )
      }


      return contextMenuItems;
    };



    $scope.runSearch = () => {
      const filterModel = getFilterModel();
      $scope.loadNodetypeNodes($scope.context.nodetype, {
        maxResults: $scope.maxResults,
        searchCriterias: filterModel,
      });
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
        $scope.$apply();
        const filterModel = getFilterModel();
        $scope.loadNodetypeNodes($scope.context.nodetype, {
          maxResults: $scope.maxResults,
          searchCriterias: filterModel,
        });
      });
    };

    $scope.waitingResults = false;
    $scope.loadNodetypeNodes = async (nodetype, search = { maxResults: $scope.maxResults }) => {
      try {
        $scope.waitingResults = true;
        if ($scope.searchDate) {
          if ($scope.searchType === 'currentOn') {
            //  Set Time to 0 and add time to 23:59:59 for date selected
            search.searchDate = $scope.searchDate.setHours(0, 0, 0) + 86399000;
          } else {
            search.searchDate = $scope.searchDate.setHours(0, 0, 0);
          }
          search.searchType = $scope.searchType;

        }
        $scope.context.mainGridOptions.api.setRowData([]);
        $scope.context.mainGridOptions.api.showLoadingOverlay();


        const nodes = await nodesModel.getNodes(nodetype.name, search);
        $scope.waitingResults = false;
        if (!nodes) return;

        if ($scope.context.currentNodetype.name === nodetype.name) {

          $scope.context.mainGridOptions.data = nodes.map((node) => {
            node.locked = helperFunctions.getLockedState(node);
            return node;
          });

          // load rowData if the grid is still there (in case the user already logged out for example)
          if ($scope.context.mainGridOptions.api) {
            $scope.context.mainGridOptions.api.setRowData($scope.context.mainGridOptions.data);
          }

          //  Check if results are less that the maxResults requested
          if (nodes.length < $scope.maxResults) {
            $scope.maxResultsClass = false;
          } else {
            $scope.maxResultsClass = true;
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    $scope.unlockNode = async (node) => {
      const openedNode = $rootScope.appContext.user.appSession.openNodes.find((n) => n._id === node._id);
      if (openedNode && openedNode.unsavedChanges) {
        return Notification.warning({
          title: `Node ${node.properties?._labelRef || ''} cannot unlocked`, message: 'Node has unsaved changes',
        });
      }
      const result = await nodesModel.updateNode(node, false);
      if (!result) return;

      const rowNodes = [];
      $scope.context.mainGridOptions.api.forEachNode((rowNode) => {
        if (rowNode.data._id === result._id) {
          result.locked = helperFunctions.getLockedState(result);
          rowNode.data = result;
          rowNodes.push(rowNode);
        }
      });
      $scope.context.mainGridOptions.api.redrawRows({ rowNodes });

      Notification.success(`Node ${result.properties?._labelRef || ''} unlocked`);

      $rootScope.$broadcast('socketUnlockedNode', {
        node: result,
        user: $rootScope.appContext.user,
      });
    };

    $scope.lockNode = async (node) => {
      const result = await nodesModel.updateNode(node, true);
      if (!result) return;

      const rowNodes = [];
      $scope.context.mainGridOptions.api.forEachNode((rowNode) => {
        if (rowNode.data._id === result._id) {
          result.locked = helperFunctions.getLockedState(result);
          rowNode.data = result;
          rowNodes.push(rowNode);
        }
      });
      $scope.context.mainGridOptions.api.redrawRows({ rowNodes });

      Notification.success(`Node ${result.properties?._labelRef || ''} locked`);

      $rootScope.$broadcast('socketLockedNode', {
        node: result,
        user: $rootScope.appContext.user,
      });
    };

    $scope.editNode = async (node) => {
      if (node.locked == 0) {
        const lock = true;
        const result = await nodesModel.updateNode(node, lock);
        if (result) $scope.openNode(node);
      } else if (node.locked === 1) {
        $scope.openNode(node);
      } else if (node.locked > 1) {
        Notification.error({
          title: "Cannot Edit",
          message: `Node is locked by ${node.properties._lockedByName || 'someone else'}`,
        });
      }
    };

    $scope.getMaxResults = () => {
      const maxResults = Number.parseInt(localStorage['maxResults'], 10);
      if (Number.isNaN(maxResults)) {
        localStorage['maxResults'] = 100;
        return 100;
      }
      return maxResults;
    };

    $scope.renderColumnDefs = () => {
      $scope.context.mainGridOptions.columnDefs = agRenderMachine.getColumnDefs($scope.context.currentNodetype);
      if ($scope.context.mainGridOptions.api) {
        $scope.context.mainGridOptions.api.setColumnDefs([]);
        $scope.context.mainGridOptions.api.setColumnDefs($scope.context.mainGridOptions.columnDefs);
      } else {
        console.info("A-Grid api not loaded or Dismissed by User yet...");
      }
    };

    $scope.clearColumnConfig = () => {
      $scope.renderColumnDefs();
      agRenderMachine.resetColumnsDef($scope.context.nodetype.name);
      $scope.loadNodetypeNodes($scope.context.nodetype);
    };

    $scope.clearFilters = () => {
      $scope.noFilter = true;
      $scope.context.mainGridOptions.api.setFilterModel(null);
    };

    $scope.openNode = (node) => {
      if (node && node._id) $rootScope.$broadcast('openNode', node);
    };

    // $scope
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
      const node = await nodesModel.addNode(data, true);
      if (!node) return;

      //just for ag-grid, will be removed later
      node.properties._typeObject = nodetype;

      await helperFunctions.runTriggeredMethods('afterCreate', node, $scope);

      $scope.openNode(node);
      node.locked = helperFunctions.getLockedState(node);
      $scope.context.mainGridOptions.data.push(node);
      $scope.context.mainGridOptions.api.setRowData($scope.context.mainGridOptions.data);
    };


    $scope.files = [];
    $scope.fileUpload = {};
    $scope.$watch("fileUpload", (file, oldValue) => {
      if (file === oldValue || file === null) return;
      $scope.runFileUploadCreation(file);
    });

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

          const lock = !!$scope.rel.openOnCreation;

          const node = await nodesModel.addNode(file, lock);
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
        } else if (data) {
          const { title, message } = data;
          Notification.error({ title: title || 'Upload Failed', message });
          loadingNotification.then((notification) => notification.kill());
        }
      } catch (error) {
        console.error(error);
      }
    }

    $scope.delete = async (nodetype, node) => {
      try {
        let selectedNodes = [];
        if (node) {
          selectedNodes = [{ data: node }];
        } else {
          selectedNodes = $scope.context.mainGridOptions.api.getSelectedNodes();
        }

        const promises = selectedNodes.map(async (item) => {
          await helperFunctions.runTriggeredMethods('beforeDelete', item.data, $scope);

          const result = await nodesModel.deleteNode(item.data);
          if (!result) return;

          await helperFunctions.runTriggeredMethods('afterDelete', result, $scope);

          _.remove($scope.context.mainGridOptions.data, { _id: item.data._id });
          $scope.context.mainGridOptions.api.setRowData($scope.context.mainGridOptions.data);
          Notification.success('<i class="fa fa-check" aria-hidden="true"></i> Node successfully removed');
        });
        await Promise.all(promises);
      } catch (error) {
        console.error(error);
      }
    };

    $scope.runNodetypeAction = async (action) => {
      try {
        const { name: nodetypeName } = $scope.context.nodetype;

        const data = {};

        if (action.preClientMethod) {
          const method = $rootScope.datamodel.methods.find((m) => m.name === action.preClientMethod);
          if (!method) {
            return Notification.error(`Pre Client Method ${action.preClientMethod} not found`);
          }

          await clientMethodsService[method.name]($scope, $rootScope, data);
        }

        if (action.serverMethod) {
          const result = await nodesModel.runNodetypeAction(nodetypeName, action, data);
          if (!result) return;

          Object.assign(data, result.clientMethodData);
        }

        if (action.postClientMethod) {
          const method = $rootScope.datamodel.methods.find((m) => m.name === action.postClientMethod);
          if (!method) {
            return Notification.error(`Post Client Method ${action.postClientMethod} not found`);
          }

          await clientMethodsService[method.name]($scope, $rootScope, data);
        }

        const actionNameTranslation = $translate.instant(`nodetype.${nodetypeName}.${action.name}`);
        Notification.success(`'${actionNameTranslation || action.name}' successfully run`);
      } catch (error) {
        console.error(error);
      }
    }

    // #endregion 

    // #region [INIT]
    $scope.maxResults = $scope.getMaxResults();
    $scope.maxResultsClass = {}; //  If max results is more than nodes in db
    $scope.searchDate = new Date(Date.now());
    $scope.searchType = 'currentOn';
    $scope.noFilter = true;
    $scope.nodeNotSelected = true;
    $scope.rel = {}; // for nodeRelModal;
    $scope.node = {}; // for nodeRelModal;

    $scope.context.mainGridOptions = {
      components: {
        datePicker: agRenderMachine.getDatePicker(),
        booleanEditor: agRenderMachine.getBooleanEditor(),
      },
      enableRangeSelection: true,
      suppressCopyRowsToClipboard: true,
      defaultColDef: {
        // allow every column to be aggregated
        enableValue: true,
        // allow every column to be grouped
        enableRowGroup: true,
        // allow every column to be pivoted
        enablePivot: true,
        resizable: true,
        sortable: true,
        filter: true,
      },
      pagination: $rootScope.appDefinition.uxConfig.paginationEnabled || false,
      paginationPageSize: $rootScope.appDefinition.uxConfig.defaultPaginationSize || 500,
      columnDefs: null,
      suppressClickEdit: false,
      rowData: null,
      columnTypes: {
        state: {
          cellRenderer: agRenderMachine.stateRenderer,
        },
        date: {
          cellRenderer: agRenderMachine.dateRenderer,
        },
        node: {
          cellRenderer: agRenderMachine.nodeRenderer,
        }
      },
      rowSelection: 'multiple',
      sideBar: 'columns',
      // onModelUpdated: onModelUpdated,
      angularCompileRows: true,
      floatingFilter: true,
      getContextMenuItems: $scope.getContextMenuItems,
      rowClassRules: {
        'rowGroup': (params) => {
          return params.node.group
        }
      },
      getRowNodeId(data) {
        return data._id;
      },
      onColumnResized(params) {
        if (params.finished) {
          agRenderMachine.saveColumnsDef($scope.context.nodetype.name, $scope.context.mainGridOptions);
        }
      },
      onDisplayedColumnsChanged(params) {
        agRenderMachine.saveColumnsDef($scope.context.nodetype.name, $scope.context.mainGridOptions);
        const { primaryColumns } = params.columnApi.columnController;
        agRenderMachine.setGridRowHeight(primaryColumns, $scope.context.mainGridOptions);
      },
      onRowSelected(params) {
        $scope.nodeNotSelected = false;
        $scope.$apply();
      },
      onGridReady: (event) => {
        $scope.context.mainGridOptions.columnApi.autoSizeColumns();
      },
      onCellDoubleClicked: (params) => {
        if (!params.colDef.editable) {
          $scope.openNode(params.data);
        }
      },
      onFilterChanged: (event) => {
        $scope.noFilter = false;
        const filterModel = getFilterModel();
        $scope.loadNodetypeNodes($scope.context.nodetype, {
          maxResults: $scope.maxResults,
          searchCriterias: filterModel,
        });
      },
      onCellEditingStarted: (params) => {
        if (params.data.locked === 2) {
          $scope.context.mainGridOptions.api.stopEditing();
          return Notification.error({
            title: 'Cannot Update Cell',
            message: `Node is locked by ${params.data.properties?._lockedByName || 'someone else'}`
          });
        }
        const propertyName = params.colDef.field.split('.')[1];
        const propertyDM = $scope.context.nodetype.properties.find((property) => {
          return property.name === propertyName;
        });

        if (propertyDM && propertyDM.type === 'node') {
          $scope.context.mainGridOptions.api.stopEditing(true);
          const relationshipDM = $rootScope.datamodel.nodetypes.find((nodetype) => {
            return nodetype.elementType === 'relationship' && nodetype.id === propertyDM.relationship;
          })
          if (relationshipDM) {
            $scope.rel = relationshipDM;
            $scope.node = params.data;
            $scope.$broadcast('openNodeRelModal', relationshipDM, propertyDM.relationship, $scope.node, propertyName, true);
          }
        }
      },
      onCellValueChanged: async (params) => {
        if (params.column.colId.indexOf('_serialized') > -1) return;
        if (params.oldValue === params.newValue) {
          return;
        }
        //  If node is locked by someone else, return
        if (params.data.locked === 2) {
          const rowData = { ...params.data };
          const rowNode = $scope.context.mainGridOptions.api.getRowNode(rowData._id);
          rowData[params.colDef.field] = params.oldValue;
          rowNode.setData(rowData);
          return Notification.error({
            title: 'Cannot Update Cell',
            message: `Node is locked by ${rowData.properties?._lockedByName || 'someone else'}`
          });
        }
        const node = params.data;
        await nodesModel.updateNode(node);

        $scope.context.mainGridOptions.api.resetRowHeights();
        Notification.success('Node Updated');
      },
    };


    // #endregion INIT

    // #region [SCOPE_WATCH]

    $scope.$watch('context.currentNodetype', (newValue) => {
      if (newValue != null) {
        $scope.context.nodetype = newValue;
        $scope.renderColumnDefs();
        $scope.loadNodetypeNodes(newValue);
        $scope.loadNodetypeReports(newValue);
        $scope.loadNodetypeActions(newValue);
        $scope.checkUserRightsForCreations(newValue);
        agRenderMachine.restoreColumnsDef($scope.context.nodetype.name, $scope.context.mainGridOptions);
        // hide node tabs
        // activate list tab
        $rootScope.appContext.user.appSession.listActive = true;
        $rootScope.appContext.user.appSession.dashActive = false;
        $rootScope.appContext.user.appSession.searchActive = false;
      } else {
        if ($rootScope.appContext.user.appSession) {
          $rootScope.appContext.user.appSession.listActive = false;
          $rootScope.appContext.user.appSession.dashActive = true;
          $rootScope.appContext.user.appSession.searchActive = false;
        }
      }
    });

    $scope.$watchGroup(['maxResults', 'searchType', 'searchDate'], function (newValues, oldValues, scope) {
      localStorage['maxResults'] = newValues[0];
      const filterModel = getFilterModel();
      if ($scope.context.nodetype) {
        $scope.loadNodetypeNodes($scope.context.nodetype, {
          maxResults: newValues[0],
          searchCriterias: filterModel,
        });
      }
    });
    // #endregion 

    localScope = $scope;
    // #region [SCOPE_ON]
    //  Update Grid Columns on Language Change
    $rootScope.$on('$translateChangeSuccess', () => {
      if (localScope.context.mainGridOptions.columnDefs) localScope.renderColumnDefs();
      if (localScope.context.nodetype) agRenderMachine.restoreColumnsDef(localScope.context.nodetype.name, localScope.context.mainGridOptions);
      if ($scope.context.nodetype) $scope.runSearch();
    });
    // #endregion 
    $rootScope.$on('socketLockedNode', (event, data) => {
      const { node } = data;
      if (node._type === $scope.context.currentNodetype?.name) {
        $scope.context.mainGridOptions.api.forEachNode((rowNode) => {
          if (rowNode.data._id === node._id) {
            rowNode.data = node;
            if ($rootScope.appContext.user._id === node.user._id) {
              rowNode.data.locked = 1; // Locked By Current User
            } else {
              rowNode.data.locked = 2; // Locked By Different User
            }
            return $scope.context.mainGridOptions.api.redrawRows({ rowNodes: [rowNode] });
          }
        });
      }
    });

    $rootScope.$on('socketUnlockedNode', (event, data) => {
      const { node } = data;
      if (node._type === $scope.context.currentNodetype?.name) {
        $scope.context.mainGridOptions.api.forEachNode((rowNode) => {
          if (rowNode.data._id === node._id) {
            rowNode.data = node;
            rowNode.data.locked = 0;
            return $scope.context.mainGridOptions.api.redrawRows({ rowNodes: [rowNode] });
          }
        });
      }
    });
  });
