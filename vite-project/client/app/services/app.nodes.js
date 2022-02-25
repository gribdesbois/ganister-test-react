/* global angular */
angular.module('app.ganister.models.nodes', [
  'app.ganister.models.nodetypes',
])
  .service('nodesModel', function ($http, $sce, $rootScope, datamodelModel, Notification, $translate) {
    const APIVER = 'v0';
    let data = this,
      URLS = {
        nodes: `/api/${APIVER}/nodes/`,
        users: `/api/${APIVER}/users/`,
        groups: `/api/${APIVER}/nodes/groups/`,
        uploads: `/api/${APIVER}/uploads/`,
        reports: `/api/${APIVER}/nodes/report/`,
      },
      gFileSyncUrl = 'http://localhost:8765/';

    const extract = (result) => {
      const error = displayErrors(result);
      if (error) return;

      const { data } = result.data;

      return data || result.data;
    };

    const displayErrors = (result) => {
      const { status } = result;
      const { data, error, errors = [] } = result.data;

      if (!error && status === 404) {
        Notification.error({ title: 'Error 404', message: 'Resource not found' });
        return true;
      }
      if (error) {
        const err = result.data || result;
        const propertyRefs = /(###)(\w+\.\w+\.\w+)(###)/mg;
        err.message = err.message.replaceAll(propertyRefs, (match, p1, p2) => {
          return $translate.instant(p2);
        });
        Notification.error(err);
        console.error('API ERROR', err);
        return true;
      }

      if (data) {
        errors.forEach((err) => {
          Notification.warning({ title: 'Custom Method Warning', message: err.message });
          console.warn('API WARNING', err);
        });
      }
    };

    function unescape(nodetypeName, node) {
      const nodetypeDM = datamodelModel.getNodetype(nodetypeName);
      const textProperties = nodetypeDM.properties.filter((p) => p.type === 'text' || p.type === 'string' || p.type === 'richText');
      textProperties.map((p) => {
        if (node[p.name]) {
          node[p.name] = _.unescape(node[p.name]);
        }
        if (node.properties && node.properties[p.name]) {
          node.properties[p.name] = _.unescape(node.properties[p.name]);
        }
      });
      return node;
    }

    data.getNodetypeCreationRight = (nodetype) => {
      return $http.get(`${URLS.nodes + nodetype}/checkNodeCreationRight`).then(extract);
    }
      ;
    data.getNodes = async (nodetype, search) => {
      let result;
      if (search) {
        const { maxResults } = search;
        const query = maxResults ? `?maxResults=${maxResults}` : '';
        result = await $http.post(`${URLS.nodes + nodetype}/search${query}`, search);
      } else {
        result = await $http.get(`${URLS.nodes + nodetype}`);
      }
      return extract(result);
    };

    data.searchNodes = async (params) => {
      const result = await $http.post(`${URLS.nodes}search`, params);
      return extract(result)
    };

    data.getTeamMembers = async (teamId) => {
      const result = await $http.get(URLS.groups + teamId + '/teamDetails')
      return extract(result);
    };

    data.getGroups = () => {
      return $http.get(URLS.groups).then(extract);
    };

    data.getNode = async (nodetype, nodeId) => {
      const result = await $http.get(`${URLS.nodes + nodetype}/${nodeId}`);
      return extract(result);
    };

    data.getNodeHistory = (nodetype, nodeId) => {
      return $http.get(`${URLS.nodes + nodetype}/${nodeId}/history`).then(result => {
        return result.data;
      });
    };

    data.getNodeParents = (nodetype, nodeId, nodeVersion) => {
      return $http.get(`${URLS.nodes + nodetype}/${nodeId}/versions/${nodeVersion}/parents`).then(extract);
    };

    data.addNode = async (node, lock) => {
      const { _type, properties } = node;

      const nodetype = $rootScope.datamodel.nodetypes.find((n) => n.name === _type);
      lock = !!lock && !nodetype.formDisabled;

      const result = await $http.post(`${URLS.nodes + _type}`, { properties, lock });
      return extract(result);
    };

    /**
     * Update Node's properties 
     * @param {object{}} node - Node object
     * @param {string} node._type - Nodetype name
     * @param {string} node._id - Node ID
     * @param {object{}} node.properties - Node properties
     * @param {boolean} lock - 'true' to lock, 'false' to unlock node
     * @returns Returns updated Node
     */
    data.updateNode = async (node, lock) => {
      const { _type, _id, properties } = node;
      const result = await $http.patch(`${URLS.nodes + _type}/${_id}`, { properties, lock });
      return extract(result);
    };

    /**
     * updateNodeValue - updates the node value from the property and the value sent
     * @param {string} node - node json representation
     * @param {string} prop - property name
     * @param {string} value - value of the update
     */
    data.updateNodeValue = (node, prop, value) => {
      return $http.patch(`${URLS.nodes + node._type}/${node._id}`, {
        prop,
        value,
      })
        .then(
          result => result.data
          , (err) => {
            console.error(err);
            return false;
          });
    };

    data.deleteNode = async (node) => {
      const { _type, _id } = node;
      const result = await $http.delete(`${URLS.nodes + _type}/${_id}`);
      return extract(result);
    };

    data.promoteNode = async (node, targetState, comment) => {
      const body = { comment, state: targetState };
      const result = await $http.post(`${URLS.nodes}${node._type}/${node._id}/promotions`, body);
      return extract(result);
    };

    data.serializeNode = async (nodetype, nodeId, instanciationId, remove) => {
      const result = await $http.post(`${URLS.nodes + nodetype}/${nodeId}/serializeNode`, { instanciationId, remove })
      return extract(result);
    }

    data.addFile = (nodetype, file) => {
      return $http.post(`${URLS.nodes + nodetype}`, { file }).then((result) => {
        const { methods } = result.data;
        if (methods) {
          methods
            .filter((m) => m.failed)
            .map((m) => {
              Notification.warning({ title: `${m.methodName} method failed` });
            });
        }
        return result.data;
      });
    };

    data.attachNode = async (sourceNode, targetNode, relationship) => {
      const result = await $http.post(`${URLS.nodes + sourceNode._type}/${sourceNode._id}/relationship/${relationship.name}/${targetNode._type}/${targetNode._id}`);
      return extract(result);
    };

    data.getRelationships = async (source, relationshipName = '', options = {}) => {
      const queryOptions = Object.keys(options)
        .map((key) => `${key}=${options[key]}`)
        .join('&');
      const query = queryOptions ? `?${queryOptions}` : '';

      const result = await $http.get(`${URLS.nodes + source._type}/${source._id}/relationships/${relationshipName}${query}`);
      return extract(result);
    };

    data.searchRelationships = async (source, body, options = {}) => {
      const queryOptions = Object.keys(options)
        .map((key) => `${key}=${options[key]}`)
        .join('&');
      const query = queryOptions ? `?${queryOptions}` : '';

      const result = await $http.post(`${URLS.nodes + source._type}/${source._id}/relationships${query}`, body);
      return extract(result);
    };

    data.addRelationship = async (relationship) => {
      const { _type, properties, source, target } = relationship;
      const body = {
        target: {
          _type: target._type,
          _id: target._id
        },
        properties,
      };
      const result = await $http.post(`${URLS.nodes}${source._type}/${source._id}/relationships/${_type}`, body);
      return extract(result);
    };

    data.updateRelationship = async (relationship) => {
      const { _type, _id, properties, source, target } = relationship;
      const body = {
        target: {
          _type: target._type,
          _id: target._id
        },
        properties,
      };
      const result = await $http.patch(`${URLS.nodes}${source._type}/${source._id}/relationships/${_type}/${_id}`, body);
      return extract(result);
    };

    data.deleteRelationship = async (relationship) => {
      const { _type, _id, source } = relationship;
      const result = await $http.delete(`${URLS.nodes}${source._type}/${source._id}/relationships/${_type}/${_id}`);
      return extract(result);
    };

    data.deleteRelationshipById = async (source, relationshipName, relationshipId) => {
      const result = await $http.delete(`${URLS.nodes + source._type}/${source._id}/relationships/${relationshipName}/${relationshipId}`);
      return extract(result);
    };

    data.getReverseEcos = (sourceNode) => {
      const httpRequest = `${URLS.nodes}${sourceNode._type}/${sourceNode._id}/getReverseEcos`;
      return $http.get(httpRequest).then(extract);
    };

    data.subscribeToNode = (node) => {
      return $http.put(`${URLS.nodes + node._type}/${node._id}/subscription/true`)
        .then((result) => {
          return true;
        }, (err) => {
          console.error(err);
          return false;
        });
    };

    data.unsubscribeToNode = (node) => {
      return $http.put(`${URLS.nodes + node._type}/${node._id}/subscription/false`)
        .then(
          result => true
          , (err) => {
            console.error(err);
            return false;
          });
    };

    data.updateRelNodeValue = (node, prop, value) => {
      const properties = {};
      properties[prop] = value;

      return $http.patch(`${URLS.nodes + node._parentType}/${node._parentId}/relationships/${node._reltype}/${node._relid}`, { properties })
        .then(
          result => result.data
          , (err) => {
            console.error(err);
            return false;
          });
    };

    data.runNodeAction = async (node, action, clientMethodData) => {
      const result = await $http.post(`${URLS.nodes}${node._type}/${node._id}/actions/${action.id}`, { clientMethodData });
      return extract(result);
    };

    data.runNodetypeAction = async (nodetypeName, action, clientMethodData) => {
      const result = await $http.post(`${URLS.nodes}${nodetypeName}/actions/${action.id}`, { clientMethodData });
      return extract(result);
    };

    // only used for ECOImpactMatrix tab
    data.normalizeNode = (node) => {
      let nodeBack = node.properties;
      nodeBack._typeObject = datamodelModel.getNodetype(node._type);
      nodeBack._type = node._type;
      nodeBack._id = node._id;
      nodeBack._labelRef = node._labelRef;
      nodeBack._state = node._state;
      nodeBack.mroTracking = node.mroTracking;
      nodeBack.user = {};
      nodeBack._lockable = node._lockable;
      if (node._lockState) {
        nodeBack._lockedBy = node._lockedBy;
        nodeBack._lockedByName = node._lockedByName;
        nodeBack._lockedOn = node._lockedOn;
        nodeBack._lockState = node._lockState;
      } else {
        nodeBack._lockState = false;
      }
      nodeBack._version = node._version;
      nodeBack.latestVersion = node.latestVersion;
      nodeBack.user.isSubscriber = node.subscribing;
      nodeBack.lifecycleRoles = node.lifecycleRoles;
      nodeBack.accessRoles = node.accessRoles;
      nodeBack = unescape(nodeBack._type, nodeBack);
      return nodeBack;
    };

    data.notifyIdentityChange = function (nodetype, nodeId, relationship) {
      return $http.post(`${URLS.nodes}${nodetype}/${nodeId}/notifyIdentityChange/${relationship}`).then(extract);
    };

    data.generatePublicURL = function (nodeId, viewable = true, cache = false) {
      return $http.get(`${URLS.uploads}generatePublicURL/${nodeId}?viewable=${viewable}`, {
        cache
      }).then(extract);
    }

    data.generatePublicURLFromSourceKey = (sourceKey, filename, cache = false) => {
      return $http.post(`${URLS.uploads}downloadS3File`, {
        sourceKey,
        filename,
        cache
      }).then(extract);
    }

    data.getCustomTableView = async (node, customTableViewName) => {
      const result = await $http.get(`${URLS.nodes}${node._type}/${node._id}/customTableView/${customTableViewName}`);
      return extract(result);
    };

    data.getCustomTreeGridView = async (node, customTableViewName) => {
      const result = await $http.get(`${URLS.nodes}${node._type}/${node._id}/customTreeGridView/${customTableViewName}`);
      return extract(result);
    };

    data.getGraphView = async (node, graphViewName) => {
      const result = await $http.get(`${URLS.nodes}${node._type}/${node._id}/graphView/${graphViewName}`);
      return extract(result);
    };

    //  Get Node's Assignments
    data.getLifecycleAssignments = (node) => $http.get(`${URLS.nodes}lifecycleAssignments/${node._type}/${node._id}`).then(extract);

    data.attachLifecycleAssignment = (node, assignmentId, _state) => $http.post(`${URLS.nodes}lifecycleAssignments/${node._type}/${node._id}`, { assignmentId, _state }).then(extract);

    data.detachLifecycleAssignment = (node, relId) => $http.delete(`${URLS.nodes}lifecycleAssignments/${node._type}/${node._id}/relationship/${relId}`).then(extract);

    data.checkOut = (node) => {
      const trust = $sce.trustAsResourceUrl(`${gFileSyncUrl}checkOut/${node._id}`);
      return $http.get(trust)
        .then((result) => {
          if (result.status === -1) {
            $rootScope.gfsLogged = false;
            return {
              error: true,
              gfsRunning: false,
              message: 'Make sure GFS is running...',
            }
          }
          return result.data;
        })
        .catch((error) => {
          Notification.error({
            title: 'Error Checking Out',
            message: error.message,
          });
        })
    }

    data.checkIn = (node) => {
      const trust = $sce.trustAsResourceUrl(`${gFileSyncUrl}checkIn/${node._id}`);
      return $http.get(trust)
        .then((result) => {
          if (result.status === -1) {
            $rootScope.gfsLogged = false;
            return {
              error: true,
              gfsRunning: false,
              message: 'Make sure GFS is running...',
            }
          }
          return result.data;
        })
        .catch((error) => {
          Notification.error({
            title: 'Error Checking In',
            message: error.message,
          });
        })
    }

    data.removeCheckOut = (node) => {
      const trust = $sce.trustAsResourceUrl(`${gFileSyncUrl}removeCheckOut/${node._id}`);
      return $http.get(trust)
        .then((result) => {
          if (result.status === -1) {
            $rootScope.gfsLogged = false;
            return {
              error: true,
              gfsRunning: false,
              message: 'Make sure GFS is running...',
            }
          }
          return result.data;
        })
        .catch((error) => {
          Notification.error({
            title: 'Error Removing CheckedOut File',
            message: error.message,
          });
        })
    }

    data.openCheckedOutFile = (node) => {
      const trust = $sce.trustAsResourceUrl(`${gFileSyncUrl}openFile/${node._id}`);
      return $http.get(trust)
        .then((result) => {
          if (result && result.status === -1) {
            $rootScope.gfsLogged = false;
            return {
              error: true,
              gfsRunning: false,
              message: 'Make sure GFS is running...',
            }
          }
          return result.data;
        })
        .catch((error) => {
          Notification.error({
            title: 'Error Opening File',
            message: error.message,
          });
        });
    };

    data.runReport = (reportId, params) => {
      return $http.post(`${URLS.reports}${reportId}`, params).then(extract);
    };
  });