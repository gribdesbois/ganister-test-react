angular.module("app.ganister.searchPanel", [
  'agGrid',
  'app.ganister.tool.aggrid',
  'app.ganister',
  'chart.js',
])
  .controller('searchController', function ($rootScope, $scope, datamodelModel, nodesModel, helperFunctions) {


    $scope.$on('datamodelLoaded', () => {
      $scope.nodetypes = $rootScope.datamodel.nodetypes.filter(nodetype => nodetype.elementType === 'node');
      $scope.properties = [];
      $scope.searchNodetypes = [];
      $scope.searchTerm = '';
      $scope.searchMaxResults = 100;
      $scope.searchOperator = 'AND';
      $scope.searchCriterias = {};
      $scope.searchResults = [];
      $scope.advancedSearch = false;
      $scope.searchResultMessage = '';
    })

    $scope.changeAdvancedSearch = (bool) => {
      $scope.nodetypes = $rootScope.datamodel.nodetypes.filter(nodetype => nodetype.elementType === 'node');
      $scope.advancedSearch = bool;
    }
    $scope.$on('simpleSearch', (events, searchTerm) => {
      $scope.searchTerm = searchTerm;
      $scope.search('simple');
    })

    $scope.clear = () => {
      $scope.searchResultMessage = '';
      $scope.searchResults = [];
    }

    $scope.addSearchCriteria = (criteria) => {
      const criteriasLength = Object.keys($scope.searchCriterias).length;
      $scope.searchCriterias[criteriasLength] = criteria;
    }

    $scope.search = async (type) => {
      $scope.searchResultMessage = 'Searching...';
      $scope.searchResults = [];
      if (!$scope.searchMaxResults) {
        $scope.searchMaxResults = 100;
      }
      if (!$scope.searchOperator) {
        $scope.searchOperator = 'AND';
      }
      if (type === 'simple') {
        $scope.searchCriterias = {};
        $scope.searchNodetypes = [];
        const searchParams = { type: 'contains', filterType: 'text', property: 'all', filter: $scope.searchTerm }
        const criteriasLength = Object.keys($scope.searchCriterias).length;
        $scope.searchCriterias[criteriasLength] = searchParams;
      }

      const nodetypeNames = $scope.searchNodetypes.map((n) => n.name)
      const params = {
        searchCriterias: $scope.searchCriterias,
        nodetypes: nodetypeNames,
        maxResults: $scope.searchMaxResults,
        operator: $scope.searchOperator,
      }
      const nodes = await nodesModel.searchNodes(params);
      if (!nodes) {
        $scope.searchResultMessage = 'Error';
        return;
      }

      $scope.searchResults = nodes;
      $scope.searchResults.map(async (searchResult) => {
        const { _thumbnail } = searchResult.properties;
        if (_thumbnail) {
          const response = await nodesModel.generatePublicURL(_thumbnail._id);
          if (!response.error) {
            searchResult.properties._thumbnail.properties.publicUrl = response.url;
          }
        } else {
          searchResult.properties._thumbnail = {
            properties: {
              publicUrl: await helperFunctions.getNodeIconUrl(searchResult._type),
            },
          }
        }
        return searchResult;
      })

      $scope.searchResultMessage = nodes.length;
    }

    $scope.matchingTypes = ['contains', 'exact', 'startsWith', 'endsWith', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'];
    $scope.filterTypes = ['text', 'number', 'boolean'];

    $scope.emptyNodetypeSelection = () => {
      $scope.searchNodetypes = [];
      $scope.nodetypes.forEach(nt => {
        nt.selected = false;
      });
      $scope.refrechPropertyList();
    }
    $scope.fillNodetypeSelection = () => {
      $scope.searchNodetypes = [];
      $scope.nodetypes.forEach(nt => {
        nt.selected = true;
        $scope.searchNodetypes.push(nt);
      });
      $scope.refrechPropertyList();
    }
    $scope.changeNodetypeSelection = (nodetype) => {
      nodetype.selected = !nodetype.selected;
      if (!nodetype.selected) {
        $scope.searchNodetypes = _.reject($scope.searchNodetypes, { 'name': nodetype.name });
      } else {
        $scope.searchNodetypes.push(nodetype);
      }
      $scope.refrechPropertyList();
    }

    $scope.refrechPropertyList = () => {
      const properties = [];
      $scope.searchNodetypes.map(nodetype => nodetype.properties.map(i => properties.push(i.name)));
      $scope.properties = [...new Set(properties)];
      $scope.properties.push('all');
    }

    $scope.removeSearchCriteria = (sc) => {
      $scope.searchCriterias.splice($scope.searchCriterias.indexOf(sc), 1);
    }

    $scope.openNode = (_type, _id) => { $rootScope.$broadcast('openNode', { _id, _type }) };

  })