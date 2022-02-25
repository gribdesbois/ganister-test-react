angular.module('app.ganister.tabs.node.nodeFormTabs.externalAPIs.github', [
  'app.ganister.externalAPIs.github',
  'app.ganister.tabs.node.nodeFormTabs.externalAPIs.github.listForRepo',
  'app.ganister.tabs.node.nodeFormTabs.externalAPIs.github.listCommits',
  'ui-notification',
]).controller('externalAPIsGithubController', ($scope, $rootScope, Notification, githubModel) => {
});