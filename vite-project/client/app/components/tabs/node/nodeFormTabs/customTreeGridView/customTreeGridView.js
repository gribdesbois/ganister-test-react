/* globals _, agGrid, angular */
agGrid.initialiseAgGridWithAngular1(angular);
angular.module('app.ganister.tabs.node.nodeFormTabs.customTreeGridView', [
  'agGrid',
  'ui-notification',
  'app.ganister.shared.modals.relationshipModal',
  'app.ganister.tool.aggrid',
  'app.ganister.tool.helperFunctions',
  'app.ganister.models.nodetypes',
  'app.ganister.shared.modals.contextualAttachNodeModal',
])
  .controller('customTreeGridViewController', ($scope, $rootScope, nodesModel, Notification, agRenderMachine, helperFunctions) => {

    //  ______                _   _                 
    // |  ____|              | | (_)                
    // | |__ _   _ _ __   ___| |_ _  ___  _ __  ___ 
    // |  __| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
    // | |  | |_| | | | | (__| |_| | (_) | | | \__ \
    // |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|___/

    /**
     * getOrgCellRenderer
     * @returns 
     */
    function getOrgCellRenderer() {
      function OrgCellRenderer() { }

      OrgCellRenderer.prototype.init = (params) => {
        const tempDiv = document.createElement('div');
        let icon;
        let value;
        if (params.data) {
          icon = helperFunctions.getNodeIcon(params.data._type);
          value = params.data._displayName;
        }
        tempDiv.innerHTML = icon ? `<span>${icon} <span class="nodename">${value}</span></span>` : value;
        this.eGui = tempDiv.firstChild;
      };
      OrgCellRenderer.prototype.getGui = () => this.eGui;

      return OrgCellRenderer;
    }

    /**
     * createNewNode
     * @param {*} nodetype 
     * @param {*} parentNode 
     * @param {*} relationship 
     * @param {*} location 
     */
    async function createNewNode(nodetype, parentNode, relationship, location = null, reverse = false) {
      try {
        const params = {
          _type: nodetype.name,
          properties: {},
        };

        await helperFunctions.runTriggeredMethods('beforeCreate', params, $scope);

        // check mandatory fields
        const mandatoryFields = await helperFunctions.askMandatoryFields(nodetype);
        if (!mandatoryFields) {
          return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
        }

        //if mandatory fields provided add node
        params.properties = { ...params.properties, ...mandatoryFields };
        const lock = !!$scope.rel.openOnCreation;

        const node = await nodesModel.addNode(params, lock);
        if (!node) return;

        await helperFunctions.runTriggeredMethods('afterCreate', node, $scope);
        if (reverse) {
          attachNode(parentNode, node, relationship, location);
        } else {
          attachNode(node, parentNode, relationship, location);
        }

        // open newly created object
        $rootScope.$broadcast('openNode', { _id: node._id, _type: node._type, });
      } catch (error) {
        console.error(error);
      }
    };

    /**
     * attachNode
     * @param {*} node 
     * @param {*} parentNode 
     * @param {*} relationship 
     * @param {*} location 
     */
    function attachNode(node, parentNode, relationship, location = null) {
      // test if rel is $scope.rel.customTreeGridView.relNames
      if ($scope.rel.customTreeGridView.localizer) {
        node[$scope.rel.customTreeGridView.localizer] = location;
      }
      nodesModel.attachNode(
        parentNode,
        node,
        relationship,
      ).then((resultRel) => {
        const nodeRef = resultRel.target.properties._ref;
        if (location) {
          // prepare data for location update (rel node value update)
          resultRel._parentType = resultRel.startnodetype;
          resultRel._parentId = resultRel.startnodeId;
          const relType = $rootScope.datamodel.nodetypes.find(nodetype => nodetype.linkName === resultRel.linkName);
          resultRel._reltype = relType.name;
          resultRel._relid = resultRel._id;

          // update rel node value
          nodesModel.updateRelNodeValue(resultRel, $scope.rel.customTreeGridView.localizer, location).then((result) => {
            $scope.refreshTable();
            // notify success
            Notification.success({ title: 'Node Attached', message: `Node Ref: ${nodeRef}` });
          }).catch((err) => {
            console.error(err);
          });
        } else {
          $scope.refreshTable();
          // notify success
          Notification.success({ title: 'Node Attached', message: `Node Ref: ${nodeRef}` });
        }
      }).catch((e) => {
        console.error(e);
      });
    }

    //    _                               __                  _   _                 
    //   | |                             / _|                | | (_)                
    //  / __) ___  ___ ___  _ __   ___  | |_ _   _ _ __   ___| |_ _  ___  _ __  ___ 
    //  \__ \/ __|/ __/ _ \| '_ \ / _ \ |  _| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
    //  (   /\__ \ (_| (_) | |_) |  __/_| | | |_| | | | | (__| |_| | (_) | | | \__ \
    //   |_| |___/\___\___/| .__/ \___(_)_|  \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
    //                     | |                                                      
    //                     |_|         
    /**
         * insertNode
         * @param {*} rowNode 
         * @param {*} rel 
         */
    $scope.attachNode = async (rowNode, rel) => {

      let targetNodetype;
      if (rel) {
        targetNodetype = $rootScope.datamodel.nodetypes.find((nodetype) => {
          return rel.directions.find((d) => d.source === nodetype.id);
        });
      }
      if (!rowNode) rowNode = $scope.node;
      if (!targetNodetype) {
        await Swal.fire({
          title: 'Select a nodetype',
          type: 'info',
          input: 'select',
          inputOptions,
          showCancelButton: true,
        }).then(result => {
          if (result.value) {
            rel = rels.find(i => i.name === result.value);
            targetNodetype = $rootScope.datamodel.nodetypes.find((nodetype) => {
              return rel.directions.find((d) => d.target === nodetype.id);
            });
            if (!targetNodetype) {
              Notification.error({ title: 'Error', message: "Target Nodetype not found!" });
            }
          }
        })
      }

      if (targetNodetype) {
        nodesModel
          .getNode(rowNode._type, rowNode._id)
          .then(async (node) => {
            // check if lockable or if relationship is not lock linked
            await Swal.fire({
              title: 'Create or Attach node?',
              type: 'info',
              showCloseButton: true,
              showCancelButton: true,
              focusConfirm: false,
              confirmButtonText: 'New Node',
              confirmButtonAriaLabel: 'Create New Node',
              cancelButtonText: 'Attach Node',
              cancelButtonAriaLabel: 'Attach New Node',
            }).then((swalresult) => {
              if (swalresult.value) {
                const restoredOrg = [...rowNode.orgHierarchy]
                restoredOrg.unshift($scope.node._id)
                createNewNode(targetNodetype, rowNode, rel, restoredOrg, true);
              } else if (swalresult.dismiss === Swal.DismissReason.cancel) {
                //  Attach Node
                $rootScope.$broadcast('openContextualAttachNodeModal', $scope.node._id, targetNodetype, rel, rowNode, 'customTreeGridComponent', true);
              }
            });
          });
      }
    }

    /**
     * insertNode
     * @param {*} rowNode 
     * @param {*} rel 
     */
    $scope.insertNode = async (rowNode, rel) => {
      let targetNodetype;
      if (rel) {
        targetNodetype = $rootScope.datamodel.nodetypes.find((nodetype) => {
          return rel.directions.find((d) => d.target === nodetype.id);
        });
      }
      if (!rowNode) rowNode = $scope.node;
      if (!targetNodetype) {
        await Swal.fire({
          title: 'Select a nodetype',
          type: 'info',
          input: 'select',
          inputOptions,
          showCancelButton: true,
        }).then(result => {
          if (result.value) {
            rel = rels.find(i => i.name === result.value);
            targetNodetype = $rootScope.datamodel.nodetypes.find((nodetype) => {
              return rel.directions.find((d) => d.target === nodetype.id);
            });
            if (!targetNodetype) {
              Notification.error({ title: 'Error', message: "Target Nodetype not found!" });
            }
          }
        })
      }

      if (targetNodetype) {
        nodesModel
          .getNode(rowNode._type, rowNode._id)
          .then(async (node) => {
            // check if lockable or if relationship is not lock linked
            if (node.properties._lockable || $scope.rel.lockLinked == false) {
              await Swal.fire({
                title: 'Create or Attach node?',
                type: 'info',
                showCloseButton: true,
                showCancelButton: true,
                focusConfirm: false,
                confirmButtonText: 'New Node',
                confirmButtonAriaLabel: 'Create New Node',
                cancelButtonText: 'Attach Node',
                cancelButtonAriaLabel: 'Attach New Node',
              }).then((swalresult) => {
                if (swalresult.value) {
                  const restoredOrg = [...rowNode.orgHierarchy]
                  restoredOrg.unshift($scope.node._id)
                  createNewNode(targetNodetype, rowNode, rel, restoredOrg, false);
                } else if (swalresult.dismiss === Swal.DismissReason.cancel) {
                  //  Attach Node
                  $rootScope.$broadcast('openContextualAttachNodeModal', $scope.node._id, targetNodetype, rel, rowNode, 'customTreeGridComponent', false);
                }
              });
            } else {
              Notification.warning({ title: 'Parent not editable', message: `The selected node is not editable` });
            }
          });
      }
    }

    /**
     * openNode
     * @param {*} _type 
     * @param {*} _id 
     */
    $scope.openNode = (_type, _id) => { $rootScope.$broadcast('openNode', { _id, _type }) };

    /**
     * refreshTable
     */
    $scope.refreshTable = () => {


      $scope.gridOptions.api.setRowData([]);
      $scope.gridOptions.api.showLoadingOverlay();


      let firstSelectedRow = null;
      if ($scope.gridOptions.api.getSelectedNodes().length > 0) {
        firstSelectedRow = $scope.gridOptions.api.getSelectedNodes()[0];
      }
      const selectedRowsIds = $scope.gridOptions.api.getSelectedNodes().map((row) => {
        return row.id;
      });

      nodesModel.getCustomTreeGridView($scope.node, $scope.rel.name)
        .then((resultNodes) => {
          // build table
          let columnDefs = [];
          const typeColumn = {
            headerName: "Type",
            field: "_type",
            mapping: '_type',
            type: 'nodetypeLogo',
            width: 70,
            sortable: true,
            rowSortBy: 'asc',
            sortIndex: 0,
            cellRendered: true,
          };
          agRenderMachine.getRendering(typeColumn, typeColumn);
          columnDefs.push(typeColumn);
          const levelColumn = {
            headerName: "Level",
            field: "_indentation",
            mapping: '_indentation',
            type: 'indentation',
            width: 50,
            cellRendered: true,
          };
          agRenderMachine.getRendering(levelColumn, levelColumn);
          columnDefs.push(levelColumn);
          resultNodes.columns.forEach((col) => {
            col.cellRendered = true;
            let column = {
              headerName: col.name,
              field: col.name,
              colId: col.mapping + '.' + col.Property,
              editable: col.editable,
              width: parseInt(col.width, 10),
              cellRendered: true,
              sortable: true,
              rowSortBy: col.rowSortBy,
              columnGroupShow: false,
              type: col.type,
            }

            // add sorting for numbers
            if (col.type === 'integer') {
              column.comparator = (valueA, valueB, nodeA, nodeB, isInverted) => valueB - valueA;
            }


            // retrieve columns from nodetype def
            const nodetypeName = col.Nodetype;
            const propName = col.Property;
            const nt = $rootScope.datamodel.nodetypes.find(nodetype => nodetype.name === nodetypeName);

            if (nt) {
              var gc = nt.ui.gridColumns.find((uigc) => uigc.property === nodetypeName + '.' + propName);
              if (gc) {
                column = { ...gc, ...column }
              }
            }
            // find column rendering
            agRenderMachine.getRendering(column, column);

            // add column to table
            if (col.visible) columnDefs.push(column);

          });


          // load the content
          const data = [];
          resultNodes.data.forEach((item) => {
            dataRow = {
              orgHierarchy: item.orgHierarchy,
              _type: item._type,
              _types: item.types,
              _isContextual: item._isContextual,
              _relid: item._relid,
              _displayName: item._displayName,
              _indentation: item.orgHierarchy.length - 1,
            };
            dataRow.id = dataRow.orgHierarchy.join('-');
            dataRow._id = dataRow.orgHierarchy[dataRow.orgHierarchy.length - 1];
            try {
              $scope.customViewRowsNodes[dataRow.id] = [];
              columnDefs.forEach((colDef) => {
                if (['treeStructure', 'indentation', 'nodetypeLogo'].indexOf(colDef.type) < 0) {
                  if (colDef.colId.split('.').length > 1) {
                    let object = [colDef.colId.split('.')[0]];
                    let prop = [colDef.colId.split('.')[1]];
                    if (object[0][0] == '#') {
                      object = [object[0].substring(1)];
                      prop = [colDef.colId.split('.')[2]];
                    }
                    if (item[object]) {
                      dataRow[colDef.field] = item[object][prop];
                      colDef.mapping = `${colDef.colId}`;
                      colDef.nodetype = item[object]._type;
                      $scope.customViewRowsNodes[dataRow.id].push({
                        element: colDef.field,
                        _type: item[object]._type,
                        _id: item[object]._id
                      });
                    }
                  } else {
                    dataRow[colDef.field] = item[colDef.colId];
                  }
                }
              });
            } catch (error) {
              console.error(error);
            }
            data.push(dataRow);
          });

          // set column edit state
          columnDefs = columnDefs.map((col) => {
            if (col.editable) {
              col.editable = () => {
                if ($scope.rel.disableUpdates) {
                  return false;
                } else if ($scope.lockedByCurrentUser || (!$scope.rel.lockLinked && $scope.rel.lockLinked != undefined)) {
                  return true;
                }
                return false;
              };
            }
            col.sort = col.rowSortBy;
            col.sortIndex = col.sortIndex || 1;
            col.colId = col.mapping;
            delete col.mapping;
            delete col.type;
            return col;
          });

          // load Columns definition in the grid
          $scope.gridOptions.api.setColumnDefs(columnDefs);

          // remove duplicate item in data by id 
          const dataUnique = _.uniqBy(data, 'id');

          // Load data in the grid
          $scope.gridOptions.api.setRowData(dataUnique);

          // reposition the grid
          selectedRowsIds.forEach((id) => {
            $scope.gridOptions.api.getRowNode(id).setSelected(true);
          });
          if (firstSelectedRow) {
            const firstSelectedRowIndex = $scope.gridOptions.api.getRowNode(firstSelectedRow.id).rowIndex;
            $scope.gridOptions.api.ensureIndexVisible(firstSelectedRowIndex, 'middle');
          }

          // Update tab counter
          $scope.$emit("objCountUpdate", $scope.rel.name, $scope.gridOptions.api.getDisplayedRowCount());

        })
        .catch((error) => {
          console.error("getCustomTreeGridView", error);
          $scope.$emit("objCountUpdate", $scope.rel.name, 0);
        });
    }

    //   _       _ _   
    //  (_)     (_) |  
    //   _ _ __  _| |_ 
    //  | | '_ \| | __|
    //  | | | | | | |_ 
    //  |_|_| |_|_|\__|

    $scope.customViewRowsNodes = {};

    $scope.$on('nodeformTabSelection', (e, data) => {
      const { index, rel } = data;
      if (!$scope.loaded && ($scope.rel.autoloads === false) && $scope.rel.id === rel.id) {
        $scope.refreshTable();
        $scope.loaded = true;
      }
    });

    $scope.gridOptions = {
      defaultColDef: {
        enablePivot: false,
        resizable: true
      },
      getDataPath: data => data.orgHierarchy,
      groupDefaultExpanded: -1,
      autoGroupColumnDef: {
        headerName: "Refs",
        cellRendererParams: {
          suppressCount: true,
          innerRenderer: 'orgCellRenderer',
        },
      },
      treeData: true,
      rowSelection: 'single',
      sideBar: 'columns',
      defaultToolPanel: '',
      angularCompileRows: true,
      columnDefs: [],
      getRowNodeId: (data) => {
        return data.orgHierarchy;
      },
      rowClassRules: {
        'contextualNode': (params) => {
          if (params.data) {
            return params.data._isContextual;
          }
          return false;
        },
      },
      getContextMenuItems: (params) => {
        let rowNode = $scope.node;
        if (params.node !== null) {
          rowNode = params.node.data;
        }
        //  Find Parent Node
        let parentNode = $scope.node;
        if (rowNode.root && rowNode.root !== $scope.node._id) {
          parentNode = $scope.tree_data.find(n => n._id === rowNode.root);
        }

        // retrieve nodetype and id
        const nodeElement = params.column.colDef.field;
        $scope.gridOptions.api.getRowNode(params.node.id).setSelected(true, true);
        const rowId = params.node.data.id;
        const nodes = $scope.customViewRowsNodes[rowId];
        const node = _.find(nodes, { 'element': nodeElement });

        // init contextual menu
        const items = [];

        // add Open Node Action
        if (node) {
          items.push({
            // custom item
            name: 'Open node ',
            action: function () {
              $scope.openNode(node._type, node._id);
            },
          });
        }

        // add Standard Actions
        items.push('copy');
        items.push('copyWithHeaders');
        items.push('export');

        // Add detach node Action
        rowNode._rel = $scope.rel.customTreeGridView.relNames.split(',')[0];
        const rowNodeDM = $rootScope.datamodel.nodetypes.find(n => n.name === rowNode._type);
        const relationshipDM = $rootScope.datamodel.nodetypes.find((nodetype) => {
          const { elementType, hidden, linkName, directions = [] } = nodetype;
          if (elementType === 'node' || hidden) return;

          const sameLinkName = linkName === rowNode._rel;
          const direction = directions.find((d) => d.target === rowNodeDM.id || d.source === rowNodeDM.id);

          return sameLinkName && direction;
        })

        if (relationshipDM && rowNode._relid) {
          items.push({
            name: 'Detach Node',
            disabled: $scope.lockedByCurrentUser && parentNode._lockable || relationshipDM.lockLinked == false ? false : true,
            action: () => {
              const sourceNode = {
                _type: rowNode._types[rowNode._types.length - 2],
                _id: rowNode.orgHierarchy[rowNode.orgHierarchy.length - 2],
              }
              nodesModel.deleteRelationshipById(sourceNode, relationshipDM.name, rowNode._relid)
                .then((result) => {
                  if (result.error) return Notification.error({ title: 'Error Deleting Relationship', ...result });
                  $scope.refreshTable();
                  Notification.success({ title: 'Node Detached', message: `${rowNode._displayName}` });
                }).catch((e) => {
                  Notification.error({ title: 'Detach Failed', message: e.message });
                  console.error(e);
                });
            },
          });
          items.push({
            name: 'Detach & Delete Node',
            disabled: $scope.lockedByCurrentUser && parentNode._lockable || relationshipDM.lockLinked == false ? false : true,
            action: () => {
              const sourceNode = {
                _type: rowNode._types[rowNode._types.length - 2],
                _id: rowNode.orgHierarchy[rowNode.orgHierarchy.length - 2],
              }
              nodesModel.deleteRelationshipById(sourceNode, relationshipDM.name, rowNode._relid)
                .then(async (result) => {
                  if (result.error) return Notification.error({ title: 'Error Deleting Relationship', ...result });
                  $scope.refreshTable();
                  await nodesModel.deleteNode({
                    _type: rowNode._type,
                    _id: rowNode._id,
                  });
                  Notification.success({ title: 'Node Detached and deleted', message: `${rowNode._displayName}` });
                }).catch((e) => {
                  Notification.error({ title: 'Detach Failed', message: e.message });
                  console.error(e);
                });
            },
          });
        }

        const rels = $scope.rel.customTreeGridView.relNames.split(',');


        // ADD RELATED NODETYPES
        let rowNodeRels = $rootScope.datamodel.nodetypes.filter((n) => {
          const { elementType, linkName, directions = [] } = n;
          if (elementType === 'node') return;

          const sameLinkName = rels.includes(linkName);
          const direction = directions.find((d) => d.source === rowNodeDM.id);

          return sameLinkName && direction;
        })
        rowNodeRels.map(rel => {
          const targetNodetype = $rootScope.datamodel.nodetypes.find((n) => {
            return rel.directions.find((d) => d.target === n.id);
          })
          if (!items.find(i => i.name === `Insert ${targetNodetype.name} (${rel.name})`)) {
            items.push({
              name: `Insert ${targetNodetype.name} (${rel.name})`,
              disabled: $scope.lockedByCurrentUser || rel.lockLinked == false ? false : true,
              action: () => $scope.insertNode(rowNode, rel),
            });
          }

        })



        // ADD TARGETING NODETYPES
        rowNodeRels = $rootScope.datamodel.nodetypes.filter((n) => {
          const { elementType, linkName, directions = [] } = n;
          if (elementType === 'node') return;

          const sameLinkName = rels.includes(linkName);
          const direction = directions.find((d) => d.target === rowNodeDM.id);

          return sameLinkName && direction;
        })
        rowNodeRels.map(rel => {
          const targetNodetype = $rootScope.datamodel.nodetypes.find((n) => {
            return rel.directions.find((d) => d.source === n.id);
          })
          if (!items.find(i => i.name === `Insert ${targetNodetype.name} (${rel.name})`)) {
            items.push({
              name: `Insert ${targetNodetype.name} (${rel.name})`,
              disabled: $scope.lockedByCurrentUser || rel.lockLinked == false ? false : true,
              action: () => $scope.attachNode(rowNode, rel),
            });
          }

        })



        return items;
      },
      components: {
        datePicker: agRenderMachine.getDatePicker(),
        booleanEditor: agRenderMachine.getBooleanEditor(),
        orgCellRenderer: getOrgCellRenderer(),
      },
      rowData: [],
      onCellDoubleClicked: (params) => {
        if (!params.colDef.editable) $rootScope.$broadcast('openNode', {
          _id: params.data._id,
          _type: params.data._type,
        });
      },
      onCellValueChanged: async (params) => {
        if (params.oldValue === params.newValue) {
          return;
        }

        $scope.gridOptions.api.resetRowHeights();
        if (params.colDef.colId) {
          const node = params.data;
          node._id = node.id;
          const prop = params.colDef.colId.split('.')[1];
          if (prop === '_serialized') return;
          const value = params.newValue;
          // update value
          const result = await nodesModel.updateNodeValue(node, prop, value);
          if (result.error) {
            Notification.error({ title: 'Error Updating Node Value', ...result });
            // reset value when update fails
            const rowNode = $scope.gridOptions.api.getRowNode(params.data.orgHierarchy);
            const rowData = { ...params.data };
            rowData[params.colDef.field] = params.oldValue;
            rowNode.setData(rowData);
          }
        } else {
          Notification.error('Property Name not defined');
        }
      },
      onGridReady: (event) => {
        $scope.gridOptions.api.closeToolPanel();
        if ($scope.rel.autoloads != false) {
          $scope.refreshTable();
          $scope.loaded = true;
        }
      }
    }



    //    _                _       _                   
    //   | |              | |     | |                  
    //  / __)_      ____ _| |_ ___| |__   ___ _ __ ___ 
    //  \__ \ \ /\ / / _` | __/ __| '_ \ / _ \ '__/ __|
    //  (   /\ V  V / (_| | || (__| | | |  __/ |  \__ \
    //   |_|  \_/\_/ \__,_|\__\___|_| |_|\___|_|  |___/


    $scope.$on('refreshTabContent', () => {
      $scope.refreshTable();
    });
  });