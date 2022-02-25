angular.module('app.ganister.config.topBar', [])
  .controller('topBarController', function ($rootScope, $scope, datamodelModel, languagesConfig, $translate) {

    $scope.setBackgroundColor = () => {
      if ($scope.datamodel.instanceType === 'DEV') {
        return "linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)";
      } else if ($scope.datamodel.instanceType === 'STAGING') {
        return "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)";
      } else {
        return "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)";
      }
    };

    $scope.setActiveLanguage = async (lang) => {
      const language = $rootScope.appDefinition.app.languages.find((item) => item.key === lang);
      languagesConfig.setUserLanguage($rootScope.appContext.user._id, lang);
      $rootScope.appContext.user.language = language;
      
      try {
        await $translate.refresh(lang);
      } catch (error) {
        console.log("error", error)
      }
      try {
        await $translate.use(lang);
      } catch (error) {
        console.log("error", error)
      }
    }

    $scope.exportDm = async () => {
      const dm = await datamodelModel.getDatamodel();
      let dataStr = JSON.stringify(dm, null, '\t');
      let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      let exportFileDefaultName = `Ganister_DM_${moment().format("YYYY_MM_DD")}.json`;
      let linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }

    $scope.updateDMPackages = () => {
      Swal.fire({
        type: 'warning',
        title: 'Are you sure you want to update dmPackages?',
        text: 'This might break your configuration',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'Yes, update',
        inputValidator: (value) => {
          if (!value) {
            return 'Secret token is required'
          }
        }
      }).then((result) => {
        if (result.value) {
          datamodelModel.updateDMPackages(result.value).then((result) => {
            if (result.data === true) {
              Notification.success('dmPackages updated');
            } else {
              Notification.error({
                title: 'Error updating DM Packages',
                ...result.data,
              });
            }
          });
        }
      })
    }

    // INIT

    $scope.topBarBackgroundColor = $scope.setBackgroundColor();
  })
