angular.module('app.ganister.config.data', [])
  .service('data', function ($http, Notification) {
    const APIVER = "v0";
    var data = this,
      URLS = {
        NODES: '/api/' + APIVER + '/nodes/',
        USERS: '/api/' + APIVER + '/users/',
        PERMISSIONS: '/api/' + APIVER + '/nodes/accessNodes/',
        GROUPS: '/api/' + APIVER + '/nodes/groups/',
        TRANSLATIONS: '/api/' + APIVER + '/translations/',
      };

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

    data.nodes = {
      clearNodetypeTranslation: (nodetypeName) => {
        return $http.get(`${URLS.TRANSLATIONS}clearNodetypeTranslation/${nodetypeName}`).then((result) => {
          return result;
        });
      },


      all: async (nodetype) => {
        const result = await $http.get(`${URLS.NODES + nodetype}`);
        return extract(result);
      },

      get: async (nodetype, nodeId) => {
        const result = await $http.get(`${URLS.NODES + nodetype}/${nodeId}`);
        return extract(result);
      },

      add: async (node, lock = false, generateAPIKey = false) => {
        const { _type, properties } = node;
        const response = await $http.post(`${URLS.NODES + _type}`, { properties, lock, generateAPIKey });
        
        const result = extract(response);
        return { 
          ...result,
          ...(generateAPIKey && { apiKey: response?.data?.apiKey })
        }
      },

      update: async (node) => {
        const { _type, _id, properties } = node;
        const result = await $http.patch(`${URLS.NODES + _type}/${_id}`, { properties });
        return extract(result);
      },

      delete: async (node) => {
        const { _type, _id } = node;
        const result = await $http.delete(`${URLS.NODES + _type}/${_id}`);
        return extract(result);
      },
    };

    data.relationships = {
      allByName: async (nodetype, relationshipName = '', options = {}) => {
        const queryOptions = Object.keys(options)
          .map((key) => `${key}=${options[key]}`)
          .join('&');
        const query = queryOptions ? `?${queryOptions}` : '';

        const result = await $http.get(`${URLS.NODES}${nodetype}/relationships/${relationshipName}${query}`);
        return extract(result);
      },

      all: async (source, relationshipName = '', options = {}) => {
        const queryOptions = Object.keys(options)
          .map((key) => `${key}=${options[key]}`)
          .join('&');
        const query = queryOptions ? `?${queryOptions}` : '';

        const result = await $http.get(`${URLS.NODES}${source._type}/${source._id}/relationships/${relationshipName}${query}`);
        return extract(result);
      },

      add: async (relationship) => {
        const { _type, properties, source, target } = relationship;
        const body = {
          target: {
            _type: target._type,
            _id: target._id
          },
          properties,
        };
        const result = await $http.post(`${URLS.NODES}${source._type}/${source._id}/relationships/${_type}`, body);
        return extract(result);
      },

      update: async (relationship) => {
        const { _type, _id, properties, source, target } = relationship;
        const body = {
          target: {
            _type: target._type,
            _id: target._id
          },
          properties,
        };
        const result = await $http.patch(`${URLS.NODES}${source._type}/${source._id}/relationships/${_type}/${_id}`, body);
        return extract(result);
      },

      delete: async (relationship) => {
        const { _type, _id, source } = relationship;
        const result = await $http.delete(`${URLS.NODES}${source._type}/${source._id}/relationships/${_type}/${_id}`);
        return extract(result);
      },
    };

    data.users = {
      add: (user) => {
        return $http.post(URLS.USERS + 'signup', user).then((result) => {
          return result.data;
        });
      },
      get: () => {
        return $http.get(URLS.USERS).then((result) => {
          return result.data;
        });
      },
      patch: (userId, property, value) => {
        var updateObject = { property, value };
        return $http.patch(URLS.USERS + userId, updateObject).then((result) => {
          return result.data;
        });
      },
      put: (userId, user) => {
        return $http.put(URLS.USERS + userId, user).then((result) => {
          return result.data;
        });
      },
      delete: (userId) => {
        return $http.delete(URLS.USERS + userId).then((result) => {
          return result.data;
        });
      },
      invite: (user) => {
        return $http.post(URLS.USERS + 'invite', user).then((result) => {
          return result.data;
        });
      },
    };

    data.permissions = {
      add: (permission) => {
        return $http.post(URLS.PERMISSIONS, { permission }).then((result) => {
          return result.data;
        });
      },
      get: () => {
        return $http.get(URLS.PERMISSIONS).then(extract);
      },
      patch: (property, value) => {
      },
      addUserMember: (accessNodeId, childMemberId, role, canCreate) => {
        return $http.post(URLS.PERMISSIONS + accessNodeId + "/UserMember/" + childMemberId, { role, canCreate }).then((result) => {
          return result.data;
        });
      },
      addGroupMember: (accessNodeName, childMemberId, role, canCreate) => {
        return $http.post(URLS.PERMISSIONS + accessNodeName + "/GroupMember/" + childMemberId, { role, canCreate }).then((result) => {
          return result.data;
        });
      },
      editUserMember: (accessNodeId, childMemberId, role) => {
        return $http.patch(URLS.PERMISSIONS + accessNodeId + "/UserMember/" + childMemberId, { role }).then((result) => {
          return result.data;
        });
      },
      editGroupMember: (accessNodeId, childMemberId, role, canCreate) => {
        return $http.patch(URLS.PERMISSIONS + accessNodeId + "/GroupMember/" + childMemberId, { role, canCreate }).then((result) => {
          return result.data;
        });
      },
      removeUserMember: (accessNodeId, childMemberId) => {
        return $http.delete(URLS.PERMISSIONS + accessNodeId + "/UserMember/" + childMemberId).then((result) => {
          return result.data;
        });
      },
      removeGroupMember: (accessNodeName, childMemberId) => {
        return $http.delete(URLS.PERMISSIONS + accessNodeName + "/GroupMember/" + childMemberId).then((result) => {
          return result.data;
        });
      },
      put: (permissionId, permission) => {
        return $http.put(URLS.PERMISSIONS + permissionId, permission).then((result) => {
          return result.data;
        });
      },
      delete: (permissionName) => {
        return $http.delete(URLS.PERMISSIONS + permissionName).then((result) => {
          return result.data;
        });
      }
    };


    data.roles = {
      // CRUD
      add: (role) => {
        return $http.post(URLS.GROUPS, { group: role, groupType: 'role' }).then((result) => {
          return result.data;
        });
      },
      get: () => {
        return $http.get(URLS.GROUPS).then((result) => {
          // filter by role
          result.data = result.data.filter((item) => {
            return item.groupType === 'role';
          });
          return result.data
        });
      },
      getOne: (roleId) => {
        return $http.get(URLS.GROUPS + roleId).then((result) => {
          console.log("result", result)
          return result.data
        });
      },
      patch: (roleId, property, value) => {
        return $http.patch(URLS.GROUPS + roleId, { property, value }).then((result) => {
          return result.data
        });
      },
      delete: (roleId) => {
        return $http.delete(URLS.GROUPS + roleId).then((result) => {
          return result.data
        });
      }
      // ADVANCED

    }

    data.teams = {
      // CRUD
      add: (team) => {
        return $http.post(URLS.GROUPS, { group: team, groupType: 'team' }).then((result) => {
          return result.data
        })
      },
      get: () => {
        return $http.get(URLS.GROUPS).then((result) => {
          // filter by role
          result.data = result.data.filter((item) => {
            return item.groupType === 'team';
          });
          return result.data
        });
      },
      getOne: (teamId) => {
        return $http.get(URLS.GROUPS + teamId).then((result) => {
          return result.data
        });
      },
      patch: (teamId, property, value) => {
        return $http.patch(URLS.GROUPS + teamId, { property, value }).then((result) => {
          return result.data
        });
      },
      delete: (teamId) => {
        return $http.delete(URLS.GROUPS + teamId).then((result) => {
          return result.data
        });
      },
      initRoles: (teamId, type = 'project') => {
        return $http.post(URLS.GROUPS + teamId + '/roles/init/' + type).then((result) => {
          return result.data
        });
      },
      // ADVANCED

    }


    data.groups = {
      // CRUD
      add: (group) => {
        return $http.post(URLS.GROUPS, { group, groupType: 'group' }).then((result) => {
          return result.data
        })
      },
      get: () => {
        return $http.get(URLS.GROUPS).then((result) => {
          // filter by group
          result.data = result.data.filter((item) => {
            return (['team', 'role'].indexOf(item.groupType) < 0);
          });
          return result.data
        })
      },
      getFullStructure: () => {
        return $http.get(URLS.GROUPS + 'fullStructure').then((result) => {
          return result.data
        })
      },
      getOne: (groupId) => {
        return $http.get(URLS.GROUPS + groupId).then((result) => {
          return result.data
        })
      },
      addUserMember: async (groupId, childMemberId) => {
        const result = await $http.post(`${URLS.GROUPS}${groupId}/UserMember/${childMemberId}`);
        return extract(result);
      },
      addGroupMember: async (groupId, childMemberId) => {
        const result = await $http.post(`${URLS.GROUPS}${groupId}/GroupMember/${childMemberId}`)
        return extract(result)
      },
      updateUserMember: (groupId, childMemberId, role, status) => {
        return $http.patch(`${URLS.GROUPS}${groupId}/UserMember/${childMemberId}`, { role, status }).then((result) => {
          return result.data
        })
      },
      updateGroupMember: (groupId, childMemberId, role, status) => {
        return $http.patch(`${URLS.GROUPS}${groupId}/GroupMember/${childMemberId}`, { role, status }).then((result) => {
          return result.data
        })
      },
      removeUserMember: (groupId, childMemberId) => {
        return $http.delete(URLS.GROUPS + groupId + "/UserMember/" + childMemberId).then((result) => {
          return result.data
        })
      },
      removeGroupMember: (groupId, childMemberId) => {
        return $http.delete(URLS.GROUPS + groupId + "/GroupMember/" + childMemberId).then((result) => {
          return result.data
        })
      },
      put: (groupId, data) => {
        return $http.put(URLS.GROUPS + groupId, data).then((result) => {
          return result.data
        })
      },
      delete: (groupId) => {
        return $http.delete(URLS.GROUPS + groupId).then((result) => {
          return result.data
        })
      }
    }


    data.saveGroupsAndPermissions = (fileContent) => {
      return $http.post('/api/' + APIVER + '/nodes/groupsAndPermissions/', fileContent).then((result) => {
        return result.data
      })
    }
  })