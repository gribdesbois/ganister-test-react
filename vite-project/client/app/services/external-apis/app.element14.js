angular.module('app.ganister.externalAPIs.element14', [])
  .service('element14Model', function ($http) {
    const APIVER = 'v0';
    const BASEURL = `/api/${APIVER}/external-apis/element14`;
    let data = this;

    data.searchTerm = async (numberOfResults, offset, storeInfoId, term) => await $http.post(`${BASEURL}/searchTerm`, { numberOfResults, offset, storeInfoId, term }).then(({data }) => data);
  
  });