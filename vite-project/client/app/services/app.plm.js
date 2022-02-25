/* global angular */
angular.module('app.ganister.models.plm', [
  'app.ganister.models.nodetypes',
  'app.ganister.models.nodes',
])
  .service('plmModel', function ($http, Notification) {
    const APIVER = 'v0';
    let data = this,
      URLS = {
        nodes: `/api/${APIVER}/nodes/`,
        users: `/api/${APIVER}/users/`,
        plm: `/api/${APIVER}/plm/`,
        groups: `/api/${APIVER}/nodes/groups/`,
      };

    /**
     *
     * @param {*} result
     */
    const extract = (result) => {
      const data = displayError(result);
      if (!data) return;

      return result.data;
    };

    const displayError = (result) => {
      if (result.data?.error) {
        const error = result.data || result;
        Notification.error(error);
        console.error(error);
        return;
      }
      return result.data;
    };

    /**
     *
     * @param {*} result
     */
    function cacheData(result) {
      data = extract(result);
      return data;
    }
    /**
     * getEcoControlledNodes
     * @param {*} ecoId
     */
    data.getEcoControlledNodes = ecoId => $http.get(`${URLS.plm}eco/${ecoId}/controlledItems`).then(extract);
    /**
     * getEcoControlledNodesExtended
     * @param {*} ecoId
     */
    data.getEcoControlledNodesExtended = ecoId => $http.get(`${URLS.plm}eco/${ecoId}/controlledItems/extended`).then(extract);
    data.getEcoProcessedNodesExtended = ecoId => $http.get(`${URLS.plm}eco/${ecoId}/processedItems/extended`).then(extract);
    data.getEcoAllItems = ecoId =>$http.get(`${URLS.plm}eco/${ecoId}/allItems/extended`).then(extract);
    /**
     * addEcoControlledNode
     * @param {*} nodeId
     * @param {*} ecoId
     */
    data.addEcoControlledNode = (nodeId, ecoId) => $http.post(`${URLS.plm}eco/${ecoId}/controlledItem/${nodeId}`).then(extract);
    /**
     * updateEcoControlledState
     * @param {*} nodeId
     * @param {*} ecoId
     * @param {*} props
     */
    data.updateEcoControlledState = (nodeId, ecoId, props) => $http.put(`${URLS.plm}eco/${ecoId}/controlledItem/${nodeId}`, props).then(extract);

    data.updateEcoControlledLinkActions = (nodeId, ecoId, props) => $http.put(`${URLS.plm}eco/${ecoId}/controlledItem/${nodeId}/linkActions`, props).then(extract);
    /**
   * updateEcoControlledParam
   * @param {*} nodeId
   * @param {*} ecoId
   * @param {*} param
   * @param {*} value
   */
    data.updateEcoControlledParam = (nodeId, ecoId, param, value) => {
      return $http.put(`${URLS.plm}eco/${ecoId}/controlledItem/${nodeId}`, {
        singleValue: true,
        param,
        value,
      }).then(extract);
    };
    /**
     * removeEcoControlledNode
     *
     * @param {*} nodeType
     * @param {*} nodeId
     * @param {*} ecoId
     */
    data.removeEcoControlledNode = (nodeId, ecoId) => $http.delete(`${URLS.plm}eco/${ecoId}/controlledItem/${nodeId}`).then(extract);

    /**
     * processECONode
     * @param {*} nodeId
     */
    data.processECONode = async (nodetype, nodeId, action, newRef, ecoId) => {
      const body = { action, newRef, ecoId };
      const result = await $http.post(`${URLS.plm}processECONode/${nodetype}/${nodeId}`, body);
      return extract(result);
    };


    data.instanciateNode = (nodetype, nodeId, instanciationId) => $http.post(`${URLS.plm}instanciateNode/${nodetype}/${nodeId}`, { instanciationId }).then(extract);

    data.getProjectAssignments = (projectId) => {
      return $http.get(`${URLS.plm}projects/${projectId}/projectAssignments`).then(extract);
    };

    data.publicCADDocument = (nodeId) => $http.post(`${URLS.plm}CAD/CADDocument/public/${nodeId}`).then(extract);

    data.getRevisionCADDocument = (revisionId) => $http.get(`${URLS.plm}CAD/CADDocument/revision/${revisionId}`).then(extract);

    data.getUxConfig = () => $http.get(`/api/${APIVER}/config/ux`).then(extract);
  });