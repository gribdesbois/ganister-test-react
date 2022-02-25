angular.module('app.ganister.tabs.node.nodeFormTabs.graphView', [
  'ui-notification',
  'app.ganister.shared.modals.relationshipModal',
  'app.ganister.tool.helperFunctions',
  'app.ganister.models.nodetypes',
  'app.ganister.shared.modals.contextualAttachNodeModal',
])
  .controller('graphViewController', async ($scope, $rootScope, nodesModel, $translate, datamodelModel, Notification, helperFunctions) => {


    $scope.convertNode = (node) => {
      const nodeClass = node._id === $scope.node._id ? 'source' : '';
      return {
        group: 'nodes',
        data: {
          id: node._id,
          _id: node._id,
          _type: node._type,
          class: node._type,
          name: node.properties.name || node.properties._ref,
          properties: node.properties,
          image: datamodelModel.getNodetype(node._type).ui.defaultThumbnail,
        },
        classes: [nodeClass],
      }
    }

    $scope.convertEdge = (rel) => {
      return {
        group: 'edges',
        data: {
          id: rel._id,
          class: rel._type,
          source: rel.source._id,
          linkName:  helperFunctions.getRelationshipLinkName(rel._type),
          target: rel.target._id,
          properties: rel.properties,
        },
      }
    }

    const graphConfig = {
      name: 'dagre',
      rankDir: 'LR',
      animate: true,
      spacingFactor: 1.5,
    }

    $scope.loadView = async () => {

      // retrieve nodes and rels
      const resultNodes = await nodesModel.getGraphView($scope.node, $scope.rel.name);
      console.log('resultNodes', resultNodes)

      // convert result

      const nodes = resultNodes.data.nodes.map(node => {
        return $scope.convertNode(node);
      })

      const edges = resultNodes.data.relationships.map(rel => {
        return $scope.convertEdge(rel);
      })


      $scope.graph = cytoscape({
        boxSelectionEnabled: false,
        userPanningEnabled: true,
        userZoomingEnabled: true,
        selectionType: 'single',
        container: document.getElementById(`graphView-${$scope.node._id}-${$scope.rel.id}`),
        style: [
          {
            selector: 'node',
            style: {
              content: 'data(label)',
              shape: 'round-rectangle',
              width: 150,
              height: 150,
              'background-width': '80%',
              'background-height': '80%',
              'text-wrap': 'wrap',
              'label': 'data(name)',
              'text-max-width': 100,
              'transition-property': 'background-color, line-color, target-arrow-color,width,height',
              'transition-duration': '0.3s',
              'background-image': 'data(image)',
              'background-width': 128,
              'background-height': 128,
              'background-opacity': 0,
              'text-wrap': "wrap",
              'text-valign': "bottom",
              'border-width': 0,
              'border-color': '#111'
            }
          },
          {
            selector: ':selected',
            style: {
              'border-color': '#337ab7',
              'border-width': 8,
            }
          },
          {
            selector: 'node.source',
            style: {
              'border-color': '#22AA66',
              'border-width': 5,
            }
          },
          {
            selector: 'edge',
            style: {
              'curve-style': 'bezier',
              width: 2,
              'label': 'data(linkName)',
              'text-rotation': 'autorotate',
              'target-arrow-shape': 'triangle',
              'line-color': '#7d9aca',
              'target-arrow-color': '#7d9aca',
              'arrow-scale': '1',
            }
          },
          {
            selector: 'edge.inbound',
            style: {
              'width': 15,
              'line-color': '#5bc0de',
              'target-arrow-color': '#5bc0de',
            }
          },
          {
            selector: 'edge.outbound',
            style: {
              'width': 15,
              'line-color': '#5cb85c',
              'target-arrow-color': '#5cb85c',
            }
          },
          {
            selector: 'node.outbound',
            style: {
              'border-color': '#d9534f',
              'border-width': 3,
            }
          },
          {
            selector: 'node.inbound',
            style: {
              'border-color': '#f0ad4e',
              'border-width': 3,
            }
          },
        ],
        elements: [...nodes, ...edges],
        wheelSensitivity: 0.2,
        boxSelectionEnabled: true,
        maxZoom: 3,
        minZoom: .2,
        layout: graphConfig
      });

      $scope.runLayout = (direction) => {
        graphConfig.rankDir = direction;
        $scope.graph.layout(graphConfig).run();
      }

      const graphCommands = [
        { // example command
          fillColor: '#337ab7', // optional: custom background color for item
          content: '<i class="fas fa-expand-arrows-alt"></i> Expand', // html/text content to be displayed in the menu
          select: (ele) => { // a function to execute when the command is selected
            // `ele` holds the reference to the 
            // display all direct relationships
            nodesModel.getRelationships(ele.data()).then(result => {

              // lock every node in the graph
              $scope.graph.nodes().forEach(node => {
                node.locked(true);
              });

              result.forEach(element => {
                // check if the node is already in the graph
                const checkNode = $scope.graph.getElementById(element.target._id);
                if (checkNode.length > 0) return;
                // add node to graph
                const node = $scope.convertNode(element.target);
                $scope.graph.add(node);
                // check if the edge is already in the graph
                const checkEdge = $scope.graph.getElementById(element._id);
                if (checkEdge.length > 0) return;
                // add edge to graph
                const edge = $scope.convertEdge(element);
                $scope.graph.add(edge);

              });
              console.log(result)
              // run graph layout
              $scope.graph.layout(graphConfig).run();
              $scope.selectNode(ele);
            })

          },
          enabled: (ele) => { // a function that returns a boolean, whether this command is enabled for the given element
            return true;
          },
        },
        // { // example command
        //   fillColor: '#5bc0de', // optional: custom background color for item
        //   content: '<i class="fas fa-expand"></i> Expand On Relationship', // html/text content to be displayed in the menu
        //   select: (ele) => { // a function to execute when the command is selected
        //     console.log("LOG / file: graphView.js / line 175 / $scope.loadView= / ele", ele);
        //     // `ele` holds the reference to the 
        //     // get ele relationships
        //     // display modal
        //     // display relationships selected
        //   },
        //   enabled: (ele) => { // a function that returns a boolean, whether this command is enabled for the given element
        //     return true;
        //   },
        // },
        { // example command
          fillColor: '#d9534f', // optional: custom background color for item
          content: '<i class="fas fa-eraser"></i> Remove from View', // html/text content to be displayed in the menu
          select: (ele) => { // a function to execute when the command is selected
            // `ele` holds the reference to the 
            // remove ele
            $scope.graph.$(':selected').remove();
          },
          enabled: (ele) => { // a function that returns a boolean, whether this command is enabled for the given element
            return true;
          },
        }

      ]

      // if (true) {
      //   graphCommands.push({ // example command
      //     fillColor: '#f0ad4e', // optional: custom background color for item
      //     content: '<i class="fas fa-lock"></i> Freeze', // html/text content to be displayed in the menu
      //     select: (ele) => { // a fu
      //       console.log("LOG / file: graphView.js / line 143 / $scope.loadView= / ele", ele);
      //       // lock ele position
      //       ele.locked(true);
      //       // disable dragging
      //       ele.grabify(false);
      //     },
      //     enabled: (ele) => { // a function that returns a boolean, whether this command is enabled for the given element
      //       return true;
      //     },
      //   })
      // } else {
      //   graphCommands.push({ // example command
      //     fillColor: '#5bc0de', // optional: custom background color for item
      //     content: '<i class="fas fa-lock-open"></i> UnFreeze', // html/text content to be displayed in the menu
      //     select: (ele) => { // a function to execute when the command is selected
      //       console.log("LOG / file: graphView.js / line 152 / $scope.loadView= / ele", ele);
      //       // `ele` holds the reference to the 
      //     },
      //     enabled: false,
      //   })
      // }

      // add context menu
      $scope.graph.cxtmenu({// the radius of the circular menu in pixels
        selector: 'node', // elements matching this Cytoscape.js selector will trigger cxtmenus
        commands: graphCommands
      });

      // update UI when tapping on graph
      $scope.graph.on('tap', function (evt) {
        if (evt.target == $scope.graph) {
          $scope.graph.$("*").removeClass("selected");
          $scope.graph.$("*").removeClass("outbound");
          $scope.graph.$("*").removeClass("inbound");
        }
      });

      let tappedTimeout, tappedBefore;
      $scope.graph.on('tap', 'node', (evt) => {
        // start : handle double tap event
        var tappedNow = evt.target;
        if (tappedTimeout && tappedBefore) {
          clearTimeout(tappedTimeout);
        }
        if (tappedBefore === tappedNow) {
          tappedNow.trigger('doubleTap');
          tappedBefore = null;
        } else {
          tappedTimeout = setTimeout(function () { tappedBefore = null; }, 300);
          tappedBefore = tappedNow;
        }
        // end : handle double tap event

        const node = evt.target;
        $scope.selectNode(node);
      });

      $scope.graph.on('doubleTap', 'node', (event) => {
        // answer to double click event
        console.log('double click', event)
        if (event.target.data('_type') && event.target.data('_id')) {
          $rootScope.$broadcast('openNode', { _id: event.target.data('_id'), _type: event.target.data('_type') });
        }
      });


      $scope.graph.on('cxttapstart', (evt) => {
        if (evt.target.collection().size() < 1) return;
        // answer to single click event
        var node = evt.target;
        node.select();
      });

      $scope.graph.on('cxttap', (evt) => {
        if (evt.target.collection().size() < 1) return;
        // answer to single click event
        var node = evt.target;
        $scope.graph.$("*").unselect();
        node.select();
      });

      $scope.graph.on('tap', (evt) => {
        if (evt.target.collection().size() < 1) return;
        // answer to single click event
        var node = evt.target;
      });

      $scope.selectNode = (node) => {
        if (node) {
          $scope.graph.$("*").removeClass("outbound");
          $scope.graph.$("*").removeClass("inbound");
          $scope.graph.$("*").unselect();
          node.outgoers('[id != "' + node.id() + '"]').addClass("outbound");
          node.incomers('[id != "' + node.id() + '"]').addClass("inbound");
        }
      }
      // Update tab counter
      $scope.$emit("objCountUpdate", $scope.rel.name, resultNodes.data.nodes.length);

    }

    $scope.loadView();


  });