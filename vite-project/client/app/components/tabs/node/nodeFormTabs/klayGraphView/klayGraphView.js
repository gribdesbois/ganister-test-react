/* global angular, _, document, google */
angular.module('app.ganister.tabs.node.nodeFormTabs.klayGraphView', [
  'ui-notification',
  'app.ganister.tool.aggrid',
  'app.ganister.models.nodetypes',
  'app.ganister.shared.modals.relationshipModal',
])
  .controller('klayGraphViewController', async ($scope, $rootScope, Notification, plmModel, nodesModel, helperFunctions) => {

    //#region EVENT LISTENERS

    const setEventListeners = () => {
      // custom double-click event listener on nodes in klay graph
      let tappedBefore;
      let tappedTimeout;
      $scope.cy.on('tap', (event) => {
        // set 'doubletap trigger'
        const tappedNow = event.target;
        if (tappedTimeout && tappedBefore) {
          clearTimeout(tappedTimeout);
        }
        if (tappedBefore === tappedNow) {
          tappedNow.trigger('doubleTap');
          tappedBefore = null;
        } else {
          tappedTimeout = setTimeout(function () { tappedBefore = null; }, 300);
          tappedBefore = tappedNow;

          // callback on 'tap'
          const node = event.target.data();
          if (node._id) {
            $scope.selectedNode = node;
            $scope.$apply();
          }
        }
      });

      $scope.cy.on('doubleTap', (event) => {
        const node = event.target.data();
        const emptyNode = Object.entries(node).length === 0;

        if (!emptyNode) {
          $rootScope.$broadcast('openNode', node);
          $scope.$apply();
        }
      });
    };

    //#endregion EVENT LISTENERS

    const layoutOptions = {
      name: 'klay',
      // initial viewport state:
      zoom: 1,
      pan: { x: 40, y: 20 },
      fit: true,
      wheelSensitivity: 0.2,
      randomize: false,
      klay: {
        direction: 'RIGHT',
        nodePlacement: 'INTERACTIVE',
        edgeSpacingFactor: 2,
        spacing: 30,
      }
    };

    const getRelatedAssignments = async (project) => {
      // looking for relationship between assignments, e.g. (assignment)-[:hasPredecessor]->(assignment)
      const assignmentNodetypeId = $scope.rel._definition.directions[0].target; // will not work with multiple source/target relationships
      const assignmentRelationship = $rootScope.datamodel.nodetypes.find((nodetype) => {
        const { elementType, hidden, directions = [] } = nodetype;
        if (elementType !== 'relationship' || hidden) return;

        const direction = directions.find((d) => {
          return d.source === assignmentNodetypeId && d.target === assignmentNodetypeId;
        });
        return direction;
      });

      const relationshipsNames = [$scope.rel._definition.name, assignmentRelationship.name];
      const relationships = await nodesModel.searchRelationships(project, { relationships: relationshipsNames }, { recursive: true });
      if (!relationships) return;

      const nodes = [];
      const edges = [];
      
      relationships.forEach((relationship) => {
        const { _type, _id, source, target } = relationship;

        const hasPredecessor = source._type === target._type;
        const nodeData = hasPredecessor ? source : target;
        
        const node = {
          data: {
            id: nodeData._id,
            ...nodeData,
            _relationshipType: _type,
            _relationshipId: _id,
          }
        };
        nodes.push(node);

        if (!hasPredecessor) return;
        if (source._id === target._id) return;

        const predecessor = {
          data: {
            id: target._id,
            ...target,
          }
        };
        nodes.push(predecessor);

        const edge = {
          data: {
            id: _id,
            source: target._id,
            target: source._id,
          },
        };
        edges.push(edge);
      });

      $scope.relatedNodesNumber = _.uniqBy(nodes, 'data.id').length;
      $scope.nodes = nodes;
      $scope.edges = edges;
    };

    $scope.loadKlayView = async () => {
      await getRelatedAssignments($scope.node);
      if (!$scope.nodes || !$scope.edges) return;

      $scope.cy = cytoscape({
        container: document.getElementById(`klayGraphViewDiv-${$scope.rel.relationships}-${$scope.node._id}`),
        elements: {
          nodes: $scope.nodes,
          edges: $scope.edges,
        },
        style: [
          {
            selector: 'node',
            style: {
              'shape': 'round-rectangle',
              'z-index': 2,
              'background-color': '#337ab7',
              'border-width': 0,
              'background-opacity': .8,
              'width': 100,
              'height': 75,
              'font-size': 16,
              'font-weight': 'bold',
              'background-width': 140,
              'background-height': 140,
              'text-valign': "center",
              'text-wrap': "wrap",
              'label': 'data(properties.name)'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 6,
              'background-opacity': 0.8,
              'text-wrap': 'wrap',
              'line-color': '#aaa',
              'target-arrow-color': '#000',
              'target-arrow-shape': 'triangle',
              'source-arrow-color': '#000',
              'z-index': 1,
              'curve-style': 'bezier',
              'control-point-step-size': '150px',
              'text-rotation': 'autorotate',
              'text-margin-y': '-15px',
            }
          },
          {
            selector: 'node:selected',
            style: {
              'background-color': '#5cc85c',
            }
          },
          {
            selector: 'node.obfuscated',
            style: {
              'background-opacity': .5,
            }
          },
        ],
        layout: layoutOptions,
        maxZoom: 3,
        minZoom: .1,
      });
      $scope.cy.layout(layoutOptions).run();

      $scope.$emit("objCountUpdate", $scope.rel.name, $scope.relatedNodesNumber);
      setEventListeners();
    };

    $scope.addAsRelationship = () => {
      $rootScope.$broadcast('openRelModal', $scope.rel.id, $scope.node._id, $scope.node.properties._version);
    };

    $scope.handleAttachedNode = async () => {
      await $scope.loadKlayView();
    };

    $scope.createAsRelationship = async () => {
      const targetNodetype = $rootScope.datamodel.nodetypes.find((nodetype) => {
        const { directions = [] } = $scope.rel._definition;
        return directions.find((d) => d.source === $scope.nodetype.id && d.target === nodetype.id);
      });

      const params = {
        _type: targetNodetype.name,
        properties: {},
      };

      await helperFunctions.runTriggeredMethods('beforeCreate', params, $scope);

      const mandatoryFields = await helperFunctions.askMandatoryFields(targetNodetype, params.properties);
      if (!mandatoryFields) {
        return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
      }

      params.properties = { ...params.properties, ...mandatoryFields };
      const lock = !!$scope.rel.openOnCreation;

      const node = await nodesModel.addNode(params, lock);
      if (!node) return;

      await helperFunctions.runTriggeredMethods('afterCreate', node, $scope);

      const relationship = await nodesModel.attachNode($scope.node, node, $scope.rel._definition);
      if (relationship) $scope.loadKlayView();
    };

    $scope.detach = async () => {
      const { _id, _relationshipType, _relationshipId } = $scope.selectedNode;

      const params = {
        _type: _relationshipType,
        _id: _relationshipId,
        source: $scope.node,
      };
      const result = await nodesModel.deleteRelationship(params);
      if (!result) return;

      Notification.success({ message: 'Relationship removed' });
      $scope.cy.remove(`node[id = '${_id}']`);
    };

    $scope.detachAndDelete = async () => {
      try {
        const { _id, _relationshipType, _relationshipId } = $scope.selectedNode;

        const params = {
          _type: _relationshipType,
          _id: _relationshipId,
          source: $scope.node,
        };
        const detached = await nodesModel.deleteRelationship(params);
        if (!detached) return;

        const result = await nodesModel.deleteNode($scope.selectedNode);
        if (!result) return;

        $scope.cy.remove(`node[id = '${_id}']`);
        Notification.success({ message: 'Node Deleted' });
      } catch (error) {
        console.error(error);
        Notification.error({ title: 'Node Error', message: error.message });
      }
    };
    //  _       _ _   
    // (_)     (_) |  
    //  _ _ __  _| |_ 
    // | | '_ \| | __|
    // | | | | | | |_ 
    // |_|_| |_|_|\__|

    //#region init

    await $scope.loadKlayView();

    ////#endregion init

    $scope.$on('refreshTabContent', () => {
      $scope.loadKlayView();
    })
  })