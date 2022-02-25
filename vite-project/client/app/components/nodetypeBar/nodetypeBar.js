/* globals angular */
angular.module('app.ganister.nodetypeBar', [
  'app.ganister',
]).controller('nodetypeBarController', function ($scope, $rootScope) {

  // #region [FUNCTIONS]
  // #endregion

  // #region [SCOPE_FUNCTIONS]
  $scope.openAccountModal = () => {
    $rootScope.$broadcast('openAccountModal');
  }

  /*
  setcurrentNodetype : Set the nodetype context
   */
  $scope.setCurrentNodetype = (nodetype) => {
    // set scope currentNode
    $scope.context.currentNodetype = nodetype;
    localStorage["ganister_currentNodetype"] = nodetype.name;
    $rootScope.$broadcast('activeTab', 'list');
  }

  $scope.setCurrentCategory = (category) => {
    $scope.context.currentCategory = category;
  }
  // #endregion

  // #region [INIT]
  // #endregion

  // #region [SCOPE_WATCH]
  // #endregion

  // #region [SCOPE_ON]
  // #endregion



}).directive('checkImage', function ($http) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      attrs.$observe('ngSrc', function (ngSrc) {
        if (ngSrc) {
          $http.get(ngSrc).then(function (result) {
            if (result.status === 200) {
            } else {
              element.attr('src', '/images/identityLogo.png'); // set default image
            }
          }).catch(function () {
            element.attr('src', '/images/identityLogo.png'); // set default image
          });
        } else {
          element.attr('src', '/images/identityLogo.png'); // set default image
        }
      });
    }
  };
})