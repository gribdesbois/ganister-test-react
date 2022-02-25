/* global angular */
angular.module('app.ganister.tabs', [
  'app.ganister.user.config',
  'app.ganister.models.nodes',
  'app.ganister.models.nodetypes',
  'ui.bootstrap.contextMenu',
])
  .controller('tabsController', function ($scope, $rootScope, userconf, nodesModel, datamodelModel, Notification, $translate, helperFunctions) {


    // #region FUNCTION
    // #endregion

    // #region $SCOPE.FUNCTIONS

    /**
     * 
     * @param {*} nodetype 
     */
    $scope.setCurrentNodetype = (nodetype) => {
      // set scope currentNode
      $scope.context.currentNodetype = nodetype;
      localStorage["ganister_currentNodetype"] = nodetype.name;
      $scope.activeTab('list');
    }


    $scope.buildNodetypesContextMenu = (dmCategories, dmNodetypes) => {

      let categories = [];
      $scope.ctxMenuOptions = [
        // NEW IMPLEMENTATION
        {
          text: 'Close',
          click: function ($itemScope, $event, modelValue, text, $li) {
            $scope.closeNode($itemScope.node);
          }
        },
        {
          text: 'Close All',
          click: function ($itemScope, $event, modelValue, text, $li) {
            $scope.removeAllNodes();
          }
        },
        {
          text: 'Close Others',
          click: function ($itemScope, $event, modelValue, text, $li) {
            $scope.removeOtherNodes($itemScope.node);
          }
        },
      ];

      dmCategories.forEach((category) => {
        if (!(category.hidden)) {
          let children = [];
          dmNodetypes.forEach((nodetype) => {
            if (nodetype.category === category.catid) {
              children.push({
                text: $translate.instant(`default.nodetype.${nodetype.name}`),
                click: function ($itemScope, $event, modelValue, text, $li) {
                  $scope.setCurrentNodetype(nodetype);
                }
              });
            }
          });
          categories.push({
            text: $translate.instant(`default.category.${category.name}`),
            children,
          });
        }
      });
      $scope.ctxMenuNodetypeList = categories;
    }


    /**
     * 
     * @param {*} tabArray 
     */
    $scope.openSavedTabs = (tabArray) => {
      if (tabArray) {
        for (tab of tabArray) {
          if (tab?.type){
            $scope.openTabById(tab.type, tab.id, true);
          }
        }
        // activate the latest selected item
        $scope.activeTab($scope.selectionMemory[$scope.selectionMemory.length - 1]);
      }
    }

    $scope.removeAllNodes = () => {
      let listOfNodes = $rootScope.appContext.user.appSession.openNodes.slice(0);
      listOfNodes.forEach((node) => {
        $scope.removeNodeFromOpenTabs(node);
      })
    }

    $scope.removeOtherNodes = (contextNode) => {
      let listOfNodes = $rootScope.appContext.user.appSession.openNodes.slice(0);
      listOfNodes.forEach((node) => {
        if (node._id !== contextNode._id) {
          $scope.removeNodeFromOpenTabs(node);
        }
      })
    }

    $scope.closeNode = (node) => {
      if (node.unsavedChanges) {
        Swal.fire({
          title: 'Unsaved Changes',
          text: "Are you sure you want to close node without saving?",
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, close node'
        }).then((result) => {
          if (result.value) {
            $scope.removeNodeFromOpenTabs(node);
            $scope.$apply();
          }
        })
      } else {
        $scope.removeNodeFromOpenTabs(node);
      }
    }

    $scope.removeNodeFromOpenTabs = (node) => {
      // pull the node to remove
      _.pull($rootScope.appContext.user.appSession.openNodes, node);
      _.pull($scope.selectionMemory, node);
      
      userconf.saveTabs($scope.selectionMemory);
      // open last activated tab from selection memory
      $scope.activeTab(_.last($scope.selectionMemory));
    }

    $scope.removeNode = (node) => {
      $scope.removeNodeFromOpenTabs(node);
      _.remove($scope.context.mainGridOptions.data, { _id: node._id });
      $scope.context.mainGridOptions.api.setRowData($scope.context.mainGridOptions.data);
      userconf.removeRecentItem(node._id);
    };


    /**
     * openTabByID
     * Opens a node form based on its type and ID
     * 
     * @param {string} nodeType - nodeType
     * @param {string} nodeId - node id
     * @param {string} init
     * 
     */
    $scope.openTabById = async (nodetype, nodeId, init = false) => {
      // TODO: make the following code reusable in a service
      const node = await nodesModel.getNode(nodetype, nodeId);
      if (!node) {
        $scope.tabLoading = $scope.tabLoading.filter(tab => tab !== nodeId);
        return;
      }

      node._typeObject = datamodelModel.getNodetype(nodetype);
      const { _version } = node.properties;
      if (_version) {
        node.properties._versionLabel = helperFunctions.filterSemVersionning(_version, node._typeObject);
      } else {
        node.properties._versionLabel = 'N/A';
      }
      helperFunctions.convertNodeDatesBackToMoment(node._typeObject, node.properties);


      $scope.tabLoading = $scope.tabLoading.filter(tab => tab !== nodeId);
      $scope.openNode(node, init);
    };

    /**
     * openNode
     * Opens a node based on its object
     * @param {object} node
     * @param {string} init
     */
    $scope.openNode = (node, init = false) => {
      if (node && !node._ui) {
        node._ui = {};
      }
      if ($rootScope.appContext.user.appSession) {
        const openedNodes = $rootScope.appContext.user.appSession.openNodes;
        let openedNode = openedNodes.find((n) => {
          return n._id === node._id && n.properties._version === node.properties._version;
        });
        if (openedNode === undefined) {
          $rootScope.appContext.user.appSession.openNodes.push(node);
        } else {
          openedNode = node;
        }
        // activate the opened node
        $rootScope.appContext.user.appSession.openNodes = $rootScope.appContext.user.appSession.openNodes.map(function (item) {
          if (!item._ui) {
            item._ui = {};
          }
          if (node._id === item._id && node.properties._version === item.properties._version) {
            if (!init) {
              item._ui.isActive = true;
            }
          } else {
            item._ui.isActive = false;
          }
          item._typeObject = datamodelModel.getNodetype(item._type);
          return item;
        });
        if (!init) {
          $scope.activeTab(node);
        }

      }

      // update the selection memory only if this is not initialisation
      if (!init) {
        // desactivate List
        $rootScope.appContext.user.appSession.listActive = false;
        $rootScope.appContext.user.appSession.dashActive = false;
        $rootScope.appContext.user.appSession.searchActive = false;
      }
      $scope.updateSelectionMemory(node, init)
    }

    $scope.activeTab = function (node) {
      // check if node selected is list
      if ($rootScope.appContext.user.appSession) {
        switch (node) {
          case "list":
            if (!$rootScope.appContext.user.appSession.listLoaded) {
              let nodetypeName = "part";
              if (localStorage["ganister_currentNodetype"]) {
                nodetypeName = localStorage["ganister_currentNodetype"];
              }
              if ($scope.datamodel.nodetypes.findIndex((nt) => nt.name === nodetypeName) < 0) {
                nodetype = datamodelModel.getNodetype('part');
              } else {
                nodetype = datamodelModel.getNodetype(nodetypeName);
              }
              $scope.context.currentNodetype = nodetype;
            }
            $rootScope.appContext.user.appSession.dashActive = false;
            $rootScope.appContext.user.appSession.searchActive = false;
            $rootScope.appContext.user.appSession.listActive = true;
            break;
          case "dashboard":
            $rootScope.appContext.user.appSession.dashActive = true;
            $rootScope.appContext.user.appSession.searchActive = false;
            $rootScope.appContext.user.appSession.listActive = false;
            break;
          case "searchPanel":
            $rootScope.appContext.user.appSession.dashActive = false;
            $rootScope.appContext.user.appSession.searchActive = true;
            $rootScope.appContext.user.appSession.listActive = false;
            break;
          default:
            $rootScope.appContext.user.appSession.dashActive = false;
            $rootScope.appContext.user.appSession.searchActive = false;
            $rootScope.appContext.user.appSession.listActive = false;
            break;
        }

        // set tab state based on the node selected
        $rootScope.appContext.user.appSession.openNodes = $rootScope.appContext.user.appSession.openNodes.map((item) => {
          if (node._id === item._id && node.properties._version === item.properties._version) {
            item._ui.isActive = true;
            $rootScope.$broadcast('tabOpened', node);
          } else {
            item._ui.isActive = false;
          }
          return item;
        });
        $rootScope.$broadcast('loadTabs', node);
      }
      // update the selection memory
      $scope.updateSelectionMemory(node);
    };
    $scope.updateSelectionMemory = (node, init = false) => {
      let index;
      if (['list', 'dashboard', 'searchPanel'].includes(node)) {
        index = $scope.selectionMemory.findIndex(item => item = node);
      } else {
        if (!node._id) return;
        index = $scope.selectionMemory.findIndex(item => item._id === node._id && item.properties._version === node.properties._version);
      }

      if (index !== -1) {
        $scope.selectionMemory.splice(index, 1);
      }
      $scope.selectionMemory.push(node);
      userconf.saveTabs($scope.selectionMemory);
      if (!init) {
        userconf.saveRecentItems(node);
      }
    }



    // #endregion

    // #region INIT



    $scope.selectionMemory = ['dashboard'];
    $scope.tabLoading = [];
    $scope.$on('datamodelLoaded', () => {
      $scope.dmCategories = $rootScope.datamodel.categories;
      $scope.dmNodetypes = $rootScope.datamodel.nodetypes;
      $scope.buildNodetypesContextMenu($scope.dmCategories, $scope.dmNodetypes);
      $scope.openSavedTabs(userconf.loadTabs());
    });
    // #endregion

    // #region WATCHES (Object Watcher)
    // #endregion

    // #region ON (Event Listener)


    // When node is remove
    $rootScope.$on('removeNode', function (event, data) {
      $scope.removeNode(data);
    })

    // When node is reloaded
    $scope.$on('reloadNode', function (event, data) {
      $scope.removeNodeFromOpenTabs(data);
      $scope.openTabById(data._type, data._id);
    })

    // When node is loaded
    $scope.$on('openNode', function (event, data) {
      const nodetypeDM = $rootScope.datamodel.nodetypes.find((n) => n.name === data._type);
      if (nodetypeDM.formDisabled) {
        return Notification.info({
          title: 'Cannot Open Node',
          message: `The form is disabled for ${data._type}`,
        });
      }
      $scope.tabLoading.push(data._id);
      $scope.openTabById(data._type, data._id);
    });

    // When Tab is activated
    $scope.$on('activeTab', function (event, node) {
      $scope.activeTab(node);
    });

    // When Translation is updated
    $rootScope.$on('$translateChangeSuccess', () => {
      if ($scope.dmCategories && $scope.dmNodetypes) $scope.buildNodetypesContextMenu($scope.dmCategories, $scope.dmNodetypes);
    });
    // #endregion



  });
