angular.module('app.ganister.config.models.nodetypes.lifecycle', [
  'ui.codemirror',
  'ui-notification'
]).controller('lifecycleController', function ($scope, datamodelModel, Notification) {

  $scope.nodetype = $scope.datamodel.openItem
  /******************************************************************************** */
  /*                          Handling lifecycle                                    */
  /******************************************************************************** */

  // set lifecycle object if not defined in the datamodel (in the future should never happen)
  if (!($scope.nodetype.lifecycle)) {
    $scope.nodetype.lifecycle = {
      "roles": [],
      "states": [],
      "transitions": []
    }
  } else if (!($scope.nodetype.lifecycle.roles)) {
    $scope.nodetype.lifecycle.roles = []
  }



  // lifecycle Roles grid

  $scope.rolesGridOptions = {
    defaultColDef: {
      resizable: true
    },
    columnDefs: [
      {
        headerName: "name",
        field: "name",
        editable: true
      }, {
        headerName: "label",
        field: "label",
        editable: true
      }
    ],
    rowSelection: "multiple",
    onGridReady: function (params) {
      $scope.nodetype = $scope.datamodel.openItem
      datamodelModel.grid.loadData($scope.rolesGridOptions.api, $scope.nodetype.lifecycle.roles)
    },
    onCellValueChanged: function (params) {
      var roleId = params.data.id
      if (params.oldValue != params.newValue) {
        datamodelModel.nodetypes.lifecycle.roles.update(
          $scope.nodetype.name,
          roleId,
          params.colDef.field,
          params.oldValue,
          params.newValue
        ).then(function (result) {
          Notification({
            title: 'Role Change',
            message: `role property as been updated`,
          })
          refreshRoles()
        })
      }
    }
  }

  $scope.methods = $scope.datamodel.methods.map((m) => m.name);

  $scope.preMethodsGridOptions = {
    defaultColDef: {
      resizable: true
    },
    columnDefs: [
      {
        headerName: "Pre-Methods",
        field: "preMethods",
        children: [
          {
            headerName: 'Method name',
            field: 'server_pre',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
              values: $scope.methods
            },
          },
          {
            headerName: 'Params',
            field: 'params_pre',
            editable: true,
          }
        ]
      }
    ],
    rowSelection: "multiple",
    rowDeselection: true,
    onCellValueChanged: function (params) {
      if (params.oldValue != params.newValue) {
        const index = params.rowIndex;
        const methodName = params.data.server_pre;
        try {
          
        const methodParams = params.data.params_pre ? JSON.parse(params.data.params_pre) : undefined;
        const value = {
          name: methodName,
          params: methodParams,
        };
        $scope.updateLifecycleTransitionMethods(index, value, 'server_pre');
        } catch (error) {
          Notification.error({ message: 'Not saved, Wrong parameter format, should be JSON compliant', replaceMessage: true });
        }
      }
    },
  }

  $scope.postMethodsGridOptions = {
    defaultColDef: {
      resizable: true
    },
    columnDefs: [
      {
        headerName: "Post-Methods",
        field: "postMethods",
        children: [
          {
            headerName: 'Method name',
            field: 'server_post',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
              values: $scope.methods
            },
          },
          {
            headerName: 'Params',
            field: 'params_post',
            editable: true,
          }
        ]
      }
    ],
    rowSelection: "multiple",
    rowDeselection: true,
    onCellValueChanged: function (params) {
      if (params.oldValue != params.newValue) {
        const index = params.rowIndex;
        const methodName = params.data.server_post;
        const methodParams = params.data.params_post ? JSON.parse(params.data.params_post) : undefined;
        const value = {
          name: methodName,
          params: methodParams,
        };
        $scope.updateLifecycleTransitionMethods(index, value, 'server_post');
      }
    }
  }

  $scope.addRole = function () {
    var newRole = {
      "name": "role " + $scope.nodetype.lifecycle.roles.length,
      "label": "role " + $scope.nodetype.lifecycle.roles.length
    }

    datamodelModel.nodetypes.lifecycle.roles.add(
      $scope.nodetype.name,
      newRole
    ).catch(function (e) {
      console.log(e)
      // alert message and restore values
    }).then(function (result) {
      Notification.success({ message: '👍 Role Added', replaceMessage: true });
      $scope.nodetype.lifecycle.roles.push(result.role)
      datamodelModel.grid.loadData($scope.rolesGridOptions.api, $scope.nodetype.lifecycle.roles)
      refreshRoles()
    })
  }

  $scope.deleteRole = function () {
    var selectedRows = $scope.rolesGridOptions.api.getSelectedRows()
    if (selectedRows.length > 0) {
      // remove selected items from $scope properties
      for (role of selectedRows) {
        datamodelModel.nodetypes.lifecycle.roles.remove(
          $scope.nodetype.name,
          role.id
        ).catch(function (e) {
          console.log(e)
          // alert message and restore values
        }).then(function (result) {
          $scope.nodetype.lifecycle.roles = _.reject($scope.nodetype.lifecycle.roles, { "id": result.id })
          datamodelModel.grid.loadData($scope.rolesGridOptions.api, $scope.nodetype.lifecycle.roles)
          refreshRoles()
          Notification({ title: 'Role Change', message: `${role.name} deleted` })
        })
      }
    } else {
      // notify user to select a row first
    }
  }



  function loadLifecycle() {
    var graphNodes = [];
    var graphEdges = [];
    var startingState = "";
    // build graph dataset

    $scope.nodetype.lifecycle.transitions.forEach((transition) => {
      if (_.find($scope.nodetype.lifecycle.states, { id: transition.to }) && _.find($scope.nodetype.lifecycle.states, { id: transition.from })) {
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


    graphEdges = $scope.nodetype.lifecycle.transitions.map(function (transition) {
      var edge = {
        data: {
          id: transition.id,
          source: transition.from,
          target: transition.to
        },
        selectable: true
      }
      return edge
    })

    graphNodes = $scope.nodetype.lifecycle.states.map(function (state) {
      var node = {}
      node = {
        data: {
          id: state.id,
          name: state.name,
          label: state.label,
          assignee: state.owner
        },
        selectable: true,
        classes: 'standard'
      }
      return node
    })

    var lcLayout = {
      fit: true,
      name: 'breadthfirst',
      padding: 30,
      directed: true,
      spacingFactor: 0.7,
    }

    if ($scope.nodetype.lifecycle.states.length > 0) {
      if (_.find($scope.nodetype.lifecycle.states, { "start": true }) != undefined) {
        startingState = _.find($scope.nodetype.lifecycle.states, { "start": true }).id
        lcLayout.roots = '#' + startingState
      }
    }
    // load graph
    var promotionGraphData = {
      nodes: graphNodes,
      edges: graphEdges
    }


    /* load business flow graph */
    $scope.cy = cytoscape({
      container: document.getElementById('businessFlowGraph'), // container to render in
      selectionType: 'single',
      style: [ // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            'shape': 'ellipse',
            'label': 'data(label)',
            'z-index': 2,
            'background-color': '#539aC7',
            'border-width': 2,
            'background-opacity': 1,
            'width': 30,
            'height': 30,
            'text-valign': "bottom",
            'text-wrap': "wrap",
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
            'width': 3,
            'line-color': '#222',
            'target-arrow-color': '#000',
            'target-arrow-shape': 'triangle',
            'source-arrow-color': '#000',
            'z-index': 1,
            'curve-style': 'bezier',
            'text-rotation': 'autorotate',
            'text-margin-y': '-15px',
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
      elements: promotionGraphData,
      layout: {
        name: 'null'
      },
      wheelSensitivity: 0.2,
      maxZoom: 3,
      minZoom: .8,
    });

    $scope.cy.nodes().positions((node, i) => {
      const state = $scope.nodetype.lifecycle.states.find((state) => state.id === node.data().id);
      if (!('positionX' in state)) state.positionX = i * 100;
      if (!('positionY' in state)) state.positionY = 150;
      return {
        x: state.positionX,
        y: state.positionY,
      }
    })

    // trick to fit the graph
    $scope.fitLifecycleGraph = () => {
      setTimeout(() => {
        $scope.cy.fit(null, 50);
      }, 100);
    };

    var nodecxtmenuApi = $scope.cy.cxtmenu({// the radius of the circular menu in pixels
      selector: 'node.standard', // elements matching this Cytoscape.js selector will trigger cxtmenus
      commands: [ // an array of commands to list in the menu or a function that returns the array

        { // example command
          fillColor: 'rgba(217, 83, 79, 0.75)', // optional: custom background color for item
          content: 'Delete state', // html/text content to be displayed in the menu
          select: function (ele) { // a function to execute when the command is selected
            $scope.deleteState(ele)
          }
        },
        { // example command
          fillColor: 'rgba(92, 184, 92, 0.75)', // optional: custom background color for item
          content: 'Start transition', // html/text content to be displayed in the menu
          select: function (ele) { // a function to execute when the command is selected
            // `ele` holds the reference to the active element
            $scope.cy.$("node").removeClass("standard")
            $scope.cy.$("node").addClass("potential")
            $scope.tempStartId = ele.id()
          }
        }

      ]
    });

    var nodecxtmenuPotentialApi = $scope.cy.cxtmenu({// the radius of the circular menu in pixels
      selector: 'node.potential', // elements matching this Cytoscape.js selector will trigger cxtmenus
      commands: [ // an array of commands to list in the menu or a function that returns the array

        { // example command
          fillColor: 'rgba(92, 184, 92, 0.75)', // optional: custom background color for item
          content: 'Finish transition', // html/text content to be displayed in the menu
          select: function (ele) { // a function to execute when the command is selected
            // `ele` holds the reference to the active element
            $scope.cy.$("node").removeClass("potential")
            $scope.cy.$("node").addClass("standard")
            $scope.addTransition($scope.tempStartId, ele.id())
            $scope.tempStartId = null
          }
        },
        { // example command
          fillColor: 'rgba(91,192, 222, 0.75)', // optional: custom background color for item
          content: 'Cancel transition', // html/text content to be displayed in the menu
          select: function (ele) { // a function to execute when the command is selected
            // `ele` holds the reference to the active element
            $scope.cy.$("node").removeClass("potential")
            $scope.cy.$("node").addClass("standard")
            $scope.tempStartId = null
          }
        }

      ]
    });

    var edgecxtmenuApi = $scope.cy.cxtmenu({
      // the radius of the circular menu in pixels
      selector: 'edge', // elements matching this Cytoscape.js selector will trigger cxtmenus
      commands: [ // an array of commands to list in the menu or a function that returns the array

        { // example command
          fillColor: 'rgba(217, 83, 79, 0.75)', // optional: custom background color for item
          content: 'Delete transition', // html/text content to be displayed in the menu
          select: function (ele) { // a function to execute when the command is selected
            $scope.deleteTransition(ele)
          }
        }

      ]
    });

    var bckcxtmenuApi = $scope.cy.cxtmenu({
      selector: 'core', // elements matching this Cytoscape.js selector will trigger cxtmenus
      commands: [ // an array of commands to list in the menu or a function that returns the array

        { // example command
          fillColor: 'rgba(200, 250, 200, 0.75)', // optional: custom background color for item
          content: 'Add new State', // html/text content to be displayed in the menu
          select: function (ele, pos) { // a function to execute when the command is selected
            // `ele` holds the reference to the active element
            $scope.addState(
              ele,
              {
                "x": pos.position.x,
                "y": pos.position.y
              }
            )

          }
        }

      ]
    });

    // update UI when tapping on a node
    $scope.cy.on('tap', function (evt) {
      if (evt.target == $scope.cy) {
        $scope.cy.$("*").addClass("obfuscated")
        $scope.selectedEltType = ""
        $scope.$apply()
      }
    })

    // update UI when tapping on a node
    $scope.cy.on('tap', 'node', function (evt) {
      var node = evt.target;
      $scope.cy.$("*").addClass("obfuscated")
      node.removeClass("obfuscated")
      node.neighborhood().removeClass("obfuscated")
      //$scope.selectLifecycleState(node.id())
      $scope.selectedEltType = "node"
      $scope.state = _.find($scope.nodetype.lifecycle.states, { "id": node.id() })
      $scope.$apply()
    })

    // update UI when tapping on an edge

    $scope.cy.on('tap', 'edge', function (evt) {
      var edge = evt.target;
      $scope.cy.$("*").addClass("obfuscated");
      edge.removeClass("obfuscated");
      edge.neighborhood().removeClass("obfuscated");
      $scope.selectLifecycleTransition(edge.id());
      $scope.selectedEltType = "edge";
      $scope.selectedEltId = edge.id();
      $scope.$apply();
    })

    const lifecycleGridSize = 20;



    // update UI when tapping on a node
    $scope.cy.on('free', async (evt) => {
      const node = evt.target;
      const target = node._private;
      $scope.state = _.find($scope.nodetype.lifecycle.states, { "id": node.id() });
      if ($scope.state.positionX !== target.position.x || $scope.state.positionY !== target.position.y) {
        $scope.cy.$("*").unselect();
        $scope.cy.$("*").addClass("obfuscated");
        node.removeClass("obfuscated");
        node.neighborhood().removeClass("obfuscated");
        node.select();
        $scope.selectedEltType = "node";
        target.position.x = Math.round(target.position.x / lifecycleGridSize) * lifecycleGridSize;
        target.position.y = Math.round(target.position.y / lifecycleGridSize) * lifecycleGridSize;
        $scope.state.positionX = target.position.x;
        $scope.state.positionY = target.position.y;
        $scope.$apply();
        const positionY = await $scope.updateState('positionY');
        const positionX = await $scope.updateState('positionX');
      }
    })
  }

  // redraw when visible
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    if (e.target.attributes.getNamedItem("tabContent")) {
      if (e.target.attributes.getNamedItem("tabContent").value == "cytoscape") {
        $scope.cy.resize()
        // var layout = $scope.cy.layout({
        //     fit: true,
        //     name: 'dagre',
        //     rankDir: "LR",
        //     avoidOverlap: true,
        //     padding: 30,
        //     animationDuration: 2000,
        //     directed: true,
        //     spacingFactor: 1
        // })
        // layout.run()
      }
    }
  })

  loadLifecycle();

  $scope.addState = function (cy, pos) {
    var newState = {
      "name": "state " + $scope.nodetype.lifecycle.states.length,
      "label": "state " + $scope.nodetype.lifecycle.states.length,
      "color": "",
      "start": false,
      "lockable": true
    }
    datamodelModel.nodetypes.lifecycle.states.add(
      $scope.nodetype.name,
      newState
    ).catch(function (e) {
      console.log(e)
      // alert message and restore values
    }).then(function (result) {
      Notification.success({ message: '👍 State Added', replaceMessage: true });
      $scope.nodetype.lifecycle.states.push(result.state)
      cy.add({
        data: {
          id: result.state.id,
          label: result.state.label,
          assignee: result.state.owner
        },
        position: { x: pos.x, y: pos.y },
        selectable: true,
        classes: 'standard'
      })
      return result.state
    })
  }

  $scope.deleteState = function (el) {
    // test if is targeted => if yes = cancel (should also be checked server side)
    // test if has source links => if yes = delete transitions (should also be done server side)
    Swal.fire({
      title: `Are you sure you want to remove ${el.data().name} state?`,
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it',
    }).then((result) => {
      if (result.value) {
        datamodelModel.nodetypes.lifecycle.states.remove(
          $scope.nodetype.name,
          el.id()
        ).catch(function (e) {
          console.log(e)
          // alert message and restore values
        }).then(function (result) {
          Notification.success({ message: '👍 State Deleted', replaceMessage: true });
          $scope.nodetype.lifecycle.states = _.reject($scope.nodetype.lifecycle.states, { "id": result.id })
          el.remove()
        })
      }
    });
  }


  $scope.addTransition = (startId, endId) => {
    if (startId === endId) {
      Notification.error({
        title: 'lifecycle transition',
        message: `you can't make a self transition on a state`,
        delay: 2000
      })
    } else {
      var newTransition = {
        "from": startId,
        "to": endId,
        "premethods": [],
        "postmethods": []
      }
      datamodelModel.nodetypes.lifecycle.transitions.add(
        $scope.nodetype.name,
        newTransition
      ).catch(function (e) {
        console.log(e);
        Notification.error({ title: 'Transition not created', message: e.message });
        // alert message and restore values
      }).then(function (result) {
        Notification.success({ message: '👍 Transition Created', replaceMessage: true });
        $scope.nodetype.lifecycle.transitions.push(result.transition)
        $scope.cy.add({
          data: {
            id: result.transition.id,
            source: startId,
            target: endId
          },
          selectable: true,
          classes: ''
        })
      })
    }

  }

  $scope.deleteTransition = (el) => {
    datamodelModel.nodetypes.lifecycle.transitions.remove(
      $scope.nodetype.name,
      el.id()
    ).catch(function (e) {
      console.log(e)
      // alert message and restore values
    }).then(function (result) {
      Notification.success({ message: '👍 Transition Deleted', replaceMessage: true });
      $scope.nodetype.lifecycle.transitions = _.reject($scope.nodetype.lifecycle.transitions, { "id": result.id })
      el.remove()
    })
  };

  $scope.selectLifecycleTransition = (transitionId) => {
    $scope.selectedTransition = _.find($scope.nodetype.lifecycle.transitions, { "id": transitionId });
  };

  const updateTransition = (transition, nodetypeName, transitionId, attribute, oldValue, newValue) => {
    datamodelModel.nodetypes.lifecycle.transitions.update(
      nodetypeName,
      transitionId,
      attribute,
      oldValue,
      newValue,
    ).catch((e) => {
      console.log(e);
      // alert message and restore values
    }).then((result) => {
      Notification.success({ message: '👍 Transition Updated', replaceMessage: true });
      transition[attribute] = newValue;
      console.log(result);
      $scope.selectedTransition = result.transition;
    })
  };

  $scope.addLifecycleTransitionMethod = async (transition) => {
    const methodsOptions = {
      processECOActions: 'processECOActions',
      cancelECO: 'cancelECO',
      cancelVersionnedItems: 'cancelVersionnedItems',
    };
    $scope.datamodel.methods.forEach((method) => {
      methodsOptions[method.name] = method.name;
    });

    const transitionTimeOptions = new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          'server_pre': 'Before Transition',
          'server_post': 'After transition',
        })
      }, 100)
    });
    const questions = [
      {
        title: 'Select a method',
        input: 'select',
        inputOptions: methodsOptions,
        inputPlaceholder: 'Select a method',
        showCancelButton: true,
      },
      {
        title: 'When the method should be executed?',
        input: 'radio',
        inputOptions: transitionTimeOptions,
        showCancelButton: true,
      }
    ];

    const { value } = await Swal.mixin({
      type: 'info',
      confirmButtonText: 'Next &rarr;',
      showCancelButton: true,
      progressSteps: questions.map((v, i) => i + 1),
      inputValidator: (value) => {
        if (value === false || !value) {
          return 'This field is required';
        }
      }
    }).queue(questions);

    if (value) {
      const methodName = value[0];
      const transitionTime = value[1];

      if (methodName) {
        let newValue, oldValue;
        if (transition.hasOwnProperty(transitionTime)) {
          oldValue = transition[transitionTime].slice();
          newValue = transition[transitionTime].slice();
          newValue.push({ name: methodName });
        } else {
          oldValue = [];
          newValue = [{ name: methodName }];
        }
        updateTransition(transition, $scope.nodetype.name, transition.id, transitionTime, oldValue, newValue);
      }
    }
  };

  $scope.updateLifecycleTransitionMethods = (index, value, transitionTime) => {
    const serverPreMethods = $scope.selectedTransition[transitionTime];
    const newValue = [...serverPreMethods];
    newValue.splice(index, 1, value);

    updateTransition(
      $scope.selectedTransition,
      $scope.nodetype.name,
      $scope.selectedEltId,
      transitionTime,
      serverPreMethods,
      newValue
    );
  };

  $scope.removeLifecycleTransitionMethod = (transition) => {
    const preMethods = $scope.preMethodsGridOptions.api.getSelectedNodes();
    const postMethods = $scope.postMethodsGridOptions.api.getSelectedNodes();
    const methodsToDelete = preMethods.concat(postMethods);

    methodsToDelete.forEach((method) => {
      const transitionTime = Object.keys(method.data)[0];

      if (transition.hasOwnProperty(transitionTime)) {
        const index = method.rowIndex;
        const oldValue = [...transition[transitionTime]];
        const newValue = [...oldValue];
        newValue.splice(index, 1);
        updateTransition(transition, $scope.nodetype.name, transition.id, transitionTime, oldValue, newValue);
      }
    });
  };

  $scope.$watch('datamodel.openItem.name', function () {
    $scope.nodetype = $scope.datamodel.openItem
    // update lifecycles
    if (!($scope.nodetype.lifecycle)) {
      $scope.nodetype.lifecycle = {
        "roles": [],
        "states": [],
        "transitions": []
      }
    }
    // load outgoing rels
    $scope.outRels = $scope.datamodel.nodetypes.filter((nt) => {
      const { elementType, hidden, directions = [] } = nt;
      if (hidden || elementType === 'node') return;

      const direction = directions.find((d) => d.source === $scope.nodetype.id)
      return direction;
    })

    // Load datamodel data
    datamodelModel.grid.loadData($scope.rolesGridOptions.api, $scope.nodetype.lifecycle.roles)

    // Load lifecycle
    loadLifecycle()
  });

  $scope.$watch('selectedTransition', function () {
    if ($scope.selectedTransition) {
      const preMethodsRows = [];
      const postMethodsRows = [];
      if ($scope.selectedTransition.server_pre) {
        $scope.selectedTransition.server_pre.forEach((method) => {
          if (typeof method === 'object') {
            const row = {
              server_pre: method.name,
              params_pre: JSON.stringify(method.params),
            };
            preMethodsRows.push(row);
          }
        });
      }
      if ($scope.selectedTransition.server_post) {
        $scope.selectedTransition.server_post.forEach((method) => {
          if (typeof method === 'object') {
            const row = {
              server_post: method.name,
              params_post: JSON.stringify(method.params),
            };
            postMethodsRows.push(row);
          }
        });
      }
      datamodelModel.grid.loadData($scope.preMethodsGridOptions.api, preMethodsRows);
      datamodelModel.grid.loadData($scope.postMethodsGridOptions.api, postMethodsRows);
    }
  });


  $scope.updateState = (propName) => {
    if ($scope.state[propName] == null) $scope.state[propName] = "none";
    return datamodelModel.nodetypes.lifecycle.states.update(
      $scope.nodetype.name,
      $scope.state.id,
      propName,
      "",
      $scope.state[propName]
    ).catch(function (e) {
      console.log(e)
      // alert message and restore values
    }).then(function (result) {
      Notification.success({ message: '👍 State Updated', replaceMessage: true });
      if (propName === "label") {
        $scope.cy.$('#' + $scope.state.id).data('label', $scope.state.label)
      }
    })
  }

  function refreshRoles() {
    console.info("should rearrange existing data with updated role")
  }

  $scope.updatePosition = async () => {
    $scope.cy.$('#' + $scope.state.id).position({
      x: Math.round(parseFloat($scope.state.positionX)),
      y: Math.round(parseFloat($scope.state.positionY)),
    });
    const positionY = await $scope.updateState('positionY');
    const positionX = await $scope.updateState('positionX');
  }
})