/* globals angular, _, cytoscape, document */
angular.module('app.ganister.shared.modals.lifecycleModal', [
  'ui-notification',
  'app.ganister.shared.modals.assignmentsModal',
])
  .controller('lifecycleModalController', ($scope, $rootScope, $translate, nodesModel, datamodelModel, agRenderMachine, helperFunctions, Notification) => {

    // #region [FUNCTIONS]
    const filterAssignments = () => {
      $scope.assignmentSelected = false;
      if (!$scope.lifecycleModal.selectedNode || !$scope.lifecycleModal.selectedNode._state) {
        return $scope.gridLifecycleAssignments.api.setRowData($scope.assignments);
      }
      //  Filter Assignments
      if (!_.isEmpty($scope.assignments)) {
        const { _state } = $scope.lifecycleModal.selectedNode;
        $scope.gridLifecycleAssignments.api.setRowData($scope.assignments.filter((n) => n._rel._state === _state.name));
      }
    };

    $scope.toggleCollapse = () => {
      $('#assignmentsAndHistoryCollapse-' + $scope.node._id).toggleClass('in');
    };
    // #endregion

    // #region [SCOPE_FUNCTIONS]
    $('assignmentsAndHistoryCollapse-' + $scope.node._id).collapse();
    $scope.lifecycleOpen = false;
    $scope.lifecycleLoading = false;

    $scope.openLifecycle = () => {
      $scope.lifecycleOpen = !$scope.lifecycleOpen;
      if (!$scope.lifecycleOpen) return;
      $scope.reloadLifecycle();
    };

    $scope.reloadLifecycle = async () => {
      try {
        $scope.lifecycleLoading = true;

        const { lifecycle } = $scope.nodetype;
        const { states = [] } = lifecycle;
        const state = states.find((s) => s.name === $scope.node.properties._state);

        let stateOwnerName;
        if (lifecycle?.roles) {
          if (!$scope.node.lifecycleRoles || !$scope.node.lifecycleRoles.length) {
            $scope.node.lifecycleRoles = lifecycle.roles.map((role) => {
              role.properties = { role: role.name };
              return role;
            });
          }
          const stateOwnerRole = lifecycle.roles.find((r) => r.id === state?.owner);
          stateOwnerName = stateOwnerRole?.name;
        }

        const relationships = await nodesModel.getRelationships($scope.node, 'lifecycleRole');
        $scope.lifecycleLoading = false;
        if (!relationships) return;

        relationships.forEach((relationship) => {
          const index = $scope.node.lifecycleRoles.findIndex((r) => {
            return r.properties.role === relationship.properties.role;
          });
          $scope.node.lifecycleRoles.splice(index, 1, relationship);
        });

        const stateOwnerRole = relationships.find((relationship) => {
          const { role } = relationship.properties;
          const { stateOwner } = relationship.target.properties;
          const currentUser = relationship.target._id === $rootScope.appContext.user._id;
          const currentStateOwner = stateOwnerName && role === stateOwnerName;
          return currentUser && stateOwner && currentStateOwner;
        });

        const allowManagerPromotion = $scope.appDefinition.uxConfig.promotionByNodeManager;
        const nodeManager = $scope.node.user.highestAccess === 'manager';
        $scope.promotionEnabled = stateOwnerRole || (nodeManager && allowManagerPromotion);

        $scope.loadPromotionGraph($scope.promotionEnabled, state, domSelectorId);
        $scope.graph.$('*').unselect();
        $scope.lifecycleModal.selectedNode = undefined;
        $scope.fetchAssignments();
      } catch (error) {
        console.error(error);
      }
    };

    $scope.buildGraphLifecycle = (domSelectorId, data, startState, actualState = "undefined") => {
      $scope.graph = cytoscape({
        boxSelectionEnabled: false,
        userPanningEnabled: true,
        userZoomingEnabled: true,
        selectionType: 'single',
        container: document.getElementById(domSelectorId),
        style: cytoscape.stylesheet()
          .selector('node')
          .css({
            content: 'data(label)',
            'background-color': '#5bc0de',
            'background-fit': 'contain',
            shape: 'ellipse',
            'text-wrap': 'wrap',
            'text-max-width': 100,
            'transition-property': 'background-color, line-color, target-arrow-color,width,height',
            'transition-duration': '0.3s',
            'background-image': 'images/lifecycle_pending.png',
            'border-color': '#111',
            'border-width': 2,
          })
          .selector('edge')
          .css({
            'curve-style': 'bezier',
            width: 6,
            'target-arrow-shape': 'triangle',
            'line-color': '#7d9aca',
            'target-arrow-color': '#7d9aca',
            'arrow-scale': '1',
          })
          .selector(`#${actualState}`)
          .css({
            'border-color': '#5cb85c',
            'border-width': 5,
            'border-style': 'double',
            'target-arrow-color': '#61bffc',
            'background-color': '#5cb85c',
            'background-image': 'images/lifecycle_here.png',
          })
          .selector(`#${startState}`)
          .css({
            'target-arrow-color': '#61bffc',
          })
          .selector('.nextSelectable')
          .css({
            'background-color': '#f0ad4e',
            'border-color': '#5cb85c',
            'border-width': 2,
            'target-arrow-color': '#61bffc',
            'background-image': 'images/lifecycle_promote.png',
          })
          .selector(`#${actualState}:selected`)
          .css({
            'background-color': '#5cb85c',
            'border-color': '#5cb85c',
          })
          .selector(`:selected`)
          .css({
            'width': 50,
            'height': 50,
            'border-color': '#428bca',
            'target-arrow-color': '#61bffc',
          })
          .selector('.nextSelectable:selected')
          .css({
            'border-width': 3,
            'border-color': '#428bca',
            'target-arrow-color': '#61bffc',
          })
          .selector('.highlighted')
          .css({
            'background-color': '#61bffc',
            'line-color': '#428bca',
            'target-arrow-color': '#61bffc',
          }),
        elements: data,
        layout: {
          name: 'null',
        },
        wheelSensitivity: 0.2,
        maxZoom: 3,
        minZoom: .5,
      });
      $scope.graph.nodes().positions((node, i) => {
        const state = $scope.nodetype.lifecycle.states.find((state) => state.id === node.data().id)
        if (!('positionX' in state)) state.positionX = i * 100;
        if (!('positionY' in state)) state.positionY = 150;
        return {
          x: state.positionX,
          y: state.positionY,
        }
      })
      $scope.graph.autolock(true);
      $scope.graph.fit(null, 50);
    }

    /**
   * Opens the promotion dialog modal
   * @param {string} actionnable - true if the user is responsible of the actual state.
   */
    $scope.loadPromotionGraph = (actionnable, nodeState, domSelectorId) => {
      let graphNodes = [];
      let graphEdges = [];
      let nextEdges = [];
      let startingState = '';
      // build graph dataset

      $scope.nodetype.lifecycle.transitions.forEach((transition) => {
        const sourceState = _.find($scope.nodetype.lifecycle.states, { id: transition.from });
        const targetState = _.find($scope.nodetype.lifecycle.states, { id: transition.to });
        if (sourceState && targetState) {
          const edge = {
            data: {
              id: transition.id,
              source: transition.from,
              target: transition.to,
            },
            selectable: false,
          };
          graphEdges.push(edge);
        } else {
          console.info(`transition ${transition.id} is missing a source or a target`);
        }
      });
      nextEdges = $scope.nodetype.lifecycle.transitions.filter((transition) => {
        if (nodeState && transition.from === nodeState.id) {
          return true;
        }
        return false;
      }).map(transition => transition.to);

      const roles = {};
      graphNodes = $scope.nodetype.lifecycle.states.map((state) => {
        const { id, name, label, owner } = state;
        const node = {
          data: {
            id,
            name,
            label,
            assignee: owner,
            promotable: true,
          },
          selectable: true,
        };
        if (nodeState && state.id === nodeState.id) {
          $scope.actualAssignee = state.owner;
        }
        if (roles[state.owner]) {
          role = roles[state.owner]
        } else {
          const ownerRole = _.find($scope.nodetype.lifecycle.roles, { id: state.owner });
          let ownerLabel = '';
          if (ownerRole) {
            role = ownerRole.label;
            roles[state.owner] = ownerRole.label;
          }
        }
        // retrieve role label
        if ((nextEdges.indexOf(state.id) > -1) && (actionnable)) {
          node.classes = 'nextSelectable';
        }
        return node;
      });

      startingState = _.find($scope.nodetype.lifecycle.states, { start: true }).id;

      // load graph
      const promotionGraphData = {
        nodes: graphNodes,
        edges: graphEdges,
      };
      $scope.activeNodeState = nodeState ? nodeState.id : "undefined";
      $scope.buildGraphLifecycle(domSelectorId, promotionGraphData, startingState, $scope.activeNodeState);
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
        $scope.targetState = node.data('name');
        $scope.updateSelectedNode(node, node.data('label'));
        $scope.graph.$('*').unselect();
        node.select();
        $scope.$apply();
        filterAssignments();
      });

      $scope.graph.on('doubleTap', 'node', (event) => {
        if ($scope.promotionEnabled && $scope.lifecycleModal.selectedNode.promotable) {
          $scope.runPromotion();
        }
      });

      $scope.graph.on('tap', (evt) => {
        var evtTarget = evt.target;
        if (evtTarget === $scope.graph) {
          $scope.lifecycleModal.selectedNode = undefined;
          $scope.graph.$('*').unselect();
          $scope.$apply();
          filterAssignments();
        }
      });
    }

    $scope.updateSelectedNode = (node, nodeLabel) => {
      //  Get Selected _state
      const _state = $scope.nodetype.lifecycle.states.find((s) => s.label === nodeLabel);

      const ownerRole = _.find($scope.nodetype.lifecycle.roles, { id: node.data('assignee') });
      let ownerLabel = '';
      if (ownerRole) ownerLabel = ownerRole.label;
      let mandatoryProperties = [];
      let mandatoryRels = [];
      // build promote requirements
      if (_state.mandatoryProperties) {
        mandatoryProperties = _state.mandatoryProperties.map((prop) => {
          return $translate.instant(`nodetype.${$scope.nodetype.name}.${prop}`);
        });
      }
      
      if (_state.mandatoryRels) {

        // check props that are actually rels
        _state.mandatoryRels.forEach((rel) => {

          // check if there is a tab
          let hasATab = true;
          let hasAProperty = false;
          let propertyRelName = '';
          if ($scope.nodetype.ui.tabs && $scope.nodetype.ui.tabs.find((tab) => tab.name === rel)) {
            hasATab = true;
          } else {
            hasATab = false;
            // check if property is based on the relationship
            const dmRel = $rootScope.datamodel.nodetypes.find((n) => n.name === rel);
            if (dmRel) {
              const prop = $scope.nodetype.properties.find((prop) => prop.relationship === dmRel.id)
              if (prop) {
                hasAProperty = true;
                propertyRelName = prop.name;
              }
            }
          }

          if (hasATab) {
            mandatoryRels.push($translate.instant(`nodetype.${$scope.nodetype.name}.${rel}`))
          } else if (hasAProperty) {
            mandatoryProperties.push($translate.instant(`nodetype.${$scope.nodetype.name}.${propertyRelName}`))
          } else {
            console.error('unreachable mandatory data: ', rel)
          }
        });
      }

      $scope.lifecycleModal.selectedNode = {
        owner: node.data('assignee'),
        ownerLabel,
        promotable: node.data('promotable'),
        nodeLabel,
        _state,
        mandatoryRels,
        mandatoryProperties,
      };
    };

    $scope.refreshNodeTab = (node) => {
      try {
        const convertedNodeProperties = convertNodeDatesBackToMoment(node.properties);
        const nodeProperties = Object.assign(node.properties, convertedNodeProperties);

        $scope.node.properties = nodeProperties;
        $scope.node.properties._versionLabel = helperFunctions.filterSemVersionning(nodeProperties._version, $scope.nodetype);

        $scope.checkNodeLockState($scope.node);

        // update lifecycleScope
        $scope.reloadLifecycle();

        $scope.node.properties._promotions = $scope.node.properties._promotions.map((elt) => {
          elt._type = $scope.node._type;
          return elt;
        });
        $scope.gridLifecyclePromotions.api.setRowData($scope.node.properties._promotions);
        // update nodeFormScope
        const { lifecycle } = $scope.nodetype;
        const currentState = lifecycle.states.find((s) => s.name === node.properties._state);
        $scope.$parent.$parent.currentState = currentState;
        $scope.$parent.$parent.properties = $scope.node.properties;

        // update nodeTabsScope
        $scope.$parent.$parent.$parent.$parent.node = $scope.node;

        $rootScope.$broadcast('refreshNodeTabs', { _id: $scope.node._id, _version: $scope.node.properties._version });

        Notification.success('Node Promoted');
      } catch (err) {
        console.error(err);
      }
    };

    const convertNodeDatesBackToMoment = (node) => {
      //  Convert Date values before saving
      const dateProps = $scope.nodetype.properties.filter((item) => item.type === 'date' || item.type === 'dateTime');
      Object.keys(node).map((key) => {
        const dateProp = dateProps.find((p) => p.name === key);
        if (dateProp) {
          if (node[key]) {
            const date = new Date(node[key]);
            node[key] = date;
          } else {
            node[key] = null;
          }
        }
      })
      return node;
    };

    $scope.runPromotion = async () => {
      await Swal.fire({
        title: 'Provide a promotion comment',
        input: 'text',
        showCancelButton: true,
        inputValidator: async (comment) => {
          if (!comment) {
            return 'You need to leave a comment to promote this node.';
          } else {
            const node = await nodesModel.promoteNode($scope.node, $scope.targetState, comment);
            if (!node) return;
            $scope.refreshNodeTab(node);
            $scope.updateMainGrid(node);
          }
        }
      });
    };

    //  Assignments
    $scope.fetchAssignments = async () => {
      const result = await nodesModel.getLifecycleAssignments($scope.node);
      if (result.error) {
        return Notification.error({
          title: 'Fetch Assignments Failed',
          ...result,
        });
      }
      $scope.assignments = result;
      filterAssignments();
    }

    $scope.createAsRelationship = async () => {
      //  If no _state selected, show error message
      if (!$scope.lifecycleModal.selectedNode) {
        return Notification.warning('State selection is required');
      }
      const { _state } = $scope.lifecycleModal.selectedNode;
      try {
        const mandatoryFields = await helperFunctions.askMandatoryFields(assignmentDM);
        if (mandatoryFields) {
          const params = {
            _type: assignmentDM.name,
            properties: { ...mandatoryFields }
          };
          const node = await nodesModel.addNode(params);
          if (!node) return;

          const attachNode = await nodesModel.attachLifecycleAssignment($scope.node, node._id, _state.name);
          if (attachNode.error) {
            return Notification.error({
              title: 'Error Attaching Node',
              ...attachNode,
            });
          }
          $scope.assignments.push({ ...attachNode.assignment, _rel: attachNode.assignmentFor });
          filterAssignments();
          $rootScope.$broadcast('openNode', {
            _id: attachNode.assignment._id,
            _type: attachNode.assignment._type,
            _version: attachNode.assignment._version,
          })
        }
      } catch (error) {
        Notification.error(error.message);
        console.log(error);
      }
    }

    $scope.addAsRelationship = async () => {
      const { _state } = $scope.lifecycleModal.selectedNode;
      $rootScope.$broadcast('openAssignmentsModal', $scope.node.id, $scope.node._version, _state.name);
    }

    $scope.detachRelationship = async () => {
      // retrieve targetnode
      const selected = $scope.gridLifecycleAssignments.api.getSelectedNodes();
      if (_.isEmpty(selected)) {
        Notification.warning('You need to select an assignment first');
        return false;
      }
      const { data } = selected[0];
      try {
        const result = await nodesModel.detachLifecycleAssignment($scope.node, data._rel._id);
        if (result.error) {
          Notification.error({
            title: 'Relationship not removed',
            message: result.message,
          });
          return false;
        }
        _.remove($scope.assignments, { _id: data._id });
        filterAssignments();
        return true;
      } catch (error) {
        Notification.error({
          title: 'Error',
          message: error.message,
        });
        return false;
      }
    }

    $scope.detachAndDelete = async () => {
      // retrieve targetnode
      const selected = $scope.gridLifecycleAssignments.api.getSelectedNodes();
      if (_.isEmpty(selected)) {
        return Notification.warning('You need to select an assignment first');
      }
      const { data } = selected[0];
      try {
        const detachRelationship = await $scope.detachRelationship();
        if (!detachRelationship) {
          return false;
        }
        const result = await nodesModel.deleteNode(data._type, data._id);
        if (!result) return;
        Notification.success({ title: 'Node Deleted', message: result });
        return true;
      } catch (error) {
        console.error(error);
        Notification.error({ title: 'Node Error', message: error.message });
      }
    };

    $scope.returnAssignmentRel = async (attachNode) => {
      $scope.assignments.push({ ...attachNode.assignment, _rel: attachNode.assignmentFor });
      filterAssignments();
    };

    $scope.loadPromotionsGrid = () => {
      const columnDefs = [{
        headerName: 'From',
        width: 90,
        field: 'fromState',
        type: 'state',
        cellRendered: true,
        cellStyle: {
          'text-align': 'center',
        },
      }, {
        headerName: 'To',
        width: 90,
        field: 'toState',
        type: 'state',
        cellRendered: true,
        cellStyle: {
          'text-align': 'center',
        },
      }, {
        headerName: 'Comment',
        field: 'comment',
      }, {
        headerName: 'User',
        width: 120,
        field: 'user.name',
      }, {
        headerName: 'Time',
        width: 150,
        field: 'time',
        type: 'dateTime',
        cellRendered: true,
      }, {
        headerName: 'Version',
        width: 90,
        field: '_version',
        cellRenderer: agRenderMachine.versionRenderer,
      }].map((column) => {
        columnback = agRenderMachine.getRendering(column, column);
        delete columnback.type;
        delete columnback.cellRendered;
        return columnback;
      });
      $scope.gridLifecyclePromotions = {
        components: {
          datePicker: agRenderMachine.getDatePicker(),
          booleanEditor: agRenderMachine.getBooleanEditor(),
        },
        columnDefs,
        singleClickEdit: true,
        stopEditingWhenGridLosesFocus: true,
        rowData: $scope.node._promotions,
        defaultColDef: {
          resizable: true,
          sortable: true,
        },
        onGridReady: () => {
          const { _promotions } = $scope.node.properties;
          if (_promotions) {
            $scope.node._promotions = _promotions.map((elt) => {
              elt._type = $scope.node._type;
              return elt;
            });
            $scope.gridLifecyclePromotions.api.setRowData($scope.node._promotions);
          }
        },
        // onModelUpdated: onModelUpdated,
        angularCompileRows: true,
      };
    };

    $scope.loadAssignmentsGrid = () => {
      //  Get Column Defs for assignment
      const assignmentColumnDefs = agRenderMachine.getColumnDefs(datamodelModel.getNodetype('assignment')).map((item) => {
        const adjustedItem = item;
        if (item.editable) {
          adjustedItem.editable = () => {
            if ($scope.rel.disableUpdates) {
              return false;
            } else if ($scope.lockedByCurrentUser || (!$scope.rel.lockLinked && $scope.rel.lockLinked != undefined)) {
              return true;
            }
            return false;
          };
        }
        return adjustedItem;
      });

      $scope.gridLifecycleAssignments = {
        components: {
          datePicker: agRenderMachine.getDatePicker(),
          booleanEditor: agRenderMachine.getBooleanEditor(),
        },
        columnDefs: assignmentColumnDefs,
        singleClickEdit: true,
        stopEditingWhenGridLosesFocus: true,
        rowData: $scope.assignments,
        defaultColDef: { resizable: true, sortable: true },
        rowSelection: 'single',
        getRowNodeId: (data) => `${data._id}-${data._version}-${data._rel._state}`,
        onGridReady: () => $scope.gridLifecycleAssignments.api.setRowData($scope.assignments),
        onSelectionChanged: () => {
          const selected = $scope.gridLifecycleAssignments.api.getSelectedNodes();
          if (_.isEmpty(selected)) {
            $scope.assignmentSelected = false;
          } else {
            $scope.assignmentSelected = true;
          }
          $scope.$apply();
        },
        onRowDoubleClicked: ({ data }) => $rootScope.$broadcast('openNode', {
          _id: data._id,
          _type: data._type,
          _version: data._version,
        }),
        angularCompileRows: true,
      };
    }
    // #endregion

    // #region [INIT]

    $scope.promotionEnabled = false;
    $scope.lifecycleModal = {
      nodeId: $scope.node._id,
      nodeType: $scope.node._type,
      modalLabel: `${$scope.node._type} lifecycle`,
      selectedNode: {},
    };
    $scope.assignments = [];
    $scope.assignmentSelected = false;
    const assignmentDM = $rootScope.datamodel.nodetypes.find((n) => n.name === 'assignment');

    const { _version } = $scope.node.properties;
    $scope.nodeVersion = _version ? _version.replace(/\./g, '') : '';
    const domSelectorId = `cytoscape-${$scope.node._type}-${$scope.node._id}`;
    $scope.loadPromotionsGrid();
    $scope.loadAssignmentsGrid();

    // #endregion

    // #region [SCOPE_WATCH]
    // #endregion

    // #region [SCOPE_ON]
    // load lifecycle data
    $scope.$on('openLifecycle', (events, data) => $scope.openLifecycle());
    $scope.$on('reloadLifecycle', (events, data) => $scope.reloadLifecycle());
    $scope.$on('tabOpened', (events, data) => {
      if (data._id === $scope.node._id && data.properties._version === $scope.node.properties._version && $scope.graph) {
        setTimeout(() => {
          $scope.graph.resize();
        }, 200)
      }
    });
    // #endregion

  });
