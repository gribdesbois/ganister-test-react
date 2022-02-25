/* global angular, _, document */
angular.module('app.ganister.tabs.node.nodeFormTabs.multilevelView', [
  'app.ganister.user.config',
  'app.ganister.models.nodes',
  'app.ganister.models.nodetypes',
  'app.ganister.models.plm',
  'agGrid',
  'app.ganister.tool.aggrid',
  'app.ganister.tool.helperFunctions',
  'ui-notification',
  'app.ganister.shared.modals.attachNodeModal',
])
  .controller('multilevelViewController', ($scope, $rootScope, $translate, nodesModel, agRenderMachine, Notification, helperFunctions) => {
    //
    // handling _lockState in the tab
    //
    $scope.loaded = false;
    $scope.$on('nodeformTabSelection', (e, data) => {
      const { index, rel } = data;
      if (!$scope.loaded && ($scope.rel.autoloads === false) && $scope.rel.id === rel.id) {
        $scope.gridOptions.columnApi.autoSizeColumns();
        setTimeout(() => {
          if ($scope.gridOptions.api) $scope.gridOptions.api.resetRowHeights();
        }, 500);
        loadMultiLevelData();
        $scope.loaded = true;
      }
    });

    $scope.parentUnlocked = !$scope.node._lockState;

    $scope.col_defs = agRenderMachine.getColumnDefs($scope.rel._definition[0], $scope.rel._definition[0].name, true).map(item => {
      if (item.editable) {
        item.editable = () => {
          if ($scope.rel.disableUpdates) {
            return false;
          } else if ($scope.lockedByCurrentUser || (!$scope.rel.lockLinked && $scope.rel.lockLinked != undefined)) {
            return true;
          }
          return false;
        };
      }
      return item;
    });

    $scope.firstColumn = $scope.col_defs.find(item => item.orgCellRendered === true);
    if (!$scope.firstColumn) {
      $scope.firstColumn = { ...$scope.col_defs[1] };
      $scope.col_defs[1].hide = true;
    }
    $scope.firstColumn.lockPosition = true;
    $scope.firstColumn.pinned = 'left';
    $scope.firstColumn.cellRendererParams = {
      suppressCount: true,
      innerRenderer: 'orgCellRenderer',
    };

    $scope.gridOptions = {
      components: {
        datePicker: agRenderMachine.getDatePicker(),
        orgCellRenderer: getOrgCellRenderer(),
        booleanEditor: agRenderMachine.getBooleanEditor(),
      },
      columnDefs: $scope.col_defs.filter(item => item.orgCellRendered !== true),
      rowData: [],
      // singleClickEdit: true,
      // stopEditingWhenGridLosesFocus: true,
      treeData: true, // enable Tree Data mode
      animateRows: true,
      angularCompileRows: true,
      rowSelection: 'multiple',
      sideBar: {
        toolPanels: [
          {
            id: 'columns',
            labelDefault: 'Columns',
            labelKey: 'columns',
            iconKey: 'columns',
            toolPanel: 'agColumnsToolPanel',
            toolPanelParams: {
              suppressPivots: true,
              suppressPivotMode: true,
              suppressRowGroups: true,
              suppressValues: true,
            },
          },
          {
            id: 'filters',
            labelDefault: 'Filters',
            labelKey: 'filters',
            iconKey: 'filter',
            toolPanel: 'agFiltersToolPanel',
          }
        ],
        defaultToolPanel: 'columns',
      },
      getContextMenuItems: getContextMenuItemsFn,
      defaultColDef: {
        enablePivot: false,
        resizable: true
      },
      getRowNodeId: (data) => {
        return data.orgHierarchy;
      },
      groupDefaultExpanded: -1, // expand all groups by default
      getDataPath: data => data.orgHierarchy,
      onGridReady: (params) => {
        if ($scope.rel.autoloads != false) {
          $scope.gridOptions.columnApi.autoSizeColumns();
          loadMultiLevelData();
          $scope.loaded = true;
        }
      },
      onCellValueChanged: async (params) => {
        if (params.oldValue === params.newValue) {
          return;
        }

        $scope.gridOptions.api.resetRowHeights();

        if (params.colDef.field) {
          const isTarget = params.colDef.field.split('.')[0] === 'target';

          let newData;
          if (isTarget) {
            const node = params.data.target;
            const property = params.colDef.field.split('.')[2]
            if (property === '_serialized') return;
            
            const nodeParams = { ...node };
            nodeParams.properties[property] = params.newValue;

            const updatedNode = await nodesModel.updateNode(nodeParams);
            // new object formatted to correspond to row data format
            newData = {
              ...updatedNode.properties,
              target: updatedNode
            };

          } else {
            const { data } = params;
            const property = params.colDef.field.split('.')[2];
            const relationship = {
              _id: data._relId,
              _type: data._rel,
              properties: data.properties,
              target: data.target,
              source: {
                _type:data._type,
                _id:data.root,
              }
            }
            relationship.properties[property] = params.newValue;
            const result = await nodesModel.updateRelationship(relationship);
            if (result && !result.error) {
              Notification.success({ message: `✔️ ${$translate.instant('default.shared.valueUpdated')}`, replaceMessage: true });
            } else if (result.error) {
              Notification.error({ title: 'Error Updating Node Value', ...result });
              const rowNode = $scope.gridOptions.api.getRowNode(params.data.orgHierarchy);
              const rowData = { ...params.data };
              rowData[params.colDef.field] = params.oldValue;
              rowNode.setData(rowData);
            }
          }

          const rowNode = $scope.gridOptions.api.getRowNode(params.data.orgHierarchy);
          const rowData = { ...params.data };

          if (!newData) {
            rowData[params.colDef.field] = params.oldValue;
          } else {
            Object.assign(rowData, newData);
          }

          rowNode.setData(rowData);
        }
      },
      onCellDoubleClicked: function (params) {
        if (!params.colDef.editable) $rootScope.$broadcast('openNode', {
          _id: params.data._id,
          _type: params.data._type,
        });
      },
      onDisplayedColumnsChanged(params) {
        const { primaryColumns } = params.columnApi.columnController;
        agRenderMachine.setGridRowHeight(primaryColumns, $scope.gridOptions);
      },
      autoGroupColumnDef: $scope.firstColumn
    };


    $scope.$on('nodeLocked', () => {
      $scope.parentUnlocked = false;
      $scope.gridOptions.api.resetColumnState();
    });

    $scope.$on('nodeUnlocked', () => {
      $scope.parentUnlocked = true;
      $scope.gridOptions.api.resetColumnState();
    });

    //  Find relationships
    const rels = [...$scope.rel._definition].filter((x, i) => i !== 'tab');
    const relsLinkname = rels.map(r => r.linkName);
    const inputOptions = {};
    const currentNodeRels = $rootScope.datamodel.nodetypes.filter((n) => {
      const { elementType, linkName, directions = [] } = n;
      if (elementType === 'node') return;

      const sameLinkName = relsLinkname.includes(linkName);
      const direction = directions.find((d) => d.source === $scope.node._typeObject.id);

      return sameLinkName && direction;
    })
    currentNodeRels.map(rel => {
      const directions = rel.directions;
      directions.forEach((dir) => {
        const targetNodetype = $rootScope.datamodel.nodetypes.find(nodetype => nodetype.id === dir.target);
        inputOptions[rel.name] = `${targetNodetype.name} (${rel.name})`;
      });
    });

    $scope.insertNode = async (rowNode, rel) => {
      let targetNodetype;
      if (rel) {
        targetNodetype = $rootScope.datamodel.nodetypes.find(nodetype => { // won't work with multiple source/target
          return nodetype.id === rel.directions[0].target;
        });
      }
      if (!rowNode) rowNode = $scope.node;
      if (!targetNodetype) {
        await Swal.fire({
          title: $translate.instant('default.shared.selectANodetype'),
          icon: 'info',
          input: 'select',
          inputOptions,
          showCancelButton: true,
        }).then(result => {
          if (result.value) {
            rel = rels.find(i => i.name === result.value); // won't work with multiple source/target
            targetNodetype = $rootScope.datamodel.nodetypes.find(nodetype => nodetype.id === rel.directions[0].target);
            if (!targetNodetype) {
              Notification.error({ title: 'Error', message: "Target Nodetype not found!" });
            }
          }
        })
      }

      if (targetNodetype) {
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
            createNewNode(targetNodetype, rowNode, rel);
          } else if (swalresult.dismiss === Swal.DismissReason.cancel) {
            //  Attach Node
            $rootScope.$broadcast('openAttachNodeModal', $scope.node._id, targetNodetype, rel, rowNode, 'multilevelviewComponent');
          }
        });
      }
    }

    function getInstanciationContextMenu(params) {
      const instanciationMenuArray = [];
      const { target } = params.node.data;
      const nodetypeName = params.node.data._type || 'none';
      const node = params.node.data;
      let nodetype;
      if (nodetypeName !== 'none') {
        nodetype = $rootScope.datamodel.nodetypes.find(nodetype => nodetype.name === nodetypeName);
        if (nodetype.instanciations) {
          nodetype.instanciations.forEach((inst) => {
            const translationPath = `nodetype.${nodetype.name}.${inst.name}`;
            const translation = $translate.instant(translationPath);
            if (translation !== translationPath) inst.translation = translation;
            // create sub menu element
            instanciationMenuArray.push({
              name: `🔀 ${inst.translation || inst.name}`,
              action: () => {
                const hasId = target.properties._serialized.includes(inst.id);
                if (node.properties._serialized === undefined) node.properties._serialized = [];
                nodesModel.serializeNode(node._type, node._id, inst.id, hasId)
                  .then((result) => {
                    params.node.setDataValue(`target.properties._serialized`, result.properties._serialized);
                    Notification.success({ title: "Serialized", message: "Instanciation updated" });
                  }, (error) => {
                    console.error(error);
                  })
              },
            })
          })
        }
      }
      return instanciationMenuArray;
    }

    function getContextMenuItemsFn(params) {
      let rowNode = $scope.node;
      if (params.node !== null) {
        rowNode = params.node.data;
      }
      //  Find Parent Node
      let parentNode = $scope.node;
      if (rowNode.root && rowNode.root !== $scope.node._id) {
        parentNode = $scope.tree_data.find(n => n._id === rowNode.root);
      }


      //  List Menu Items
      const items = [
        {
          name: 'Open Node',
          action: () => {
            $rootScope.$broadcast('openNode', {
              _id: params.node.data._id,
              _type: params.node.data._type,
            });
            $scope.$apply();
          },
        },
        'separator',
        'copy',
        'copyWithHeaders',
        'export',
      ];

      // add instanciation menu if instanciations are available and if _serialized is available
      const instanceMenu = getInstanciationContextMenu(params);
      if (instanceMenu.length > 0) {
        items.push(
          {
            name: 'Instanciation',
            subMenu: instanceMenu,
          }
        )
      }
      items.push({
        name: 'Detach Node',
        disabled: $scope.lockedByCurrentUser && parentNode._lockable ? false : true,
        action: () => {
          const rowNodeDM = $rootScope.datamodel.nodetypes.find(n => n.name === rowNode._type);
          const relationshipsDM = $scope.rel.relationships.filter((rel) => $rootScope.datamodel.nodetypes.find((r) => r.id === rel));
          const relationshipDM = relationshipsDM.find((r) => {
            const sameLinkName = rowNode._rel;
            const direction = r.directions.find((d) => d.target === rowNodeDM.id);

            return sameLinkName && direction;
          })
          nodesModel.deleteRelationshipById(
            parentNode,
            relationshipDM.name,
            rowNode._relId,
          ).then((result) => {
            if (result.error) return Notification.error({ title: 'Error Deleting Relationship', ...result });
            Notification.success({ title: 'Node Detached', message: `Node Ref: ${rowNode._ref}` });
            loadMultiLevelData();
          }).catch((e) => {
            Notification.error({ title: 'Detach Failed', message: e.message });
            console.error(e);
          });
        },
      });
      //  Check if actions below are allowed 
      const allowActions = $scope.lockedByCurrentUser && rowNode._lockable;
      if (allowActions) {
        const rowNodeDM = $rootScope.datamodel.nodetypes.find(n => n.name === rowNode._type);
        const rowNodeRels = $rootScope.datamodel.nodetypes.filter((n) => {
          const { elementType, linkName, directions = [] } = n;
          if (elementType === 'node') return;

          const sameLinkName = rels.includes(linkName);
          const direction = directions.find((d) => d.source === rowNodeDM.id);

          return sameLinkName && direction;
        });
        rowNodeRels.map(rel => {
          const targetNodetype = $rootScope.datamodel.nodetypes.find(n => { // won't work with multiple source/target relationships
            return n.id === rel.directions[0].target;
          });
          if (!items.find(i => i.name === `Insert ${targetNodetype.name} (${rel.name})`)) {
            items.push({
              name: `Insert ${targetNodetype.name} (${rel.name})`,
              disabled: allowActions ? false : true,
              action: () => $scope.insertNode(rowNode, rel),
            });
          }
        });
      }
      return items;
    }

    /**
 * handledToDeepStruct - it takes an array of nodes and there relationships and builds 
 * @param {*} relationships Nodes are provided with their first level children
 * @returns 
 */
    const handledToDeepStruct = (relationships) => {
      const nodes = relationships.map((relationship) => {
        const { source, target } = relationship;
        setOrgHierarchy(relationship, relationships, [relationship._id]);

        const record = {
          target,
          source,
          ...target.properties,
          properties: relationship.properties,
          _type: target._type,
          guid: Math.random(),
          root: source._id,
          _id: target._id,
          orgHierarchy: relationship.orgHierarchy,
          indentation: relationship.orgHierarchy.length,
          _rel: relationship._type,
          _relId: relationship._id,
        };

        return record;
      });
      return nodes;
    };

    const setOrgHierarchy = (relationship, relationships, orgHierarchy = []) => {
      const parentRelationship = relationships.find((r) => {
        return r.target._id === relationship.source._id;
      });

      if (parentRelationship) {
        orgHierarchy.unshift(parentRelationship._id);
        setOrgHierarchy(parentRelationship, relationships, orgHierarchy);
      }
      relationship.orgHierarchy = orgHierarchy;
    };

    const loadMultiLevelData = async () => {
      $scope.gridOptions.api.showLoadingOverlay();

      const relationshipsNames = $rootScope.datamodel.nodetypes
        .filter((nodetype) => {
          return $scope.rel.relationships.includes(nodetype.id);
        })
        .map((nodetype) => nodetype.name);

      const body = { relationships: relationshipsNames };
      const relationships = await nodesModel.searchRelationships($scope.node, body, { recursive: true })

      if ($scope.gridOptions.api) {
        let rowCount = 0;
        if (relationships) {
          $scope.tree_data = handledToDeepStruct(relationships);
          $scope.gridOptions.api.setRowData($scope.tree_data);
          $scope.gridOptions.api.resetRowHeights();
          rowCount = $scope.gridOptions.api.getDisplayedRowCount();
        } else {
          $scope.gridOptions.api.setRowData([]);
          $scope.gridOptions.api.resetRowHeights();
          $scope.gridOptions.api.showNoRowsOverlay();
        }
        $scope.$emit("objCountUpdate", $scope.rel.name, rowCount);
      }
    };

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
        let icon;
        let value;
        if (params.data && params.data.target && params.data.target.properties) {
          icon = getNodeIcon(params.data._type);
          value = params.data.target.properties[$scope.firstColumn.field.split('.')[2]];
        }
        tempDiv.innerHTML = icon ? `<span>${icon} <span class="nodename">${value}</span></span>` : value;
        this.eGui = tempDiv.firstChild;
      };
      OrgCellRenderer.prototype.getGui = () => this.eGui;

      return OrgCellRenderer;
    }

    async function createNewNode(nodetype, parentNode, relationship) {
      try {
        const params = {
          _type: nodetype.name,
          properties: {},
        };

        await helperFunctions.runTriggeredMethods('beforeCreate', params, $scope);

        const mandatoryFields = await helperFunctions.askMandatoryFields(nodetype, params.properties);
        if (!mandatoryFields) {
          return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
        }

        params.properties = { ...params.properties, ...mandatoryFields };
        const lock = !!$scope.rel.openOnCreation;

        const node = await nodesModel.addNode(params, lock);
        if (!node) return;

        await helperFunctions.runTriggeredMethods('afterCreate', node, $scope);

        //  Attach 
        Notification.success({
          title: 'Node Created',
          message: 'Attaching Node...',
        });
        attachNode(node, parentNode, relationship);
      } catch (error) {
        console.error(error);
      }
    };

    function attachNode(node, parentNode, relationship) {
      nodesModel.attachNode(
        parentNode,
        node,
        relationship,
      ).then((resultRel) => {
        const nodeRef = resultRel.target.properties._ref;
        // notify success
        Notification.success({ title: 'Node Attached', message: `Node Ref: ${nodeRef}` });
        loadMultiLevelData();
      }).catch((e) => {
        console.error(e);
      });
    }

    $rootScope.$on('refreshMultilevel', (e, nodeId) => {
      if ($scope.node._id === nodeId) {
        loadMultiLevelData();
      }
    });

    $scope.refreshBOM = () => {
      loadMultiLevelData();
    };


    //  Update Grid Columns on Language Change
    $rootScope.$on('$translateChangeSuccess', () => {
      if ($scope.gridOptions.api && $scope.rel._definition[0].ui.gridColumns) {
        const columnDefs = agRenderMachine.getColumnDefs($scope.rel._definition[0], $scope.rel._definition[0].name).map((item) => {
          const adjustedItem = item;
          if (item.editable) {
            if ($scope.lockedByCurrentUser) {
              adjustedItem.editable = () => {
                if ($scope.rel.disableUpdates) {
                  return false;
                } else if ($scope.lockedByCurrentUser || (!$scope.rel.lockLinked && $scope.rel.lockLinked != undefined)) {
                  return true;
                }
                return false;
              };
            }
          }
          return adjustedItem;
        });

        $scope.gridOptions.api.setColumnDefs([]);
        $scope.gridOptions.api.setColumnDefs(columnDefs);
      }
    });

    $scope.$on('refreshTabContent', () => {
      $scope.refreshBOM();
    })

  });
