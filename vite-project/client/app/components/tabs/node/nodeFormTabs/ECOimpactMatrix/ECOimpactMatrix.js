
/* global angular, _ */
angular.module('app.ganister.tabs.node.nodeFormTabs.ECOimpactMatrix', [
  'app.ganister.user.config',
  'app.ganister.models.nodes',
  'app.ganister.models.nodetypes',
  'app.ganister.models.plm',
  'agGrid',
  'app.ganister.tool.aggrid',
  'ui-notification',
])
  .controller('ECOimpactMatrixController', ($scope, $rootScope, $translate, Notification, nodesModel, plmModel, agRenderMachine) => {

    // #region FUNCTION

    const getCustomActionName = (action) => {
      if (!action) return { value: 'none', name: 'none' };
      const actions = [...$scope.customActionNames].map((action) => action.value);
      let customActionName;
      if (!actions.includes(action)) {
        customActionName = $scope.customActionNames.find((a) => a.name === action);
      } else {
        customActionName = $scope.customActionNames.find((a) => a.value === action);
      }
      if (customActionName) {
        return customActionName.name
      } else {
        return 'none'
      }
    }

    const getAction = (name) => {
      const action = $scope.customActionNames.find((a) => a.name === name);
      if (action) {
        return action.value;
      } else {
        return name;
      }
    }

    /**
     * Creates a formatted record for the impact matrix.
     * @name createImpactMatrixRecord
     * @param {string} record - node record
     * @param {boolean} controlledNode - true if the node is controlled by the ECO, false if just impacted
     * @returns {object} Impact Matrix Record
     */
    const createImpactMatrixRecord = (record, controlledNode) => {
      let impactMatrixRecord;
      if (controlledNode) {
        impactMatrixRecord = {
          ...record.node,
          rel: record.rel,
          relation: record.relation,
          action: getCustomActionName(record.action),
          _changeComment: record._changeComment,
          newRef: record.newRef,
          replacement: record.replacement,
          impacted: 'controlled',
          _handled: record._handled,
          _handledState: record._handledState,
          _sourceNode: record._sourceNode,
          linkActions: record.linkActions,
        };
      } else {
        impactMatrixRecord = {
          ...record,
          action: 'none',
          impacted: 'impacted',
        };
      }
      return impactMatrixRecord;
    }

    /**
     * Returns if the array still has parent to child links to resolve
     * @name cntMapsToResolve
     * @param {array} viewArray - node record
     * @returns {integer} count of links to resolve
     */
    function cntMapsToResolve(viewArray) {
      let matchingCnt = 0;
      viewArray.forEach((viewArrayItem) => {
        if (_.find(viewArray, { _id: viewArrayItem.root })) {
          matchingCnt += 1;
        }
      });
      return matchingCnt;
    }

    /**
      * Clean array duplicates based on the orgHierarchy criteria
      * @name cleanDuplicates
      * @param {array} array - node record
      * @returns {array} array cleaned off duplicates
      */
    function cleanDuplicates(array) {
      array.forEach((item) => {
        item.fullpath = item.orgHierarchy.join('-');
      });
      return _.uniqBy(array, 'fullpath');
    }

    /**
      * Converts a collection of Parent Child rels to a nested structure compatible with ag-grid tree structure format
      * @name controlledNodesToDeepStruct
      * @param {array} controlledNodes - node record
      * @returns {collection} collection of impact matrix records
      */
    const controlledNodesToDeepStruct = (controlledNodes) => {
      const viewArray = [];

      // ********************************
      // manage controlled nodes and parents
      // ********************************
      for (const controlledNode of controlledNodes) {
        // in case there is no parent 
        if (!(_.find(controlledNode.impactedNodes, { relation: 'parent' }))) {
          const record = createImpactMatrixRecord(controlledNode, true);
          record.root = controlledNode.node._id;
          record.orgHierarchy = [controlledNode.node._id];
          viewArray.push(record);
        } else {
          // else if there are impacted nodes

          // Loop through impacted parent nodes
          for (const impactedNode of controlledNode.impactedNodes) {
            // if this is a parent and it has not been added yet to the grid, add it
            if (impactedNode && impactedNode.relation === 'parent') {
              // do not add if it is a controlledNode
              if (!(_.find(controlledNodes, { targetNodeId: impactedNode._id }))) {
                const recordparent = createImpactMatrixRecord(impactedNode, false);
                recordparent.root = impactedNode._id;
                recordparent.orgHierarchy = [impactedNode._id];
                recordparent.parent = impactedNode._id;
                recordparent.parentVersion = impactedNode._version;
                viewArray.push(recordparent);
              }
              // also add child
              const recordChild = createImpactMatrixRecord(controlledNode, true);
              recordChild.root = impactedNode._id;
              recordChild.orgHierarchy = [impactedNode._id, controlledNode.node._id];
              recordChild.parent = impactedNode._id;
              recordChild.parentVersion = impactedNode._version;
              viewArray.push(recordChild);
            }
            if (impactedNode === null) console.warn('Impacted Node is null');
          };
        };
      };

      // ********************************
      // add children
      // ********************************

      let viewArrayWithChildren = [...viewArray];
      for (const viewItem of viewArray) {
        for (const controlledNode of controlledNodes) {
          for (const impactedNode of controlledNode.impactedNodes) {
            // if this is a child and it has not been added yet to the grid, add it
            if (impactedNode && impactedNode.relation && impactedNode.relation === 'child') {
              if (viewItem.orgHierarchy[viewItem.orgHierarchy.length - 1] === controlledNode.node._id) {
                //add child
                const recordChild = createImpactMatrixRecord(impactedNode, false);
                recordChild.root = viewItem.root;
                recordChild.parent = controlledNode.node._id;
                recordChild.parentVersion = controlledNode.node._version;
                recordChild.orgHierarchy = [...viewItem.orgHierarchy];
                recordChild.orgHierarchy.push(impactedNode._id);
                viewArrayWithChildren.push(recordChild);
                ;
              }
            };
          };
        };
      };

      // ***************************************
      // set all items to same handling status and find linkActions from parents
      // ***************************************
      viewArrayWithChildren.map((elt) => {
        const eltFound = _.find(viewArrayWithChildren, { _id: elt._id, impacted: 'controlled', _version: elt._version });
        if (eltFound) {
          elt.impacted = 'controlled';
          elt.newRef = eltFound.newRef;
          elt.action = eltFound.action;
          elt._handled = eltFound._handled;
          elt._changeComment = eltFound._changeComment;
        }
        return elt;
      });

      viewArrayWithChildren.map((elt) => {
        //  Find all elements with elt _id from array that are controlled
        const eltsFound = _.filter(viewArrayWithChildren, { _id: elt._id, parent: elt.parent });
        if (eltsFound.length) {
          //  Find Link Action and Alternative Node from parents
          const parent = viewArrayWithChildren.find((n) => n._id === elt.parent && n.linkActions);
          //  If parent found, parse linkActions (if exist) and check for recordChild
          if (parent) {
            const linkActions = JSON.parse(parent.linkActions);
            const linkAction = linkActions.find((a) => a.childNode === elt._id);
            if (linkAction) {
              //  Update all elements found
              eltsFound.map((e) => {
                e.linkAction = linkAction.action;
                e.alternativeNode = linkAction.alternativeNode;
                e.alternativeNodeVer = linkAction.alternativeNodeVer;
                e.alternativeNodeLabel = linkAction.alternativeNodeLabel;
              })
            }
          }
        }
      });

      // ********************************
      // resolve tree-structure
      // ********************************

      let limitCnt = 0;
      while (cntMapsToResolve(viewArrayWithChildren) > 0 && limitCnt < 10) {
        limitCnt += 1;
        viewArrayWithChildren.forEach((viewArrayItem) => {
          if (_.find(viewArrayWithChildren, { _id: viewArrayItem.root })) {
            viewArrayWithChildren.forEach((viewArrayItem2) => {
              // if elt 2 the root of elt 1
              if ((viewArrayItem2._id === viewArrayItem.root) && (_.difference(viewArrayItem2.orgHierarchy, viewArrayItem.orgHierarchy).length > 0) && (viewArrayItem.orgHierarchy.length > 1)) {
                viewArrayItem.orgHierarchy.shift();
                viewArrayItem.orgHierarchy = (viewArrayItem2.orgHierarchy.concat(viewArrayItem.orgHierarchy));
                viewArrayItem.root = viewArrayItem2.root;
              }
            });
          }
        });
        viewArrayWithChildren = cleanDuplicates(viewArrayWithChildren);
      }

      //  Remove Root Nodes that exists as a child in the tree
      viewArrayWithChildren = viewArrayWithChildren.filter((n) => {
        const root = n.root === n._id;
        //  If node is not root, return true
        if (!root) {
          return true;
        }
        //  If node is root, check if node exists in a non root place
        if (root) {
          const foundChildNode = viewArrayWithChildren.find((item) => item._id === n._id && item.root !== item._id);
          if (foundChildNode) {
            return false;
          }
          return true;
        }
      });
      return viewArrayWithChildren;
    }

    let impactMatrixBeforeRelationships = [];
    function collectNodesRelationships(controlledNodes) {
      impactMatrixBeforeRelationships = [];
      controlledNodes.forEach((controlledNode) => {
        controlledNode.impactedNodes.forEach((impactedNode) => {
          const newItem = { parent: {}, child: {}, relationship: _.cloneDeep(impactedNode.rel) };
          if (impactedNode.relation === 'child') {
            newItem.child = _.cloneDeep(impactedNode);
            newItem.parent = _.cloneDeep(controlledNode.node);
          }
          if (impactedNode.relation === 'parent') {
            newItem.parent = _.cloneDeep(impactedNode);
            newItem.child = _.cloneDeep(controlledNode.node);
          }
          impactMatrixBeforeRelationships.push(newItem);
        })
      });
      impactMatrixBeforeRelationships = _.uniqBy(impactMatrixBeforeRelationships, 'relationship._id');
      return impactMatrixBeforeRelationships;
    }

    function getNodeIcon(nodetype) {
      const nodetypeDM = $rootScope.datamodel.nodetypes.find((n) => n.name === nodetype);
      const defaultThumbnail = _.get(nodetypeDM, 'ui.defaultThumbnail');
      if (defaultThumbnail) {
        return `<img src="${defaultThumbnail}" style="width: 16px; height: 16px; margin-right: 5px;" />`;
      } else {
        return '<i class="glyphicon glyphicon-asterisk"></i>';
      }
    }

    function getOrgCellRenderer() {
      function OrgCellRenderer() { }

      OrgCellRenderer.prototype.init = (params) => {
        const tempDiv = document.createElement('div');
        const { value } = params;
        let icon = '';
        if (params.data) {
          icon = getNodeIcon(params.data._type);
        }
        tempDiv.innerHTML = icon ? `<span>${icon} <span class="nodename">${params.data._maidenName}</span></span>` : value;
        this.eGui = tempDiv.firstChild;
      };
      OrgCellRenderer.prototype.getGui = () => {
        return this.eGui;
      };

      return OrgCellRenderer;
    }

    const getInterchangeableAction = (nodetypeName, action) => {
      const nodetypeDM = $rootScope.datamodel.nodetypes.find((i) => i.name === nodetypeName);
      if (!nodetypeDM || !nodetypeDM.versioningRule || ['obsolete', 'fork', 'supFork'].includes(action)) {
        return false;
      };
      return nodetypeDM.versioningRule[action];
    }

    // Remove any linkActions from parentNode that includes this childNode
    const removeLinkActions = async (childNodeId, parentId) => {
      const linkActions = [{ childNode: childNodeId, operation: 'remove' }];
      let nodeControlled = false;
      $scope.gridOptionsBefore.api.forEachNode((node) => {
        if (node.data._id === parentId && node.data.impacted === 'controlled') {
          nodeControlled = true;
        }
      });
      if (nodeControlled) {
        const result = await $scope.updateEcoControlledLinkActions(parentId, linkActions);
        if (result.error) {
          Notification.error('Link Actions Remove Error', result.message);
          return { ...result, error: true };
        }
        return result;
      }
      const missingControlledParentErrorMsg = 'Parent node is not controlled by ECO';
      Notification.warning(missingControlledParentErrorMsg);
      return { error: true, message: missingControlledParentErrorMsg };
    }

    const addLinkActions = async (childId, parentId, linkAction) => {
      const result = await $scope.addControlledNode(parentId);
      if (result.error) {
        return result;
      }
      $scope.gridOptionsBefore.api.forEachNode((node) => {
        if (node.data._id === parentId && node.data.impacted === 'impacted') {
          Notification.info({
            message: 'Parent node automatically added to controlled nodes',
          });
        }
      });
      //  Find Relationship
      const relObj = impactMatrixBeforeRelationships.find((r) => r.parent._id === parentId && r.child._id === childId);
      if (!relObj) return Notification.error('Link Action not created - Relationship not found');
      linkAction.relationshipId = relObj.relationship._id;
      linkAction.relationshipLinkName = relObj.relationship.linkName;
      return await $scope.updateEcoControlledLinkActions(parentId, [linkAction]);
    }

    const getApplicableLinkActions = (_type, action) => {
      const coreAction = getAction(action);
      const interChangeableStatus = getInterchangeableAction(_type, coreAction);
      //  If action is interchangeable, link Actions should be empty
      if (interChangeableStatus === 'interchangeable') {
        return ['Update to Latest (default)'];
      }
      if (coreAction === 'obsolete') {
        return ['none', 'pick alternative'];
      }
      if (coreAction === 'fork') {
        return ['pick fork', 'pick alternative'];
      }
      if (coreAction === 'supFork') {
        return ['pick fork', 'pick alternative'];
      }
      if (['major', 'minor', 'patch'].includes(coreAction)) {
        return ['Update to Latest (default)', 'pick alternative'];
      }
      return ['none'];
    }

    // #endregion

    // #region $SCOPE.FUNCTIONS

    /**
      * Creates the context menu
      * @name getContextMenuItemsFn
      * @param {object} params - ag-grid context
      * @returns {collection} context menu items for the ag-grid
      */
    $scope.getContextMenuItemsFn = (params) => {
      $scope.gridOptionsBefore.api.getRowNode(params.node.id).setSelected(true, true);
      const result = [
        {
          // custom item
          name: 'Revise or Branch',
          disabled: !($scope.node._state !== 'released' && $scope.lockedByCurrentUser && params.node.data.impacted === 'impacted'),
          action: async () => {
            const result = await $scope.addControlledNode(params.node.data._id);
            if (!result.error) {
              $scope.loadImpactMatrixData();
            }
          },
        },
        {
          // custom item
          name: 'Cancel Action',
          disabled: !($scope.node._state !== 'released' && $scope.lockedByCurrentUser && params.node.data.impacted === 'controlled'),
          action: () => {
            plmModel.removeEcoControlledNode(params.node.data._id, $scope.node._id)
              .then((result2) => {
                if (result2.error) {
                  return Notification.error({
                    title: 'Error Removing ECO Controlled Node',
                    ...result2,
                  });
                }
                $scope.loadImpactMatrixData();
              });
          },
        },
        {
          // custom item
          name: 'Process Node',
          disabled: $scope.lockedByCurrentUser && params.node.data._handled !== true && params.node.data.impacted === 'controlled' ? false : true,
          action: () => {
            const { _id, _type, action, newRef } = params.node.data;
            const ecoId = $scope.node._id;
            const coreAction = getAction(action);
            plmModel.processECONode(_type, _id, coreAction, newRef, ecoId)
              .then((result2) => {
                $scope.reloadGraph();
                $scope.reloadMatrix();
              }).catch((error) => {
                console.error(error);
              });
          },
        },
        {
          name: 'Open Node',
          action: () => {
            // TODO: make the following code reusable in a service
            return $rootScope.$broadcast('openNode', {
              _id: params.node.data._id,
              _type: params.node.data._type,
            });
          },
        },
        'separator',
        'copy',
        'copyWithHeaders',
        'export',
      ];
      return result;
    }

    $scope.loadImpactMatrixData = async () => {
      if ($scope.gridOptionsBefore.api) {
        $scope.gridOptionsBefore.api.showLoadingOverlay();

        let firstSelectedRow = null;
        if ($scope.gridOptionsBefore.api.getSelectedNodes().length > 0) {
          firstSelectedRow = $scope.gridOptionsBefore.api.getSelectedNodes()[0];
        }
        const selectedNodeIds = $scope.gridOptionsBefore.api.getSelectedNodes().map((row) => {
          return row.data._id;
        });

        const result = await plmModel.getEcoControlledNodesExtended($scope.node._id);
        controlledNodesIds = result.map(({ node }) => node._id);
        collectNodesRelationships(result);
        $scope.tree_data = await controlledNodesToDeepStruct(result);
        $scope.gridOptionsBefore.api.setRowData($scope.tree_data);
        $scope.$emit("objCountUpdate", $scope.rel.name, $scope.tree_data.length);

        // reposition the grid
        $scope.gridOptionsBefore.api.forEachNode((rowNode, index) => {
          if (selectedNodeIds.indexOf(rowNode.data._id) > -1) {
            rowNode.setSelected(true);
          }
        });
        if (firstSelectedRow) {
          const firstSelectedRowIndex = $scope.gridOptionsBefore.api.getRowNode(firstSelectedRow.id).rowIndex;
          $scope.gridOptionsBefore.api.ensureIndexVisible(firstSelectedRowIndex, 'middle');
        }

        $scope.gridOptionsBefore.api.hideOverlay();
      } else {
        console.info("Before grid not ready yet!");
      }
      if ($scope.gridOptionsAfter.api) {
        $scope.gridOptionsAfter.api.showLoadingOverlay();
        const result = await plmModel.getEcoProcessedNodesExtended($scope.node._id);
        $scope.controlledTree_data = await controlledNodesToDeepStruct(result);
        $scope.gridOptionsAfter.api.setRowData($scope.controlledTree_data);
        $scope.gridOptionsAfter.api.hideOverlay();
      } else {
        console.info("After grid not ready yet!");
      }
    }

    $scope.reloadGraph = () => $scope.loadEcoGraph();
    $scope.reloadMatrix = () => $scope.loadImpactMatrixData();

    $scope.openNode = (node) => {
      if (node && node._id) {
        $rootScope.$broadcast('openNode', {
          _id: node._id,
          _type: node._type
        })
      }
    };

    $scope.onColumnResized = (event) => {
      if (event.finished) {
        $scope.gridOptionsBefore.api.resetRowHeights();
      }
    };

    $scope.openImpactedNode = async () => {
      const { _type, _id } = $scope.selectedImpactedItem;
      const node = await nodesModel.getNode(_type, _id);
      if (!node) return;
      $scope.openNode(nodesModel.normalizeNode(node));
    };

    $scope.updateControlledNode = ({ _changeComment, _id, action, newRef }) => {
      return plmModel.updateEcoControlledState(_id, $scope.node._id, { _changeComment, action, newRef });
    };

    $scope.updateEcoControlledParam = (param) => {
      plmModel.updateEcoControlledParam(
        $scope.selectedImpactedItem._id,
        $scope.node._id,
        param,
        $scope.selectedImpactedItem[param]
      ).then((result) => {
        // save the local data store
        // apply to all other lines sharing the same id
      });
    };

    $scope.updateEcoControlledLinkActions = (nodeId, data) => {
      return plmModel.updateEcoControlledLinkActions(
        nodeId,
        $scope.node._id,
        data,
      )
    };

    $scope.openDialogNodeSearch = () => {
      // load AG-GRID
      $rootScope.$broadcast('openAddImpactedModal', 'part', $scope.node._id, $scope.gridOptionsBefore, []);
    };

    $scope.addAlternativeNode = async () => {
      const { _id, _version, parent, parentVersion } = $scope.selectedNode;
      const nodes = $scope.ecoGridOptions.api.getSelectedRows();
      if (nodes.length) {
        //  Always get only the first node if selected more than one
        const alternativeNode = nodes[0];
        //  Update Link Actions
        //  Generate Alternative Node Label
        let alternativeNodeLabel = alternativeNode._id;
        const alternativeNodeDM = $rootScope.datamodel.nodetypes.find((n) => n.name === alternativeNode._type);
        if (alternativeNodeDM.maidenName && alternativeNodeDM.maidenName.elements) {
          alternativeNodeLabel = alternativeNodeDM.maidenName.elements.map((elt) => alternativeNode.properties[elt]).join(alternativeNodeDM.maidenName.separator);
        }
        const linkAction = {
          alternativeNode: alternativeNode._id,
          alternativeNodeVer: alternativeNode.properties._version,
          alternativeNodeLabel,
          childNode: _id,
          childVersion: _version,
          action: 'pick alternative',
          operation: 'add',
        };
        const result = await addLinkActions(_id, parent, linkAction);
        if (result.error) return Notification.error('Cannot add alternative node', result.message);
        $scope.loadImpactMatrixData();
      }
      $("#ecoRelationshipModal-" + $scope.node._id).modal('hide');
    }

    $scope.addControlledNodes = () => {
      const nodes = $scope.ecoGridOptions.api.getSelectedRows();
      Promise.all(nodes.map(async (node) => await plmModel.addEcoControlledNode(node._id, $scope.node._id)))
        .then(result => {
          result.map(i => {
            if (i.error) {
              Notification.error({ title: i.title, message: i.message, delay: 5000 })
            }
          });
          $scope.loadImpactMatrixData();
          $("#ecoRelationshipModal-" + $scope.node._id).modal('hide');
        })
        .catch(error => console.error(error))
    };

    $scope.addControlledNode = async (nodeId) => {
      //  Check if parent is already in controlled chg control
      let nodeControlled = false;
      $scope.gridOptionsBefore.api.forEachNode((node) => {
        if (node.data._id === nodeId && node.data.impacted === 'controlled') {
          nodeControlled = true;
        }
      });
      //  Add Parent to controlled nodes if not already controlled
      if (!nodeControlled) {
        const result = await plmModel.addEcoControlledNode(nodeId, $scope.node._id);
        if (result.error) {
          Notification.error({
            title: 'Error adding Controlled Node',
            ...result,
          });
        } else {
          Notification.success('Node added to controlled nodes');
        }
        return result;
      }
      return { error: false };
    }

    $scope.loadNodetypeNodes = (nodetypeDM, search) => {
      const releasedStates = nodetypeDM.lifecycle.states.filter((s) => s.released).map((s) => s.name);

      search.searchDate = $scope.searchDate.setHours(0, 0, 0) + 86399000;
      search.searchType = $scope.searchType;
      search.searchCriterias[`${nodetypeDM.name}._state`] = { filterType: 'set', values: releasedStates };
      //  TODO: If modal is addControlledNodes, show only released state nodes (update search criterias)
      $scope.ecoGridOptions.api.showLoadingOverlay();
      nodesModel.getNodes(nodetypeDM.name, search).then((result) => {
        $scope.ecoGridOptions.data = result.map((item) => {
          item._typeObject = nodetypeDM;
          return item;
        });
        $scope.ecoGridOptions.api.setRowData($scope.ecoGridOptions.data);
        $scope.ecoGridOptions.api.hideOverlay();
        //  Check if results are less that the maxResults requested
        if (result.length < $scope.maxResults) {
          $scope.maxResultsClass = false;
        } else {
          $scope.maxResultsClass = true;
        }
      });
    };

    const getFilterModel = () => {
      const filterModel = $scope.ecoGridOptions.api.getFilterModel();
      if (Object.keys(filterModel).length === 0 && filterModel.constructor === Object) {
        $scope.noFilter = true;
      }
      //  convert all date values to miliseconds
      Object.keys(filterModel).map((i) => {
        if (filterModel[i].operator) {
          Object.keys(filterModel[i]).filter(k => k !== 'operator').map(k => {
            if (filterModel[i][k].filterType === 'date') {
              if (filterModel[i][k].dateFrom) filterModel[i][k].dateFrom = moment(filterModel[i][k].dateFrom).valueOf();
              if (filterModel[i][k].dateTo) filterModel[i][k].dateTo = moment(filterModel[i][k].dateTo).valueOf();
            }
          })
        } else {
          Object.keys(filterModel[i]).map(k => {
            if (filterModel[i].filterType === 'date') {
              if (filterModel[i].dateFrom) filterModel[i].dateFrom = moment(filterModel[i].dateFrom).valueOf();
              if (filterModel[i].dateTo) filterModel[i].dateTo = moment(filterModel[i].dateTo).valueOf();
            }
          })
        }
      });
      return filterModel;
    }

    $scope.executeFilter = (nodetype) => {
      const filterModel = getFilterModel();
      $scope.loadNodetypeNodes(nodetype, {
        maxResults: $scope.maxResults,
        searchCriterias: filterModel
      });
    }

    $scope.clearFilters = () => $scope.ecoGridOptions.gridOptions.api.setFilterModel(null);



    $scope.loadCytoscapeGraph = () => {
      return cytoscape({
        container: document.getElementById('ecoGraph'), // container to render in
        selectionType: 'multiple',
        style: [ // the stylesheet for the graph
          {
            selector: 'node',
            style: {
              'shape': 'ellipse',
              'label': 'data(label)',
              'text-halign': 'left',
              'text-valign': 'center',
              'text-margin-x': 0,
              'text-margin-y': 0,
              'z-index': 2,
              'background-color': '#539aC7',
              'border-width': 2,
              'background-opacity': 1,
              'width': 128,
              'height': 128,
              'text-valign': "bottom",
              'text-wrap': "wrap",
            }
          }, {
            selector: 'node[nodeOpacity]',
            style: {
              'opacity': 'data(nodeOpacity)',
            }
          }, {
            selector: 'node[image]',
            style: {
              'background-image': 'data(image)',
              'background-opacity': .8,
              'background-width': '80%',
              'background-height': '80%',
            }
          },
          {
            selector: 'node.handlesChangeOf',
            style: {
              'border-style': 'dotted',
              'background-color': '#53FaC7',
              'background-opacity': .5,
              'border-width': 1,
            }
          },
          {
            selector: 'node.virtual',
            style: {
              'border-style': 'dotted',
              'background-color': '#53FaC7',
              'background-opacity': .5,
              'border-width': 1,
            }
          },
          {
            selector: 'node.handlesChangeOf',
            style: {
              'border-style': 'dotted',
              'background-color': '#5bc0de',
              'background-opacity': .5,
              'border-width': 6,
            }
          },
          {
            selector: 'node.generated',
            style: {
              'border-style': 'dotted',
              'background-color': '#5cb85c',
              'background-opacity': .5,
              'border-width': 6,
            }
          },
          {
            selector: 'node.revised',
            style: {
              'border-style': 'dashed',
              'background-opacity': .5,
              'border-width': 2,
            }
          },
          {
            selector: 'node:selected',
            style: {
              'background-color': '#5cc85c'
            }
          },
          {
            selector: 'node.obfuscated',
            style: {
              'background-color': '#999'
            }
          },
          {
            selector: 'edge:selected',
            style: {
              'width': 4,
              'line-color': '#C55',
              'target-arrow-color': '#C55',
              'source-arrow-color': '#C55'
            }
          },
          {
            selector: 'edge.obfuscated',
            style: {
              'width': 1,
              'background-opacity': 0.2,
            }
          },
          {
            selector: 'edge',
            style: {
              "curve-style": "bezier",
              "taxi-direction": "downward",
              'width': 3,
              'line-color': '#222',
              'target-arrow-color': '#000',
              'target-arrow-shape': 'triangle',
              'source-arrow-color': '#000',
              'z-index': 1,
              'label': 'data(label)',
              'text-rotation': 'autorotate',
              'text-margin-y': '-15px',
            }
          },
          {
            selector: 'edge[edgeOpacity]',
            style: {
              'line-opacity': 'data(edgeOpacity)',
              'text-opacity': 'data(edgeOpacity)',
            }
          }, {
            selector: 'edge.revises',
            style: {
              "curve-style": "straight",
              "line-style": 'dotted',
            }
          },
          {
            selector: 'edge.virtual',
            style: {
              "curve-style": "bezier",
              "line-style": 'dotted',
              'line-color': '#F88',
            }
          },
          {
            selector: 'edge:selected',
            style: {
              'width': 6,
              'line-color': '#b22'
            }
          },
        ],
        elements: [],
        wheelSensitivity: 0.2,
        maxZoom: 3,
        minZoom: .2,
      });
    }

    $scope.addNodeToGraph = (node, action = 'none', ecoState) => {
      const nodeId = node._id;
      if (!($scope.cy.$('#' + nodeId).length > 0)) {
        const nodetype = _.find($rootScope.datamodel.nodetypes, { name: node._type });
        const image = nodetype.ui.defaultThumbnail;
        let gNode = {
          group: 'nodes',
          classes: [],
          data: {
            ...node,
            image,
            id: node._id, weight: 75, label: `
          Ref:${node._ref}
          Name:${node.name}
          Revision:${node._version}
          State:${node._state}
          ` },
        }

        gNode.classes.push(ecoState);
        switch (action) {
          case 'patch':
          case 'minor':
          case 'major':
            gNode.classes.push('revised');
            break;
          case 'fork':
          case 'supFork':
            gNode.classes.push('forked');
            break;
          default:
            gNode.classes.push('unrevised');
            break;
        }
        $scope.cy.add(gNode)
      } else {
        console.info('node already in the graph');

        // Update node if action was not set
        if (action != 'none') {
          $scope.cy.$('#' + nodeId).removeClass('unrevised');
          $scope.cy.$('#' + nodeId).addClass('revised');
          $scope.cy.$('#' + nodeId).addClass(ecoState);
          console.info('action updated');
        }
      }
    }

    $scope.addEdgeToGraph = (sourceNode, targetNode) => {

      const relId = targetNode.rel._id;
      if (!($scope.cy.$('#' + relId).length > 0)) {
        let sourceId = sourceNode._id;
        let targetId = targetNode._id
        if (targetNode.relation == 'parent') {
          sourceId = targetNode._id;
          targetId = sourceNode._id;
        }

        $scope.cy.add({
          group: 'edges',
          classes: ['unrevised'],
          data: { id: targetNode.rel._id, source: sourceId, target: targetId, label: 'consumes' },
        });
      } else {
        console.info('edge already in the graph');
      }

    }

    $scope.addVersionEdgeToGraph = (node, revisedId) => {
      $scope.cy.add({
        group: 'edges',
        classes: ['revises'],
        data: { id: 'rev_' + revisedId, source: node._id, target: revisedId, label: 'revises' },
      });
    }

    $scope.addForkEdgeToGraph = (node, forkedId) => {
      $scope.cy.add({
        group: 'edges',
        classes: ['forks'],
        data: { id: 'rev_' + forkedId, source: node._id, target: forkedId, label: 'forks' },
      });
    }



    $scope.loadEcoGraph = async () => {

      // Retrieve ECO nodes
      const ecoNodes = await plmModel.getEcoAllItems($scope.node._id);

      // Initiate Cytoscape
      $scope.cy = $scope.loadCytoscapeGraph();

      $scope.displayedNodes = [];

      // Parse Controlled Nodes
      ecoNodes.forEach((ecoNode) => {

        // Add Controlled Node 
        $scope.addNodeToGraph(ecoNode.node, ecoNode.action, ecoNode.node.control);
        ecoNode.impactedNodes.forEach((impactedNode) => {
          // Add Impacted Node 
          $scope.addNodeToGraph(impactedNode, 'none');
          $scope.addEdgeToGraph(ecoNode.node, impactedNode)
        })
        // $scope.applyVersionningToNode($scope.cy.$('#' + controlledNode.node._id));
      });

      ecoNodes.forEach((ecoNode) => {
        if (ecoNode.revises) $scope.addVersionEdgeToGraph(ecoNode.node, ecoNode.revises);
        if (ecoNode.forks) $scope.addForkEdgeToGraph(ecoNode.node, ecoNode.forks);
      })

      const lifecycleGridSize = 20;
      $scope.cy.on('free', async (evt) => {
        const node = evt.target;
        const target = node._private;
        target.position.x = Math.round(target.position.x / lifecycleGridSize) * lifecycleGridSize;
        target.position.y = Math.round(target.position.y / lifecycleGridSize) * lifecycleGridSize;
      })

      $scope.cy.layout({
        name: 'dagre',
        animate: true,
        spacingFactor: 1.5,
        edgeSep: 30,
        rankSep: 1,
        rankDir: 'TB',
        minLen: function (edge) {
          if (edge.data().label === 'revises') return 1;
          if (edge.data().label === 'consumes') return 10;
          return 1;
        },
      }).run()
      $scope.cy.resize()
      $scope.cy.fit()

      // // DEFINE MENU FOR NODE
      // var nodeGraphCxt = $scope.cy.cxtmenu({
      //   menuRadius: 100,
      //   selector: 'node.unrevised', // elements matching this cytoscape.js selector will trigger cxtmenus
      //   commands: [ // an array of commands to list in the menu or a function that returns the array
      //     {
      //       fillColor: '#5cb85c',
      //       content: 'Create New Revision',
      //       select: function (ele) {
      //         // Create new revision (InWork)
      //         $scope.cloneNode(ele, 'revision');

      //       }
      //     }, {
      //       fillColor: '#337ab7', // optional: custom background color for item
      //       content: 'Create New Copy', // html/text content to be displayed in the menu
      //       select: function (ele) {
      //         $scope.cloneNode(ele, 'fork');
      //       }
      //     }, {
      //       fillColor: '#f0ad4e', // optional: custom background color for item
      //       content: 'Open', // html/text content to be displayed in the menu
      //       select: function (ele) {
      //         const node = {
      //           _id: ele.data().id,
      //           _type: 'part',
      //         }
      //         $scope.openNode(node)
      //       }
      //     }

      //   ]
      // })

      // // DEFINE MENU FOR REVISED NODE
      // var revisedNodeGraphCxt = $scope.cy.cxtmenu({
      //   menuRadius: 100,
      //   selector: 'node.revised', // elements matching this cytoscape.js selector will trigger cxtmenus
      //   commands: [ // an array of commands to list in the menu or a function that returns the array
      //     {
      //       fillColor: '#5cb85c',
      //       content: 'Cancel New Revision',
      //       select: function (ele) {
      //         // Create new revision (InWork)
      //         $scope.cancelChange(ele);

      //       }
      //     }, {
      //       fillColor: '#f0ad4e', // optional: custom background color for item
      //       content: 'Open', // html/text content to be displayed in the menu
      //       select: function (ele) {
      //         const node = {
      //           _id: ele.data().id,
      //           _type: 'part',
      //         }
      //         $scope.openNode(node)
      //       }
      //     }

      //   ]
      // })

      // // DEFINE MENU FOR VIRTUAL NODE
      // var virtualNodeGraphCxt = $scope.cy.cxtmenu({
      //   menuRadius: 100,
      //   selector: 'node.virtual', // elements matching this cytoscape.js selector will trigger cxtmenus
      //   commands: [ // an array of commands to list in the menu or a function that returns the array
      //     {
      //       fillColor: '#338ab7', // optional: custom background color for item
      //       content: 'Patch', // html/text content to be displayed in the menu
      //       select: function (ele) {
      //       }
      //     }, {
      //       fillColor: '#635ab7', // optional: custom background color for item
      //       content: 'Minor Revision', // html/text content to be displayed in the menu
      //       select: function (ele) {
      //       }
      //     }, {
      //       fillColor: '#932ab7', // optional: custom background color for item
      //       content: 'Major Revision', // html/text content to be displayed in the menu
      //       select: function (ele) {
      //       }
      //     }

      //   ]
      // })

    }
    $scope.loadEcoGraph();

    // ECO Graph Matrix Features
    $scope.addNode = () => {

    }
    /**
     * cloneNode
     * @param {*} node 
     * @param {*} type 
     */
    $scope.cloneNode = (node, type) => {
      // define clone Relationship
      let cloneRelation = 'forks';
      // Switch Revise Class
      if (type === 'revision') {
        node.removeClass('unrevised');
        node.addClass('revised');
        cloneRelation = 'revises';
      }

      // Retrieve data
      const nodeData = node.data()
      const sourcePosition = node.position();

      // Generate new Ids
      const newId = 'ABCDE' + Date.now();
      const newRelId = 'ABCDEREL' + Date.now();

      // Add node clone
      $scope.cy.add({
        group: 'nodes',
        classes: ['virtual'],
        position: {
          x: sourcePosition.x + 300,
          y: sourcePosition.y - 50,
        },
        data: {
          id: newId,
          label: `
         Ref:${nodeData._ref}
         Name:${nodeData.name}
         Revision:${nodeData._version}-V
         State:Draft
         Action: Patch
         `  },
      })

      // Connect node clone to original node
      $scope.cy.add({
        group: 'edges',
        classes: [cloneRelation, 'virtual'],
        data: { id: newRelId, source: newId, target: nodeData.id, label: cloneRelation, type: 'virtual' },
      });
      // retrieve all parents consuming the original node
      const parents = node.incomers("[label='consumes']").sources();
      parents.forEach((pa) => {
        let safetyCnt = 0;
        while (pa.incomers("[label='revises']").size() > 0 && safetyCnt < 100) {
          pa = pa.incomers("[label='revises']").eq(0).source();
          safetyCnt = safetyCnt + 1;
        }
        $scope.cy.add({
          group: 'edges',
          classes: ['consumes', 'virtual'],
          data: { source: pa.data().id, target: newId, label: 'consumes', type: 'virtual' },
        });
      })

      // retrieve all children
      const children = node.outgoers("[label='consumes']").targets();
      children.forEach((ch) => {

        let safetyCnt = 0;
        while (ch.incomers("[label='revises']").size() > 0 && safetyCnt < 100) {
          ch = ch.incomers("[label='revises']").eq(0).source();
          safetyCnt = safetyCnt + 1;
        }
        if (ch.incomers("[label='revises']").size() < 1) {
          $scope.cy.add({
            group: 'edges',
            classes: ['consumes', 'virtual'],
            data: { source: newId, target: ch.data().id, label: 'consumes', type: 'virtual' },
          });
        }
      })
      $scope.cleanRevisionConnections(node);
    }

    $scope.cleanRevisionConnections = (node) => {

      const revisedNodes = $scope.cy.$('[label="revises"]').targets().connectedEdges("[type='virtual'][label='consumes']").remove();
    }

    $scope.graphVisibility = 50;

    $scope.updateGraphVisibility = () => {
      if ($scope.cy) {
        const plannedVis = 1 - Math.pow($scope.graphVisibility / 100, 2);
        const processedVis = 1 - Math.pow($scope.graphVisibility / 100 - 1, 2);
        $scope.cy.$('.handlesChangeOf').data('nodeOpacity', plannedVis);
        $scope.cy.$('.generated').data('nodeOpacity', processedVis);
        if (plannedVis > processedVis) {
          $scope.cy.$('.handlesChangeOf').connectedEdges().data('edgeOpacity', plannedVis);
          $scope.cy.$('.generated').connectedEdges().data('edgeOpacity', processedVis);
        } else {
          $scope.cy.$('.generated').connectedEdges().data('edgeOpacity', processedVis);
          $scope.cy.$('.handlesChangeOf').connectedEdges().data('edgeOpacity', plannedVis);
        }
      }
    }

    $scope.makeNonInterChange = (node) => {

    }


    $scope.makeInterChange = (node) => {

    }

    $scope.cancelChange = (node) => {
      node.incomers('[label="revises"]').sources().remove();
      node.removeClass('revised');
      node.addClass('unrevised');
    }

    $scope.applyVersionningToNode = (node) => {
      switch (node.action) {
        case 'patch':
        case 'minor':
        case 'major':
          $scope.cloneNode(node, 'revision');
          break;
        case 'fork':
        case 'supFork':
          $scope.cloneNode(node, 'fork');
          break;
      }
    }

    $scope.applyVersionningToRelationships = (level) => {
      switch (level) {
        case 'patch':
          break;
        case 'minor':
          break;
        case 'major':
          break;
      }
    }


    $scope.addNode = async (modalType) => {
      $scope.modalType = modalType;
      $scope.selectedNodetype = false;
      //  If modal type is add Controlled Nodes, show swal to select nodetype
      if (modalType === 'addControlledNodes') {
        const { value: selectedNodetype } = await Swal.fire({
          title: 'Select a nodetype',
          type: 'info',
          input: 'select',
          inputOptions: ecoInputOptions,
          showCancelButton: true,
        });
        if (selectedNodetype) {
          $scope.selectedNodetype = ecoNodetypes.find((n) => n.name === selectedNodetype);
        } else {
          return;
        }
      }
      //  If modal type is add Alternative Node, select selected node's nodetype
      if (modalType === 'addAlternativeNode') {
        $scope.selectedNodetype = ecoNodetypes.find((n) => n.name === $scope.selectedNode._type);
      }
      if ($scope.selectedNodetype) {
        //  Update Grid Columns
        const columnDefs = agRenderMachine.getColumnDefs($scope.selectedNodetype).map((item) => {
          item.editable = false;
          return item;
        });
        $scope.ecoGridOptions.api.setColumnDefs([]);
        $scope.ecoGridOptions.api.setColumnDefs(columnDefs);
        // open the modal using jquery
        $scope.ecoGridOptions.api.setFilterModel(null);
        //  Before opening the grid, check if a released state exists in nodetype
        if ($scope.modalType === 'addControlledNodes') {
          const releasedStates = $scope.selectedNodetype.lifecycle.states.filter((s) => s.released);
          if (_.isEmpty(releasedStates)) {
            return Notification.error(`Released State not found for ${$scope.selectedNodetype.name} nodetype`);
          }
        }
        $("#ecoRelationshipModal-" + $scope.node._id).modal();
        $scope.loadNodetypeNodes($scope.selectedNodetype, {
          maxResults: $scope.maxResults,
          searchCriterias: $scope.ecoGridOptions.api.getFilterModel()
        });
      } else {
        Notification.error('Selected nodetype does not exists in eco nodetypes');
      }
    }
    $scope.getMaxResults = () => {
      const maxResults = Number.parseInt(localStorage['maxResults'], 10);
      if (Number.isNaN(maxResults)) {
        localStorage['maxResults'] = 100;
        return 100;
      }
      return maxResults;
    };
    $scope.editMaxResult = () => {
      Swal.fire({
        title: 'Edit the max result count',
        type: 'info',
        input: 'number',
        inputValue: $scope.maxResults,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        confirmButtonColor: '#f0ad4e',
        cancelButtonText: 'Cancel',
      }).then((swalResult) => {
        if (swalResult.value > 0) {
          $scope.maxResults = swalResult.value;
        } else if (swalResult.value < 1) {
          $scope.maxResults = 1;
          Notification.warning('Minimum result size must be 1');
        }
      });
    };

    // #endregion



    // #region INIT

    $scope.parentUnlocked = !$scope.node._lockState;
    $scope.before = true;
    const uxConfig = $rootScope.datamodel.uxConfig;
    $scope.customActionNames = [...uxConfig.versioningLabels, { value: 'none', name: 'none' }];
    $scope.graphView = false;

    //
    // Impact matrix columns definition
    //

    const columnDefs = [
      {
        field: '_id',
        headerName: 'id',
        hide: true,
      },
      {
        headerName: 'Node Changes',
        children: [
          {
            field: '_type',
            headerName: 'Nodetype',
            width: 150,
            hide: true,
          },
          {
            field: '_ref',
            headerName: 'ref',
            width: 150,
            hide: true,
          },
          {
            field: 'name',
            headerName: 'Name',
            hide: true,
          },
          {
            field: 'versions',
            headerName: 'State',
            width: 100,
            cellStyle: {
              "text-align": "center"
            },
            cellRenderer: agRenderMachine.impactMatrixInitialStateRenderer,
          },
          {
            field: '_version',
            headerName: 'Version',
            width: 80,
            cellStyle: {
              "text-align": "center"
            },
            cellRenderer: agRenderMachine.versionRenderer,
          },
          {
            field: 'impacted',
            width: 120,
            headerName: 'Chg Control?',
            cellStyle: (params) => {
              if (params.value === 'impacted') {
                return { backgroundColor: '#5bc0de' };
              }
              if (params.value === 'controlled') {
                return { backgroundColor: '#f0ad4e' };
              }
              return null;
            },
          },
          {
            field: 'action',
            width: 120,
            headerName: 'Item Action',
            cellEditor: 'agSelectCellEditor',
            editable: (params) => $scope.lockedByCurrentUser && params.data._handled !== true && params.data.impacted === 'controlled',
            cellEditorParams: (params) => {
              const nodetype = params.data._type;
              const nodetypeDM = $rootScope.datamodel.nodetypes.find(i => i.name === nodetype);
              if (!nodetypeDM || !nodetypeDM.versioningRule) {
                console.error(`A non versionnable item shouldn't appear in this grid [Nodetype: ${nodetype}]`);
                return { values: ['none'] };
              };
              let values = [...$scope.customActionNames].filter((action) => {
                const globalVersioningAction = ['fork', 'supFork', 'obsolete'].includes(action.value);
                const nodetypeVersioningRule = Object.keys(nodetypeDM.versioningRule).filter((rule) => {
                  return nodetypeDM.versioningRule[rule]
                });
                const nodetypeVersioningAction = nodetypeVersioningRule.includes(action.value);
                return globalVersioningAction || nodetypeVersioningAction;
              });
              values = values.map((value) => value.name);
              return { values };
            },
            cellStyle: (params) => {
              let style;
              const action = getAction(params.value);
              switch (action) {
                case 'fork':
                  style = { backgroundColor: '#d9534f' };// @danger
                  break;
                case 'supFork':
                  style = { backgroundColor: '#d9534f' };// @danger
                  break;
                case 'major':
                  style = { backgroundColor: '#f0ad4e' };// @warning
                  break;
                case 'minor':
                  style = { backgroundColor: '#d9edf7' };// @info
                  break;
                case 'patch':
                  style = { backgroundColor: '#dff0d8' };// @success
                  break;
                case 'obsolete':
                  style = { backgroundColor: '#FFD500' };// @yellow
                  break;
                case 'none':
                  style = { backgroundColor: '#eee' };// @gray
                  break;
                default:
                  style = { backgroundColor: '#fff' };// @white
                  break;
              }
              return style;
            },
          },
          {
            field: 'newRef',
            width: 140,
            headerName: 'New Ref',
            editable: (params) => {
              const coreAction = getAction(params.data.action);
              if ($scope.lockedByCurrentUser && params.data.impacted === 'controlled' && (coreAction === 'fork' || coreAction === 'supFork') && params.data._handled !== true) return true;
              return false;
            },
            cellStyle: (params) => {
              let cClass = {};
              if (params.data) {
                const coreAction = getAction(params.data.action);
                switch (coreAction) {
                  case 'fork':
                  case 'supFork':
                    cClass = { backgroundColor: '#FFF' };
                    break;
                  default:
                    cClass = { backgroundColor: '#999' };
                    break;
                }
              }
              return cClass;
            },
          },
          {
            field: '_handled',
            headerName: 'Processed?',
            hide: true,
            width: 100,
            editable: false,
            cellRenderer: (params) => {
              let cell = '';
              if (params.data.impacted !== 'controlled') {
                cell = '-';
              } else if (params.data._handled && params.data._handled === true) {
                cell = '<i class="fa fa-check"></i>';
              } else if (!params.data._handled) {
                cell = '<i class="fa fa-times"></i>';
              }
              return cell;
            },
            autoHeight: true,
            cellClass: 'cell-wrap-text',
          },
          {
            field: 'interchangeable',
            width: 120,
            hide: true,
            headerName: 'Interchangeable?',
            cellEditor: 'agSelectCellEditor',
            cellRenderer: (params) => {
              const coreAction = getAction(params.data.action);
              const interChangeableStatus = getInterchangeableAction(params.data._type, coreAction);
              if (!interChangeableStatus) return '-';
              return interChangeableStatus;
            },
          },
        ]
      },
      {
        headerName: 'Usage Changes',
        children: [
          {
            field: 'linkAction',
            width: 150,
            headerName: 'Link Action',
            cellEditor: 'agSelectCellEditor',
            editable: (params) => {
              //  Set editable to false if node is not locked by current user
              if (!$scope.lockedByCurrentUser) {
                return false;
              }
              //  Set editable to false if there is no parent
              if (!params.data.parent) {
                Notification.error('You are not allowed to add a linkAction on this node, because there is no parent node');
                return false;
              }
              let parent;
              $scope.gridOptionsBefore.api.forEachNode((node) => {
                if (node.data._id === params.data.parent) {
                  parent = node.data;
                }
              });
              //  Set editable to false if parent not found
              if (!parent) {
                Notification.error('You are not allowed to add a linkAction on this node, because parent was not found');
                return false;
              }
              //  Set editable to false if parent is not in a released state
              const parentDM = $rootScope.datamodel.nodetypes.find((n) => n.name === parent._type);
              const parentStateDM = parentDM.lifecycle.states.find((s) => s.name === parent._state);
              if (!parentStateDM.released) {
                Notification.error(`Parent must be in a released state and controlled by this eco to add a link action`);
                return false;
              }
              //  Set editable to false if parent node is set to become obsolete
              if (params.data.parent && parent.action === 'obsolete') {
                Notification.error('You are not allowed to add a linkAction on this node, because parent node is set to become Obsolete');
                return false;
              }
              //  Set editable to false if current node is in a interchangeable action
              const coreAction = getAction(params.data.action);
              const interChangeableStatus = getInterchangeableAction(params.data._type, coreAction);
              if (interChangeableStatus === 'interchangeable') {
                Notification.error('You are not allowed to add a linkAction on this node, because its action is interchangeable');
                return false;
              }
              return true;
            },
            cellRenderer: (params) => {
              if (params.value) return params.value;
              let parent;
              $scope.gridOptionsBefore.api.forEachNode((node) => {
                if (node.data._id === params.data.parent) {
                  parent = node.data;
                }
              });
              const coreAction = getAction(params.data.action);
              if (parent && parent.impacted === "controlled" && ['major', 'minor', 'patch'].includes(coreAction)) {
                return 'Update to Latest (default)';
              }
              const interChangeableStatus = getInterchangeableAction(params.data._type, coreAction);
              if (interChangeableStatus === 'interchangeable') {
                return 'Update to Latest (default)';
              }
              return 'none';
            },
            cellEditorParams: (params) => {
              const { _type, action } = params.data;
              const customAction = getAction(action);
              const values = getApplicableLinkActions(_type, customAction);
              return { values };
            },
            cellStyle: (params) => {
              let parent;
              $scope.gridOptionsBefore.api.forEachNode((node) => {
                if (node.data._id === params.data.parent) {
                  parent = node.data;
                }
              });
              if (!parent || params.data.impacted !== 'controlled') {
                return { backgroundColor: '#999', textAlign: 'center' };
              }
              const parentDM = $rootScope.datamodel.nodetypes.find((n) => n.name === parent._type);
              const parentStateDM = parentDM.lifecycle.states.find((s) => s.name === parent._state);
              if (!parentStateDM.released) {
                return { backgroundColor: '#999', textAlign: 'center' };
              }
              if (params.data.parent && parent.action === 'obsolete') {
                return { backgroundColor: '#999', textAlign: 'center' };
              }
              const coreAction = getAction(params.data.action);
              const interChangeableStatus = getInterchangeableAction(params.data._type, coreAction);
              if (interChangeableStatus === 'interchangeable') {
                return { backgroundColor: '#999', textAlign: 'center' };
              }
              switch (params.value) {
                case 'pick alternative':
                case 'pick fork':
                  style = { backgroundColor: '#d9edf7' };// @info
                  break;
                case 'none':
                  style = { backgroundColor: '#eee' };// @gray
                  break;
                default:
                  style = { backgroundColor: '#fff' };// @white
                  break;
              }
              return style;
            },
          },
          {
            field: 'alternativeNode',
            width: 100,
            headerName: 'Alternative Node Id',
            editable: (params) => {
              let parent;
              $scope.gridOptionsBefore.api.forEachNode((node) => {
                const eachNode = node;
                if (eachNode.data._id === params.data.parent) {
                  parent = eachNode.data;
                }
              });
              if ($scope.lockedByCurrentUser && params.data.parent && parent.action !== 'obsolete') {
                return true;
              }
              return false;
            },
            hide: true,
          },
          {
            field: 'alternativeNodeLabel',
            width: 200,
            headerName: 'Alternative Node',
            editable: false,
            cellStyle: (params) => {
              let cClass = {};
              if (_.get(params.data, 'linkAction') !== 'pick alternative') {
                cClass = {
                  backgroundColor: '#999',
                };
              }
              return cClass;
            },
          },
          {
            field: 'alternativeNodeVer',
            width: 200,
            headerName: 'Alternative Node Version',
            editable: false,
            cellRenderer: agRenderMachine.versionRenderer,
            cellStyle: (params) => {
              let cClass = { textAlign: "center" };
              if (_.get(params.data, 'linkAction') !== 'pick alternative') {
                cClass.backgroundColor = '#999';
              }
              return cClass;
            },
          },
        ]
      },
      {
        field: '_changeComment',
        headerName: 'comment',
        editable: (params) => {
          if ($scope.lockedByCurrentUser) {
            if (params.data.impacted === 'controlled') {
              return true;
            }
          }
          return false;
        },
        cellEditor: 'agLargeTextCellEditor',
        autoHeight: true,
        cellClass: 'cell-wrap-text',
      },
    ];

    $scope.gridOptionsBefore = {
      columnDefs,
      rowData: [],
      singleClickEdit: true,
      stopEditingWhenGridLosesFocus: true,
      components: {
        orgCellRenderer: getOrgCellRenderer(),
        datePicker: agRenderMachine.getDatePicker(),
        booleanEditor: agRenderMachine.getBooleanEditor(),
      },
      treeData: true, // enable Tree Data mode
      rowSelection: 'multiple',
      animateRows: true,
      excludeChildrenWhenTreeDataFiltering: true,
      getContextMenuItems: $scope.getContextMenuItemsFn,
      defaultColDef: {
        resizable: true,
        flex: 1,
        filter: true,
      },
      groupDefaultExpanded: -1, // expand all groups by default
      getDataPath: (data) => {
        return data.orgHierarchy;
      },
      onCellDoubleClicked: function (params) {
        if ((params.colDef.field === 'alternativeNodeLabel' || params.colDef.field === 'alternativeNodeVer') && $scope.lockedByCurrentUser) {
          if (params.data.linkAction !== 'pick alternative') {
            return Notification.warning('Link Action must be pick alternative to select a node');
          }
          //  Temporary save selectedNode in $scope to use it later in addAlternativeNode
          $scope.selectedNode = params.data;
          return $scope.addNode('addAlternativeNode');
        }
        if (!params.colDef.editable) {
          return $rootScope.$broadcast('openNode', {
            _id: params.data._id,
            _type: params.data._type,
          });
        }
      },
      onCellValueChanged: async (params) => {
        const { newValue, oldValue } = params;
        //  If value not changed, return
        if (newValue === oldValue) return;

        let { _id, _type, _version, action, newRef, parent, parentVersion } = params.data;
        const { field } = params.colDef;

        //  Changes to be updated at the end of the function
        const changes = {};
        changes[field] = newValue;

        //  If field updated is newRef, update newRef if action is fork or supFork only!
        if (field === 'newRef') {
          if (['fork', 'supFork'].includes(action)) {
            changes.newRef = newRef;
          }
        }

        if (field === 'linkAction') {
          if (newValue === 'none') {
            // Remove any linkActions from parentNode that includes this childNode
            const result = await removeLinkActions(_id, parent);
            if (result.error) return Notification.error('Could not remove linkAction', result.message);
          } else {
            //  TODO: Check if we can remove the versions (maybe not nescessary anymore since each version has a unique _id now)
            const linkAction = {
              childNode: _id,
              childVersion: _version,
              action: newValue,
              operation: "add",
            };
            const result = await addLinkActions(_id, parent, linkAction);
            if (result.error) return Notification.error('Cannot add link action', result.message);
          }
          return $scope.loadImpactMatrixData();
        }

        if (field === 'action') {
          const coreAction = getAction(action);
          changes.action = coreAction;
          //  If action is not fork and not supFork, remove the newRef if exists
          if (!['fork', 'supFork'].includes(coreAction) && newRef) {
            changes.newRef = '';
          }

          //  If new action is interchangeable or obsolete, remove all linkActions
          const interChangeableStatus = getInterchangeableAction(_type, coreAction);
          if (interChangeableStatus === 'interchangeable' || action === 'obsolete') {
            const promises = [];
            //  Find all rows that have this node, linkAction and a parent
            $scope.gridOptionsBefore.api.forEachNode((row) => {
              if (row.data._id === _id && row.data.linkAction && row.data.parent) {
                const linkActions = [{ childNode: _id, operation: 'remove' }];
                promises.push($scope.updateEcoControlledLinkActions(row.data.parent, linkActions));
              }
            });
            if (!_.isEmpty(promises)) await Promise.all(promises);
          }

          if (action === 'supFork') {
            //  Find all rows that have this node, linkAction and a parent
            const promises = [];
            $scope.gridOptionsBefore.api.forEachNode((row) => {
              if (row.data._id === _id && row.data.parent) {
                const linkAction = {
                  childNode: row.data._id,
                  childVersion: row.data._version,
                  action: 'pick fork',
                  operation: 'add',
                };
                promises.push(addLinkActions(row.data._id, row.data.parent, linkAction));
              }
            });
            if (!_.isEmpty(promises)) await Promise.all(promises);
          }

          //  When action changed, if the link Action is no more applicable to the new action, remove it
          //  In cases of obsolete it's already removed! In case of supFork its already changed to pick fork
          if (action !== 'supFork' && action !== 'obsolete' && interChangeableStatus !== 'interchangeable') {
            const applicableLinkActions = getApplicableLinkActions(_type, action);
            const promises = [];
            $scope.gridOptionsBefore.api.forEachNode((row) => {
              if (row.data._id === _id && row.data.linkAction && row.data.parent) {
                if (!applicableLinkActions.includes(row.data.linkAction)) {
                  const linkActions = [{ childNode: _id, operation: 'remove' }];
                  promises.push($scope.updateEcoControlledLinkActions(row.data.parent, linkActions));
                }
              }
            });
            if (!_.isEmpty(promises)) await Promise.all(promises);
          }
        }

        //  If there are changes, update node before reload table
        if (!_.isEmpty(changes)) {
          changes._id = _id;
          await $scope.updateControlledNode(changes);
        }
        return $scope.loadImpactMatrixData();
      },
      onGridReady: (params) => {
        $scope.gridOptionsBefore.columnApi.autoSizeColumns();
        setTimeout(() => {
          $scope.gridOptionsBefore.api.resetRowHeights();
        }, 500);
        $scope.loadImpactMatrixData();
      },
      onColumnResized: $scope.onColumnResized,
      autoGroupColumnDef: {
        headerName: 'BOM',
        lockPosition: true,
        sortable: true,
        sort: 'asc',
        pinned: 'left',
        valueGetter: (params) => {
          return params.data._maidenName;
        },
        cellRendererParams: {
          suppressCount: true,
          innerRenderer: 'orgCellRenderer',
        },
      },
      onDisplayedColumnsChanged(params) {
        const { primaryColumns } = params.columnApi.columnController;
        agRenderMachine.setGridRowHeight(primaryColumns, $scope.gridOptionsBefore);
      },
    };

    $scope.gridOptionsAfter = {
      columnDefs: [
        {
          field: '_id',
          headerName: 'id',
          hide: true,
        },
        {
          field: 'impacted',
          headerName: 'Impacted',
          width: 150,
          filter: true,
          hide: false,
        },
        {
          field: '_ref',
          headerName: 'ref',
          width: 150,
          hide: false,
        },
        {
          field: 'name',
          headerName: 'Name',
          hide: true,
        },
        {
          field: '_state',
          headerName: 'State',
          width: 110,
          cellStyle: {
            "text-align": "center"
          },
          cellRenderer: agRenderMachine.stateRenderer,
        },
        {
          field: '_version',
          headerName: 'Current Version',
          width: 120,
          cellStyle: {
            "text-align": "center"
          },
          cellRenderer: agRenderMachine.versionRenderer,
        },
      ],
      rowData: [],
      singleClickEdit: true,
      stopEditingWhenGridLosesFocus: true,
      components: {
        orgCellRenderer: getOrgCellRenderer(),
        datePicker: agRenderMachine.getDatePicker(),
        booleanEditor: agRenderMachine.getBooleanEditor(),
      },
      treeData: true, // enable Tree Data mode
      animateRows: true,
      excludeChildrenWhenTreeDataFiltering: true,

      getContextMenuItems: $scope.getContextMenuItemsFn,
      defaultColDef: {
        flex: 1,
        resizable: true
      },
      getRowStyle: (params) => {
        if (params.data.impacted === 'controlled') {
          return {
            background: '#f0ad4e'
          };
        }
      },
      groupDefaultExpanded: -1, // expand all groups by default
      getDataPath: (data) => {
        return data.orgHierarchy;
      },
      onGridReady: (params) => {
        $scope.gridOptionsBefore.columnApi.autoSizeColumns();
        setTimeout(() => {
          $scope.gridOptionsBefore.api.resetRowHeights();
        }, 500);
        // $scope.loadImpactMatrixData();
      },
      onRowDoubleClicked: function (params) {
        $rootScope.$broadcast('openNode', {
          _id: params.data._id,
          _type: params.data._type,
        });
      },
      onColumnResized: $scope.onColumnResized,
      autoGroupColumnDef: {
        headerName: 'BOM',
        lockPosition: true,
        sortable: true,
        sort: 'asc',
        pinned: 'left',
        valueGetter: (params) => {
          return params.data._maidenName;
        },
        cellRendererParams: {
          suppressCount: true,
          innerRenderer: 'orgCellRenderer',
        },
      },
      onDisplayedColumnsChanged(params) {
        const { primaryColumns } = params.columnApi.columnController;
        agRenderMachine.setGridRowHeight(primaryColumns, $scope.gridOptionsAfter);
      },
    };

    //  ECO MODAL
    $scope.ecoGridOptions = {
      columnDefs: [],
      rowData: [],
      defaultColDef: {
        resizable: true,
        enableSorting: true,
      },
      rowSelection: 'single',
      angularCompileRows: true,
      suppressCellSelection: true,
      floatingFilter: true, // turn on floating filters
      onFilterChanged: () => $scope.executeFilter($scope.selectedNodetype),
    };

    $scope.maxResults = $scope.getMaxResults();
    $scope.maxResultsClass = {}; //  If max results is more than nodes in db
    $scope.searchDate = new Date(Date.now());
    $scope.searchType = 'currentOn';

    const ecoNodetypes = $rootScope.datamodel.nodetypes.filter(n => n.changeMethod === 'eco');
    const ecoInputOptions = {};
    ecoNodetypes.map(n => ecoInputOptions[n.name] = n.name);
    $scope.selectedNodetype;
    $scope.impactedItemSelected = false;
    $scope.nodeNotSelected = true;
    $scope.modalType = 'addControlledNodes';
    // #endregion
    $scope.filterImpacted = false;

    $scope.toggleImpactedVisibility = () => {
      $scope.filterImpacted = !$scope.filterImpacted || false;

      $scope.gridOptionsBefore.api.setQuickFilter();
      // set filter model and update
      const filterModelAfter = $scope.gridOptionsAfter.api.getFilterInstance('impacted');
      const filterModelBefore = $scope.gridOptionsBefore.api.getFilterInstance('impacted');
      if ($scope.filterImpacted){
        filterModelBefore.setModel({ values: ['controlled'] });
        filterModelAfter.setModel({ values: ['controlled'] });
      } else {
        filterModelBefore.resetFilterValues();
        filterModelAfter.resetFilterValues();
      }

      // refresh rows based on the filter (not automatic to allow for batching multiple filters)
      $scope.gridOptionsAfter.api.onFilterChanged();
      $scope.gridOptionsBefore.api.onFilterChanged();


    }

    // #region WATCHES (Object Watcher)
    // #endregion

    // #region ON (Event Listener)

    $scope.$on('nodeLocked', () => {
      $scope.parentUnlocked = false;
      $scope.gridOptionsBefore.api.resetColumnState();
    });

    $scope.$on('nodeUnlocked', () => {
      $scope.parentUnlocked = true;
      $scope.gridOptionsBefore.api.resetColumnState();
    });

    $scope.$on('refreshTabContent', () => {
      $scope.reloadGraph();
      $scope.reloadMatrix();
    })
    // #endregion

  });

