/* globals agGrid, swal */
agGrid.initialiseAgGridWithAngular1(angular);
angular.module("app.ganister.tabs.node.nodeFormTabs.fileGallery", [
  'agGrid',
  'ui-notification',
  'app.ganister.shared.modals.relationshipModal',
  'app.ganister.tool.aggrid',
  'app.ganister.models.nodetypes',
  'ngFileUpload',
])
  .controller('fileGalleryController', function ($rootScope, $scope, $window, nodesModel, plmModel, Notification, Upload, helperFunctions) {


    //                       _         _  _   
    //                      (_)       (_)| |  
    //  __   __ __ _  _ __   _  _ __   _ | |_ 
    //  \ \ / // _` || '__| | || '_ \ | || __|
    //   \ V /| (_| || |    | || | | || || |_ 
    //    \_/  \__,_||_|    |_||_| |_||_| \__|


    var data = [];
    $scope.fileUpload;
    $scope.itemSelected = false;
    $scope.openedFile = false;
    $scope.files = [];
    $scope.viewableMimetypes = [
      'application/octet-stream',
      'application/pdf',
      'image/png',
      'image/jpeg',
    ];

    $scope.cadViewerOptions = {
      autoPlay: 1, // 0,1
      showViewCube: 1, // 0,1
      cameraType: 'perspective', // isometric, perspective
      displayMode: 'auto', // auto, wireframe, shaded, shadedWithBoundaries
      representation: 'auto', // auto, brep, finePoly, mediumPoly, coarsePoly
      bg: '#ffffff',
    };

    const generateCADViewerURL = () => {
      let url = `https://cloud.cadexchanger.com/embedded.html?fileId=${$scope.openedFile.generated.data.id}`;
      Object.keys($scope.cadViewerOptions).map((key) => {
        url += `&${key}=${$scope.cadViewerOptions[key]}`;
      })
      $scope.cadViewerURL = url;
      $("#fileViewerItem").html(`<iframe src="${$scope.cadViewerURL}" frameborder="0" style="overflow:hidden;height:100%;width:100%" height="100%" width="100%"></iframe>`);
    }


    //  ______                    _    _                    
    // |  ____|                  | |  (_)                   
    // | |__  _   _  _ __    ___ | |_  _   ___   _ __   ___ 
    // |  __|| | | || '_ \  / __|| __|| | / _ \ | '_ \ / __|
    // | |   | |_| || | | || (__ | |_ | || (_) || | | |\__ \
    // |_|    \__,_||_| |_| \___| \__||_| \___/ |_| |_||___/


    /**
     * getFileLogo
     */
    function getFileLogo(mimetype, filename) {
      // load file fileLogo
      let fileLogo;
      if (filename) fileLogo = _.find($rootScope.fileMimetypeImages, { 'ext': filename.split('.').pop() });
      if (!fileLogo) fileLogo = _.find($rootScope.fileMimetypeImages, { 'mimetype': mimetype })
      if (!fileLogo) {
        fileLogo = { img: "any128.png" };
        console.warn("no file logo set for mimetype: " + mimetype)
      }
      return fileLogo.img;
    }


    $scope.loadFiles = () => {
      loadFiles();
    }

    /**
     * loadFiles
     * Main function for loading the document related files
     */
    const loadFiles = async () => {
      try {
        if (!$scope.rel._definition) {
          console.error('error while getting the related object definition, check datamodel', $scope.rel);
          return;
        }
        const relationships = await nodesModel.getRelationships($scope.node, $scope.rel._definition.name);
        if (!relationships) return;

        $scope.relationships = relationships;

        const nodes = relationships.map((relationship) => {
          const { _type, _id, target } = relationship;

          const node = { ...target };
          node._relationshipType = _type;
          node._relationshipId = _id;

          const { filesize, mimetype, _createdOn, filename } = node.properties;
          node.properties.filesize = humanFileSize(filesize, true);
          node.properties.fileLogo = getFileLogo(mimetype, filename);
          node.properties.formatedCreatedOn = moment(parseInt(_createdOn)).format('DD/MM/YYYY HH:mm');
          return node;
        });
        $scope.files = Object.assign(data, nodes);
        $scope.$emit("objCountUpdate", $scope.rel.name, nodes.length);
      } catch (error) {
        console.error(error);
      }
    };

    /**
     * openFile
     * Open a right side panel with the file viewable
     * @param {*} file 
     * @param {*} forceDownload 
     */
    function openFile(file, forceDownload) {
      const { filename, url, mimetype } = file.properties;
      const { _ref, _labelRef } = $scope.node.properties;

      // open viewable or download
      if (forceDownload) {
        $window.open(url, '_blank');
      } else {
        $('#fileViewerCADOptions').hide("slow");
        $scope.openedFile = file;
        $("#fileViewerName").text(`${_ref || _labelRef} (${filename})`);
        switch (mimetype) {
          case "image/jpeg":
            $("#fileViewer").css('width', 5 + ($(document).width() / 2.2));
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 22) + "px");
            $("#fileViewerItem").html("<img style='max-width:" + $(document).width() / 2.2 + "px';max-height:" + $(document).height() + "px'  src='" + url + "' />");
            $("#fileViewer").show("slow");
            break;
          case "image/png":
            $("#fileViewer").css('width', 5 + ($(document).width() / 2.2));
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 22) + "px");
            $("#fileViewerItem").html("<img style='max-width:" + $(document).width() / 2.2 + "px';max-height:" + $(document).height() + "px'  src='" + url + "' />");
            $("#fileViewer").show("slow");
            break;
          case "application/pdf":
            $("#fileViewer").css('width', 5 + ($(document).width() / 2.2));
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 22) + "px");
            $("#fileViewerItem").css('height', ($(document).height() - 60) + 'px');
            $("#fileViewerItem").html("<embed class='pdfEmbed' src='" + url + "' />");
            $("#fileViewer").show("slow");
            break;
          case "application/octet-stream":
            $("#fileViewer").css('width', 5 + ($(document).width() / 2.2));
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 42) + "px");
            $("#fileViewerItem").css('height', ($(document).height() - 160) + 'px');
            generateCADViewerURL();
            $('#fileViewerCADOptions').show("slow");
            $("#fileViewer").show("slow");
            break;
          default:
            Notification.warning("no viewer available, the file will open in a new tab");
            $window.open(url, '_blank');
            break;
        }
      }
    }

    window.addEventListener('resize', () => {
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      let deductHeight = parseInt($("#fileViewerName").outerHeight()) + 20;
      if ($scope.openedFile?.properties?.mimetype === "application/octet-stream") {
        deductHeight += parseInt($("#fileViewerCADOptions").outerHeight());
      }
      $("#fileViewerItem").css('height', (vh - deductHeight) + 'px');
    });


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
    const runFileUpload = async (file) => {
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
          node.properties.fileLogo = getFileLogo(node.properties.mimetype,node.properties.filename);
          node.properties.formatedCreatedOn = moment(parseInt(node.properties._createdOn)).format('DD/MM/YYYY HH:mm');

          const params = {
            _type: $scope.rel._definition.name,
            source: $scope.node,
            target: node,
          };
          const relationship = await nodesModel.addRelationship(params);
          loadingNotification.then((notification) => notification.kill());
          if (!relationship) return;

          const { _type, _id } = relationship;
          node._relationshipType = _type;
          node._relationshipId = _id;

          $scope.files.push(node);
          $scope.$emit("objCountUpdate", $scope.rel.name, $scope.files.length);
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


    //    _                                                  _         _     
    //   | |                                                | |       | |    
    //  / __) ___   ___  ___   _ __    ___  __      __ __ _ | |_  ___ | |__  
    //  \__ \/ __| / __|/ _ \ | '_ \  / _ \ \ \ /\ / // _` || __|/ __|| '_ \ 
    //  (   /\__ \| (__| (_) || |_) ||  __/ _\ V  V /| (_| || |_| (__ | | | |
    //   |_| |___/ \___|\___/ | .__/  \___|(_)\_/\_/  \__,_| \__|\___||_| |_|
    //                        | |                                            
    //                        |_|                                            


    $scope.$watch("fileUpload", (file, oldValue) => {
      if (file === oldValue || file === null) { return; }
      runFileUpload(file);
    });

    $scope.$on('refreshTabContent', () => {
      loadFiles();
    })



    //    _                                    ______                    _    _                    
    //   | |                                  |  ____|                  | |  (_)                   
    //  / __) ___   ___  ___   _ __    ___    | |__  _   _  _ __    ___ | |_  _   ___   _ __   ___ 
    //  \__ \/ __| / __|/ _ \ | '_ \  / _ \   |  __|| | | || '_ \  / __|| __|| | / _ \ | '_ \ / __|
    //  (   /\__ \| (__| (_) || |_) ||  __/ _ | |   | |_| || | | || (__ | |_ | || (_) || | | |\__ \
    //   |_| |___/ \___|\___/ | .__/  \___|(_)|_|    \__,_||_| |_| \___| \__||_| \___/ |_| |_||___/
    //                        | |                                                                  
    //                        |_|                                                                  

    /**
     * openCardFile
     * Request a reachable URL from the file id and ask for viewing it
     */
    $scope.openCardFile = async (file) => {
      let { source, mimetype, generated } = file.properties;

      if (mimetype === 'application/octet-stream' && generated) {
        try {
          if (typeof (generated) === 'string') {
            file.properties.generated = JSON.parse(generated);
            generated = JSON.parse(generated);
          }
          if (generated.source === 'cadExchanger') {
            const { id, public } = generated.data;
            //  Make file public
            if (!public) {
              const result = await plmModel.publicCADDocument(file._id);
              if (result.error) {
                return Notification.error({ title: 'Error Generating Public URL for CAD Document', message: result.message });
              }
            }
            return openFile(file);
          }
        } catch (error) {
          Notification.error({ title: 'Error Generating Public URL', message: error.message });
        }
      } else {
        if (source === 'local') {
          if (mimetype === 'application/octet-stream') {
            return openFile(file, true);
          }
          return openFile(file);
        }
        nodesModel.generatePublicURL(file._id)
          .then((result) => {
            if (result.error) {
              Notification.error({ title: 'Error Generating Public URL', ...result });
            } else {
              file.properties.url = result.url;
              file.properties.mimetype = result.mimetype;
              if (mimetype === 'application/octet-stream') {
                return openFile(file, true);
              }
              return openFile(file);
            }
          }).catch((err) => {
            Notification.error({ title: 'Error Generating Public URL', ...err });
          })
      }
    }

    /**
     * downloadFile
     * Request a reachable URL from the file id and ask for dowloading it
     */
    $scope.downloadFile = (relationship) => {
      let selectedFile = $scope.selectedFile;
      if (selectedFile.properties.source !== 'local') {
        nodesModel.generatePublicURL(selectedFile._id)
          .then((result) => {
            if (result.error) {
              Notification.error({ title: 'Error Generating Public URL', ...result });
            } else {
              selectedFile.properties.url = result.url;
              openFile(selectedFile, true);
            }
          })
      } else {
        openFile(selectedFile, true);
      }
    };

    $scope.openCheckedOutFile = (file) => {
      nodesModel.openCheckedOutFile(file)
        .then((result) => {
          if (result && result.error) {
            return Notification.error({ title: 'Error Opening File', message: result.message });
          }
        })
    }

    $scope.checkOut = (file) => {
      nodesModel.checkOut(file)
        .then((result) => {
          if (result && result.error) {
            return Notification.error({ title: 'Error Checking Out File', message: result.message });
          }
          result.size = humanFileSize(result.size, true);
          delete result.name;
          file = Object.assign(file, result);
          return Notification.success({ title: 'File Checked Out', message: "File Checked Out Succesfully" });
        })
    }

    $scope.checkIn = (file) => {
      nodesModel.checkIn(file)
        .then((result) => {
          if (result && result.error) {
            return Notification.error({ title: 'Error Checking In File', message: result.message });
          }
          result.size = humanFileSize(result.size, true);
          delete result.name;
          file = Object.assign(file, result);
          return Notification.success({ title: 'File Check In', message: "File Checked In Succesfully" });
        });
    }

    $scope.removeCheckOut = (file) => {
      nodesModel.removeCheckOut(file)
        .then((result) => {
          if (result && result.error) {
            return Notification.error({ title: 'Error removing Checked Out File', message: result.message });
          }
          delete file.properties._checkedOut;
          delete file.properties._checkedOutBy;
          delete file.properties._checkedOutOn;
          delete file.properties._checkedOutByName;
          return Notification.success({
            title: 'Remove Checked Out File',
            message: "File removed from checked out files!",
          });
        });
    }


    $scope.detach = async () => {
      try {
        // retrieve targetnode
        const selectedNodes = $scope.files.filter(item => item.selected);

        const response = await Swal.fire({
          title: "Detach File",
          type: 'question',
          text: 'The file will be removed',
          showCancelButton: true,
        });
        if (!response.value) return;

        const promises = selectedNodes.map(async (node) => {
          const { _relationshipType, _relationshipId } = node;
          const params = {
            _type: _relationshipType,
            _id: _relationshipId,
            source: $scope.node,
          };
          const result = await nodesModel.deleteRelationship(params);
          if (!result) return;

          _.remove(data, { _relationshipId });
          $(`#fileGalleryItem-${node._id}`).remove();
          Swal.fire(
            'Deleted',
            'Your file has been deleted.',
            'success'
          )
          $scope.$emit("objCountUpdate", $scope.rel.name, data.length);
        });

        await Promise.all(promises);
      } catch (error) {
        console.error(error);
      }
    };

    $scope.renameFile = async (file) => {
      try {
        const response = await Swal.fire({
          title: 'Edit File Name',
          inputValue: file.properties.filename,
          input: 'text',
          inputPlaceholder: 'Type filename here...',
          showCancelButton: true
        });
        if (!response.value) return;

        const { _type, _id } = file;
        const filename = response.value;
        const params = {
          _type,
          _id,
          properties: { filename }
        };
        const node = await nodesModel.updateNode(params);
        if (!node) return;

        file.properties.filename = node.properties.filename;
        Notification.success({ message: 'File renamed' });
      } catch (error) {
        console.error(error);
      }
    }

    // WILL WORK ON THIS PART AFTER INVENTOR INTEGRATOR REFACTO
    $scope.versionFile = (oldFile) => {
      console.info("versionFile")
      Swal.fire({
        title: 'Select file',
        input: 'file',
        inputAttributes: {
          'accept': '*',
          'aria-label': 'Upload your file'
        }
      }).then(swalResult => {
        if (swalResult.dismiss) {
          console.info(swalResult.dismiss);
        } else {
          let newfile = swalResult.value;
          runFileUpload(newfile).then((fileId) => {
            nodesModel.deleteRelationshipById(
              $scope.node,
              $scope.rel._definition.name,
              oldFile._relid,
            ).then((resultRel) => {
              if (resultRel) {
                _.remove(data, { _relid: oldFile._relid });
                $scope.$emit("objCountUpdate", $scope.rel.name, data.length);
              }
              nodesModel.updateNodeValue(oldFile, 'versionnedBy', fileId)
                .then((result) => {
                  if (result.error) {
                    return Notification.error({ title: 'Error Updating Node Value', ...result });
                  }
                  loadFiles();
                }).catch((e) => {
                  console.error("couldn't update versionnedBy info on file with ID: " + fileId);
                });
            }).catch((e) => {
              Notification.error({ title: 'Detach Failed', message: "error" });
              console.error(e);
            });
          });
        }
      });
    }

    $scope.commentFile = (file) => {
      Swal.fire({
        input: 'textarea',
        inputPlaceholder: 'Type your comment here...',
        showCancelButton: true
      }).then(result => {
        if (result.dismiss) {
          console.info(result.dismiss);
        } else {
          console.log("=> " + result.value)
        }
      });
    }

    $scope.aFileIsSelected = false;
    $scope.selectFile = (file) => {
      $scope.aFileIsSelected = true;
      const wasSelected = file.selected;
      $scope.files.forEach((f) => {
        f.selected = false;
      });
      if (!file.selected) {
        file.selected = false;
      }
      file.selected = !wasSelected;
      $scope.aFileIsSelected = file.selected;
      if ($scope.aFileIsSelected)
        $scope.selectedFile = file;
    }

    $scope.$on("cadViewerOptionsUpdate", (events, data) => {
      $scope.cadViewerOptions = data;
      generateCADViewerURL();
    });


    $scope.$on('fileUpdate', (event, data) => {
      let updatedFile = $scope.files.find((file) => {
        return file._id === data.file.properties._id;
      });
      if (updatedFile) {
        updatedFile = Object.assign(updatedFile, data.file.properties);
        updatedFile.size = humanFileSize(updatedFile.size, true);
        updatedFile.formatedCreatedOn = moment(parseInt(updatedFile._modifiedOn)).format('DD/MM/YYYY HH:mm');
      }
      $scope.$apply();
    });


    //  Socket Action: If node is locked, update scope and display notification to the user
    $scope.$on('socketLockedNode', function (event, data) {
      //  Check if the node from socket is the current node
      if ($scope.node._id === data.node._id) {
        $scope.files.map((file) => {
          delete file.properties._checkedOut;
          delete file.properties._checkedOutBy;
          delete file.properties._checkedOutByName;
          delete file.properties._checkedOutOn;
        });
      }
    })

    //  _____         _  _   
    // |_   _|       (_)| |  
    //   | |   _ __   _ | |_ 
    //   | |  | '_ \ | || __|
    //  _| |_ | | | || || |_ 
    // |_____||_| |_||_| \__|

    loadFiles();
  })