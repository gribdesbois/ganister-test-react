/* globals agGrid, angular */
agGrid.initialiseAgGridWithAngular1(angular);
angular.module('app.ganister.config', [
  'app.ganister.config.topBar',
  'app.ganister.config.models',
  'app.ganister.config.models.datamodel',
  'app.ganister.config.models.nodetypes',
  'app.ganister.config.models.nodetypes.properties',
  'app.ganister.config.models.nodetypes.lifecycle',
  'app.ganister.config.models.nodetypes.ui.tabs',
  'app.ganister.config.models.nodetypes.actions',
  'app.ganister.config.models.nodetypes.methods',
  'app.ganister.config.models.nodetypes.instanciations',
  'app.ganister.config.models.nodetypes.ui',
  'app.ganister.config.models.nodetypes.externalAPIsMapping',
  'app.ganister.config.models.lovs',
  'app.ganister.config.models.methods',
  'app.ganister.user.config',
  'app.ganister.config.groupsAndUsers',
  'app.ganister.config.models.translations',
  'app.ganister.config.models.categories',
  'app.ganister.config.models.healthReport',
  'app.ganister.config.models.settings',
  'app.ganister.languages.config',
  'agGrid',
  'pascalprecht.translate',
  'ui.codemirror',
  'ui-notification',
  'dndLists',
  'angular-loading-bar',
])

  .service('APIInterceptor', function (userlocal, $rootScope) {
    var service = this;
    service.request = function (config) {
      var currentUser = userlocal.getToken()
      if (currentUser) {
        config.headers.authorization = currentUser;
      }
      return config;
    };
    service.responseError = function (response) {
      if (response.status === 401) {
        $rootScope.$broadcast('unauthorized');
      }
      if (response.status === 403) {
        console.error(response)
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'Something went wrong',
          footer: '403 error, contact your admin (' + response.statusText + ')',
        });
      }
      if (response.status === 500) {
        console.error(response)
        Swal.fire({
          type: 'error',
          title: 'Oops...',
          text: 'Something went wrong',
          footer: '500 error, contact your admin (' + response.statusText + ')',
        });
      }
      return response;
    };

  })
  .config(function ($httpProvider, $translateProvider) {
    $httpProvider.interceptors.push('APIInterceptor');
    $translateProvider.useSanitizeValueStrategy(null);
    $translateProvider.useStaticFilesLoader({
      prefix: '/locales/locale-',
      suffix: '.json',
    });

    $translateProvider
      .fallbackLanguage('default')
      .preferredLanguage('default');
    $translateProvider.forceAsyncReload(true);
  })
  .config(function (NotificationProvider) {
    NotificationProvider.setOptions({
      delay: 10000,
      startTop: 20,
      startRight: 10,
      verticalSpacing: 20,
      horizontalSpacing: 20,
      positionX: 'right',
      positionY: 'bottom'
    });
  })

  .run(function () {
    $("#element").introLoader({
      animation: {
        name: 'doubleLoader',
        options: {
          exitFx: 'fadeOut',
          ease: "easeInOutCirc",
          style: 'ocean',
          delayBefore: 200,
          exitTime: 300,
          progbarTime: 500,
          progbarDelayAfter: 300,
        }
      }
    })
  })

  .controller('LoginController', function ($http, $scope, $rootScope, Notification, userconf, userlocal, languagesConfig, $translate) {
    $scope.logging = false;
    // Initialise rootscope variables
    $rootScope.appContext = {
      user: {},
    }
    $rootScope.logged = false
    $rootScope.appDefinition = {
      app: {
        version: null,
        versionDate: null,
        appName: "Ganister",
        languages: [],
      }
    }

    $http.get('buildInfo.json').then((response) => {
      const { commit, commitDate } = response.data;
      $rootScope.appDefinition.app = {
        ...$rootScope.appDefinition.app,
        version: commit,
        versionDate: commitDate,
      }
      $http.get('uxConfig.json').then((response) => {
        $rootScope.appDefinition.uxConfig = response.data;
        languagesConfig.getLanguages().then((languages) => {
          console.info("✔️ Languages Loaded");
          $rootScope.appDefinition.app.languages = languages.filter((item) => item.active && item.key !== 'default');
          //  Setup Fallback Language
          const fallbackLanguage = $rootScope.appDefinition.app.languages.find((item) => item.fallbackLanguage == true);
          if (fallbackLanguage) {
            $translate.fallbackLanguage(fallbackLanguage.key);
          } else {
            $translate.fallbackLanguage('default');
          }
          $scope.testLoggedState();
        });
      });
    });

    //  Check If User is Logged In
    $scope.testLoggedState = () => {
      console.info("🛂 Testing if User is already logged in...");
      userconf.testLoggedState()
        .then((response) => {
          if (response.status == 200) {
            if (response.data) {
              const user = response.data;
              if (user.properties.active !== true) {
                Notification.error({
                  message: "✋ Unauthorized: User not active",
                });
              } else if (user.properties._isAdmin !== true) {
                Notification.error({
                  message: "✋ Unauthorized: Admin users only",
                });
              } else {
                console.info("👍 User Access Valid");
                $rootScope.appContext.user = user;
                $rootScope.appContext.logged = true;
                //  Update User Language
                //  Check if user has a preferred language setup and language exists and is active
                $scope.setLanguage();
                $rootScope.$broadcast('loadMainView');
              }
            }
          } else {
            console.info("✋ User is not logged in");
          }
        })
    }


    $scope.setLanguage = () => {
      let userLanguage;
      if ($rootScope.appContext.user.language) {
        userLanguage = $rootScope.appDefinition.app.languages.find(item => item.key === $rootScope.appContext.user.language && item.active);
      } else {
        $rootScope.appContext.user.language = $rootScope.appContext.user.properties.language;
        userLanguage = $rootScope.appDefinition.app.languages.find(item => item.key === $rootScope.appContext.user.properties.language && item.active);
      }

      if (userLanguage) {
        $rootScope.appContext.user.language = userLanguage;
        $translate.use($rootScope.appContext.user.language.key);
      } else {
        const preferredLanguage = $rootScope.appDefinition.app.languages.find((item) => item.preferredLanguage == true);
        if (preferredLanguage) {
          //  TODO: Load Preferred Language from User Object if exists
          $rootScope.appContext.user.language = preferredLanguage;
          $translate.use(preferredLanguage.key);
        } else {
          $rootScope.appContext.user.language = $rootScope.appDefinition.app.languages[0];
          $translate.use($rootScope.appDefinition.app.languages[0].key);
        }
      }
    }

    // User Login Handler
    $scope.login = (user) => {
      $scope.logging = true;
      setTimeout(() => {
        if ($scope.logging) {
          $scope.loginMessage = 'Logging in is taking more than usual... Please note that for training and discovery instances, the instance goes into sleep after 1h of inactivity. The instance should be available in 30 sec'
          $scope.$apply();
        }
      }, 5 * 1000);
      userconf.login(user)
        .then((result) => {
          $scope.logging = false;
          if (result.status === -1) {
            return Notification.error({
              message: "Please check your internet connection!",
            });
          }
          if (result.status !== 200) {
            return Notification.error({
              title: "Unauthorized User",
              message: "Wrong Credentials",
            });
          }
          const userData = _.get(result, 'data', {});

          //  Catch other errors
          if (userData.error) {
            return Notification.error({
              title: userData.title,
              message: userData.message,
            });
          }

          if (!userData.properties._isAdmin) {
            return Notification.error({
              title: "Unauthorized User",
              message: "You are not an Admin",
            });
          }

          $rootScope.appContext.user = userData;
          $rootScope.appContext.logged = true;
          $scope.setLanguage();
          if (userData.properties.active !== true) {
            Notification.error({
              message: "Unauthorized: User not active!",
            });
          } else if (userData.properties._isAdmin !== true) {
            Notification.error({
              message: "Unauthorized: Admin users only!",
            });
          } else if (!userData.isError && userData.properties.token) {
            userlocal.saveToken(userData.properties.token, userData.properties.tokenExpiration);
            $rootScope.$broadcast('loadMainView');
            $rootScope.appContext.logged = true;
            $rootScope.appContext.user = userData;
          } else if (!userData.dbError) {
            Notification.error({
              message: "Failed Login! Please try again...",
            });
          } else {
            Notification.error({
              message: "Database not available",
            });
          }
        })
        .catch((err) => Notification.error({ title: err.message }));
      // 
    }

    $rootScope.$on('unauthorized', (events, args) => {
      userlocal.removeToken()
      $rootScope.appContext.logged = false;
    })
  })
  .controller('mainController', function ($scope, $rootScope, datamodelModel, userlocal, $window, $location) {
    // Init shared $scope members
    $scope.datamodel = {};
    // $rootScope.appDefinition = {};
    $rootScope.appContext = {};
    $scope.context = {};
    $rootScope.appContext.logged = false;

    $scope.select = (category) => {
      $scope.categorySelected = true;
      $scope.category = category;
      $scope.categoryName = category.ref;
    }
    $scope.unselect = () => {
      $location.search({ page: 'main' });
      $scope.categorySelected = false;
      $scope.categoryName = "";
    }


    $scope.backToClient = () => {
      $window.location.href = '/';
    }

    $rootScope.$on('unauthorized', (events, args) => {
      userlocal.removeToken();
      $rootScope.appContext.logged = false;
    })


    function loadSavedPage() {
      const page = $location.search().page;
      if (page && page !== "main") {
        const category = $scope.configApps.find((c) => c.ref === page);
        $scope.select(category);
      }
    }

    //  Enable ToolTips
    jQuery(function ($) {
      $(document).tooltip({
        selector: '[data-toggle="tooltip"]'
      });
    });

    $scope.configApps = [
      {
        name: 'Datamodel',
        ref: 'datamodel',
        title: 'Datamodel Configurator',
        big: true,
        img: 'images/config/Technology_Mix_-_Final-38-256.png',
        url: 'config/app/components/datamodel/datamodel.html',
      }, {
        name: 'Methods',
        ref: 'methods',
        title: 'Method Editor',
        big: true,
        img: 'images/config/codeEditorLogo.png',
        url: 'config/app/components/methods/methods.html',
      }, {
        name: 'Groups & Users',
        ref: 'groupsAndUsers',
        title: 'Groups and Users',
        big: false,
        img: 'images/config/Technology_Mix_-_Final-16-256.png',
        url: 'config/app/components/groupsAndUsers/groupsAndUsers.html',
      }, {
        name: 'Lists of values',
        ref: 'lovs',
        title: 'Lists of Values editor',
        big: false,
        img: 'images/config/Technology_Mix_-_Final-21-256.png',
        url: 'config/app/components/lovs/lovs.html',
      }, {
        name: 'Categories',
        ref: 'categories',
        title: 'Categories Configurator',
        big: false,
        img: 'images/config/if_Technology_Mix_-_Final-12_998682.png',
        url: 'config/app/components/categories/categories.html',
      }, {
        name: 'Health Report',
        ref: 'healthReport',
        title: 'Health Report Dashboard',
        big: false,
        img: 'images/config/Technology_Mix_-_Final-06-256.png',
        url: 'config/app/components/healthReport/healthReport.html',
      }, {
        name: 'Settings',
        ref: 'settings',
        title: 'App Settings',
        big: false,
        img: 'images/config/Technology_Mix_-_Final-30-256.png',
        url: 'config/app/components/settings/settings.html',
      }, {
        name: 'Translations',
        ref: 'translations',
        title: 'Translations Manager',
        big: false,
        img: 'images/config/Technology_Mix_-_Final-28-256.png',
        url: 'config/app/components/translations/translations.html',
      },
    ]

    $scope.setBackgroundColor = () => {
      if ($scope.datamodel.instanceType === 'DEV') {
        return "linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)";
      } else if ($scope.datamodel.instanceType === 'STAGING') {
        return "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)";
      } else {
        return "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)";
      }
    };

    $rootScope.$on('loadMainView', (e) => $scope.loadDatamodelContent());

    $scope.loadDatamodelContent = () => {
      datamodelModel.getDatamodel()
        .then((result) => {
          $scope.datamodel = result;
          $rootScope.appContext.logged = true;
          console.info("✔️ Datamodel Loaded");
          $scope.topBarBackgroundColor = $scope.setBackgroundColor();
          loadSavedPage();
        })
    }

    $scope.logout = () => {
      userlocal.removeToken();
      $scope.categorySelected = false;
      $rootScope.appContext.logged = false;
    }

    $scope.$on("reloadDatamodel", () => {
      $scope.loadDatamodelContent();
    })
    $scope.$on('nodetypeUpdate', (event, nodetype, datatype) => {
      $scope.$broadcast('nodetypeMainUpdate', nodetype, datatype);
    });

    $scope.$on('updateMethods', (event, methods) => {
      $scope.datamodel.methods = methods;
    })
  })


