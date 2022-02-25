angular.module('app.ganister.externalAPIs.github', [])
  .service('githubModel', function ($http) {
    const APIVER = 'v0';
    const BASEURL = `/api/${APIVER}/external-apis/github`;
    let data = this;

    data.issues = {
      listForRepo: async (owner, repo, options) => await $http.post(`${BASEURL}/issues/listForRepo`, { owner, repo, options }).then(({data }) => data)
    }

    data.commits = {
      listCommits: async (owner, repo) => await $http.post(`${BASEURL}/commits/listCommits`, { owner, repo }).then(({data }) => data)
    }
  });