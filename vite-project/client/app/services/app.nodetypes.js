/* global angular */
angular.module('app.ganister.models.nodetypes', [])
  .service('datamodelModel', function ($http) {
    let datamodel = this;

    datamodel.URLS = {
      FETCH: '/api/v0/nodetypes/datamodel',
      NODETYPES: '/api/v0/nodetypes/',
    };

    datamodel.getDatamodel = function () {
      return new Promise((resolve, reject) => {
        if (!datamodel.nodetypes || datamodel.nodetypes.length < 1) {
          return $http.get(this.URLS.FETCH).then((result) => {
            datamodel = result.data;
            resolve(result.data);
          });
        } else {
          resolve(datamodel)
        }
      })
    };

    datamodel.getNodetype = function (nodetypeName) {
      return _.find(datamodel.nodetypes, { name: nodetypeName });
    };

    datamodel.fetchInfoDataForm = (nodetypeName) => $http.get(`${this.URLS.NODETYPES}${nodetypeName}/form/infodataform`).then((result) => result.data);

    //datamodel.nodetypes = this.getDatamodel().nodetypes;
  });
