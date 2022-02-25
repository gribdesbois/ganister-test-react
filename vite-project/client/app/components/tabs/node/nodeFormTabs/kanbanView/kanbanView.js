/* global angular, _, document, google */
angular.module('app.ganister.tabs.node.nodeFormTabs.kanbanView', [
  'dndLists',
  'ui-notification',
  'app.ganister.models.nodetypes',
  'app.ganister.shared.modals.relationshipModal',
])
  .controller('kanbanViewController', ($scope, $rootScope, Notification, nodesModel, helperFunctions) => {
    $scope.kanbanSuccess = true;
    $scope._showKanbanLists = false;
    $scope._kanbanListsArray = [{ name: 'Unassigned', nodes: [] }];
    $scope._kanbanLists = [];

    //  If No KanbanCard Design exists, show a default card
    const defaultCard = `
      <div class="row">
        <div class="col-xs-12">
          <h4 style="font-weight: 600">{{node.properties._labelRef}}
            <a href="#" class="close" aria-label="close" ng-click="updateKanbanValue(node,'')">&times;</a>
          </h4>
        </div>
      </div>
    `;
    $scope.cardRenderer = $scope.rel.kanbasCard || defaultCard;

    //  Find KanbanProperty from tab setup in rel
    const kanbanProperty = $scope.node._typeObject.properties.find((p) => p.id === $scope.rel.property);
    if (!kanbanProperty) {
      $scope.kanbanErrorMsg = 'No kanban property exists';
      $scope.kanbanSuccess = false;
    }

    const generateKanbanListsArray = () => {
      $scope._kanbanLists = $scope.node.properties[kanbanProperty.name];
      if (!$scope._kanbanLists) return;
      
      try {
        $scope._kanbanLists
          .split(',')
          .forEach((name) => {
            const list = { name: name.trim(), nodes: [] };
            const existingList = $scope._kanbanListsArray.find((l) => l.name === list.name);
            if (!existingList) $scope._kanbanListsArray.push(list);
          });
      } catch (error) {
        console.error(error);
        $scope.kanbanErrorMsg = 'Cannot read Kanban Lists json correctly';
        $scope.kanbanSuccess = false;
      }
    }

    //  Show/Hide kanbanListView Setup
    $scope.toggleKanbanListSetup = () => $scope._showKanbanLists = !$scope._showKanbanLists;

    $scope.saveKanbanListSetup = async () => {
      const params = { ...$scope.node };
      params[kanbanProperty.name] = $scope._kanbanLists;
      const node = await nodesModel.updateNode($scope.node);
      if (!node) return;

      $scope.node.properties[kanbanProperty.name] = $scope._kanbanLists;
      renderKanban();
    };

    const renderKanban = () => {
      generateKanbanListsArray();
      getNodes();
    };

    const getNodes = async () => {
      try {
        const relationships = await nodesModel.getRelationships($scope.node, $scope.rel._definition.name);
        if (!relationships) return;

        $scope.$emit("objCountUpdate", $scope.rel.name, relationships.length);

        const nodes = relationships.map((relationship) => {
          const { _type, _id, target } = relationship;
          const node = {
            ...target,
            _relationshipType: _type,
            _relationshipId: _id,
          };
          return node;
        });

        $scope._kanbanListsArray.forEach((list) => {
          list.nodes = nodes.filter((n) => n.properties._kanbanList === list.name)
        });

        const unassignedNodes = nodes.filter((n) => {
          const { _kanbanList } = n.properties;
          const undefinedKanbanProperty = !_kanbanList;
          const unassigned = _kanbanList && _kanbanList.toLowerCase() === 'unassigned';
          const list = $scope._kanbanListsArray.find((l) => l.name === _kanbanList);
          return undefinedKanbanProperty || unassigned || !list;
        });
        if (unassignedNodes.length > 0) {
          const unassignedList = $scope._kanbanListsArray.find((l) => l.name.toLowerCase() === 'unassigned');
          if (unassignedList) unassignedList.nodes = unassignedNodes;
        };
      } catch (error) {
        console.error(error);
        $scope.$emit("objCountUpdate", $scope.rel.name, 0);
      };
    };


    $scope.createAsRelationship = async (relationshipName) => {
      try {
        const targetNodetype = $rootScope.datamodel.nodetypes.find((nodetype) => {
          const { directions = [] } = $scope.rel._definition;
          return directions.find((d) => {
            return d.source === $scope.nodetype.id && d.target === nodetype.id;
          })
        });

        const nodeParams = {
          _type: targetNodetype.name,
          properties: {},
        };

        await helperFunctions.runTriggeredMethods('beforeCreate', nodeParams, $scope);

        const params = {
          _type: relationshipName,
          source: $scope.node,
        };
        
        const relMandatoryFields = await helperFunctions.askMandatoryFields($scope.rel._definition, params.properties);
        if (!relMandatoryFields) {
          return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
        }
  
        params.properties = { ...params.properties, ...relMandatoryFields };


        const mandatoryFields = await helperFunctions.askMandatoryFields(targetNodetype, nodeParams.properties);
        if (!mandatoryFields) {
          return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
        }

        nodeParams.properties = { ...nodeParams.properties, ...mandatoryFields };
        const lock = !!$scope.rel.openOnCreation;

        const node = await nodesModel.addNode(nodeParams, lock);
        if (!node) return;

        await helperFunctions.runTriggeredMethods('afterCreate', node, $scope);

        params.target = node;
    
        const relationship = await nodesModel.addRelationship(params);
        if (!relationship) return;

        $scope.handleAttachedNode();
      } catch (error) {
        console.error(error);
      }
    };

    $scope.updateKanbanValue = async (node, listName) => {
      const params = { ...node };
      params.properties._kanbanList = listName;
      
      const result = await nodesModel.updateNode(params);
      if (!result) return;

      // render kanban if it is not a move but an unassignment
      if (!listName) return renderKanban();
      Notification.success({ title: 'Success', message: `Kanban List Updated to ${listName}` });
    }

    $scope.dropCallback = (index, item, external, type, list) => {
      if (list.name === 'Unassigned') {
        $scope.updateKanbanValue(item, '');
      } else {
        $scope.updateKanbanValue(item, list.name);
      }
      return item;
    };

    $scope.openNode = (node) => {
      if (node && node._id) {
        $rootScope.$broadcast('openNode', { _id: node._id, _type: node._type });
      }
    };

    $scope.refresh = () => renderKanban();

    if ($scope.kanbanSuccess) renderKanban();

    $scope.addAsRelationship = () => {
      $rootScope.$broadcast('openRelModal', $scope.rel.id, $scope.node._id, $scope.node.properties._version)
    };

    $scope.handleAttachedNode = () => renderKanban();

    $scope.$on('refreshTabContent', () => {
      $scope.refresh();
    })
  });