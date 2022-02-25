angular.module('app.ganister.externalAPIs.ihs', [])
  .service('ihsModel', function ($http) {
    const APIVER = 'v0';
    const BASEURL = `/api/${APIVER}/external-apis/ihs`;
    let data = this;

    data.searchParts = async (params) => await $http.post(`${BASEURL}/searchParts`, params).then(({ data }) => data);
  });