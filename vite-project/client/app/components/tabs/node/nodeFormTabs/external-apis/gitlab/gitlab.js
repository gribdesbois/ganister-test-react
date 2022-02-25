angular.module('app.ganister.tabs.node.nodeFormTabs.externalAPIs.gitlab', [
  'app.ganister.externalAPIs.gitlab',
  'app.ganister.tabs.node.nodeFormTabs.externalAPIs.gitlab.listForRepo',
  'app.ganister.tabs.node.nodeFormTabs.externalAPIs.gitlab.listCommits',
  'ui-notification',
]).controller('externalAPIsGitlabController', ($scope, $rootScope, Notification, gitlabModel) => {
});