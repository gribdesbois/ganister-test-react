angular.module('app.ganister.config.groupsAndUsers', [
  'ui.tree',
  'app.ganister.config.data',
  'ngFileUpload',
])
  .controller('groupsAndUsers', function ($scope, $http, Upload, data, Notification, $location, $translate) {

    const getNodesRelationships = async (nodetype) => {
      const relationships = await data.relationships.allByName(nodetype, 'groupMember', { reverse: true, recursive: true });
      return relationships;
    };

    const getRelationships = async () => {
      try {
        $scope.permissionsLoading = false;
        const groups = await data.nodes.all('Group');
        if (!groups) return;

        $scope.groups = groups.filter((g) => !g.properties.groupType || g.properties.groupType.toLowerCase() === 'group');
        $scope.teams = groups.filter((g) => g.properties.groupType?.toLowerCase() === 'team');
        $scope.roles = groups.filter((g) => g.properties.groupType?.toLowerCase() === 'role');
        $scope.teamsAndRoles = [...$scope.teams, ...$scope.roles];

        const groupRelationships = await getNodesRelationships('Group');
        $scope.permissions = await data.groups.getFullStructure();


        $scope.relationships = [...groupRelationships]
          .filter((value, index, self) => {
            const valueIndex = self.findIndex((v) => v._id === value._id);
            return valueIndex === index;
          });

        $scope.groupsRelationships = $scope.relationships.filter((r) => {
          const { groupType } = r.target.properties;
          return !groupType || groupType.toLowerCase() == 'group';
        });
        $scope.teamsAndRolesRelationships = $scope.relationships.filter((r) => {
          const { groupType = '' } = r.target.properties;
          return groupType.toLowerCase() == 'team' || groupType.toLowerCase() === 'role';
        });
      } catch (error) {
        Notification.error(`Error: ${error.message}`);
      }
    };

    const buildNodesData = (nodes) => {
      nodes.forEach((node) => {
        const { _id, _type, properties } = node;
        const { groupType } = properties;

        if (groupType === 'role') node._type = 'role';
        const nodetype = node._type.toLowerCase();
        const image = _type ? `images/${nodetype}Logo.png` : 'images/groupLogo.png'

        const nodeData = {
          group: 'nodes',
          data: {
            name: properties._labelRef || properties.name,
            id: _id,
            nodetype: node._type,
            image,
            properties,
          }
        };
        $scope.graphData.nodes.push(nodeData);
      });
    };

    const buildRelationshipData = (relationship) => {
      const { _id, properties, source, target } = relationship;
      const relationshipData = {
        group: 'edges',
        data: {
          target: target._id,
          source: source._id,
          id: _id,
          properties,
        }
      };
      $scope.graphData.relations.push(relationshipData);
    };

    const buildGraphData = () => {
      let nodes = [];
      let relationships = [];
      if ($scope.groupType === 'Group') {
        nodes = $scope.groups;
        relationships = $scope.groupsRelationships;
      } else {
        nodes = $scope.teamsAndRoles;
        relationships = $scope.teamsAndRolesRelationships;
      }
      relationships.forEach((relationship) => buildRelationshipData(relationship));
      buildNodesData([...nodes, ...$scope.users]);
      return $scope.graphData;
    };

    $scope.buildGraph = async () => {
      $scope.permissionsLoading = true;
      $scope.graphData = { nodes: [], relations: [] };
      await getRelationships();
      await buildGraphData();
      $scope.cy = cytoscape({
        container: document.querySelector('#permissionsGraph'),
        elements: {
          nodes: $scope.graphData.nodes,
          edges: $scope.graphData.relations
        },
        style: [ // the stylesheet for the graph
          {
            selector: 'node[nodetype = "permission"]',
            style: {
              'shape': 'ellipse',
              'label': 'data(name)',
              'z-index': 2,
              'background-color': '#337ab7',
              'border-width': 0,
              'background-opacity': .8,
              'width': 80,
              'height': 80,
              'font-size': 28,
              'font-weight': 'bold',
              'background-width': 50,
              'background-height': 50,
              'text-valign': "bottom",
              'text-wrap': "wrap",
              'background-image': 'data(image)',
            }
          }, {
            selector: 'node[nodetype = "Group"]',
            style: {
              'shape': 'rectangle',
              'label': 'data(name)',
              'z-index': 2,
              'background-color': '#337ab7',
              'border-width': 0,
              'background-opacity': .8,
              'width': 300,
              'height': 200,
              'font-size': 28,
              'font-weight': 'bold',
              'background-width': 140,
              'background-height': 140,
              'text-valign': "bottom",
              'text-wrap': "wrap",
              'background-image': 'data(image)',
            }
          }, {
            selector: 'node[nodetype = "user"]',
            style: {
              'shape': 'ellipse',
              'label': 'data(name)',
              'z-index': 2,
              'background-color': '#337ab7',
              'border-width': 0,
              'background-opacity': .8,
              'width': 140,
              'height': 140,
              'font-size': 28,
              'font-weight': 'bold',
              'background-width': 80,
              'background-height': 80,
              'text-valign': "bottom",
              'text-wrap': "wrap",
              'background-image': 'data(image)',
            }
          }, {
            selector: 'node[nodetype = "role"]',
            style: {
              'shape': 'diamond',
              'label': 'data(name)',
              'z-index': 2,
              'background-color': '#337ab7',
              'border-width': 0,
              'background-opacity': .8,
              'width': 140,
              'height': 140,
              'font-size': 28,
              'font-weight': 'bold',
              'background-width': 80,
              'background-height': 80,
              'text-valign': "bottom",
              'text-wrap': "wrap",
              'background-image': 'data(image)',
              'text-max-width': 200,
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
          {
            selector: 'node.compound',
            style: {
              'shape': 'cutrectangle',
              'label': 'data(name)',
              'z-index': 1,
              'font-weight': 'normal',
              'font-size': 50,
              'background-color': '#539aC7',
              'border-width': 8,
              "border-color": "#aea",
              'border-style': "dashed",
              'background-opacity': 1,
              'text-valign': "bottom",
              'text-wrap': "wrap",
            }
          },
          {
            selector: '$node > node',
            css: {
              'padding-top': '10px',
              'padding-left': '10px',
              'padding-bottom': '10px',
              'padding-right': '10px',
              'text-valign': 'top',
              'text-halign': 'center',
              'border-width': 2,
              'background-color': '#fefefe',
              'border-style': 'solid',
              'border-opacity': 1,
              'border-color': 'black',
              'label': 'data(name)',
              'background-opacity': 0.3,
            }
          },
          {
            selector: '$node > node:selected',
            css: {
              'background-opacity': 0.2,
              'background-color': '#5cc85c',
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 10,
              'background-opacity': 0.8,
              'text-wrap': 'wrap',
              'line-color': '#aaa',
              'label': 'isMemberOf',
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
            selector: 'edge[relType = "property"]',
            style: {
              'width': 4,
              'line-color': '#FF0000',
              'line-style': 'dashed',
              'label': 'data(linkName)',
              'target-arrow-color': '#FF0000',
              'target-arrow-shape': 'triangle',
              'source-arrow-color': '#FF0000',
              'z-index': 1,
              'curve-style': 'bezier',
              'text-rotation': 'autorotate',
              'text-margin-y': '-15px',
            }
          },
          {
            selector: 'edge:selected',
            style: {
              'width': 10,
              'line-color': '#b22',
            }
          },
          {
            selector: 'edge.obfuscated',
            style: {
              'width': 2,
              'line-color': '#ccc',
              'background-opacity': 0.4,
              'color': '#AAA'
            }
          },
          {
            selector: 'edge.inbound',
            style: {
              'width': 8,
              'line-color': '#f0ad4e',
            }
          },
          {
            selector: 'edge.outbound',
            style: {
              'width': 8,
              'line-color': '#5cb85c',
            }
          },
          {
            selector: 'edge.edgPropHighlight',
            style: {
              'width': 15,
            }
          },
          {
            selector: 'node.inbound',
            style: {
              'background-color': '#f0ad4e',
            }
          },
          {
            selector: 'node.parentsPath',
            style: {
              'background-color': '#a94442',
            }
          },
          {
            selector: 'node.childrenPath',
            style: {
              'background-color': '#fcf8e3',
            }
          },
          {
            selector: 'node.outbound',
            style: {
              'background-color': '#d9534f',
            }
          },
        ],
        layout: layoutOptions,
        wheelSensitivity: 0.2,
        maxZoom: 3,
        minZoom: .1,
      });
      // update UI when tapping on a node
      let tappedTimeout, tappedBefore;
      $scope.cy.on('tap', 'node', function (evt) {

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

        var node = evt.target;
        $scope.selectGraphNode(node);
      });
      // update UI when tapping on graph
      $scope.cy.on('tap', function (evt) {
        if (evt.target === $scope.cy) {
          $scope.unselectNode();
        }
      });

      $scope.cy.on('doubleTap', 'node', (event) => {
        var layout = $scope.cy.layout({
          name: 'breadthfirst',
          circle: false,
          spacingFactor: 1.1,
          animate: true,
          roots: '#' + $scope.selectedNode.id,
        });

        layout.run();
      });
    }


    //   _                               __                  _   _                 
    //  | |                             / _|                | | (_)                
    // / __) ___  ___ ___  _ __   ___  | |_ _   _ _ __   ___| |_ _  ___  _ __  ___ 
    // \__ \/ __|/ __/ _ \| '_ \ / _ \ |  _| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
    // (   /\__ \ (_| (_) | |_) |  __/ | | | |_| | | | | (__| |_| | (_) | | | \__ \
    //  |_| |___/\___\___/| .__/ \___| |_|  \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
    //                    | |                                                      
    //                    |_|                                                      
    //#region scope functions

    $scope.openTeamMemberRemove = async () => {
      try {
        const response = await Swal.fire({
          title: 'Confirm Removing the Selected Team Role ?',
          showCancelButton: true,
          confirmButtonColor: '#d9534f',
          confirmButtonText: `Yes`,
        });
        if (response.value) {
          const result = await data.roles.delete($scope.selectedNode.id);
          if (!result) return;

          $scope.cy.$('#' + $scope.selectedNode.id).remove();
          $scope.cy.layout(layoutOptions).run();
          $scope.selectedGroup = null;
          Notification.success("Team Role Removed");
        }
      } catch (error) {
        console.error("$scope.openTeamMemberRemove -> error", error)
      }
    };

    $scope.openTeamMemberAdd = async () => {
      const userAlreadyAdded = $scope.cy.$('#' + $scope.selectedNode.id).incomers('node').map((node) => {
        return node.data().id;
      })
      $scope.userAsObject = {};
      _.sortBy($scope.users, ['properties.firstName', 'properties.lastName']).forEach((user) => {
        if (!userAlreadyAdded.includes(user._id)) {
          $scope.userAsObject[user._id] = [user.properties.firstName, user.properties.lastName].join(' ');
        }
      })
      await Swal.fire({
        title: 'Select a new Member',
        input: 'select',
        inputOptions: $scope.userAsObject,
        inputPlaceholder: 'Select a User',
        showCancelButton: true,
        inputValidator: (value) => {
          return new Promise((resolve) => {
            data.groups.addUserMember($scope.selectedNode.id, value)
              .then(() => {
                $scope.cy.add([
                  { group: 'edges', data: { id: value + $scope.selectedNode.id, source: value, target: $scope.selectedNode.id } }
                ]);
                $scope.cy.layout(layoutOptions).run();
                $scope.selectNode($scope.cy.$('#' + $scope.selectedNode.id));
                resolve();
              })
              .catch((error) => {
                console.error(error)
              });
          })
        }
      })
    };

    $scope.openPotentialParents = async () => {
      $scope.groupAsObject = {};
      _.sortBy($scope.groups, ['properties.name']).forEach((group) => {
        if (group._id !== $scope.selectedNode.id) $scope.groupAsObject[group._id] = group.properties.name;
      })
      const response = await Swal.fire({
        title: 'Select Parent Group',
        input: 'select',
        inputOptions: $scope.groupAsObject,
        inputPlaceholder: 'Select a Group',
        showCancelButton: true,
      });

      const groupId = response.value;

      try {
        if ($scope.selectedNode.nodetype === "user") {
          const result = await data.groups.addUserMember(groupId, $scope.selectedNode.id);
          if (!result) return;
        } else {
          const result = await data.groups.addGroupMember(groupId, $scope.selectedNode.id);
          if (!result) return;
        }
        $scope.cy.add([
          { group: 'edges', data: { id: $scope.selectedNode.id + groupId, source: $scope.selectedNode.id, target: groupId } }
        ]);

        $scope.cy.layout(layoutOptions).run();
        $scope.selectNode($scope.cy.$('#' + $scope.selectedNode.id));
      } catch (error) {
        console.error(error);
      }
    }

    $scope.openAddUserMember = async () => {
      try {
        const memberAlreadyAdded = $scope.cy.$('#' + $scope.selectedNode.id).incomers('node').map((node) => {
          return node.data().id;
        });
        $scope.userAsObject = {};

        _.sortBy($scope.users, ['properties.firstName', 'properties.lastName']).forEach((user) => {
          if (!memberAlreadyAdded.includes(user._id)) {
            $scope.userAsObject[user._id] = [user.properties.firstName, user.properties.lastName].join(' ');
          }
        });
        const response = await Swal.fire({
          title: 'Select field validation',
          input: 'select',
          inputOptions: $scope.userAsObject,
          inputPlaceholder: 'Select a User',
          showCancelButton: true,
        });
        if (response.value) {
          const params = {
            _type: 'groupMember',
            source: {
              _type: 'user',
              _id: response.value
            },
            target: {
              _type: 'Group',
              _id: $scope.selectedNode.id
            }
          }
          const relationship = await data.relationships.add(params);
          if (!relationship) return;

          $scope.cy.add([
            { group: 'edges', data: { id: response.value + $scope.selectedNode.id, source: response.value, target: $scope.selectedNode.id } }
          ]);
          $scope.cy.layout(layoutOptions).run();
          $scope.selectNode($scope.cy.$('[id = "' + $scope.selectedNode.id + '"]'));
        }
      } catch (error) {
        console.error(error);
      }
    };

    $scope.openAddGroupMember = async () => {
      try {
        const memberAlreadyAdded = $scope.cy.$('#' + $scope.selectedNode.id).incomers('node').map((node) => {
          return node.data().id;
        });
        $scope.userAsObject = {};

        $scope.groupAsObject = {};
        _.sortBy($scope.groups, ['properties.name']).forEach((group) => {
          if (!memberAlreadyAdded.includes(group._id)) {
            if (group._id !== $scope.selectedNode.id) $scope.groupAsObject[group._id] = group.properties.name;
          }
        });
        const response = await Swal.fire({
          title: 'Select field validation',
          input: 'select',
          inputOptions: $scope.groupAsObject,
          inputPlaceholder: 'Select a Group',
          showCancelButton: true,
        });
        if (response.value) {
          const params = {
            _type: 'groupMember',
            source: {
              _type: 'Group',
              _id: response.value
            },
            target: {
              _type: 'Group',
              _id: $scope.selectedNode.id
            }
          }
          const group = await data.relationships.add(params);
          if (!group) return;

          $scope.cy.add([
            { group: 'edges', data: { id: response.value + $scope.selectedNode.id, source: response.value, target: $scope.selectedNode.id } }
          ]);
          $scope.cy.layout(layoutOptions).run();
          $scope.selectNode($scope.cy.$('#' + $scope.selectedNode.id));
        }
      } catch (error) {
        console.error(error);
      }
    };



    $scope.updateUserAdmin = async (admin) => {
      $scope.selectedUser._isAdmin = admin || false;
      await $scope.patchUserProperty($scope.selectedUser);
    };

    $scope.updateUserActive = async (active) => {
      $scope.selectedUser.active = active || false;
      await $scope.patchUserProperty($scope.selectedUser);
    };


    $scope.patchUserProperty = async (params) => {
      try {
        params._type = 'user';
        const user = await data.nodes.update(params);
        if (!user) return;

        const { _id, _labelRef } = user.properties;
        $scope.selectedUser.title = _labelRef;
        $scope.cy.$('#' + _id).data({ name: $scope.selectedUser.properties.name });
        Notification.success("User Updated.");
      } catch (error) {
        console.error(error);
      }
    };

    $scope.patchTeamRoleDefinition = async () => {
      const result = await $http.put(`/api/v0/config/ux/teamRoles`, { value: $scope.allRoles })
      if (result.status === 200) {
        Notification.success('Role Definition Updated');
        return true;
      } else {
        console.error("$scope.patchTeamRoleDefinition -> result", result)
        Notification.error('Error: Please try again');
        return false;
      }
    }

    $scope.patchGroupProperty = (groupId, property) => {
      data.groups.put(groupId, property).then((result) => {
        if (result) {
          // update graph
          $scope.cy.$('#' + groupId).data({ name: property.group });
          // notify success
          Notification.success("Group Updated")
        } else {
          Notification.error("Group not Updated")
        }
      })
    }

    $scope.removeUserPhoto = () => {
      $scope.selectedNode.pict = null;
      $scope.patchUserProperty($scope.selectedNode);
    };

    $scope.initTeamRoles = async () => {
      await data.teams.initRoles($scope.selectedTeam._id);
      $scope.buildGraph();
    }

    $scope.selectedRoleDefinition = null;
    $scope.selectRoleDefinition = (role) => {
      $scope.selectedUser = null;
      $scope.selectedTeam = null;
      $scope.selectedGroup = null;
      $scope.selectedRole = null;
      $scope.selectedRoleDefinition = role;
    }


    $scope.openDisconnectionConfirm = async (parent, child) => {
      try {
        const parentId = parent.id || parent._id;
        const childId = child.id || child._id;
        const response = await Swal.fire({
          title: 'Confirm Disconnection?',
          showCancelButton: true,
          confirmButtonColor: '#f0ad4e',
          confirmButtonText: `Yes`,
        });
        if (response.value) {
          const relationship = $scope.groupsRelationships.find((r) => {
            return r.source._id === childId && r.target._id === parentId;
          });
          parent._id = parent.id;
          parent._type = parent.nodetype;
          const result = await data.relationships.delete(relationship); // need to implement relationshipId
          if (!result) return;

          $scope.cy.$(`edge[source="${childId}"][target="${parentId}"]`).remove();
          $scope.cy.layout(layoutOptions).run();
          $scope.selectNode($scope.cy.$('[id = "' + $scope.selectedNode.id + '"]'));
          Notification.success("Disconnected");
        }
      } catch (error) {
        console.error(error);
      }
    };

    $scope.addUser = async (userProperties) => {
      try {
        const { generateApiKey, ...properties } = userProperties;

        const user = await data.nodes.add({ _type: 'user', properties }, false, generateApiKey);
        if (!user) return;

        $scope.newUser.apiKey = user.apiKey;
        $scope.users.push(user);

        const { _id, _labelRef } = user.properties;
        $scope.cy.add({
          group: 'nodes',
          data: {
            name: _labelRef,
            id: _id,
            nodetype: 'user',
            image: 'images/userLogo.png',
            properties: user.properties,
          }
        });
        $scope.cy.layout(layoutOptions).run();
        $('#addUserPrompt').modal('hide');

        if (generateApiKey) {
          $('#displayApiKey').modal('show');
        }
      } catch (error) {
        console.error(error);
      }
    };

    $scope.selectNode = async (node) => {
      $scope.selectedNode = node.data();

      if ($scope.selectedUser) {
        $scope.parentsNodes = [];
        node.outgoers('[id != "' + node.id() + '"]').forEach((ele) => {
          if (ele.isNode()) $scope.parentsNodes.push(ele.data());
        });
      } else {
        const relationship = $scope.permissions.find((r) => r._id === $scope.selectedNode.id);
        if (!relationship) return;

        const { groupType, permissionSets } = relationship;
        $scope.nodePermissions = [];


        // rebuild permissions
        if (groupType !== 'team' && groupType !== 'role') {
          $scope.datamodel.nodetypes
            .filter((nodetype) => nodetype.elementType === 'node')
            .forEach((nodetype) => {
              const { name } = nodetype;
              const permissionSet = permissionSets.find((p) => p.name === name);
              const { owned = {}, inherited = {}, merged = {} } = permissionSet || {};
              const permissionSetData = {
                name,
                role: $scope.accessLevels.indexOf(merged.role),
                canCreate: merged.canCreate,
                label: $translate.instant(`default.nodetype.${name}`),
                owned,
                inherited,
                merged,
                inheritedMin: true,
              };
              $scope.nodePermissions.push(permissionSetData);
            });
        }

        $scope.members = node.incomers('node').map(elt => elt.data());
        $scope.parentsNodes = node.outgoers('node').map(elt => elt.data());
        $scope.teamMembers = [];
        if ($scope.selectedTeam) {
          node.incomers('node').forEach((role) => {
            const users = role.incomers('node').map(elt => elt.data());
            users.forEach((user, indexMember) => {
              userInstance = Object.assign({}, user)
              userInstance.index = role.data().name + '-' + indexMember;
              userInstance.teamRole = role.data().name;
              userInstance.teamRoleNode = role.data();
              $scope.teamMembers.push(userInstance)
            })
          })
        }
      }
      $scope.cy.$("*").addClass("obfuscated");
      $scope.cy.$("*").removeClass("outbound");
      $scope.cy.$("*").removeClass("inbound");
      $scope.cy.$("*").removeClass("parentsPath");
      $scope.cy.$("*").removeClass("childrenPath");
      $scope.cy.$('[id != "' + node.id() + '"]').unselect();
      node.removeClass("obfuscated");
      node.neighborhood().removeClass("obfuscated");
      node.outgoers('[id != "' + node.id() + '"]').addClass("outbound");
      node.predecessors('[id != "' + node.id() + '"]').addClass("inbound");
      node.successors('[id != "' + node.id() + '"]').addClass("parentsPath");

    };

    $scope.updatePermission = async (permission, single = false) => {
      const role = $scope.accessLevels[permission.role];
      if (role === 'none' || permission.inheritedMin) {
        await data.permissions.removeGroupMember(permission.name, $scope.selectedNode.id)
          .then((result) => {
            if (!result.error) {
              permission.changed = false;
              permission.owned = {
                canCreate: false,
              }
              if (single) {
                data.groups.getFullStructure().then((result) => {
                  $scope.relationships = result;
                  Notification.success("Permission Structure Updated");
                }).catch((error) => {
                  console.error("$scope.updatePermission -> error", error)
                  Notification.error("Permission Structure Not Updated");
                })
              }
            }
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        if (permission.creation) {
          await data.permissions.addGroupMember(permission.name, $scope.selectedNode.id, role, permission.canCreate)
            .then((result) => {
              if (!result.error) {
                permission.changed = false;
                if (single) {
                  data.groups.getFullStructure().then((result) => {
                    $scope.relationships = result;
                    permission.owned = {
                      role: $scope.accessLevels[permission.role],
                      canCreate: permission.canCreate,
                    }
                    permission.merged.role = $scope.accessLevels[permission.role];
                    permission.merged.canCreate = permission.canCreate;
                    Notification.success("Permission Structure Updated");
                  }).catch((error) => {
                    console.error("$scope.updatePermission -> error", error)
                    Notification.error("Permission Structure Not Updated");
                  })
                }
              }
            })
            .catch((error) => {
              console.error(error);
            });
        } else {
          await data.permissions.editGroupMember(permission.name, $scope.selectedNode.id, role, permission.canCreate)
            .then((result) => {
              if (!result.error) {
                permission.changed = false;
                if (single) {
                  data.groups.getFullStructure().then((result) => {
                    $scope.relationships = result;
                    permission.owned = {
                      role: $scope.accessLevels[permission.role],
                      canCreate: permission.canCreate,
                    }
                    permission.merged.role = $scope.accessLevels[permission.role];
                    permission.merged.canCreate = permission.canCreate;
                    Notification.success("Permission Structure Updated");
                  }).catch((error) => {
                    console.error("$scope.updatePermission -> error", error)
                    Notification.error("Permission Structure Not Updated");
                  })
                }
              }
            })
            .catch((error) => {
              console.error(error);
            });
        }

      }
    }

    $scope.checkIfLowerAccess = (permission) => {
      if (permission.role < ($scope.accessLevels.indexOf(permission.inherited.role))) {
        permission.role = $scope.accessLevels.indexOf(permission.inherited.role);
        if (permission.role === 0 || permission.inherited.canCreate == permission.canCreate) {
          permission.inheritedMin = true
        } else {
          permission.inheritedMin = false;
        }
      } else {
        permission.inheritedMin = false;
      }
    }

    $scope.updateAllPermissions = async () => {
      for (const perm of $scope.nodePermissions) {
        if (perm.changed) {
          await $scope.updatePermission(perm);
        }
      }
    }

    $scope.triggerChangeCheck = (permission, source) => {
      if (!$scope.selectedUser) {

        if (($scope.accessLevels[permission.role] != permission.merged.role) || (permission.canCreate != permission.merged.canCreate)) {
          permission.changed = true;
        } else if ((permission.role == $scope.accessLevels.indexOf(permission.owned.role)) && permission.inheritedMin) {
          permission.changed = true;
        } else if (!permission.owned.role && !permission.inheritedMin) {
          permission.changed = true;
        } else {
          permission.changed = false;
        }
        if (source === 'role' && (permission.role === 0 && permission.canCreate)) {
          permission.canCreate = false;
        }
        if (source === 'canCreate' && (permission.role === 0 && permission.canCreate)) {
          permission.role = 1;
        }
        if (permission.role == 0 && !permission.canCreate && !permission.merged.role) {
          permission.changed = false;
        }
        permission.creation = !permission.owned.role && permission.role;
      }

    }


    $scope.selectGraphNode = async (node, fromGraph = true) => {
      if (node.data().nodetype === 'user') {
        selectedNode = $scope.users.find((n) => n._id === node.data().id);
        $scope.selectedUser = selectedNode;
        $scope.selectedTeam = null;
        $scope.selectedGroup = null;
        $scope.selectedRole = null;
        $scope.selectedRoleDefinition = null;

        // update permission inheritance for users
        $scope.nodePermissions = [];
        // $scope.relationships = await data.groups.getFullStructure();

        const parents = $scope.cy.$('#' + node.data().id).outgoers('node');
        parents.forEach((parent) => {
          const parentDefinition = $scope.permissions.find((relationship) => {
            return relationship._id === parent.data().id;
          });
          if (parentDefinition && parentDefinition.permissionSets) {
            parentDefinition.permissionSets.forEach((perm) => {
              const nodePerm = _.find($scope.nodePermissions, { 'name': perm.name });
              if (nodePerm) {
                nodePerm.canCreate = nodePerm.canCreate || nodePerm.merged.canCreate || perm.merged.canCreate;
                if ($scope.accessLevels.indexOf(perm.merged.role) > $scope.accessLevels.indexOf(nodePerm.merged.role)) {
                  nodePerm.role = $scope.accessLevels.indexOf(perm.merged.role);
                }
              } else {
                perm.role = $scope.accessLevels.indexOf(perm.merged.role);
                $scope.nodePermissions.push(perm);
              }
            });
          }
        });
        $scope.nodePermissions.map((perm) => {
          perm.canCreate = perm.canCreate || perm.merged.canCreate;
          return perm;
        });

      } else if (node.data().nodetype === 'Group') {
        if (node.data().properties.groupType === 'team') {
          selectedNode = $scope.teams.find((n) => n._id === node.data().id);
          $scope.selectedTeam = selectedNode;
          $scope.selectedUser = null;
          $scope.selectedGroup = null;
          $scope.selectedRole = null;
          $scope.selectedRoleDefinition = null;
        } else {
          selectedNode = $scope.groups.find((n) => n._id === node.data().id);
          $scope.selectedGroup = selectedNode;
          $scope.selectedTeam = null;
          $scope.selectedUser = null;
          $scope.selectedRole = null;
          $scope.selectedRoleDefinition = null;
        }
      } else if (node.data().nodetype === 'role') {
        selectedNode = $scope.roles.find((n) => n._id === node.data().id);
        $scope.selectedTeam = null;
        $scope.selectedUser = null;
        $scope.selectedGroup = null;
        $scope.selectedRoleDefinition = null;
        $scope.selectedRole = selectedNode;
      }
      if (fromGraph) {

        $scope.selectNode(node);
        $scope.$apply();
      }
    };


    $scope.selectUser = (user) => {
      $scope.selectedUser = user;
      $scope.selectedTeam = null;
      $scope.selectedGroup = null;
      $scope.selectedRole = null;
      $scope.selectedRoleDefinition = null;
      if ($scope.cy) {
        $scope.selectNode($scope.cy.$('[id = "' + user._id + '"]'));
        $scope.cy.$('[id = "' + user._id + '"]').select();
      }
      $scope.selectGraphNode($scope.cy.$('[id = "' + user._id + '"]'), false);
    }


    // Update User Avatar
    $scope.$watch('files', function () {
      $scope.upload($scope.files);
    });
    $scope.$watch('file', function () {
      if ($scope.file != null) {
        $scope.files = [$scope.file];
      }
    });

    $scope.upload = function (files) {
      if (files && files.length) {
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          if (!file.$error) {
            Upload.upload({
              url: 'api/v0/uploads/local',
              data: { file },
            }).then((res) => {
              if (res.status === 200) {
                Notification.success("User Avatar uploaded");
                // Update User Pict in $scope
                $scope.selectedUser.properties.pict = res.data.url;
                // Update User Pict in db
                $scope.patchUserProperty($scope.selectedUser, 'pict');
              } else {
                Notification.error("User Avatar not uploaded!");
                console.error("User Avatar not uploaded!", res);
              }
            });
          }
        }
      }
    };

    $scope.selectGroup = (group) => {
      $scope.selectedGroup = group;
      $scope.selectedUser = null;
      $scope.selectedTeam = null;
      $scope.selectedRole = null;
      $scope.selectedRoleDefinition = null;

      if ($scope.cy) {
        $scope.selectNode($scope.cy.$('[id = "' + group._id + '"]'));
        $scope.cy.$('[id = "' + group._id + '"]').select();
      }
    }

    $scope.selectTeam = (team) => {
      $scope.selectedTeam = team;
      $scope.selectedUser = null;
      $scope.selectedGroup = null;
      $scope.selectedRole = null;
      $scope.selectedRoleDefinition = null;
      $scope.selectNode($scope.cy.$('[id = "' + team._id + '"]'));
      $scope.cy.$('[id = "' + team._id + '"]').select();
    }


    $scope.unselectNode = () => {
      $scope.cy.$("*").removeClass("obfuscated");
      $scope.cy.$("*").removeClass("outbound");
      $scope.cy.$("*").removeClass("inbound");
      $scope.cy.$("*").removeClass("parentsPath");
      $scope.cy.$("*").unselect();
      $scope.selectedTeam = null;
      $scope.selectedUser = null;
      $scope.selectedGroup = null;
      $scope.selectedNode = null;
      $scope.nodePermissions = [];
      $scope.members = [];
      $scope.parentsNodes = [];
      $scope.$apply();
    };

    $scope.deleteUser = async (user) => {
      try {
        const response = await Swal.fire({
          title: 'Delete User',
          text: `Are you sure you want to delete ${user.title} (${user.email})?`,
          type: 'error',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete'
        });

        if (response.value) {
          const result = await data.nodes.delete(user);
          if (!result) return;

          $scope.users = $scope.users.filter(item => item._id !== user._id);
          $scope.cy.$('#' + user._id).remove();
          $scope.cy.layout(layoutOptions).run();
          Notification.success("User Deleted.");
        }

      } catch (error) {
        console.error(error);
      }
    };


    $scope.changeGroupType = () => {
      if ($scope.groupTypeSelection) {
        $scope.groupType = 'Team';
      } else {
        $scope.groupType = 'Group';
      }
      $scope.buildGraph();

      $scope.selectedTeam = null;
      $scope.selectedUser = null;
      $scope.selectedGroup = null;
      $scope.selectedNode = null;
      $scope.nodePermissions = [];
      $scope.members = [];
      $scope.parentsNodes = [];
    }

    $scope.openAddUserPrompt = () => {
      $scope.newUser = {
        pict: "images/userLogo.png",
        firstName: "",
        lastName: "",
        email: ""
      }
      $('#addUserPrompt').modal('show')
    }

    $scope.inviteUser = (user) => {
      Notification.info(`Sending Invitation...`);
      return data.users.invite(user)
        .then((result) => {
          if (result.error) {
            return Notification.error(result.message);
          }
          return Notification.success(`User Invitation Sent`);
        });
    };

    //#endregion scope functions

    const getUsers = async () => {
      try {
        const users = await data.nodes.all('user');
        if (!users) return;

        $scope.users = users;
      } catch (error) {
        console.error(error);
      }
    };

    $scope.openAddRolePrompt = async () => {
      const result = await Swal.fire({
        title: `Add Role`,
        input: 'text',
        inputPlaceholder: 'ex: Team Member, Team Leader ...',
        confirmButtonText: 'Add',
        showCancelButton: true
      })
      if (result.value) {
        const savedRole = await createRole(result.value);
        if (savedRole) {
          $scope.roles.push({
            name: savedRole,
          });
        }
      }
    };

    $scope.openAddGroupPrompt = async () => {
      try {
        const result = await Swal.fire({
          title: `Add Group`,
          input: 'text',
          inputPlaceholder: 'Employees',
          confirmButtonText: 'Add',
          showCancelButton: true
        });
        if (result.value) {
          const params = {
            _type: 'Group',
            properties: { name: result.value }
          };
          const group = await data.nodes.add(params);
          if (!group) return;

          // add group to data and graph
          $scope.groups.push(group);
          $scope.buildGraph();

          Notification.success('Group created.');
        }
      } catch (error) {
        console.error(error);
      }
    };



    $scope.openAddTeamPrompt = async () => {
      const result = await Swal.fire({
        title: `Add Team`,
        input: 'text',
        inputPlaceholder: 'Dream Team',
        confirmButtonText: 'Add',
        showCancelButton: true
      })
      if (result.value && result.value != "") {
        const savedTeam = await data.teams.add(result.value);
        if (!savedTeam.error) {
          // add team to data and graph
          $scope.buildGraph();
        }
      }
    }


    $scope.removeTeam = async () => {

      Swal.fire({
        title: 'Confirm Removal',
        showCancelButton: true,
        confirmButtonText: `Yes`,
      }).then(async (result) => {
        data.teams.delete($scope.selectedTeam._id)
          .then(async (result) => {
            Notification.success('Team Removed');
            $scope.buildGraph();
          }).catch((error) => {
            console.error("$scope.removeTeam -> error", error)
          })
      })
    }

    $scope.removeGroup = async () => {
      try {
        const response = await Swal.fire({
          title: 'Confirm Removal',
          showCancelButton: true,
          confirmButtonText: `Yes`,
        });
        if (response.value) {
          const result = await data.nodes.delete($scope.selectedGroup);
          if (!result) return;

          Notification.success('Group Removed.');
          $scope.buildGraph();
        }
      } catch (error) {
        console.error(error);
      }
    };


    // need to be moved in a service
    const getAllRoles = async () => {

      $scope.usersLoading = true;
      try {
        const result = await $http.get(`/api/v0/config/ux`);
        $scope.usersLoading = false;
        if (result.status === 200) {
          if (result.data.teamRoles) {
            const roles = result.data.teamRoles;
            roles.forEach((role) => {
              $scope.allRoles.push({ name: role.name, accessLevel: role.accessLevel })
            })
          }
          return $scope.allRoles;
        } else {
          return Notification.error('Error reading UX settings');
        }
      } catch (err) {
        console.error(err);
      };
    }

    // need to be moved in a service
    const createRole = async (value) => {
      const newRoleArray = [...$scope.allRoles];
      newRoleArray.push({ name: value });
      const result = await $http.put(`/api/v0/config/ux/teamRoles`, { value: newRoleArray })
      if (result.status === 200) {
        if (value) {
          Notification.success('Setting Updated');
          $scope.allRoles.push({ name: value });
          return true;
        }
      } else {
        Notification.error('Error: Please try again');
        return false;
      }
    }

    $scope.removeRole = async () => {

      Swal.fire({
        title: 'Confirm Removal',
        showCancelButton: true,
        confirmButtonText: `Yes`,
      }).then(async (result) => {
        let newRoleArray = [...$scope.allRoles];
        newRoleArray = newRoleArray.filter(itm => itm.name !== $scope.selectedRoleDefinition.name)
        const update = await $http.put(`/api/v0/config/ux/teamRoles`, { value: newRoleArray })
        if (update.status === 200) {
          Notification.success('Setting Updated');
          $scope.allRoles = newRoleArray;
          $scope.selectedRoleDefinition = null;
          return true;
        } else {
          Notification.error('Error: Please try again');
          return false;
        }
      });
    }

    //  _       _ _   
    // (_)     (_) |  
    //  _ _ __  _| |_ 
    // | | '_ \| | __|
    // | | | | | | |_ 
    // |_|_| |_|_|\__|

    //#region init

    $location.search({ page: 'groupsAndUsers' });

    $scope.usersLoading = false;
    $scope.groupType = 'Group';
    $scope.allRoles = [];
    $scope.groupTypeSelection = false;

    $scope.userAsObject = {};
    $scope.groupAsObject = {};

    $scope.accessLevels = ['none', 'visitor', 'reader', 'writer', 'manager'];
    $scope.users = [];
    $scope.relationships = [];
    $scope.groupsRelationships = [];
    $scope.teamsAndRolesRelationships = [];

    const layoutOptions = {
      name: 'dagre',
      animate: true,
      spacingFactor: 1.3,
      rankSep: 40,
      rankDir: 'BT',
    };

    getUsers();
    getAllRoles();
    $scope.buildGraph();

    //#endregion init
  });