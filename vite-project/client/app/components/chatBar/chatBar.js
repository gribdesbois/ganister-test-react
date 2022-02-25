angular.module('app.ganister.chatBox', [])
  .controller('chatBoxController', ($scope, $rootScope, $translate, nodesModel, Notification, socket) => {

    // #region [FUNCTIONS]
    // #endregion

    // #region [SCOPE_FUNCTIONS]
    $scope.cleanDiscussion = () => {
      $rootScope.messages = $rootScope.messages.filter((item) => {
        return ((item.to._id != $scope.interlocutor._id) && (item.from._id != $scope.interlocutor._id))
      })
      localStorage.setItem('ganister_messages', JSON.stringify($rootScope.messages));
    }

    $scope.sendMessage = () => {
      if ($scope.editedMessage && $scope.editedMessage != "") {
        socket.io.emit('chat message', $scope.editedMessage);
        socket.send($rootScope.appContext.user, $scope.editedMessage, $rootScope.interlocutor, Date.now());
        $scope.editedMessage = "";
      }
    }
    $scope.messageFilter = function (item) {
      if ($scope.interlocutor) {
        return item.to._id === $scope.interlocutor._id || item.from._id === $scope.interlocutor._id;
      }
      return false;
    };
    // #endregion

    // #region [INIT]
    // #endregion

    // #region [SCOPE_WATCH]
    // #endregion

    // #region [SCOPE_ON]
    $rootScope.$on("messageUpdated", () => {
      $scope.$apply();
    })
    // #endregion

  });