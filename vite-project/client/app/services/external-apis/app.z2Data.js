angular.module('app.ganister.externalAPIs.z2Data', [])
  .service('z2DataModel', function ($http) {
    const APIVER = 'v0';
    const BASEURL = `/api/${APIVER}/external-apis/z2data`;
    let data = this;

    data.searchParts = async (params) => await $http.post(`${BASEURL}/searchParts`, params).then(({ data }) => data);
    data.getPartDetail = async (params) => await $http.post(`${BASEURL}/getPartDetail`, params).then(({ data }) => data);
  });