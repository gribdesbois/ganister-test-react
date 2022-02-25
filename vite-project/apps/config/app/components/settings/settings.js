angular.module('app.ganister.config.models.settings', [
  'app.ganister.config.models'
])
  .controller('settingsController', function ($scope, $rootScope, $http, Notification, Upload, $location) {
    $location.search({ page: 'settings' });
    $scope.settings = {};
    const APIVersion = "v0";

    $scope.updateUX = async (param, value) => {
      const result = await $http.put(`/api/${APIVersion}/config/ux/${param}`, { value }).then((result) => {
        if (result.status === 200) {
          if (value) {
            Notification.success('Setting Updated');
            $rootScope.appDefinition.uxConfig[param] = value;
            return true;
          }
        } else {
          Notification.error('Error: Please try again');
          return false;
        }
      })
      return result;
    };

    $scope.updateVersioningLabels = (label) => {
      if (label.name) {
        $scope.updateUX('versioningLabels', $scope.settings.ux.versioningLabels);
      } else {
        return Notification.error('Error: Please try again');
      }
    }

    $scope.$watch('appLogo', async (file) => {
      if (file != null && !file.$error) {
        try {
          const res = await Upload.upload({
            url: `/api/${APIVersion}/uploads/localImages`,
            data: { file }
          });
          if (res.status === 200) {
            const uxRes = await $scope.updateUX('appLogo', res.data.url);
            if (uxRes) {
              $scope.settings.ux.appLogo = res.data.url;
              $scope.$apply();
            }
          }
        } catch (error) {
          Notification.error({ title: 'File Upload Error', message: error.message });
        }
      }
    });

    $scope.$watch('logoSmaller', async (file) => {
      if (file != null && !file.$error) {
        try {
          const res = await Upload.upload({
            url: `/api/${APIVersion}/uploads/localImages`,
            data: { file }
          });
          if (res.status === 200) {
            const uxRes = await $scope.updateUX('logoSmaller', res.data.url);
            if (uxRes) {
              $scope.settings.ux.logoSmaller = res.data.url;
              $scope.$apply();
            }
          }
        } catch (error) {
          Notification.error({ title: 'File Upload Error', message: error.message });
        }
      }
    });

    $scope.$watch('logo', async (file) => {
      if (file != null && !file.$error) {
        try {
          const res = await Upload.upload({
            url: `/api/${APIVersion}/uploads/localImages`,
            data: { file }
          });
          if (res.status === 200) {
            const uxRes = await $scope.updateUX('logo', res.data.url);
            if (uxRes) {
              $scope.settings.ux.logo = res.data.url;
              $scope.$apply();
            }
          }
        } catch (error) {
          Notification.error({ title: 'File Upload Error', message: error.message });
        }
      }
    });

    $http.get(`/api/${APIVersion}/config/settings`).then((result) => {
      if (result.status === 200) {
        $scope.settings = {
          ...$scope.settings,
          ...result.data
        };
      } else {
        Notification.error('Error reading settings');
      }
    });
    $http.get(`/api/${APIVersion}/config/ux`).then((result) => {
      if (result.status === 200) {
        $scope.settings.ux = result.data;
      } else {
        Notification.error('Error reading UX settings');
      }
    });
  })