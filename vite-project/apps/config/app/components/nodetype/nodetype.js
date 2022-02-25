angular.module('app.ganister.config.models.nodetypes', [
  'ui.codemirror',
  'ngTagsInput',
  'ngFileUpload',
  'app.ganister.config.data'
])
  .controller('nodetypeController', function ($scope, $rootScope, $translate, Notification, Upload, datamodelModel, data) {


    //                       _         _  _   
    //                      (_)       (_)| |  
    //  __   __ __ _  _ __   _  _ __   _ | |_ 
    //  \ \ / // _` || '__| | || '_ \ | || __|
    //   \ V /| (_| || |    | || | | || || |_ 
    //    \_/  \__,_||_|    |_||_| |_||_| \__|


    $scope.nodetype = $scope.datamodel.openItem
    $scope.changeMethods = [{ value: 'manual', label: 'manual' }, { value: 'eco', label: 'eco' }];
    $scope.permissions = [];

    //  ______                    _    _                    
    // |  ____|                  | |  (_)                   
    // | |__  _   _  _ __    ___ | |_  _   ___   _ __   ___ 
    // |  __|| | | || '_ \  / __|| __|| | / _ \ | '_ \ / __|
    // | |   | |_| || | | || (__ | |_ | || (_) || | | |\__ \
    // |_|    \__,_||_| |_| \___| \__||_| \___/ |_| |_||___/



    //    _                                    ______                    _    _                    
    //   | |                                  |  ____|                  | |  (_)                   
    //  / __) ___   ___  ___   _ __    ___    | |__  _   _  _ __    ___ | |_  _   ___   _ __   ___ 
    //  \__ \/ __| / __|/ _ \ | '_ \  / _ \   |  __|| | | || '_ \  / __|| __|| | / _ \ | '_ \ / __|
    //  (   /\__ \| (__| (_) || |_) ||  __/ _ | |   | |_| || | | || (__ | |_ | || (_) || | | |\__ \
    //   |_| |___/ \___|\___/ | .__/  \___|(_)|_|    \__,_||_| |_| \___| \__||_| \___/ |_| |_||___/
    //                        | |                                                                  
    //      

    $scope.upload = (files) => {
      if (files && files.length) {
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          if (!file.$error) {
            Upload.upload({
              url: '/api/v0/uploads/localImages',
              data: {
                file: file,
              }
            }).then((res) => {
              if (res.status === 200) {
                $scope.nodetype.ui.defaultThumbnail = res.data.url;
                datamodelModel.nodetypes.ui.defaultThumbnail.update($scope.nodetype.name, res.data.url).then((result) => {
                  if (result.status === 200) {
                    $scope.makeGraph($scope.$parent.datamodel.packages, $scope.$parent.datamodel.nodetypes);
                    Notification.success({ title: 'Updated', message: `Nodetype's Thumbnail updated` });
                  } else {
                    Notification.error({ title: 'Error', message: `Nodetype's Thumbnail is not updated` });
                  }
                });
              } else {
                Notification.error({ title: 'Error', message: `Your File is not uploaded` });
              }
            }).catch((err) => {
              console.error(err);
              Notification.error({ title: 'Error', message: `Your File is not uploaded` });
            });
          }
        }
      }
    };

    /**
     * addMaidenNameElt
     * @param {*} evt 
     */
    $scope.addMaidenNameElt = (evt) => {
      const val = evt.toElement.value;
      if (val != null) {
        if (!$scope.nodetype.maidenName) {
          $scope.nodetype.maidenName = {
            elements: [],
            separator: ' ',
          };
        }
        if (!$scope.nodetype.maidenName.elements.includes(val)) {
          $scope.nodetype.maidenName.elements.push(val);
          $scope.updateNodetypeMeta('maidenName', $scope.nodetype.maidenName);
        } else {
          console.info("item already added");
        }
      } else {
        console.info("item is null");
      }
    }


    /**
     * removeMaidenNameItem
     * @param {*} val 
     */
    $scope.removeMaidenNameItem = (val) => {
      $scope.nodetype.maidenName.elements = _.pull($scope.nodetype.maidenName.elements, val);
      $scope.updateNodetypeMeta('maidenName', $scope.nodetype.maidenName);
    }

    /**
     * copyId
     */
    $scope.copyId = () => {
      navigator.clipboard.writeText($scope.nodetype.id)
        .then(() => {
          Notification.success({
            message: '<span class="glyphicon glyphicon-ok"></span> ID Copied',
          });
        }, (err) => {
          Notification.error({ title: 'Copy Error', message: 'Read console for more info...', });
          console.error('Could not copy Id: ', err);
        });
    }

    /**
     * toggleConfgDetails
     */
    $scope.toggleConfgDetails = () => {
      let confElt = document.getElementById('details');
      confElt.classList.toggle("in");
    }

    /**
     * deleteNodetype
     */
    $scope.deleteNodetype = () => {
      Swal.fire({
        title: `"Do you really want to delete ${$scope.nodetype.name} nodetype?"`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete it'
      }).then((result) => {
        if (result.value) {
          datamodelModel.nodetypes.remove($scope.nodetype.id)
            .then((response) => {
              Notification.success(`Nodetype ${$scope.nodetype.name} deleted`);
              datamodelModel.getDatamodel()
                .then((result) => {
                  // restore datamodel variables
                  $scope.$parent.datamodel.nodetypes = result.nodetypes
                  $scope.$parent.datamodel.categories = result.categories
                  $scope.$parent.datamodel.packages = result.packages
                  $scope.$parent.datamodel.methods = result.methods
                  $scope.$parent.datamodel.listOfValues = result.listOfValues
                  $scope.$parent.datamodel.reports = result.reports
                  // rebuild the graph
                  $scope.setNodetypesStyles()
                  $scope.makeGraph(result.packages, result.nodetypes)
                  // unselect the deleted nodetype
                  $scope.$parent.datamodel.openItem = null
                  $scope.$parent.datamodel.itemSelected = false
                  $scope.$parent.datamodel.packageSelected = false
                  $scope.$parent.datamodel.methodSelected = false
                })
                .catch((e) => {
                  console.error(e);
                })
            }).catch((error) => {
              console.error(error);
            });
        } else {
          console.info(`${$scope.nodetype.name} nodetype deletion cancelled`);
        }
      })
    };

    /**
     * updateNodetypeMeta
     * @param {*} property 
     * @param {*} value 
     */
    $scope.updateNodetypeMeta = (property, value) => {
      datamodelModel.nodetypes.updateMetadata(
        $scope.nodetype.id,
        property,
        value
      ).catch(function (err) {
        Notification.error({ title: 'Nodetype Update failed', message: err.message });
        console.error(err);
        // alert message and restore values
      }).then(function (result) {
        Notification.success({ message: 'Nodetype Updated', replaceMessage: true });
        switch (property) {
          case "versionnable":
            if (value) {
              $scope.nodetype.changeMethod = 'manual';
              $scope.updateNodetypeMeta('changeMethod', 'manual');
            } else {
              $scope.nodetype.changeMethod = '';
              $scope.updateNodetypeMeta('changeMethod', '');
            }
          default:
            break;
        }
      })
    }

    /**
     * resetNodesAccess
     * @param {*} nodetypeName 
     */
    $scope.resetNodesAccess = (nodetypeName) => {
      Swal.fire({
        title: `Impact Existing Data ?`,
        text: "Should we apply the change to every existing instance?",
        type: 'warning',
        showCancelButton: true,
      }).then((result) => {
        if (result.value) {
          // apply to all existing instance
          datamodelModel.nodetypes.updatePermissions(nodetypeName)
            .then((result) => {
              Notification.success('Access Updated');
            })
            .catch((e) => {
              console.error(e)
              Notification.error('Access Not Updated');
              // alert message and restore values
            })
        }
      })
    }

    /**
     * updateNodesStateConfig
     * @param {*} nodetype 
     */
    $scope.updateNodesStateConfig = (nodetype) => {
      Swal.fire({
        title: `Warning: This will update all ${nodetype} state configuration`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete it'
      }).then((result) => {
        if (result.value) {
          datamodelModel.nodetypes.updateNodesStateConfig(nodetype)
            .then((result) => {
              if (result.status === 200) {
                Notification.success({ title: 'Updated', message: result.data.message, delay: 3000 })
              } else {
                Notification.error({ title: 'Error', message: result.data.message, delay: 3000 })
              }
            })
            .catch(e => console.error(e))
        }
      });
    };

    /**
     * updateCodificationCounter
     * @param {*} nodetype 
     */
    $scope.updateCodificationCounter = async (nodetype) => {
      await Swal.fire({
        title: 'Add new counter below',
        input: 'number',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'Please enter a valid integer number';
          }
          const intValue = _.toInteger(value);
          datamodelModel.nodetypes.updateCodificationCounter(nodetype, intValue)
            .then((result) => {
              if (result.status === 200) {
                Notification.success({ title: 'Updated', message: result.data.message || "Counter Updated", delay: 3000 })
              } else {
                Notification.error({ title: 'Error', message: result.data.message || "Counter Update Failed", delay: 3000 })
              }
            })
            .catch(e => console.error(e))
        }
      })
    }

    /**
     * translateUIGrid
     * @param {*} nodetype 
     */
    $scope.translateUIGrid = (nodetype) => {
      Swal.fire({
        title: `Are you sure you want to update the default translate file?`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete it'
      }).then((result) => {
        if (result.value) {
          data.nodes.translateUIGrid(nodetype)
            .then((result) => {
              if (result.status === 200) {
                Notification.success({ title: 'Updated', message: 'Default language file updated', delay: 3000 })
              } else {
                Notification.error({ title: 'Error', message: result.data.message, delay: 5000 })
              }
            })
            .catch(e => console.error(e))
        }
      })
    }

    /**
     * clearNodetypeTranslation
     * @param {*} nodetypeName 
     */
    $scope.clearNodetypeTranslation = (nodetypeName) => {
      Swal.fire({
        title: `Are you sure you want to clear language files?`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete it'
      }).then((result) => {
        if (result.value) {
          data.nodes.clearNodetypeTranslation(nodetypeName)
            .then((result) => {
              if (result.status === 200) {
                Notification.success({ title: 'Updated', message: 'Language files updated' })
              } else {
                Notification.error({ title: 'Error', message: result.data.message })
              }
            })
            .catch(e => console.error(e))
        }
      })
    }

    /**
     * updateNodetypeNameInTranslation
     * Update Nodetype Menu Name in translation file
     */
    $scope.updateNodetypeNameInTranslation = () => {
      datamodelModel.translations.update('default', {
        path: `default.nodetype.${$scope.nodetype.name}`,
        value: $scope.nodetype.name,
      })
        .then((result) => {
          if (result.status === 200) {
            Notification.success('Nodetype Menu Name updated in translation file');
          } else {
            Notification.error('Nodetype Menu Name not updated in translation file');
          }
        })
        .catch((error) => {
          Notification.error('Nodetype Menu Name not updated in translation file');
        })
    }
    /**
     * translateProps
     */
    $scope.translateProps = async () => {
      $scope.$emit('translateUpdatedProps');
    };


    //    _                                                  _         _     
    //   | |                                                | |       | |    
    //  / __) ___   ___  ___   _ __    ___  __      __ __ _ | |_  ___ | |__  
    //  \__ \/ __| / __|/ _ \ | '_ \  / _ \ \ \ /\ / // _` || __|/ __|| '_ \ 
    //  (   /\__ \| (__| (_) || |_) ||  __/ _\ V  V /| (_| || |_| (__ | | | |
    //   |_| |___/ \___|\___/ | .__/  \___|(_)\_/\_/  \__,_| \__|\___||_| |_|
    //                        | |                                            
    //    


    // Thumbnail Uploader
    $scope.$watch('files', () => {
      $scope.upload($scope.files);
    });
    $scope.$watch('file', () => {
      if ($scope.file != null) {
        $scope.files = [$scope.file];
      }
    });

    $scope.$watch('datamodel.openItem.name', () => {
      $scope.$emit('translateUpdatedProps');
      $scope.nodetype = $scope.datamodel.openItem;
        // fix top window scroll
      window.setTimeout(() => {
        $('.nav-tabs li a').click(function (e) {
          e.preventDefault()
          e.stopImmediatePropagation()
          $(this).tab('show')
        })
      }, 100);
    });

    //  _____         _  _   
    // |_   _|       (_)| |  
    //   | |   _ __   _ | |_ 
    //   | |  | '_ \ | || __|
    //  _| |_ | | | || || |_ 
    // |_____||_| |_||_| \__|


  });
