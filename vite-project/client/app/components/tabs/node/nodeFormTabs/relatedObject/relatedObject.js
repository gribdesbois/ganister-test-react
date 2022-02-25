/* globals _, agGrid, angular */
agGrid.initialiseAgGridWithAngular1(angular);
angular.module('app.ganister.tabs.node.nodeFormTabs.relatedObject', [
  'agGrid',
  'ui-notification',
  'app.ganister.shared.modals.relationshipModal',
  'app.ganister.shared.modals.nodeRelModal',
  'app.ganister.tool.aggrid',
  'app.ganister.tool.helperFunctions',
  'app.ganister.models.nodetypes',
])
  .controller('relatedObjectController', ($scope, $rootScope, $translate, nodesModel, Notification, agRenderMachine, helperFunctions) => {


    //   ______                _   _                 
    //  |  ____|              | | (_)                
    //  | |__ _   _ _ __   ___| |_ _  ___  _ __  ___ 
    //  |  __| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
    //  | |  | |_| | | | | (__| |_| | (_) | | | \__ \
    //  |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|___/


    // #region FUNCTION
    function getInstanciationContextMenu(params) {
      try {
        const instanciationMenuArray = [];
        const { target } = params.node.data;

        const nodetypeName = target?._type || 'none';
        if (nodetypeName === 'none') return;

        const nodetype = $rootScope.datamodel.nodetypes.find(n => n.name === nodetypeName);
        if (!nodetype.instanciations) return;

        nodetype.instanciations.forEach((inst) => {
          const translationPath = `nodetype.${nodetype.name}.${inst.name}`;
          inst.translation = helperFunctions.translateProperty(translationPath);

          // create sub menu element
          const menuItem = {
            name: `🔀 ${inst.translation || inst.name}`,
            action: async () => {
              const hasId = target.properties._serialized.includes(inst.id);
              try {
                const result = await nodesModel.serializeNode(target._type, target._id, inst.id, hasId);
                params.node.setDataValue(`target.properties._serialized`, result.properties._serialized);
                Notification.success({ title: "Serialized", message: "Instanciation updated" });
              } catch (err) {
                Notification.error({ title: 'Error Serializing Node', message: err });
              }
            },
          };
          instanciationMenuArray.push(menuItem);
        })
        return instanciationMenuArray;
      } catch (error) {
        console.error(error);
      }
    };


    const getRelatedObjectContextMenuItems = (params) => {
      const contextMenuItems = [
        {
          name: 'edit',
          cssClasses: [],
          icon: '<i class="fa fa-edit"></i>',
          disabled: params.node.data.target.locked == 2,
          action: () => {
            $scope.editNode(params.node.data.target)
          },
        },
        'copy',
        'copyWithHeaders',
        'export',
      ];

      // add instanciation menu if instanciations are available and if _serialized is available

      const instanceMenu = getInstanciationContextMenu(params);
      if (instanceMenu && instanceMenu.length > 0) {
        contextMenuItems.push(
          {
            name: 'Instanciation',
            subMenu: instanceMenu,
          }
        )
      }


      return contextMenuItems;
    };
    // #endregion


    //    _                               __                  _   _                 
    //   | |                             / _|                | | (_)                
    //  / __) ___  ___ ___  _ __   ___  | |_ _   _ _ __   ___| |_ _  ___  _ __  ___ 
    //  \__ \/ __|/ __/ _ \| '_ \ / _ \ |  _| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
    //  (   /\__ \ (_| (_) | |_) |  __/_| | | |_| | | | | (__| |_| | (_) | | | \__ \
    //   |_| |___/\___\___/| .__/ \___(_)_|  \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
    //                     | |                                                      
    //                     |_|                                                      

    // #region $SCOPE.FUNCTIONS
    $scope.loadTable = async () => {
      try {
        let gridName = 'gridColumns';
        if (!$scope.rel._definition) {
          console.error('error while getting the related object definition, check datamodel', $scope.rel);
          return;
        }

        $scope.gridOptions.api.setRowData([]);
        $scope.gridOptions.api.showLoadingOverlay();
        if ($scope.rel._definition.undirectedRelationship) {
          // check if the nodetype in nodeForm is the same as sourceNodetype
          const { directions = [] } = $scope.rel._definition;
          const currentlyOnSourceNodetype = directions.find((d) => d.source === $scope.nodetype.id);
          // if no, use the reverseGridColumns to display the target nodetypes
          if (!currentlyOnSourceNodetype) gridName = 'reverseGridColumns';
        }
        if ($scope.rel._definition.ui[gridName]) {
          columnDefs = agRenderMachine.getColumnDefs($scope.rel._definition, false, $scope.nodetype).map((item) => {
            const adjustedItem = item;
            if (item.editable) {
              adjustedItem.editable = () => {
                if ($scope.rel.disableUpdates) {
                  return false;
                } else if ($scope.lockedByCurrentUser || (!$scope.rel._definition.lockLinked && $scope.rel._definition.lockLinked != undefined)) {
                  return true;
                }
                return false;
              };
            }
            return adjustedItem;
          });
          $scope.gridOptions.api.setColumnDefs(columnDefs);
        }

        // load node relationships instances
        const relationships = await nodesModel.getRelationships($scope.node, $scope.rel._definition.name);
        if (!relationships) return;

        $scope.firstLoad = true;
        if (!$scope.gridOptions.api) return;

        relationshipsData = relationships.map((relationship) => {
          $scope.relationships.push(relationship);

          const { _type, _id, properties, target } = relationship;
          target.locked = helperFunctions.getLockedState(target);

          const row = {
            _type,
            _id,
            properties,
            target,
          };

          return row;
        });
        $scope.gridOptions.api.setRowData(relationshipsData);
      } catch (error) {
        console.error(error);
        $scope.$emit("objCountUpdate", $scope.rel.name, 0);
      }

      // datatable row double click handler
      $scope.gridOptions.api.addEventListener('rowDoubleClicked', (row) => {
        if (row.data) {
          $rootScope.$broadcast('openNode', row.data.target);
          $scope.$apply();
        }
      });
    }

    $scope.openNode = (node) => {
      $rootScope.$broadcast('openNode', node);
    }

    $scope.addAsRelationship = () => {
      $rootScope.$broadcast('openRelModal', $scope.rel.id, $scope.node._id, $scope.node.properties._version);
    };

    $scope.editNode = async (node) => {
      if (node.locked == 0) {
        const lock = true;
        const result = await nodesModel.updateNode(node, lock);
        if (result) $scope.openNode(node);
      } else if (node.locked === 1) {
        $scope.openNode(node);
      } else if (node.locked > 1) {
        Notification.error({
          title: "Cannot Edit",
          message: `Node is locked by ${node.properties._lockedByName || 'someone else'}`,
        });
      }
    };

    $scope.createAsRelationship = async function (relationshipDM) {
      try {
        let targetId;
        // for undirectRelationship, check if the current nodetype is the same as the target nodetype
        const sameNodetype = $scope.rel._definition.directions.find((d) => d.target === $scope.nodetype.id)
        // if so, then use the sourceNodetype as the targetNodetype to always get the 'opposite' nodetype
        if (relationshipDM._definition.undirectedRelationship && sameNodetype) {
          targetId = relationshipDM._definition.directions[0].source; // will not work with multiple source/target relationships
        } else {
          targetId = relationshipDM._definition.directions[0].target; // will not work with multiple source/target relationships
        }

        const targetNodetypeDM = $rootScope.datamodel.nodetypes.find((nodetype) => {
          return nodetype.id === targetId;
        });

        const nodeParams = {
          _type: targetNodetypeDM.name,
          properties: {},
        };

        const relParams = {
          _type: relationshipDM._definition.name,
          source: $scope.node,
          properties: {},
        };

        await helperFunctions.runTriggeredMethods('beforeCreate', nodeParams, $scope);

        const relMandatoryFields = await helperFunctions.askMandatoryFields(relationshipDM._definition, relParams.properties);
        if (!relMandatoryFields) {
          return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
        }
        const mandatoryFields = await helperFunctions.askMandatoryFields(targetNodetypeDM, nodeParams.properties);
        if (!mandatoryFields) {
          return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
        }

        nodeParams.properties = { ...nodeParams.properties, ...mandatoryFields };
        const lock = !!$scope.rel.openOnCreation;

        const node = await nodesModel.addNode(nodeParams, lock);
        if (!node) return;

        await helperFunctions.runTriggeredMethods('afterCreate', node, $scope);


        // Relationship Creation

        relParams.target = node;
        relParams.properties = { ...relParams.properties, ...relMandatoryFields };
        const relationship = await nodesModel.addRelationship(relParams);
        if (!relationship) return;

        $scope.handleAttachedNode(relationship, true);
      } catch (error) {
        console.error(error);
      }
    };

    $scope.detach = async () => {
      try {
        const selectedRows = $scope.gridOptions.api.getSelectedRows();

        const promises = selectedRows.map(async (row) => {
          row.source = $scope.node;
          const result = await nodesModel.deleteRelationship(row);
          if (!result) return;

          _.remove(relationshipsData, { _id: row._id });
          Notification.success({ message: $translate.instant('default.node.relationshipDeleted') });
        });

        await Promise.all(promises);
        $scope.gridOptions.api.setRowData(relationshipsData);
      } catch (error) {
        console.error(error);
      }
    };

    $scope.detachAndDelete = async () => {
      try {
        const selectedRows = $scope.gridOptions.api.getSelectedRows();

        await $scope.detach();

        const promises = selectedRows.map(async (row) => {
          const result = await nodesModel.deleteNode(row.target);
          if (!result) return;

          Notification.success({ message: $translate.instant('default.node.nodeDeleted') });
          $rootScope.$broadcast('updateNode', $scope.node);
        });

        await Promise.all(promises);
      } catch (error) {
        console.error(error);
      }
    };


    $scope.handleUpdateNode = (relId, value) => {
      const rowNode = $scope.gridOptions.api.getRowNode(relId);
      Object.keys(value.properties).map((k) => {
        if (value.properties[k] !== undefined) {
          rowNode.data[k] = value.properties[k];
        }
      }); // update duplicate properties in row.data => should be removed later
      Object.keys(value).map((k) => {
        rowNode.data[k] = value[k];
      }); // update row.data.properties
      rowNode.setData(rowNode.data);
    };

    $scope.handleAttachedNode = (relationship, open) => {
      const { source, target } = relationship;
      relationshipsData.push(relationship);
      $scope.gridOptions.api.setRowData(relationshipsData);

      $rootScope.$broadcast('updateNode', source);
      // open created node
      if (open && $scope.rel.openOnCreation) {
        $rootScope.$broadcast('openNode', target);
      }
    };

    $scope.refreshTable = () => {
      $scope.loadTable();
    };

    // #endregion


    //   _____       _ _   
    //  |_   _|     (_) |  
    //    | |  _ __  _| |_ 
    //    | | | '_ \| | __|
    //   _| |_| | | | | |_ 
    //  |_____|_| |_|_|\__|


    // #region INIT

    let columnDefs = [];
    let relationshipsData = [];
    $scope.itemSelected = false;
    $scope.parentUnlocked = !$scope.node._lockState;
    $scope.firstLoad = false;
    $scope.loaded = false;
    $scope.$on('nodeformTabSelection', (e, data) => {
      const { index, rel } = data;
      if (!$scope.loaded && ($scope.rel.autoloads === false) && $scope.rel.id === rel.id) {
        $scope.loadTable();
        $scope.loaded = true;
      }
    });

    $scope.gridOptions = {
      components: {
        datePicker: agRenderMachine.getDatePicker(),
        booleanEditor: agRenderMachine.getBooleanEditor(),
      },
      defaultColDef: {
        // allow every column to be aggregated
        enableValue: true,
        // allow every column to be grouped
        enableRowGroup: true,
        // allow every column to be pivoted
        enablePivot: true,
        resizable: true,
        sortable: true,
      },
      sideBar: true,
      groupDefaultExpanded: -1,
      columnDefs: null,
      singleClickEdit: true,
      stopEditingWhenGridLosesFocus: true,
      rowData: [],
      getRowNodeId: (data) => data._id,
      groupUseEntireRow: true,
      getContextMenuItems: getRelatedObjectContextMenuItems,
      rowClassRules: {
        'rowGroup': (params) => {
          return params.node.group
        }
      },
      rowSelection: 'multiple',
      // onModelUpdated: onModelUpdated,
      onGridReady: () => {
        if ($scope.rel.autoloads != false) {
          $scope.loadTable();
          $scope.loaded = true;
        }
      },
      angularCompileRows: true,
      onRowDataChanged: function () {
        if ($scope.firstLoad) {
          let counter = 0;
          $scope.gridOptions.api.forEachNode((n) => {
            if (n.data) {
              counter++;
            }
          });
          $scope.$emit("objCountUpdate", $scope.rel.name, counter);
        }
      },
      onCellValueChanged: async (params) => {
        if (params.oldValue === params.newValue) return;

        const data = params.data;
        const value = params.newValue;
        const propSplit = params.colDef.colId.split('.');
        const targetObject = propSplit[0];
        const prop = propSplit[propSplit.length - 1];

        const rowData = { ...data };

        if (prop === '_serialized') return;

        if (targetObject === 'properties') {
          const { target } = data;

          const properties = {};
          properties[prop] = value;
          const relationshipParams = {
            _type: $scope.rel._definition.name,
            _id: data._id,
            properties,
            source: $scope.node,
            target,
          };

          const relationship = await nodesModel.updateRelationship(relationshipParams);
          if (!relationship) {
            rowData[params.colDef.field] = params.oldValue;
            return;
          }

          Object.assign(rowData, relationship);
        } else {
          const node = data.target;
          node.properties[prop] = value;

          const updatedNode = await nodesModel.updateNode(node);
          if (!updatedNode) {
            rowData[params.colDef.field] = params.oldValue;
            return;
          }

          Object.assign(rowData.target, updatedNode);
        }

        Notification.success({ message: '✔️ ' + $translate.instant('valueUpdated') });

        const rowNode = $scope.gridOptions.api.getRowNode(data._id);
        rowNode.setData(rowData);
      },
      onDisplayedColumnsChanged(params) {
        const { primaryColumns } = params.columnApi.columnController;
        agRenderMachine.setGridRowHeight(primaryColumns, $scope.gridOptions);
      },
      onCellEditingStarted(params) {
        if (_.get(params.colDef, 'cellEditorParams.customEditor') === 'nodeSelector') {
          const { _id, _type, target } = params.data;
          $scope.gridOptions.api.stopEditing(true);
          const propSplit = params.colDef.colId.split('.');
          const nodetypeDM = $rootScope.datamodel.nodetypes.find((n) => n.name == target._type);
          const property = nodetypeDM.properties.find((p) => p.name == propSplit[2]);
          const relationshipDM = $rootScope.datamodel.nodetypes.find((n) => n.id === property.relationship);
          $scope.$broadcast('openNodeRelModal', relationshipDM, _id, { _id: target._id, _type: target._type }, params.colDef.field);
        }
      }
    };

    // #endregion


    //  __          __   _       _                   
    //  \ \        / /  | |     | |                  
    //   \ \  /\  / /_ _| |_ ___| |__   ___ _ __ ___ 
    //    \ \/  \/ / _` | __/ __| '_ \ / _ \ '__/ __|
    //     \  /\  / (_| | || (__| | | |  __/ |  \__ \
    //      \/  \/ \__,_|\__\___|_| |_|\___|_|  |___/



    // #region WATCHES (Object Watcher)
    // #endregion


    //   _______   _                              ____        
    //  |__   __| (_)                            / __ \       
    //     | |_ __ _  __ _  __ _  ___ _ __ ___  | |  | |_ __  
    //     | | '__| |/ _` |/ _` |/ _ \ '__/ __| | |  | | '_ \ 
    //     | | |  | | (_| | (_| |  __/ |  \__ \ | |__| | | | |
    //     |_|_|  |_|\__, |\__, |\___|_|  |___/  \____/|_| |_|
    //                __/ | __/ |                             
    //               |___/ |___/                              
    // #region ON (Event Listener)

    //  Update Grid Columns on Language Change
    $rootScope.$on('$translateChangeSuccess', () => {
      if ($scope.gridOptions.api && $scope.rel._definition.ui.gridColumns) {
        columnDefs = agRenderMachine.getColumnDefs($scope.rel._definition, $scope.rel._definition.name).map((item) => {
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

    $scope.$on('nodeLocked', () => {
      $scope.parentUnlocked = false;
      $scope.gridOptions.api.resetColumnState();
    });

    $scope.$on('nodeUnlocked', () => {
      $scope.parentUnlocked = true;
      $scope.gridOptions.api.resetColumnState();
    });

    $scope.$on('refreshTabContent', () => {
      $scope.refreshTable();
    })


    // #endregion



  });