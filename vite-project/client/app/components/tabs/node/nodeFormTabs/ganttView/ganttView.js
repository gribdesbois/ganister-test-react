/* global angular, _, document, google */
angular.module('app.ganister.tabs.node.nodeFormTabs.ganttView', [
  'agGrid',
  'ui-notification',
  'app.ganister.tool.aggrid',
  'app.ganister.models.nodetypes',
  'app.ganister.shared.modals.relationshipModal',
])
  .controller('ganttViewController', ($scope, $rootScope, Notification, nodesModel, helperFunctions) => {
    $scope.timeline;
    $scope.assignments = [];
    $scope.parentUnlocked = !$scope.node._lockState;
    $scope.groupLevel = "nogroup";

    const actorGroups = new vis.DataSet();
    const requestorGroups = new vis.DataSet();
    const stateGroups = new vis.DataSet();
    const categoryGroups = new vis.DataSet();

    $scope.$on('nodeLocked', () => {
      $scope.parentUnlocked = false;
    });

    $scope.$on('nodeUnlocked', () => {
      $scope.parentUnlocked = true;
    });

    $scope.$on('refreshTabContent', () => {
      $scope.refreshGantt();
    })

    $scope.changeGanttGrouping = () => {

      switch ($scope.groupLevel) {
        case 'actor':
          $scope.assignments.forEach((assignment) => {
            assignment.group = assignment.actor;
          });
          $scope.timeline.itemsData.update($scope.assignments);
          $scope.timeline.setGroups(actorGroups);

          break;
        case 'state':
          $scope.assignments.forEach((assignment) => {
            assignment.group = assignment._state;
          });
          $scope.timeline.itemsData.update($scope.assignments);
          $scope.timeline.setGroups(stateGroups);

          break;
        case 'category':
          $scope.assignments.forEach((assignment) => {
            assignment.group = assignment.category;
          });
          $scope.timeline.itemsData.update($scope.assignments);
          $scope.timeline.setGroups(categoryGroups);

          break;
        case 'requestor':
          $scope.assignments.forEach((assignment) => {
            assignment.group = assignment.requestor;
          });
          $scope.timeline.itemsData.update($scope.assignments);
          $scope.timeline.setGroups(requestorGroups);
          break;
        default:
          $scope.timeline.setGroups();
          break;
      }
    };

    $scope.refreshGantt = async () => {
      try {
        const relationships = await nodesModel.getRelationships($scope.node, $scope.rel._definition.name);
        if (!relationships) return;

        const assignments = relationships.map((relationship) => {
          const { _type, _id, target } = relationship;
          const node = {
            ...target,
            _relationshipType: _type,
            _relationshipId: _id,
          };

          const { actor, requestor, category, _state } = target.properties;
          if (actor?.label) {
            actorGroups.update({ id: actor._id, content: actor.label });
          }
          if (requestor?.label) {
            requestorGroups.update({ id: requestor._id, content: requestor.label });
          }
          if (category) {
            categoryGroups.update({ id: category, content: category });
          }
          if (_state) {
            stateGroups.update({ id: _state, content: _state });
          }

          if (typeof (node.properties.startDate) === 'number' && typeof (node.properties.dueDate) === 'number') {
            // Float parse node progress
            if (node.properties.progress) {
              node.properties.progress = parseFloat(node.properties.progress);
            } else {
              node.properties.progress = 0;
            }
            //  Error: Hardcode assignment on nodes because _type is Missing
            let editable = true;
            if (node.properties._lockState && node.properties._lockedBy !== $scope.appContext.user._id) {
              editable = false;
            }
            const editableHTML = !editable ? `<span style="float:right"><i class="fa fa-lock"></i></span>` : '';
            const assignment = {
              id: node._id,
              value: node.properties.progress,
              group: actor?._id || null,
              actor: actor?._id || null,
              requestor: requestor?._id || null,
              title: node.properties.description,
              _state: node.properties._state,
              category: node.properties.category,
              content: node.properties.name + editableHTML,
              start: node.properties.startDate,
              end: node.properties.dueDate,
              editable,
              node
            };
            return assignment;
          };
        });
        $scope.assignments = assignments;
        $scope.$emit("objCountUpdate", $scope.rel.name, $scope.assignments.length);
        $scope.timeline.itemsData.update($scope.assignments);
        $scope.ganttLoading = false;
      } catch (error) {
        console.error(error);
      }
    };

    $scope.ganttLoading = true;
    // retrieve activities
    $scope.loadGantt = async () => {
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
      await delay(500);
      // Create a Timeline
      $scope.options = {
        height: "100%",
        multiselect: true,
        groupOrder: 'content',
        visibleFrameTemplate: function (item) {
          if (item.visibleFrameTemplate) {
            return item.visibleFrameTemplate;
          }
          return `<div class="progress-wrapper">
                    <div class="progress" style="width:${item.value}%"></div>
                    <label class="progress-label">${item.value}%<label>
                  </div>`;
        },
        orientation: {
          item: 'top',
        },
        editable: $scope.lockedByCurrentUser ? {
          add: false,           // add new items by double tapping
          updateTime: true,       // drag items horizontally
          updateGroup: false,   // drag items from one group to another
          remove: true,           // delete an item by tapping the delete button top right
          overrideItems: false,     // allow these options to override item.editable
        } : {
          add: false,
          updateTime: false,
          updateGroup: false,
          remove: false,
          overrideItems: true,
        },
        onMove: async (item) => {
          if (!$scope.lockedByCurrentUser) {
            return;
          }
          item.node.properties.startDate = item.start.getTime();
          item.node.properties.dueDate = item.end.getTime();
          await nodesModel.updateNode(item.node);
          $scope.timeline.itemsData.update(item);
          Notification.success({
            title: 'Success',
            message: 'Node Updated',
          });
          $scope.refreshGantt();
        },
        onRemove: async (item) => {
          try {
            if (!$scope.lockedByCurrentUser) return;
            const response = await Swal.fire({
              title: item.content,
              type: 'question',
              text: 'Do you want to detach or delete this node?',
              input: 'select',
              inputOptions: {
                'detach': 'Detach',
                'delete': 'Delete',
              },
              inputPlaceholder: 'Select an action',
              showCancelButton: true,
            });

            const { node } = item;

            if (response.value) {
              const params = {
                _type: node._relationshipType,
                _id: node._relationshipId,
                source: $scope.node,
              };
              const result = await nodesModel.deleteRelationship(params);
              if (result) {
                $scope.$emit("objCountUpdate", $scope.rel.name, $scope.assignments.length);
                Notification.success({ message: 'Node Detached' });
                $scope.timeline.itemsData.remove(item.node._id);
              }
            }
            if (response.value === 'delete') {
              const result = await nodesModel.deleteNode(node);
              if (!result) return;

              $scope.$emit("objCountUpdate", $scope.rel.name, $scope.assignments.length);
              Notification.success({ message: 'Node Deleted' });
              $scope.timeline.itemsData.remove(node._id);
            }
          } catch (error) {
            console.error(error);
            Notification.error({ title: 'Node Error', message: error.message });
          }
        }
      };
      const container = document.getElementById(`ganttDiv-${$scope.rel.relationships}-${$scope.node._id}`);
      const items = new vis.DataSet();
      $scope.timeline = new vis.Timeline(container, items, $scope.options);
      $scope.timeline.on('changed', () => {
        $scope.timeline.redraw();
      });
      $scope.timeline.on('contextmenu', function (event) {

        if (!event.item || !$scope.lockedByCurrentUser) {
          return;
        }
        const item = $scope.timeline.itemsData._data[event.item];
        const { node } = item;
        let startDate, dueDate;
        if (node.properties.startDate) {
          startDate = moment(node.properties.startDate).format('YYYY-MM-DD');
        }
        if (node.properties.dueDate) {
          dueDate = moment(node.properties.dueDate).format('YYYY-MM-DD');
        }

        Swal.fire({
          title: `<h3>${item.content}</h3>`,
          width: '600px',
          html: `
            <div class="form-group">
              <label for="startDate">Task Title</label>
              <input id="content-${node._id}" type="text" class="form-control" placeholder="Title" value="${item.content}">
            </div>
            <div class="form-group">
              <label for="startDate">Start Date</label>
              <input id="startDate-${node._id}" type="date" class="form-control" placeholder="Start Date" value="${startDate}">
            </div>
            <div class="form-group">
              <label for="dueDate">Due Date</label>
              <input id="dueDate-${node._id}" type="date" class="form-control" placeholder="Due Date" value="${dueDate}">
            </div>
            <div class="form-group">
              <label for="progress">Progress</label>
              <input id="progress-${node._id}" type="number" class="form-control" placeholder="Progress" value="${node.properties.progress}">
            </div>
          </div>`,
          showCloseButton: true,
          showCancelButton: true,
          focusConfirm: false,
          confirmButtonText: 'Update',
          confirmButtonAriaLabel: 'Update Assignment',
          cancelButtonText: 'Cancel',
          cancelButtonAriaLabel: 'Cancel',
          allowOutsideClick: () => !Swal.isLoading(),
          preConfirm: async () => {
            const startDate = new Date($(`#startDate-${node._id}`).val()).getTime();
            const dueDate = new Date($(`#dueDate-${node._id}`).val()).getTime();
            const progress = parseFloat($(`#progress-${node._id}`).val());
            const name = $(`#content-${node._id}`).val();
            const props = { startDate, dueDate, progress, name };
            Object.keys(props).map((key) => {
              node.properties[key] = props[key];
            });
            const result = await nodesModel.updateNode(node);
            if (!result) return;

            item.start = startDate;
            item.end = dueDate;
            item.content = name;
            item.value = progress;

            node.properties.name = name;
            node.properties.startDate = startDate;
            node.properties.dueDate = dueDate;
            node.properties.progress = progress;

            $scope.timeline.itemsData.update(item);
            Notification.success({ title: 'Success', message: 'Node Updated' });
          },
        });

        event.event.preventDefault();
      });
      $scope.timeline.on('doubleClick', function (event) {

        if (!event.item) {
          return;
        }
        $rootScope.$broadcast('openNode', {
          _id: event.item,
          _type: 'assignment'
        })

      });
      await $scope.refreshGantt();
      $scope.timeline.redraw();
    };

    $scope.loadGantt();

    $scope.$watch('lockedByCurrentUser', (newValue, oldValue) => {
      if (!$scope.timeline) {
        return;
      }
      if (newValue) {
        $scope.timeline.setOptions({
          ...$scope.options,
          editable: {
            add: false,
            updateTime: true,
            updateGroup: false,
            remove: true,
            overrideItems: true,
          }
        });
      } else {
        $scope.timeline.setOptions({
          ...$scope.options,
          editable: {
            add: false,
            updateTime: false,
            updateGroup: false,
            remove: false,
            overrideItems: true,
          }
        });
      }
    });

    $scope.createAsRelationship = async (relationship) => {
      try {
        const targetNodetype = $rootScope.datamodel.nodetypes.find((nodetype) => {
          const { directions = [] } = $scope.rel._definition;
          return directions.find((d) => {
            return d.source === $scope.nodetype.id && d.target === nodetype.id;
          })
        });

        const nodeParams = {
          _type: targetNodetype.name,
          properties: {},
        };

        await helperFunctions.runTriggeredMethods('beforeCreate', nodeParams, $scope);

        // ask rel mandatory info
        const params = {
          _type: relationship._definition.name,
          properties: {},
          source: $scope.node,
        };
        const relMandatoryFields = await helperFunctions.askMandatoryFields(relationship._definition, params.properties);
        if (!relMandatoryFields) {
          return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
        }
  
        params.properties = { ...params.properties, ...relMandatoryFields };

        // ask node mandatory info
        const mandatoryFields = await helperFunctions.askMandatoryFields(targetNodetype, {});
        if (!mandatoryFields) {
          return Notification.warning('<i class="fa fa-ban" aria-hidden="true"></i> Creation process cancelled');
        }

        nodeParams.properties = { ...nodeParams.properties, ...mandatoryFields };
        const lock = !!$scope.rel.openOnCreation;

        const node = await nodesModel.addNode(nodeParams, lock);
        if (!node) return;

        await helperFunctions.runTriggeredMethods('afterCreate', node, $scope);

        params.target = node;

        const result = await nodesModel.addRelationship(params);
        if (!result) return;

        $scope.handleAttachedNode(result, true);
      } catch (error) {
        console.error(error);
      }
    };

    $scope.addAsRelationship = () => {
      const { _id, _version } = $scope.node.properties;
      $rootScope.$broadcast('openRelModal', $scope.rel.id, _id, _version);
    };

    $scope.handleAttachedNode = (relationship) => {
      const { _type, _id, target } = relationship;
      target._relationshipType = _type;
      target._relationshipId = _id;

      const { name, startDate, dueDate, progress } = target.properties;
      if (startDate) {
        if (!progress) target.properties.progress = 0;
        const item = {
          id: target._id,
          start: startDate,
          end: dueDate,
          value: target.properties.progress,
          content: name,
          node: target,
        };
        $scope.timeline.itemsData.update(item);
      }
    };
  });