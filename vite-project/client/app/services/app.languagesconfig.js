angular.module('app.ganister.languages.config', [])
  .service('languagesConfig', function ($http) {
    let languagesConfig = this;
    const LANGUAGESURL = '/api/v0/translations/';
    const USERSURL = '/api/v0/users/';

    languagesConfig.getLanguages = () => {
      return $http.get(`${LANGUAGESURL}languages`).then(result => {
        if (result.status === 200) {
          return result.data;
        } else {
          console.log("Cannot Get Languages: ", result.data)
          return [];
        }
      });
    }

    languagesConfig.setUserLanguage = (userId, value) => {
      const updateObject = {
          language: value
      };
      return $http.patch(USERSURL + userId, updateObject).then((result) => {
        return result.data
      })
    }
  })