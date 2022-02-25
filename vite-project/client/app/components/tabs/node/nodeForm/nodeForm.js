/* global angular, _, vis, document, moment */
angular.module('app.ganister.tabs.node.nodeform', [
  'schemaForm',
  'ui.toggle',
  'app.ganister.shared.modals.lifecycleModal',
  'app.ganister.shared.modals.itemAccessModal',
  'app.ganister.shared.modals.itemLCAccessModal',
  'app.ganister.shared.modals.addToCmModal',
  'app.ganister.shared.modals.nodePropModal',
  'app.ganister.shared.modals.versionOrForkModal',
  'app.ganister.shared.modals.infoDataModal',
  'app.ganister.shared.modals.ihsModal',
  'app.ganister.shared.modals.z2DataModal',
  'app.ganister.tabs.node.nodeFormTabs',
  'app.ganister.tabs.node.nodeFormTabs.relatedObject',
  'app.ganister.tabs.node.nodeFormTabs.customTableView',
  'app.ganister.tabs.node.nodeFormTabs.customTreeGridView',
  'app.ganister.tabs.node.nodeFormTabs.reverseRelationship',
  'app.ganister.tabs.node.nodeFormTabs.reverseEcos',
  'app.ganister.tabs.node.nodeFormTabs.fileGallery',
  'app.ganister.tabs.node.nodeFormTabs.ECOimpactMatrix',
  'app.ganister.tabs.node.nodeFormTabs.multilevelView',
  'app.ganister.tabs.node.nodeFormTabs.ganttView',
  'app.ganister.tabs.node.nodeFormTabs.graphView', 
  'app.ganister.tabs.node.nodeFormTabs.kanbanView',
  'app.ganister.tabs.node.nodeFormTabs.klayGraphView',
  'app.ganister.tabs.node.nodeFormTabs.externalAPIs.github',
  'app.ganister.tabs.node.nodeFormTabs.externalAPIs.gitlab',
  'app.ganister.tabs.node.nodeFormTabs.externalAPIs.element14',
  'app.ganister.tabs.node.nodeFormTabs.externalAPIs.ihs',
  'app.ganister.tabs.node.nodeFormTabs.externalAPIs.z2Data',
  'app.ganister.tool.helperFunctions',
  'ngFileUpload',
  'ui.select',
  'ngSanitize',
])

  /*
  ███████╗ ██████╗ ██████╗ ███╗   ███╗     ██████╗ ██████╗ ███╗   ██╗████████╗██████╗  ██████╗ ██╗     ██╗     ███████╗██████╗
  ██╔════╝██╔═══██╗██╔══██╗████╗ ████║    ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔═══██╗██║     ██║     ██╔════╝██╔══██╗
  █████╗  ██║   ██║██████╔╝██╔████╔██║    ██║     ██║   ██║██╔██╗ ██║   ██║   ██████╔╝██║   ██║██║     ██║     █████╗  ██████╔╝
  ██╔══╝  ██║   ██║██╔══██╗██║╚██╔╝██║    ██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██╗██║   ██║██║     ██║     ██╔══╝  ██╔══██╗
  ██║     ╚██████╔╝██║  ██║██║ ╚═╝ ██║    ╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║╚██████╔╝███████╗███████╗███████╗██║  ██║
  ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝     ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝
  */
  .controller('FormController', async ($scope, $rootScope, $translate, nodesModel, plmModel, datamodelModel, $window, Notification, Upload, helperFunctions, clientMethodsService) => {
    // load nodetype
    $scope.nodetype = _.find($rootScope.datamodel.nodetypes, { name: $scope.node._type });

    // #region [FUNCTIONS]

    function recursiveGetProperty(obj, lookup, callback) {
      for (property in obj) {
        if (property == lookup) {
          callback(obj);
        } else if (obj[property] instanceof Object) {
          recursiveGetProperty(obj[property], lookup, callback);
        }
      }
    }

    // TODO: move this function into another file
    function getStateBootstrapColor(state, nodetype) {
      if (nodetype && nodetype.lifecycle) {
        const stateDefinition = _.find(nodetype.lifecycle.states, { name: state });
        let bootstrapClassColor = 'default';
        if (stateDefinition && stateDefinition.ui_color) {
          bootstrapClassColor = stateDefinition.ui_color;
        } else {
          console.warn('statedefinition or state color not defined');
          bootstrapClassColor = 'default';
        }
        return bootstrapClassColor;
      }
      return null;
    }

    const formatDatesForRelatedNode = (node) => {
      const nodetypeName = node._type;
      const nodetype = _.find($rootScope.datamodel.nodetypes, { name: nodetypeName });
      const dates = nodetype.properties.filter(prop => prop.type === 'date');
      dates.forEach((date) => {
        if (node.properties[date.name] && Number.isInteger(node.properties[date.name])) {
          node.properties[date.name] = moment(node.properties[date.name]).format('L') || "";
        }
      })
    };


    // #endregion

    // #region [SCOPE_FUNCTIONS]


    $scope.translateItem = (item, nodetypeName) => {
      if (!$scope.nodetype.ui.form.labelCase) {
        $scope.nodetype.ui.form.labelCase = 'capitalize';
      }
      //  If Item has properties key and title and key exists, translate
      if (item.hasOwnProperty('key') && !Array.isArray(item.key) && item.key) {
        let keyTranslation = item.translationKey.map((key) => {
          let translation = $translate.instant(key);
          const translated = translation !== key;

          if (!translated) {
            const propertyName = key.split('.')[2].replace('_', '');
            translation = propertyName;
          }

          switch ($scope.nodetype.ui.form.labelCase) {
            case 'uppercase':
              translation = translation.toUpperCase();
              break;
            case 'lowercase':
              translation = translation.toLowerCase();
              break;
            case 'camelcase':
              translation = translation.replace(/\W+(.)/g, (match, chr) => {
                return chr.toUpperCase();
              });
              break;
            case 'capitalize':
              translation = translation.charAt(0).toUpperCase() + translation.slice(1);
              break;
            default:
          }
          return translation;
        })
        keyTranslation = keyTranslation.join(': ');

        item.title = keyTranslation;
        if (item.hasOwnProperty('fieldAddonLeft')) {
          item.fieldAddonLeft = keyTranslation;
        }
        if (item.hasOwnProperty('template')) {
          item.template = `<label class="control-label">${keyTranslation}</label>${item.template}`;
        }
      }
      if (item.hasOwnProperty('items') && item.items) {
        item.items.map(item => $scope.translateItem(item, nodetypeName));
      }

    }

    $scope.translateSerializedItems = () => {
      if (!$scope.nodetype) return;
      if (!$scope.node.properties) return;

      const { instanciations = [] } = $scope.nodetype;
      let { _serialized = [] } = $scope.node.properties;
      // temporary if statement, _serialized should always be an array
      if (typeof _serialized === 'string') {
        _serialized = JSON.parse(_serialized);
      }

      $scope.node.instanciations = _serialized.map((ser) => {
        const instanciation = instanciations.find((i) => i.id === ser);
        if (!instanciation) return;

        const translationPath = `nodetype.${$scope.node._type}.${instanciation.name}`;
        const translated = $translate.instant(translationPath);
        if (translated !== translationPath) {
          instanciation.translation = translated;
        }

        const { id, name, translation } = instanciation;
        return { id, name, translation };
      });
    }

    /**
     * $scope.runNodeAction
     */
    $scope.runNodeAction = async (action) => {
      try {
        const data = {};

        if (action.preClientMethod) {
          const method = $rootScope.datamodel.methods.find((m) => m.name === action.preClientMethod);
          if (!method) {
            return Notification.error(`Pre Client Method ${action.preClientMethod} not found`);
          }

          await clientMethodsService[method.name]($scope, $rootScope, data);
        }

        if (action.serverMethod) {
          const result = await nodesModel.runNodeAction($scope.node, action, data);
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

        const actionNameTranslation = $translate.instant(`nodetype.${$scope.node._type}.${action.name}`);
        Notification.success(`'${actionNameTranslation || action.name}' successfully run`);
      } catch (error) {
        console.error(error);
      }
    };


    /**
     * $scope.updateMainGrid
     * @param {*} newNode 
     */
    $scope.updateMainGrid = (newNode) => {
      newNode = convertNodeDates(newNode);
      // update the main grid if it is the same nodetype
      if ($scope.context.nodetype && $scope.context.nodetype.name === $scope.nodetype.name) {
        $scope.context.mainGridOptions.api.forEachNode((node) => {
          if (node.data && node.data._id === $scope.node._id) {
            node.data = Object.assign(node.data, newNode);
          }
        });
        // now tell the grid it needs refresh all these rows
        $scope.context.mainGridOptions.api.refreshCells();
      }
    }

    const convertNodeDates = (node) => {
      let modNode = JSON.parse(JSON.stringify(node));
      //  Convert Date values before saving
      const dateProps = $scope.nodetype.properties
        .filter((p) => p.type === 'date' || p.type === 'dateTime')
        .map((p) => p.name);
      Object.keys(modNode.properties).map((key) => {
        const dateProp = dateProps.includes(key);
        if (dateProp) {
          if (modNode.properties[key]) {
            const date = moment(modNode.properties[key]);
            modNode.properties[key] = parseInt(date.format('x'));
          } else {
            modNode.properties[key] = null;
          }
        }
      });
      return modNode;
    };

    $scope.saveNode = async (node) => {
      $scope.nodeSaving = true;

      try {
        let newNode = {
          ...$scope.node,
          properties: node.properties,
        };
        newNode = convertNodeDates(newNode);

        await helperFunctions.runTriggeredMethods('beforeUpdate', newNode, $scope);

        newNode = await nodesModel.updateNode(newNode);
        $scope.nodeSaving = false;
        if (!newNode) return;

        const newNodeProperties = Object.assign($scope.node.properties, newNode.properties);
        newNode = Object.assign($scope.node, newNode, newNodeProperties);
        newNode.properties = newNodeProperties;
        const { _version } = newNode.properties;
        newNode.properties._versionLabel = helperFunctions.filterSemVersionning(_version, $scope.nodetype);

        await helperFunctions.runTriggeredMethods('afterUpdate', newNode, $scope);

        $scope.updateMainGrid(newNode);
        $scope.node = newNode;

        // *** Node with Date objects
        const formattedProperties = helperFunctions.convertNodeDatesBackToMoment($scope.nodetype, newNode.properties);
        Object.keys(formattedProperties).map((key) => {
          $scope.node.properties[key] = formattedProperties[key];
          $scope.node[key] = formattedProperties[key];
        });
        // *** $scope.node with Date Objects

        $scope.lastSavedNode = angular.copy($scope.node);
        $scope.node.unsavedChanges = false;
        return true;
      } catch (error) {
        $scope.nodeSaving = false;
        console.error(error);
        Notification.error({ title: 'Saving Error', message: error.message });
        return false;
      }
    };

    $scope.lockNode = async () => {
      $scope.nodeLockStatusChanging = true;
      try {
        const node = await nodesModel.updateNode($scope.node, true);
        if (!node) return;
        //update properties
        const nodeFormNode = helperFunctions.convertNodeDatesBackToMoment($scope.nodetype, node.properties);
        Object.assign($scope.node.properties, nodeFormNode);

        $scope.node.locked = 1;
        $scope.lockedByCurrentUser = true;

        $scope._lockedOn = moment($scope.node.properties._lockedOn).format('DD/MM/YYYY HH:mm');
        Notification.success({ message: $translate.instant("default.node.locked") });
        $scope.updateMainGrid($scope.node);
        $scope.unlockProcessed = false;
        $scope.checkNodeLockState($scope.node);
      } catch (error) {
        $scope.lockedByCurrentUser = false;
        $scope.lockedByCurrentUserSwitch = $scope.lockedByCurrentUser;
        console.error(error);
      }
      $scope.nodeLockStatusChanging = false;
    };

    /**
    * $scope.unlockNode
    */
    $scope.unlockRightClick = $scope.appContext.user.properties._isAdmin ? [
      ['Unlock Node', ($itemScope, $event) => {
        $scope.unlockNode();
      }]
    ] : [];

    $scope.unlockNode = async () => {
      $scope.nodeLockStatusChanging = true;
      try {
        const node = await nodesModel.updateNode($scope.node, false);
        if (!node) return;

        const nodeFormNode = helperFunctions.convertNodeDatesBackToMoment($scope.nodetype, node.properties);
        Object.assign($scope.node.properties, nodeFormNode);
        $scope.node.unsavedChanges = false;
        $scope.unlockProcessed = true;
        $scope.node.locked = 0;
        $scope._lockedOn = null;
        Notification.success({ message: $translate.instant("default.node.unlocked") });

        $scope.updateMainGrid($scope.node);
        $scope.checkNodeLockState($scope.node);
        $scope.lockedByCurrentUser = false;
      } catch (error) {
        console.error(error);
        $scope.lockedByCurrentUser = true;
        $scope.lockedByCurrentUserSwitch = $scope.lockedByCurrentUser;
      }
      $scope.nodeLockStatusChanging = false;
    };

    /**
    * $scope.toggleGraphView
    */
    $scope.toggleGraphView = (node) => {
      if ($scope.network === null) {
        $scope.createNodeGraph(node);
      }
      $(`#graphViewCollapse-${node._id}-${$scope.nodeVersion}`).collapse('toggle');
      $(`#graphView-${node._id}-${$scope.nodeVersion}`).toggleClass('active');
    };

    /**
    * $scope.toggleUserAccessPath
    */
    $scope.toggleUserAccessPath = (node) => {
      if ($scope.userAccessPathNetwork === null) $scope.createAccessPathGraph(node);
      $(`#userAccessPathCollapse-${node._id}-${$scope.nodeVersion}`).collapse('toggle');
      $(`#userAccessPath-${node._id}-${$scope.nodeVersion}`).toggleClass('active');
      $scope.userAccessPathNetwork.fit();
    };

    /**
    * $scope.createAccessPathGraph
    */
    $scope.createAccessPathGraph = () => {
      const container = document.getElementById(`userAccessPathCollapse-container-${$scope.node._id}-${$scope.nodeVersion}`);
      $scope.VAnodes = new vis.DataSet();
      $scope.VAedges = new vis.DataSet();
      //  Find Highest Access path and sort by segments length
      $scope.graphAccessPathLoading = false;
      const nodes = [];
      const edges = [];

      $scope.node.user.correctPath.forEach((relationship) => {
        const { _type, _id, source, target } = relationship;

        // build nodes
        [source, target].forEach((node) => {
          const foundNode = nodes.find((n) => n._id === node._id);
          if (foundNode) return;

          let nodeImage;
          const nodetype = _.find($rootScope.datamodel.nodetypes, { name: node._type });
          if (nodetype && nodetype.ui) {
            nodeImage = nodetype.ui.defaultThumbnail;
          } else {
            switch (node._type) {
              case "Group":
                nodeImage = "images/groupLogo.png";
                break;
              case "PermissionSet":
                nodeImage = "images/permissionLogo.png";
                break;
              default:
                nodeImage = "images/defaultLogo.png";
                break;
            }
          }

          const { _labelRef, name } = node.properties;

          const nodeData = {
            id: node._id,
            label: `[${node._type}] ${_labelRef || name}`,
            image: nodeImage,
            shape: 'image',
            group: _labelRef || name,
          };
          nodes.push(nodeData);
        });

        const foundEdge = edges.find((e) => e._id === _id);
        if (foundEdge) return;

        const { role } = relationship.properties;
        const edgeRole = role ? `(${role})` : '';

        const edge = {
          id: _id,
          from: source._id,
          to: target._id,
          label: `${_type}${edgeRole}`,
          group: _type,
          arrows: 'to',
        };
        edges.push(edge);
      });

      $scope.VAnodes.update(nodes);
      $scope.VAedges.update(edges);

      // create a network
      const data = {
        nodes: $scope.VAnodes,
        edges: $scope.VAedges,
      };
      userAccessPathNetworkGraphOptions = Object.assign({}, graphOptions);;
      userAccessPathNetworkGraphOptions.physics.solver = 'barnesHut';
      $scope.userAccessPathNetwork = new vis.Network(container, data, graphOptions);
      $scope.userAccessPathNetwork.stabilize(2000);
    };

    /**
    * $scope.createHistoryTimeline
    */
    $scope.createHistoryTimeline = async (node) => {
      // DOM element where the Timeline will be attached
      const container = document.getElementById(`history-timeline-${node._id}-${$scope.nodeVersion}`);
      const result = await nodesModel.getNodeHistory(node._type, node._id);
      const rows = [];
      let randomId = 0;
      result.map((item) => {
        if (item.startDate) {
          const newItem = {};
          newItem.id = randomId++;
          newItem.content = item.title;
          newItem.title = '';
          if (item.properties) {
            Object.keys(item.properties).map((key) => {
              // fix label
              var label = key;
              if (key[0] === '_') label = label.substr(1);
              label = _.startCase(label);
              // fix value
              var value = item.properties[key];
              switch (key) {
                case '_createdBy':
                  const user = _.find($rootScope.users, { _id: value });
                  if (user) {
                    value = user.properties._labelRef;
                    newItem.title += `<b>By:</b> ${value} <br>`;
                  }
                  break;
                case '_createdOn':
                  value = moment(value).format('DD/MM/YYYY HH:mm');
                  newItem.title += `<b>On:</b> ${value} <br>`;
                  break;
                default:
                  break;
              }

            });
            if (item.type === 'update') {
              let value='';
              Object.keys(item.properties).map((key) => {
                if (key[0] !== '_'){
                  value += `<b>${key}</b>: <i>${item.properties[key]}</i> <br>`;
                }
              });
              newItem.title += value;
            }
          }
          const startMoment = moment(item.startDate);
          newItem.start = startMoment.format('YYYY-MM-DD HH:mm');
          if (item.endDate) {
            const endMoment = moment(item.endDate);
            newItem.end = endMoment.format('YYYY-MM-DD HH:mm');
          }
          rows.push(newItem);
        }
        $scope.timelineLoading = false;
      });
      if (rows.length === 0) {
        container.innerHTML = 'No history entries found';
        $scope.timelineLoading = false;
        return false;
      }

      // Create a DataSet (allows two way data-binding)
      const items = new vis.DataSet(rows);

      // Configuration for the Timeline
      const options = {
        horizontalScroll: true, // This option allows you to scroll horizontally to move backwards and forwards in the time range. Only applicable when option zoomCtrl is defined or zoomable is false.
        locale: $rootScope.appContext.user.language.key, // Specify a locale to the timeline
        type: 'box', // Specifies the default type for the timeline items. Choose from 'box', 'point', 'range', and 'background'. Note that individual items can override this default type. If undefined, the Timeline will auto detect the type from the items data: if a start and end date is available, a 'range' will be created, and else, a 'box' is created. Items of type 'background' are not editable.
        zoomable: true, // Specifies whether the Timeline can be zoomed by pinching or scrolling in the window. Only applicable when option moveable is set true.
        moveable: true, // Specifies whether the Timeline can be moved and zoomed by dragging the window. See also option zoomable.
        autoResize: true, // If true, the Timeline will automatically detect when its container is resized, and redraw itself accordingly. If false, the Timeline can be forced to repaint after its container has been resized using the function redraw().
        order: function (params) { }, // Provide a custom sort function to order the items. The order of the items is determining the way they are stacked. The function order is called with two arguments containing the data of two items to be compared.
        showCurrentTime: true, // Show a vertical bar at the current time.
        tooltip: {
          overflowMethod: 'flip'
        },
      };

      // Create a Timeline
      historyTimeline = new vis.Timeline(container, items, options);
      historyTimeline.on('doubleClick', function (props) {
        const item = rows.find((row) => row.id === props.item);
        if (item && item.nodeId) {
          //  Open Node By Id
          $rootScope.$broadcast('openNode', { _id: item.nodeId, _type: item.nodeType, });
        }
      });
    };


    /**
    * $scope.openNodeVersion
    */
    $scope.openNodeVersion = (item) => {
      item._type = $scope.nodetype.name;
      $rootScope.$broadcast('openNode', item);
    }


    /**
     * $scope.openECO
     * @param {string} eco id 
     */
    $scope.openECO = (ecoId) => $rootScope.$broadcast('openNode', { _id: ecoId, _type: 'eco' });

    /**
    * $scope.createNodeGraph
    */

    $scope.toggleNtVisibility = (nt) => {
      nt.active = !nt.active;
      $scope.updateGraphNtVisibility();
    }

    $scope.updateGraphNtVisibility = () => {
      let vnodes = $scope.Vnodes.map((n) => {
        if (_.find($scope.ntelements, { name: n.group, active: true })) {
          n.hidden = false;
        } else {
          n.hidden = true;
        }
        return n;
      });
      let vedges = $scope.Vedges.map((n) => {
        if (_.find($scope.ntrels, { name: n.label, active: true })) {
          n.hidden = false;
        } else {
          n.hidden = true;
        }
        return n;
      });
      $scope.Vedges.update(vedges);
      $scope.Vnodes.update(vnodes);
      if ($scope.network) {
        $scope.network.setData({
          nodes: $scope.Vnodes,
          edges: $scope.Vedges,
        });

      }
    };

    const getGraphData = async (sourceNode) => {
      const relationships = await nodesModel.getRelationships(sourceNode);
      if (!relationships) return;

      const nodes = [];
      const edges = [];

      relationships.forEach((relationship) => {
        const { _type, source, target } = relationship;
        const relationshipDM = $rootScope.datamodel.nodetypes.find((n) => n.name === _type);

        if (!relationshipDM) return;
        [source, target].forEach((node) => {
          if (!node._id) return;

          // retrieve nodetype image
          const nodetype = _.find($rootScope.datamodel.nodetypes, { name: node._type });
          if (nodetype) {
            if (!(_.find($scope.ntelements, { name: nodetype.name }))) {
              $scope.ntelements.push({ name: nodetype.name, active: true, icon: nodetype.ui.defaultThumbnail });
            }
          }
          let image = nodetype?.ui?.defaultThumbnail;
          switch (node._type) {
            case "Group":
              image = "images/groupLogo.png";
              if (!(_.find($scope.ntelements, { name: "Group" }))) {
                $scope.ntelements.push({ name: "Group", active: false, icon: image });
              } else {
                _.find($scope.ntelements, { name: "Group" }).active = false;
              }
              break;
            case "PermissionSet":
              image = "images/permissionLogo.png";
              if (!(_.find($scope.ntelements, { name: "PermissionSet" }))) {
                $scope.ntelements.push({ name: "PermissionSet", active: false, icon: image });
              } else {
                _.find($scope.ntelements, { name: "PermissionSet" }).active = false;
              }
              break;
            default:
              if (!image) {
                image = "images/defaultLogo.png";
              }
              break;
          }
          const { connections } = relationship?.properties || {};
          const label = `${node.properties?._labelRef || node._type}${connections ? `(${connections})` : ''}`;
          // build node
          const nodeData = {
            id: node._id,
            label,
            image,
            shape: 'image',
            group: node._type,
            properties: node.properties,
          };
          nodes.push(nodeData);
        });

        if (!(_.find($scope.ntrels, { name: relationshipDM.linkName }))) {
          $scope.ntrels.push({ name: relationshipDM.linkName, active: true });
        }
        const edge = {
          id: relationship._id,
          from: source._id,
          to: target._id,
          label: relationshipDM.linkName,
          group: relationshipDM.linkName,
          arrows: 'to',
        };
        edges.push(edge);
      });
      $scope.Vnodes.update(nodes);
      $scope.Vedges.update(edges);

      $scope.updateGraphNtVisibility();
      // create a network
      const data = {
        nodes: $scope.Vnodes,
        edges: $scope.Vedges
      };
      return data;
    };

    $scope.createNodeGraph = async () => {
      try {
        $scope.ntrels = [];
        $scope.ntelements = [{
          name: $scope.node._type,
          active: true,
          icon: $scope.nodetype.ui.defaultThumbnail
        }];
        const container = document.getElementById(`graphViewCollapse-container-${$scope.node._id}-${$scope.nodeVersion}`);
        $scope.Vnodes = new vis.DataSet();
        $scope.Vedges = new vis.DataSet();

        const data = await getGraphData($scope.node);
        $scope.graphLoading = false;

        $scope.network = new vis.Network(container, data, graphOptions);
        $scope.network.stabilize(100);

        $scope.network.on("oncontext", async (params, event) => {
          params.event.preventDefault();
          params.event = "[original event]";
          let nodeToOpen = $scope.network.getNodeAt(params.pointer.DOM);
          if (nodeToOpen) {
            const node = $scope.Vnodes.get(nodeToOpen);
            node._id = node.id;
            node._type = node.group;

            await getGraphData(node);
          }
        });

        $scope.network.on("doubleClick", (params) => {
          params.event = "[original event]";

          let nodeToOpen = $scope.network.getNodeAt(params.pointer.DOM);
          if (nodeToOpen) {
            var node = $scope.Vnodes.get(nodeToOpen);
            $rootScope.$broadcast('openNode', {
              _id: node.id,
              _type: node.group,
            });
          }
        });
      } catch (error) {
        console.error(error);
      }
    };

    /**
    * $scope.openAddToCmForm
    */
    $scope.openAddToCmForm = (changeElement) => {
      // open the ECO selection modal
      $rootScope.$broadcast('openAddToCmModal', `${$scope.node._id}-${$scope.nodeVersion}`, changeElement);
    };

    /**
    * $scope.openNodeProp
    */
    $scope.openNodeProp = (property) => {
      const node = $scope.node.properties[property];
      if (node) {
        $rootScope.$broadcast('openNode', node);
      }
    }

    /**
    * $scope.openNodePropModal
    */
    $scope.openNodePropModal = (nodetype, propertyName) => {
      $rootScope.$broadcast('openNodePropModal', $scope.node, nodetype, propertyName);
    };

    /**
    * $scope.updateNode
    */
    $scope.updateNode = (node) => {
      $scope.nodeSaving = true;
      $scope.saveNode(node);
    }

    /**
    * $scope.toggleNodeHistory
    */
    $scope.toggleNodeHistory = (node) => {
      if (historyTimeline === null) {
        $scope.createHistoryTimeline(node);
      }
      $(`#historyCollapse-${node._id}-${$scope.nodeVersion}`).collapse('toggle');
      $(`#historyBtn-${node._id}-${$scope.nodeVersion}`).toggleClass('active');
    };

    /**
    * $scope.toggleUserAccess
    */
    $scope.toggleUserAccess = (node) => {
      const userAccessButton = $(`#userAccess-${node._id}-${$scope.nodeVersion}`);
      const active = userAccessButton[0].classList.value.includes('active');
      if (!active) $scope.fetchNodeAccessRoles();

      $(`#userAccessCollapse-${node._id}-${$scope.nodeVersion}`).collapse('toggle');
      userAccessButton.toggleClass('active');
    };

    /**
    * $scope.openItemAccessModal
    */
    $scope.openItemAccessModal = (user = "", role = "") => {
      let action = "edit";
      if (role === "") {
        action = "add";
      }
      $rootScope.$broadcast('openitemAccessModal', $scope.node._id, role, action, user, $scope.node.accessRoles);
    };

    /**
     * activateOrganicPermission
     *  
     */
    $scope.activateOrganicPermission = async () => {
      try {
        const response = await Swal.fire({
          title: 'Reconnect the Organic Permissions',
          type: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes',
          confirmButtonColor: '#f0ad4e',
          cancelButtonText: 'Cancel',
        });
        if (response.value) {
          const permissionSets = await nodesModel.getNodes('PermissionSet');
          if (!permissionSets) return;

          const permissionSet = permissionSets.find((p) => {
            return p.properties.name === $scope.node._type;
          });
          if (!permissionSet) {
            return Notification.error(`'${$scope.node._type}' Permission Set not found`);
          }

          const params = {
            _type: 'accessRole',
            properties: { role: 'permissionSet' },
            source: permissionSet,
            target: $scope.node,
          };
          const relationship = await nodesModel.addRelationship(params);
          if (!relationship) return;

          $scope.node.accessRoles.push(relationship);
          Notification.success('Organic Permission Created.');
          $scope.$broadcast('rolesUpdate', { nodeId: $scope.node._id, relationships: $scope.node.accessRoles });
        }
      } catch (error) {
        console.error(error);
      }
    };


    /**
     * removeOrganicPermission
     *  
     */
    $scope.removeOrganicPermission = async (relationship) => {
      try {
        const response = await Swal.fire({
          title: 'Remove the Organic Permissions',
          type: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes',
          confirmButtonColor: '#d9534f',
          cancelButtonText: 'Cancel',
        });
        if (response.value) {
          const result = await nodesModel.deleteRelationship(relationship);
          if (!result) return;

          const index = $scope.node.accessRoles.findIndex((access) => access.permissionSet);
          $scope.node.accessRoles.splice(index, 1);
          $scope.node.hasPermissionSet = false;
          Notification.success('Organic Permission Removed');
        }
      } catch (error) {
        console.error(error);
      }
    };



    $scope.openPermissionSetModal = (permissionSet) => {
      $rootScope.$broadcast('openitemAccessModal', $scope.node._id, permissionSet, "permissionSet", "", $scope.node.accessRoles);
    };

    $scope.groupDetailVisible = false;


    $scope.fetchTeamMembers = (group, disable) => {
      if (!disable) {
        nodesModel.getTeamMembers(group.accessor._id)
          .then((result) => {
            group.nodes = result.map((res) => {
              return ({
                detail: res.user,
                role: res.role,
              })
            })
          });
      }
    }

    $scope.openRemoveConfirmation = (user, role) => {
      $rootScope.$broadcast('openitemAccessModal', $scope.node._id, role, "remove", user, $scope.node.accessRoles);
    }

    $scope.openLCItemAccessModal = (role) => {
      $rootScope.$broadcast('openLCitemAccessModal', $scope.node._id, role, $scope.node.lifecycleRoles);
    }

    $scope.removeLCRoleAssignee = async (lcRole) => {
      try {
        const response = await Swal.fire({
          title: 'Remove Lifecycle Role',
          text: `Are you sure you want to remove ${lcRole.target.properties._labelRef} as ${lcRole.properties.role} from this node?`,
          type: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, remove',
          cancelButtonText: 'Cancel',
          allowOutsideClick: () => !Swal.isLoading()
        });
        if (!response.value) return;

        const result = await nodesModel.deleteRelationship(lcRole);
        if (!result) return;

        const index = $scope.node.lifecycleRoles.findIndex((lifecycleRole) => {
          return lifecycleRole._id === lcRole._id;
        });
        const role = $scope.nodetype.lifecycle.roles.find((r) => {
          return r.name === lcRole.properties.role
        });
        role.properties = { role: role.name };
        $scope.node.lifecycleRoles.splice(index, 1, role);
        Swal.close();
        Notification.success({ message: 'Lifecycle Role Deleted' });
        $rootScope.$broadcast("reloadLifecycle", { nodeId: $scope.node._id });
      } catch (error) {
        console.error(error);
      }
    };

    // usefull for client custom methods
    $scope.instanciateNode = async (instanciationId) => {
      const response = await Swal.fire({
        title: 'Instanciate Node',
        text: `Are you sure you want to instanciate this node?`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, instanciate',
        cancelButtonText: 'No, cancel',
        preConfirm: () => {
          instanciatingNotification = Notification.primary({
            message: '<i class="fas fa-spinner fa-spin"></i> Instanciating Node...',
            delay: null,
          });
          return
        },
        allowOutsideClick: () => !Swal.isLoading()
      });
      if (response.value) return;

      $scope.instanciatingNode = true;
      const result = await plmModel.instanciateNode($scope.node._type, $scope.node._id, instanciationId);
      $scope.instanciatingNode = false;
      instanciatingNotification.then(notification => notification.kill());

      if (result._id) {
        const nextResponse = await Swal.fire({
          title: 'Node instanciated',
          text: 'Do you want to open the node?',
          type: 'success',
          showCancelButton: true,
          confirmButtonText: 'Yes, open',
          cancelButtonText: 'No',
        });
        if (!nextResponse.value) return;

        $rootScope.$broadcast('openNode', { _id: result._id, _type: result._type });
      } else {
        Swal.fire({
          type: 'error',
          title: result.title,
          text: result.message,
        });
      }
    };

    $scope.updateNodeUnlockAndClose = async (node) => {
      $scope.updateUnlockAndClose = true;
      setTimeout(async () => {
        if ($scope.node.unsavedChanges) {
          console.info('node not saved yet, saving before closing...')
        } else {
          $scope.updateUnlockAndClose = false;
          await $scope.triggerNodeLockStatus();
          $scope.closeNode($scope.node);
        }
      }, 100)
    }

    //  Broadcast an action to reload Node in tabs.js
    $scope.reloadNode = () => {
      $rootScope.$broadcast("reloadNode", $scope.node)
    }

    // Method to copy the node ID to the paper clip
    $scope.copyNodeId = () => {
      navigator.clipboard.writeText($scope.node._id).then(() => {
        Notification.success({ message: '<span class="glyphicon glyphicon-ok"></span>  ID Copied' });
      }, (err) => {
        Notification.error({ title: 'Copy Error', message: 'Read console for more info...' });
        console.error('Could not copy node Id: ', err);
      });
    };

    $scope.downloadFile = () => {
      console.info('downloadFile - not implemented')
    };

    /**
   * openFile
   * Open a right side panel with the file viewable
   * @param {*} file 
   * @param {*} forceDownload 
   */
    $scope.openFile = (file, forceDownload = false) => {
      const { _labelRef = '' } = $scope.node.properties;
      // open viewable or download
      if (forceDownload) {
        $window.open(file.properties.url, '_blank');
      } else {
        $('#fileViewerCADOptions').hide("slow");
        $scope.openedFile = file;
        $("#fileViewerName").text(`(${file.properties.filename})`);
        $("#fileViewer").css('width', 5 + ($(document).width() / 2.2));
        switch (file.properties.mimetype) {
          case "image/jpeg":
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 22) + "px");
            $("#fileViewerItem").html("<img style='max-width:" + $(document).width() / 2.2 + "px';max-height:" + $(document).height() + "px'  src='" + file.properties.url + "' />");
            $("#fileViewer").show("slow");
            break;
          case "image/png":
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 22) + "px");
            $("#fileViewerItem").html("<img style='max-width:" + $(document).width() / 2.2 + "px';max-height:" + $(document).height() + "px'  src='" + file.properties.url + "' />");
            $("#fileViewer").show("slow");
            break;
          case "application/pdf":
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 22) + "px");
            $("#fileViewerItem").css('height', ($(document).height() - 60) + 'px');
            $("#fileViewerItem").html("<embed class='pdfEmbed' src='" + file.properties.url + "' />");
            $("#fileViewer").show("slow");
            break;
          case "application/octet-stream":
            $("#fileViewerContent").css('width', ($("#fileViewer").width() - 42) + "px");
            $("#fileViewerItem").css('height', ($(document).height() - 160) + 'px');
            $scope.generateCADViewerURL();
            $('#fileViewerCADOptions').show("slow");
            $("#fileViewer").show("slow");
            break;
          default:
            Notification.warning("No viewer available, file opened in a new tab");
            $window.open(file.properties.url, '_blank');
            break;
        }
      }
    }


    /**
   * downloadFile
   * Request a reachable URL from the file id and ask for dowloading it
   */
    $scope.downloadFile = (node) => {
      let selectedFile = node;
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
    };

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
        console.error("generateCADViewerURL", error);
      }
    }


    /**
     * openCardFile
     * Request a reachable URL from the file id and ask for viewing it
     */
    $scope.openCardFile = async (file) => {
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
        if (file.properties.source === 'local') {
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
              file.properties.url = result.url;
              file.properties.mimetype = result.mimetype;
              if (file.properties.mimetype === 'application/octet-stream') {
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



    // Method to copy the node ID to the paper clip
    $scope.getCypherQuery = () => {
      navigator.clipboard.writeText(`MATCH (n:${$scope.node._type}{_id:'${$scope.node._id}'}) RETURN n`).then(() => {
        Notification.success({ message: '<span class="glyphicon glyphicon-ok"></span>  Cypher Copied' });
      }, (err) => {
        Notification.error({ title: "Copy Error", message: "Read console for more info..." });
        console.error("Could not copy node Cypher: ", err);
      }
      );
    };

    $scope.serializeNode = async (e, instanciationId) => {
      $scope.nodeSerializeChanging = true;

      try {
        const { _serialized = [] } = $scope.node.properties;

        const remove = !e.target.checked;
        if (remove) {
          const index = _serialized.indexOf(instanciationId);
          if (index > -1) _serialized.splice(index, 1);
        } else {
          _serialized.push(instanciationId);
        }
        $scope.node.properties._serialized = _serialized;

        const node = await nodesModel.updateNode($scope.node);
        if (!node) return;

        $scope.node.properties._serialized = node.properties._serialized;
        Notification.success({ title: "Serialized", message: "Instanciation updated" });
      } catch (error) {
        $scope.nodeSerializeChanging = false;
        console.error(error);
      }
    };

    //  Delete Node
    $scope.deleteNode = async () => {
      try {
        const response = await Swal.fire({
          title: 'Are you sure you want to delete this node?',
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it'
        });

        if (response.value) {
          await helperFunctions.runTriggeredMethods('beforeDelete', $scope.node, $scope);

          const result = await nodesModel.deleteNode($scope.node);
          if (!result) return;

          await helperFunctions.runTriggeredMethods('afterDelete', result, $scope);

          Notification.success({ title: 'Node Deleted', message: result.message });
          $rootScope.$broadcast("removeNode", $scope.node);
        }
      } catch (error) {
        console.error(error);
        Notification.error({ title: 'Node Error', message: error.message });
      }
    };

    //  REFRESH NODE'S READ ONLY MODE
    $scope.refreshReadOnlyMode = () => {
      const emptySchema = !_.keys($scope.schema).length;
      if (emptySchema) return;

      recursiveGetProperty({ ...$scope.form }, 'readonly', function (obj) {
        obj.readonly = obj._ro || !$scope.lockedByCurrentUser;
        if (obj.ganisterProp && obj.ganisterProp === 'template') {
          if (!$scope.lockedByCurrentUser || obj._ro) {
            //  Remove disabled and add disabled back before ng-model
            obj.template = obj.template.replace('disabled', '');
            obj.template = obj.template.replace('ng-model', 'disabled ng-model');
            obj.template = obj.template.replace('disabler', 'ng-disabled="true"');
          } else {
            //  If disabled exists in string, replace it with empty string
            obj.template = obj.template.replace('disabled', '');
            obj.template = obj.template.replace('ng-disabled="true"', 'disabler');
          }
        }
        if (obj.ganisterProp && obj.ganisterProp === 'node') {
          obj.readonly = true;
        } else if (obj.alwaysUnlocked) {
          obj.readonly = false;
        }
      });
      $scope.$broadcast("schemaFormRedraw");
    }

    $scope.translateForm = () => {
      let tempForm = _.cloneDeep($scope.nodetype.ui.form.ng.form);
      if (tempForm) {
        tempForm.map((item) => $scope.translateItem(item, $scope.nodetype.name));
      };
      $scope.form = tempForm;
      $scope.refreshReadOnlyMode();
      $scope.translateInstanciations();
      $scope.translateSerializedItems();
    };

    $scope.openVersionOrForkModal = async () => {
      const { _type, _id } = $scope.node;
      $rootScope.$broadcast('versionOrForkModal', `${_id}-${$scope.nodeVersion}`, _type, _id, $scope.nodeVersion);
    };

    /*********************** *************** ***********************/
    /*********************** NODE LOCK STATE ***********************/
    /*********************** *************** ***********************/

    $scope.checkNodeLockState = (node) => {
      const latestVersion = $scope.isLatestVersion;
      const locked = node.properties._lockState;
      const lockedByCurrentUser = node.properties._lockedBy === $scope.appContext.user._id;

      if (latestVersion && locked && lockedByCurrentUser) {
        $scope.lockedByCurrentUser = true;
      } else if (locked) {
        $scope.lockedByCurrentUser = false;
      } else {
        node.properties._lockState = false;
        $scope.lockedByCurrentUser = false;
      }
      $scope.refreshReadOnlyMode();
    };



    //  TRIGGER NODE LOCK STATUS
    $scope.triggerNodeLockStatus = async () => {
      $scope.nodeLockStatusChanging = true;
      if ($scope.node.properties._lockState === false) {
        $scope.lockNode();
      } else {
        if ($scope.node.unsavedChanges) {
          const saved = await $scope.saveNode($scope.node);
          if (saved) {
            await $scope.unlockNode();
          } else {
            $scope.nodeLockStatusChanging = false;
            $scope.lockedByCurrentUserSwitch = true;
          }
        } else {
          $scope.unlockNode();
        }
      };
    };


    $scope.openInfoDataModal = async () => $rootScope.$broadcast('openInfoDataModal', $scope.node);


    $scope.nodeReportingProcess = false;
    $scope.launchNodeReport = async (reportId) => {
      $scope.nodeReportingProcess = true;

      const reportContent = await nodesModel.runReport(reportId, {
        reportConfig: {
          nodeId: $scope.node._id,
          nodetype: $scope.node._type,
        }
      });

      var win = window.open("", "Ganister Report", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes");
      win.document.body.innerHTML = reportContent;
      $scope.nodeReportingProcess = false;
    }

    $scope.translateInstanciations = () => {
      if (!$scope.nodetype || !$scope.nodetype.instanciations) return;
      $scope.nodetype.instanciations = [...$scope.nodetype.instanciations].map((instanciation) => {
        const translationPath = `nodetype.${$scope.nodetype.name}.${instanciation.name}`;
        const translation = $translate.instant(translationPath);
        if (translation !== translationPath) {
          instanciation.translation = translation.charAt(0).toUpperCase() + translation.slice(1);
        } else {
          instanciation.translation = undefined;
        }
        return instanciation;
      });
    };

    // #endregion

    const checkNodeChanges = (newProperties) => {
      const avoidPropWatching = [
        '_lockedBy',
        '_lockedByName',
        '_lockState',
        '_lockable',
        '_lockedOn',
        '_serialized',
        '_modifiedOn',
        '_state',
        '_releasedOn',
        '_version',
        '_versionedOn',
        '_createdOn',
        '_history',
        '_promotions'
      ];

      // format related node dates
      Object.keys(newProperties).forEach((prop) => {
        if (newProperties[prop] && newProperties[prop]._type) {
          formatDatesForRelatedNode(newProperties[prop]);
        }
      });


      $scope.stateColor = getStateBootstrapColor(newProperties._state, $scope.nodetype);

      let newNode = {};
      let oldNode = {};

      $scope.nodetype.properties
        .filter(property => {
          const propertyOfTypeNode = property.type === 'node';
          const generatedProperty = property.generated;
          const ignoredProperty = avoidPropWatching.includes(property.name);
          return !propertyOfTypeNode && !generatedProperty && !ignoredProperty;
        })
        .map(property => {
          const { name, type } = property;
          if (type === 'date' || type === 'dateTime') {
            let newDate = moment(newProperties[name]);
            let lastDate = moment($scope.lastSavedNode.properties[name]);
            newDate._isValid ? newNode[name] = newDate.valueOf() : newNode[name] = null;
            lastDate._isValid ? oldNode[name] = lastDate.valueOf() : oldNode[name] = null;
          } else {
            newNode[name] = newProperties[name];
            oldNode[name] = $scope.lastSavedNode.properties[name];
          }
        });
      let change = false;
      if (!_.isEqual(newNode, oldNode)) {
        change = true;
        $scope.saveNode($scope.node);
      }
      $scope.node.unsavedChanges = change;
      return change;
    };

    // #region [INIT]
    $scope.thumbnailUpload;
    $scope.schema = { type: 'object', properties: {} };
    $scope.form = [];
    $scope.lockedByCurrentUser = false;
    $scope.hoverLockMode = false;
    $scope.relationships = [];
    $scope.nodeUpdated = false;
    $scope.isLatestVersion = false;
    let instanciatingNotification;
    $scope.instanciatingNode = false;
    $scope.unlockProcessed = true;
    $scope.currentState = _.get($scope.nodetype, 'lifecycle.states', []).find((s) => s.name === $scope.node.properties._state);
    if ($scope.nodetype.actions) {
      $scope.nodeActions = $scope.nodetype.actions.filter((a) => a.availableOn === 'node');
    } else {
      $scope.nodeActions = [];
    }
    // fetch peoples name
    // const users = await nodesModel.getNodes('user');
    // if (users) $rootScope.users = users;

    //  If Nodetype has thumbnail then display default thumbnail until node thumbnail loaded
    if ($scope.node._typeObject.hasThumbnail) {
      $scope._thumbnail = $scope.node._typeObject.ui.defaultThumbnail;
      //  If thumbnail exists, request public url for thumbnail
      if ($scope.node.properties._thumbnail) {
        nodesModel.generatePublicURL($scope.node.properties._thumbnail._id).then(result => {
          if (result.error) {
            Notification.error({
              title: 'Error Generating Public URL - 4',
              ...result,
            });
          } else {
            $scope._thumbnail = result.url;
          }
        });
      }
    }

    // retrieve reports
    $scope.reports = _.filter($rootScope.datamodel.reports, { sourceType: 'node', sourceNodetype: $scope.nodetype.id });

    $scope.nodetypeIsVersionable = $scope.nodetype.versionnable;
    $scope.nodetypeHasInfoData = $scope.nodetype.properties.find((p) => p.infoData === true) ? true : false;
    //  Store node properties on load in a new variable
    $scope.lastSavedNode = angular.copy($scope.node);
    Object.keys($scope.node.properties).map((key) => {
      const prop = _.find($scope.nodetype.properties, { name: key });
      if (!prop && key[0] != '_') {
        delete $scope.lastSavedNode.properties[key];
      }
    });

    const { _version } = $scope.node.properties;
    $scope.nodeVersion = _version ? _version.replace(/\./g, '') : '';

    if ($scope.nodetype.ui.form) {
      $scope.schema = $scope.nodetype.ui.form.ng.schema;
      $scope.form = $scope.nodetype.ui.form.ng.form;
    }


    $scope.nodeSaving = false;
    $scope.node.unsavedChanges = false;

    if (typeof $scope.node.properties._lockState === 'string') {
      $scope.node.properties._lockState = ($scope.node.properties._lockState === 'true');
    }
    if ($scope.node.properties._lockedOn) {
      $scope._lockedOn = moment($scope.node.properties._lockedOn).format('DD/MM/YYYY HH:mm');
    }
    $scope.stateColor = getStateBootstrapColor($scope.node.properties._state, $scope.nodetype);
    $scope.isSubscriber = $scope.node.user ? $scope.node.user.isSubscriber : false;

    const { versions = [] } = $scope.node;

    const versionsLastItem = versions[versions.length - 1];
    const lastVersion = $scope.node.properties._version === versionsLastItem?._version;
    const versionnable = $scope.nodetype.versionnable;
    if (lastVersion || !versionnable) {
      $scope.isLatestVersion = true;
    }

    if (versions) {
      versions.sort((a, b) => {
        const versa = a._version.split('.');
        const versb = b._version.split('.');
        if (parseInt(versa[0], 10) == parseInt(versb[0], 10)) {
          if (parseInt(versa[1], 10) == parseInt(versb[1], 10)) {
            return parseInt(versa[2], 10) - parseInt(versb[2], 10);
          } else {
            return parseInt(versa[1], 10) - parseInt(versb[1], 10);
          }
        } else {
          return parseInt(versa[0], 10) - parseInt(versb[0], 10);
        }
      });
    }

    if ($scope.nodetype.ui.form.ng == null) {
      console.error("datamodel error on : ", $scope.nodetype);
    }

    const graphOptions = {
      edges: {
        arrowStrikethrough: false,
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.02,
          springLength: 400,
          springConstant: 1,
          damping: 0.09,
          avoidOverlap: 1
        },
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springConstant: 0.02,
          springLength: 30,
          damping: 0.4,
          avoidOverlap: 0.5
        },
        repulsion: {
          centralGravity: 1,
          springLength: 200,
          springConstant: 0.1,
          nodeDistance: 250,
          damping: 0.1
        },
        hierarchicalRepulsion: {
          centralGravity: 0.0,
          springLength: 100,
          springConstant: 0.01,
          nodeDistance: 320,
          damping: 0.09
        },
        maxVelocity: 15,
        minVelocity: 1,
        solver: 'forceAtlas2Based',
        stabilization: {
          enabled: true,
          iterations: 3,
          updateInterval: 10,
          onlyDynamicEdges: false,
          fit: true
        },
        timestep: 0.5,
        adaptiveTimestep: true
      }
    }

    let historyTimeline = null;
    $scope.timelineLoading = true;

    $scope.userAccessPathNetwork = null;
    $scope.graphAccessPathLoading = true;

    $scope.network = null;
    $scope.graphLoading = true;

    //  Translations on Init
    $scope.translateForm();
    $scope.translateInstanciations();
    $scope.translateSerializedItems();

    //  CHECK NODE LOCK ON INIT
    $scope.checkNodeLockState($scope.node);

    $scope.node.hasLifecycleRoles = false;
    // #endregion

    // #region LIFECYCLE ROLES 
    //  Check if Node has Lifecycle Roles
    if ($scope.node.lifecycleRoles) {
      if ($scope.node.lifecycleRoles.length > 0) {
        $scope.node.hasLifecycleRoles = true;
      }
    }

    //  Open Lifecycle Roles
    $scope.openLifecycleView = (node) => {

      $(`#lifecycleCollapse-${node._id}-${$scope.nodeVersion}`).collapse('toggle');
      $(`#lifecycleNode-${node._id}-${$scope.nodeVersion}`).toggleClass('active');
      $scope.$broadcast("openLifecycle");
      $scope.promotionGraphLoaded = true;
    };


    //  Listener to update Node Access Roles
    $scope.$on('reloadLifecycle', (event, args) => {
      if ($scope.node._id === args.nodeId) {
        if ($(`#lifecycleNode-${$scope.node._id}-${$scope.nodeVersion}`).hasClass('active')) {
          $scope.$broadcast('refreshLifecycle');
        } else {
          $scope.promotionGraphLoaded = false;
        }
      }
    });
    // #endregion

    // #region ACCESS ROLES 
    //  Load Node's Access Roles
    $scope.fetchNodeAccessRoles = async () => {
      try {
        const relationships = await nodesModel.getRelationships($scope.node, 'accessRole', { reverse: true });
        if (!relationships) return;

        $scope.$broadcast('rolesUpdate', { nodeId: $scope.node._id, relationships });
      } catch (error) {
        console.error(error);
      }
    };

    //  Listener to update Node Access Roles
    $scope.$on("rolesUpdate", async (event, args) => {
      if ($scope.node._id === args.nodeId) {
        $scope.node.accessRoles = args.relationships;
        $scope.node.accessRoles.forEach((relationship) => {
          relationship.permissionSet = relationship.properties.role === 'permissionSet';
        });
        $scope.node.hasPermissionSet = $scope.node.accessRoles.some((relationship) => {
          return relationship.properties.role === 'permissionSet';
        });
        const node = await nodesModel.getNode($scope.node._type, $scope.node._id);
        if (node) $scope.node.user.correctPath = node.user.correctPath;

        $scope.createAccessPathGraph();
      }
    });
    // #endregion

    // #region SUBSCRIPTION STATE 
    $scope.toggleSubscriberState = function (node) {
      $scope.isSubscriber = !$scope.isSubscriber
      if ($scope.isSubscriber) {
        nodesModel.subscribeToNode(node).then((result) => {
          if (result === false) {
            $scope.isSubscriber = false
            Notification.error({ title: "Cannot Subscribe to Node", message: "Please try again" })
          }
        })
      } else {
        nodesModel.unsubscribeToNode(node).then((result) => {
          if (result === false) {
            $scope.isSubscriber = true
            // TODO: Error Notification
            Notification.error({ title: "Cannot Unsubscribe to Node", message: "Please try again" });
          }
        })
      }
    }

    // #endregion

    // #region WATCHS (Object Watchers)

    $scope.$watch("thumbnailUpload", async (file, oldValue) => {
      try {
        if (file === oldValue || file === null) return;

        const res = await Upload.upload({ url: 'api/v0/uploads', data: { file } });
        if (res.status !== 200) {
          const { title, message } = res.data;
          return Notification.error({ title: title || 'Upload Failed', message });
        }

        Object.assign(file, res.data);
        const result = await nodesModel.addFile('file', file);
        const node = result.data;
        if (!node) return; // need an error message

        const relationshipValues = {
          _type: 'nodeThumbnail',
          source: $scope.node,
          target: node,
        }
        const relationship = await nodesModel.addRelationship(relationshipValues);
        if (!relationship) return;

        Notification.success({ title: 'File Uploaded', message: `Your file ${file.filename} has been uploaded` });
        $scope.node.properties._thumbnail = {
          ...relationship.target,
          relationshipType: relationship._type,
          relationshipId: relationship._id
        };

        const response = await nodesModel.generatePublicURL($scope.node.properties._thumbnail._id)
        if (response.error) {
          Notification.error({ title: 'Error Generating Public URL - 5', ...response });
        } else {
          $scope._thumbnail = response.url;
        }
      } catch (error) {
        console.error(error)
      }
    });

    $scope.removeThumbnail = async () => {
      const { _thumbnail } = $scope.node.properties;
      if (!_thumbnail) return;

      const relationship = {
        _type: _thumbnail.relationshipType,
        _id: _thumbnail.relationshipId,
        source: $scope.node,
        target: _thumbnail
      };

      const relationshipResult = await nodesModel.deleteRelationship(relationship);
      if (!relationshipResult) return;

      const result = await nodesModel.deleteNode(_thumbnail);
      if (!result) return;

      $scope.node.properties._thumbnail = null;
      $scope._thumbnail = $scope.node._typeObject.ui.defaultThumbnail;
    }

    //  Watch for node changes
    $scope.$watchCollection('node.properties', (newValue) => {
      checkNodeChanges(newValue);
      if ($scope.updateUnlockAndClose && !$scope.node.unsavedChanges) {
        $scope.updateNodeUnlockAndClose($scope.node)
      }
    });


    $scope.$watch("lockedByCurrentUser", () => {
      $scope.lockedByCurrentUserSwitch = $scope.lockedByCurrentUser;
    });

    // #endregion

    // #region ON (Event Listeners)


    // clean duplicated ids in the form
    $rootScope.$on('sf-render-finished', () => {
      document.querySelectorAll('input').forEach(node => node.removeAttribute('id'));
      document.querySelectorAll('textarea').forEach(node => node.removeAttribute('id'));
    });

    //  Update Forms on Language Change 
    $rootScope.$on('$translateChangeSuccess', $scope.translateForm);




    $rootScope.$on('updateNode', async (event, data) => {
      if (data._id === $scope.node._id) await $scope.saveNode(data);
    });


    $(document).on('mouseover', '.nodeEntry', function () {
      $(this).children().not(':first').children().children().css("display", "block");
    });

    $(document).on('mouseleave', '.nodeEntry', function () {
      $(this).children().not(':first').children().children().css("display", "none");
    });

    $(document).on('keydown', '[type="date"]', function (e) {
      if (e.ctrlKey === true && e.keyCode === 67) {
        $(this).attr("type", "text");
        const value = $(this).val();
        navigator.clipboard.writeText(moment(value).format('L'));
        $(this).attr("type", "date");
      }
    });

    $(document).on('keydown', '[type="datetime-local"]', function (e) {
      if (e.ctrlKey === true && e.keyCode === 67) {
        $(this).attr("type", "text");
        const value = $(this).val();
        navigator.clipboard.writeText(moment(value).toISOString());
        $(this).attr("type", "dateTime-local");
      }
    });

    $(document).bind("paste", function (e) {
      let $input = $(document.activeElement);
      if ($input.attr("type") === "date") {
        const value = e.originalEvent.clipboardData.getData('text');
        $input.val(moment(value).format('YYYY-MM-DD')).trigger('change');
        let model = $input[0].attributes['ng-model'].value.replace('model.', '');
        $scope.node[model] = moment(value)._d;
      }
      if ($input.attr("type") === "datetime-local") {
        const value = e.originalEvent.clipboardData.getData('text');
        $input.val(moment(value).format("YYYY-MM-DD[T]HH:mm:ss")).trigger('change');
        let model = $input[0].attributes['ng-model'].value.replace('model.', '');
        $scope.node[model] = moment(value)._d;
      }
    });

    $scope.formatVersion = (_version) => helperFunctions.filterSemVersionning(_version, $scope.nodetype);

    /************ SOCKET LISTENERS ************/
    $scope.$on('socketUpdateNode', (event, data) => {
      if ($scope.node._id === data.node._id) {
        Notification.warning({ title: `Node Updated`, message: `<strong>${$scope.node.properties._labelRef}</strong> updated by <strong>${data.user.name}</strong>.` });
        $scope.nodeUpdated = `Node has been updated by ${data.user.name}.`;
        $scope.$apply();
      };
    });

    //  Socket Action: If node is locked, update scope and display notification to the user
    $scope.$on('socketLockedNode', (event, data) => {
      const { node } = data;
      //  Check if the node from socket is the current node
      if ($scope.node._id === node._id) {
        $scope.node.properties._lockedBy = node.user._id;
        $scope.node.properties._lockedByName = node.user.name;
        $scope.node.properties._lockState = true;
        $scope.checkNodeLockState($scope.node);
        Notification.info({ title: `Node Locked`, message: `<strong>${$scope.node.properties._labelRef}</strong> locked by <strong>${node.user.properties.name}</strong>.` })
      }
    })

    //  Socket Action: If node is unlocked, update scope and display notification to the user
    $scope.$on('socketUnlockedNode', (event, data) => {
      const { node } = data;
      if ($scope.node._id === node._id) {
        $scope.node.properties._lockState = false;
        $scope.node.properties._lockedBy = null;
        $scope.node.properties._lockedByName = null;
        $scope.checkNodeLockState($scope.node);
        Notification.info({ title: `Node Unlocked`, message: `<strong>${$scope.node.properties._labelRef}</strong> unlocked by <strong>${node.user.properties.name}</strong>.` })
      }
    })
    // #endregion

  })
  .directive('checkImage', function ($http) {
    return {
      restrict: 'A',
      link: (scope, element, attrs) => {
        attrs.$observe('ngSrc', (ngSrc) => {
          if (ngSrc) {
            $http.get(ngSrc).then((result) => {
              if (result.status === 200) {
              } else {
                element.attr('src', '/images/identityLogo.png'); // set default image
              }
            }).catch(() => {
              element.attr('src', '/images/identityLogo.png'); // set default image
            });
          } else {
            element.attr('src', '/images/identityLogo.png'); // set default image
          }
        });
      }
    };
  });
