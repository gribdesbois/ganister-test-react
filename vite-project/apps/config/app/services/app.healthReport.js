angular.module('app.ganister.config.healthReport', [])
  .service('healthReport', function ($http) {
    const APIVER = "v0"
    let data = this;
    const URL = '/api/' + APIVER + '/nodes/';
  })