angular.module("app.ganister.tabs.node.nodeFormTabs", [])
    .controller('nodeformTabsController', function ($scope, $rootScope, nodesModel) {

        // #region FUNCTION
        // #endregion

        // #region $SCOPE.FUNCTIONS
        $scope.selectTab = function (index, rel) {
            $scope.selectedTab = index;
            $scope.$broadcast('nodeformTabSelection', { index, rel });
        }

        $scope.refreshNodeTabs = () => {
            $scope.$broadcast('refreshTabContent');
            return;
        }
        $scope.loadingTabs = () => {
            if ($scope.tabsLoaded) {
                return;
            }
            $scope.tabsDefinition = JSON.parse(JSON.stringify($scope.nodetype.ui.tabs));
            $scope.rels = $scope.tabsDefinition.map((tab, index) => {
                tab._definition = null;
                tab.visibility = true;
                if (tab.conditionalDisplay) {
                    const statement = eval(`$scope.${tab.conditionalDisplay}`);
                    if (!statement) tab.visibility = false;
                }
                if (tab.visibility && $scope.selectedTab == null) {
                    $scope.selectedTab = index;
                }
                switch (tab.tabContentType) {
                    case "relatedObject":
                    case "fileGallery":
                    case "klayGraphView":
                    case "kanbanView":
                    case "ganttView":
                    case "undirectedRelationship":
                        if (!tab.relationships) {
                            return false;
                        }
                        tab._definition = _.find($rootScope.datamodel.nodetypes, { "id": tab.relationships });
                        break;
                    case "multilevelView":
                    case "reverseRelationships":
                        if (!tab.relationships) {
                            return false;
                        }
                        tab._definition = tab.relationships.map((rel) => {
                            return _.find($rootScope.datamodel.nodetypes, { "id": rel })
                        })
                        break;
                    case "ECOimpactMatrix":
                    default:
                        tab._definition = null
                        break;
                }
                tab._instances = [];
                tab.label = `nodetype.${$scope.node._type}.${tab.name}`;
                return tab;
            }).filter((tab) => tab);
            $scope.tabsLoaded = true;
        }
        // #endregion

        // #region INIT
        // retrieve rels from datamodel 
        $scope.relCount = [];
        $scope.nodetype = _.find($rootScope.datamodel.nodetypes, { "name": $scope.node._type })
        $scope.rels = [];
        $scope.selectedTab = null;
        $scope.tabsLoaded = false;
        const currentTab = $rootScope.appContext.user.appSession.openNodes.find((t) => t._id === $scope.node._id && t._version === $scope.node._version);
        if (currentTab._ui && currentTab._ui.isActive) {
            $scope.loadingTabs();
        }
        // #endregion

        // #region WATCHES (Object Watcher)
        // #endregion

        // #region ON (Event Listener)

        $scope.$on("objCountUpdate", (evt, relName, Count) => {
            $scope.rels.forEach((rel) => {
                if (rel.name === relName) {
                    $scope.relCount[relName] = Count;
                }
            })
        });
        $scope.$on('loadTabs', (events, data, forceReload = false) => {
            if (data._id === $scope.node._id && data._version === $scope.node._version) {
                if (forceReload) $scope.tabsLoaded = false;
                $scope.loadingTabs();
            }
        });
        $scope.$on('refreshNodeTabs', (events, data) => {
            if (data._id === $scope.node._id && data._version === $scope.node._version) {
                $scope.refreshNodeTabs();
            }
        });
        // #endregion
    })