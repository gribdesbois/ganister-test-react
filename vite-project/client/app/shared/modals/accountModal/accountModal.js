angular.module('app.ganister.shared.modals.accountModal', [])
  .controller('accountModalController', ($scope, $rootScope, nodesModel, userconf, Upload, Notification) => {
    //  Get Current User Details
    $scope.currentUser = { ...$rootScope.appContext.user.properties };
    const { TWOFA } = $scope.currentUser;
    $scope.currentUser.TWOFA = TWOFA === true || TWOFA === 'true';

    $scope.$on('openAccountModal', () => {
      $(`#modal-accountModal`).modal('show');
    });


    $scope.$watch("fileUpload", (file, oldValue) => {
      if (file === oldValue || file === null) { return; }
      Upload.upload({ url: 'api/v0/uploads', data: { file } }).then((res) => {
        if (res.status === 200 && res.data.url) {
          file.url = res.data.url;
          file.filename = res.data.filename;
          file.encoding = res.data.encoding;
          file.mimetype = res.data.mimetype;
          // file.checksum = res.data.checksum;
          file.filesize = res.data.filesize;
          file.source = res.data.source;
          file.sourceKey = res.data.sourceKey;
          // if s3 enabled GET Public URL
          if (file.source === 'local') {
            $scope.currentUser.pict = file.url;
          } else {
            $scope.currentUser.s3Key = file.sourceKey;
            $scope.currentUser.s3Filename = res.data.filename;
            nodesModel.generatePublicURLFromSourceKey(file.sourceKey, file.filename)
              .then((result) => {
                console.log(Date.now())
                setTimeout(() => {
                  $scope.currentUser.pict = `uploads/${result.filename}`;
                }, 500)
              })
              .catch((error) => {
                console.error('failed pict upload', error);
              })
          }

          Notification.success({ title: 'Picture Uploaded', message: `Your picture ${res.data.filename} has been uploaded` });

        } else {
          const { title, message } = res.data;
          Notification.error({ title: title || 'Upload Failed', message });
        }
      })
    });

    $scope.removePhoto = () => {
      $scope.currentUser.pict = '';
    }

    $scope.updateUser = () => {
      if ($scope.currentUser.newPassword) {
        if (!$scope.currentUser.confirmNewPassword) {
          Notification.error('Please check confirm new Password');
          return;
        }
        if ($scope.currentUser.confirmNewPassword !== $scope.currentUser.newPassword) {
          Notification.error('New Password not the same');
          return;
        }
        $scope.currentUser.password = $scope.currentUser.newPassword;
      }

      userconf.updateUser($scope.currentUser)
        .then((result) => {
          if (result.status === 200) {
            Object.keys(result.data.data.properties).map(key => {
              $rootScope.appContext.user.properties[key] = result.data.data.properties[key];
            })
            $(`#modal-accountModal`).modal('hide');
          } else {
            Notification.error('User not updated');
          }
        })
    }
  })