/* globals angular */
angular.module('app.ganister', [
  'app.ganister.topBar',
  'app.ganister.nodetypeBar',
  'app.ganister.tabs',
  'app.ganister.tabs.mainNodeListing',
  'app.ganister.tabs.node.nodeform',
  'app.ganister.models.nodetypes',
  'app.ganister.models.nodes',
  'app.ganister.externalAPIs.github',
  'app.ganister.externalAPIs.gitlab',
  'app.ganister.externalAPIs.element14',
  'app.ganister.externalAPIs.ihs',
  'app.ganister.externalAPIs.z2Data',
  'app.ganister.user.config',
  'app.ganister.languages.config',
  'app.ganister.clientMethodsService',
  'app.ganister.shared.modals.accountModal',
  'angular-loading-bar',
  'app.ganister.chatBox',
  'app.ganister.customPanel',
  'app.ganister.searchPanel',
  'ui-notification',
  'ngAnimate',
  'ngSidebarJS',
  'pascalprecht.translate',
  'angular-bind-html-compile',
  'ngIdle',
])
  .factory('socket', function ($rootScope, Notification) {
    //  TODO: GET URL FROM ENV VARIABLE
    let socket = io.connect('/');
    socket.on('connect', function () {
      console.log("🔗 Socket Connected");
    })
    socket.on('userLoggedIn', function (data) {
      Notification.info({
        message: `<strong><span class="glyphicon glyphicon-user" aria-hidden="true"></span> ${data.properties._labelRef}</strong> connected.`,
        delay: 2500,
        positionY: 'bottom',
        positionX: 'right',
      });
    })
    socket.on('connectedUsers', function (data) {
      $rootScope.activeUsers = data
      $rootScope.$broadcast('activeUsers');
    })
    socket.on('lockedNode', function (data) {
      if ($rootScope.appContext.user._id != data.user._id) {
        $rootScope.$broadcast('socketLockedNode', data);
      }
    })
    socket.on('unlockedNode', function (data) {
      if ($rootScope.appContext.user._id != data.user._id) {
        $rootScope.$broadcast('socketUnlockedNode', data);
      }
    })
    socket.on('updateNode', function (data) {
      if ($rootScope.appContext.user._id !== data.user._id) {
        $rootScope.$broadcast('socketUpdateNode', data);
      }
    })

    socket.on('fileUpdate', function (data) {
      if ($rootScope.appContext.user._id == data.user._id) {
        console.info('good user')
        $rootScope.$broadcast('fileUpdate', data);
      }
    })
    socket.on('disconnectedUser', function (data) {
      Notification.info({
        message: `<strong><span class="glyphicon glyphicon-user" aria-hidden="true"></span> ${data.properties._labelRef}</strong> disconnected.`
      });
    })
    /**
     * Chat Message handler
     */
    let reloadMessages = [];
    if (localStorage.getItem('ganister_messages') && localStorage.getItem('ganister_messages') != "") {
      reloadMessages = JSON.parse(localStorage.getItem('ganister_messages'));
    }
    $rootScope.interlocutor = {};
    $rootScope.messages = reloadMessages;
    $rootScope.youGotMail = [];
    socket.on('chat message', function (msg) {

      const userId = $rootScope.appContext.user._id;
      const interlocutorId = $rootScope.interlocutor._id;

      if (msg.to._id === userId || msg.from._id === userId) {

        msg.mine = false;
        msg.visibleTime = moment(parseInt(msg.time)).format('lll');
        if (msg.from._id === $rootScope.appContext.user._id) {
          msg.mine = true;
        }
        $rootScope.messages.unshift(msg);
        localStorage.setItem('ganister_messages', JSON.stringify($rootScope.messages));
        $rootScope.$broadcast("messageUpdated");
        if (msg.to._id === userId && $rootScope.interlocutor._id != msg.from._id) {
          $rootScope.youGotMail.push(msg.from._id);
        }
        $rootScope.$broadcast("youGotMailUpdate", $rootScope.youGotMail);
      }
    });

    return socket
  })
  .service('APIInterceptor', function ($rootScope, userlocal) {
    var service = this;
    service.request = function (config) {

      $rootScope.latestRequest = Date.now()
      var currentUser = userlocal.getToken();
      if (currentUser) {
        config.headers.authorization = currentUser;

        try {
          if ($rootScope.appContext && $rootScope.appContext.user && $rootScope.appContext.user.language) {
            config.headers["ganister-language"] = $rootScope.appContext.user.language.key;
          } else {
            config.headers["ganister-language"] = 'en';
          }
        } catch (err) {
          config.headers["ganister-language"] = 'en';
        }

      }
      return config;
    };
    service.responseError = function (response) {
      if (response.status === 401) {
        $rootScope.$broadcast('unauthorized');
      }
      if (response.status === 403) {
        const { title, message, popup } = response.data;
        if (popup) {
          Swal.fire({
            type: 'error',
            title: title,
            text: message ? message : 'Something went wrong',
            footer: '403 error, contact your admin (' + response.statusText + ')',
          });
        }
      }
      if (response.status === 500) {
        console.error(response);
        const { title, message, popup } = response.data;
        if (popup) {
          Swal.fire({
            type: 'error',
            title: title,
            text: message ? message : 'Something went wrong',
            footer: '500 error, contact your admin (' + response.statusText + ')',
          });
        }
      }
      return response;
    };

  })

  .config(function ($httpProvider, $translateProvider, IdleProvider) {
    $httpProvider.interceptors.push('APIInterceptor');
    $translateProvider.useSanitizeValueStrategy(null);
    $translateProvider.useStaticFilesLoader({
      prefix: '/locales/locale-',
      suffix: '.json',
    });

    $translateProvider
      .fallbackLanguage('default')
      .preferredLanguage('default');

    // configure Idle settings
    IdleProvider.idle(3600); // in seconds
    IdleProvider.timeout(60); // in seconds
    // KeepaliveProvider.interval(0); // in seconds
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

  .run(function ($window, $rootScope) {
    $window.onbeforeunload = function (e) {
      if ($rootScope.appContext) {
        const unsaved = $rootScope.appContext.user.appSession.openNodes.find(n => n.unsavedChanges);
        if (unsaved) return false;
        return null;
      } else {
        return null;
      }
    };

    $("#element").introLoader({
      animation: {
        name: 'doubleLoader',
        options: {
          exitFx: 'fadeOut',
          ease: "easeInOutCirc",
          style: 'ocean',
          delayBefore: 100,
          exitTime: 100,
          progbarTime: 300,
          progbarDelayAfter: 100,
        },
      },
    });
    var startPage = "dashboard";
    if (localStorage["startpage"]) {
      startPage = localStorage["startpage"];
    }

    $rootScope.online = navigator.onLine;
    $window.addEventListener("offline", function () {
      $rootScope.$apply(function () {
        $rootScope.online = false;
        Swal.fire({
          type: 'error',
          title: 'Offline',
          text: 'Please check your internet connection. It appears that you just went offline',
        });
      });
    }, false);
    $window.addEventListener("online", function () {
      $rootScope.$apply(function () {
        $rootScope.online = true;
        Swal.fire({
          type: 'success',
          title: 'Online',
          text: 'You are back online',
        });
      });
    }, false);
  })
  .controller('LoginController', function ($http, $scope, $rootScope, Notification, userconf, userlocal, $interval, $window) {
    // Initialise rootscope variables
    $rootScope.appContext = {};
    $rootScope.appContext.user = {};
    $rootScope.logged = false;
    $rootScope.appDefinition = {
      app: {
        "version": null,
        "versionDate": null,
        "appName": "Ganister",
      }
    }

    const tokenRenewCheckPeriod = 30000;

    $interval(() => {
      console.info('token check')
      if ($rootScope.appContext && $rootScope.appContext.logged && $rootScope.latestRequest && (Date.now() - $rootScope.latestRequest < tokenRenewCheckPeriod)) {
        if ($window.localStorage.ganister_jwtToken__expires && userlocal.getTokenRemainingLifetime() < $window.localStorage.ganister_jwtToken__expires / 1.3) {
          try {
            console.info('token refresh')
            userconf.refreshToken().then((userObject) => {
              let userData = userObject.data;
              userlocal.saveToken(userData.properties.token, userData.properties.tokenExpiration);
            })
          } catch (err) {
            console.error(err);
          }
        }
      }
    }, tokenRenewCheckPeriod);

    $scope.startLogin = (keyEvent) => {
      if (keyEvent.which === 13) {
        console.log(1)
        $scope.login($scope.user);
      }
    }

    $http.get('buildInfo.json').then((response) => {
      $rootScope.appDefinition = {
        app: {
          "version": response.data.commit,
          "versionDate": response.data.commitDate,
          "appName": "Ganister",
        },
      }
      $http.get('uxConfig.json').then((response) => {
        $rootScope.appDefinition.uxConfig = response.data;
        $scope.testLoggedState()
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
              } else {
                console.info("👍 User Access Valid");
                $rootScope.appContext.user = user;
                $rootScope.appContext.logged = true;
                $rootScope.$broadcast('loadMainView');
              }
            }
          } else {
            console.info("✋ User is not logged in");
          }
        })
    }


    // User Login Handler
    $scope.logging = false;
    $scope.oneTimeCodeCheck = false;
    $scope.login = (user) => {
      $scope.logging = true;
      userconf.login(user)
        .then((userObject) => {
          $scope.logging = false;
          if (userObject.status === -1) {
            return Notification.error({
              message: "Please check your internet connection!",
            });
          }
          let userData = userObject.data;
          if (userData.properties?.token === undefined && userObject.status == 200) {
            $scope.oneTimeCodeCheck = true;
          } else if (userData && !userData.isError && userData.properties?.token) {

            // login activation
            userlocal.saveToken(userData.properties.token, userData.properties.tokenExpiration);
            $rootScope.appContext.logged = true;
            $rootScope.appContext.user = userData;
            $rootScope.$broadcast('loadMainView');
            userconf.loginElectron();

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
      // 
    }

    $scope.login_2FA_2 = (user) => {
      userconf.login2FAConfirm(user)
        .then((userObject) => {
          $scope.logging = false;
          if (userObject.status === -1) {
            return Notification.error({ message: "Please check your internet connection!" });
          }
          let userData = userObject.data;
          if (userData && !userData.isError && userData.properties?.token) {
            $scope.oneTimeCodeCheck = false;
            userlocal.saveToken(userData.properties.token, userData.properties.tokenExpiration);
            $rootScope.appContext.logged = true;
            $rootScope.appContext.user = userData;
            $rootScope.$broadcast('loadMainView');
            userconf.loginElectron();

          } else if (!userData.dbError) {
            Notification.error({ message: "Failed Login! Please try again..." });
          } else {
            Notification.error({ message: "Database not available" });
          }
        })
    }


    $rootScope.$on('unauthorized', (events, args) => {
      userlocal.removeToken();
      $rootScope.appContext.logged = false;
    })
  })

  .controller('MainController', function ($window, $http, $translate, $scope, $rootScope, datamodelModel, languagesConfig, socket, Idle, userlocal) {
    // start watching when the app runs. also starts the Keepalive service by default.
    Idle.watch();
    $scope.$on('IdleStart', function () {
      // the user appears to have gone idle
      let timerInterval;
      Swal.fire({
        type: 'warning',
        title: 'Inactivity Notice',
        html: 'You will be logout in <strong class="idleTimer"></strong> seconds.',
        timer: 60 * 1000,
        onBeforeOpen: () => {
          Swal.showLoading();
          timerInterval = setInterval(() => {
            Swal.getContent().querySelector('.idleTimer')
              .textContent = ((Swal.getTimerLeft() / 1000) + 1).toFixed(0);
          }, 100)
        },
        onClose: () => {
          clearInterval(timerInterval);
        }
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
          console.info('I was closed by the timer');
        }
      })
    });

    $scope.$on('IdleTimeout', function () {
      // the user has timed out (meaning idleDuration + timeout has passed without any activity)
      // this is where you'd log them
      userlocal.removeToken();
      //  Force Socket to close on logout, even if the window is still open in login screen
      socket.close();
      $rootScope.appContext.logged = false;
      $window.location.reload();
    });

    $scope.$on('IdleEnd', function () {
      // the user has come back from AFK and is doing stuff. if you are warning them, you can use this to hide the dialog
      Idle.watch();
      console.info('Idle End');
    });

    // #region FUNCTION

    // #endregion

    // #region $SCOPE.FUNCTIONS

    $scope.removeInterlocutor = () => {
      $rootScope.interlocutor = {};
    }

    $scope.loadMainView = function () {

      // Init $rootScope.appContext
      let userData = $rootScope.appContext.user;
      $rootScope.activeUsers = [];
      $rootScope.appContext.user = userData;
      console.info("⚙️ creating appSession");
      $rootScope.appContext.user.appSession = {};

      // Init $scope.context
      $scope.context.tabs = [];
      $scope.context.nodes = [];
      $scope.context.currentNodetype = null;
      $scope.context.centralPanelHide = true;
      $scope.context.currentCategory = null;
      $scope.context.hasReports = false;
      $scope.context.hasActions = false;
      $rootScope.appContext.user.appSession.openNodes = [];
      $rootScope.appContext.user.appSession.listActive = false;
      $rootScope.appContext.user.appSession.searchActive = false;
      $rootScope.appContext.user.appSession.dashActive = true;

    }
    // #endregion

    // #region INIT

    // Init shared $scope members

    $rootScope.datamodel = {
      nodetypes: [],
      categories: [],
      history: {},
      languages: [],
      listOfValues: [],
      methods: [],
      packages: [],
      reports: [],
    };


    $rootScope.fileMimetypeImages = [
      {
        mimetype: 'application/pdf',
        img: "pdf128.png",
      },
      {
        mimetype: 'image/png',
        img: "png128.png",
      },
      {
        mimetype: 'text/plain',
        img: "txt128.png",
      },
      {
        mimetype: 'image/jpg',
        img: "image128.png",
      },
      {
        mimetype: 'image/jpeg',
        img: "image128.png",
      },
      {
        mimetype: 'application/x-zip-compressed',
        img: "zip128.png",
      },
      {
        mimetype: 'video/mpeg',
        img: "mp4128.png",
      },
      {
        mimetype: 'audio/mpeg',
        img: "mp3128.png",
      },
      {
        mimetype: 'application/msword',
        img: "doc128.png",
      },
      {
        mimetype: 'application/msexcel',
        img: "xls128.png",
      },
      {
        mimetype: 'application/vnd.ms-excel',
        img: "xls128.png",
      },
      {
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        img: "xls128.png",
      },
      {
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        img: "doc128.png",
      },
      {
        mimetype: 'application/octet-stream',
        img: "any128.png",
      },
    ];
    //  Manually Reopen the socket and sent loggedIn action to server
    socket.open();
    socket.emit('loggedIn', $rootScope.appContext.user);


    $scope.context = {};
    $scope.MenuRotatedLabel = "MENU";


    $http.get('buildInfo.json').then(function (response) {
      $rootScope.appDefinition.app = {
        "version": response.data.commit,
        "versionDate": response.data.commitDate,
        "appName": "Ganister",
      };
      const userLocale = window.navigator.userLanguage || window.navigator.language;
      moment.locale(userLocale);
      $scope.loadLanguages();

      datamodelModel.getDatamodel()
        .then(function (result) {
          $rootScope.datamodel = result;
          $rootScope.appContext.logged = true;
          $scope.$on('loadMainView', $scope.loadMainView());
          $rootScope.$broadcast('datamodelLoaded');
        })
        .catch((error) => {
          console.error(error);
        })
    });



    $scope.loadLanguages = () => {
      //  Load Languages from Server and set preferred Language
      languagesConfig.getLanguages().then((result) => {
        $rootScope.appDefinition.app.languages = result.filter(item => item.active && item.key !== 'default');
        //  Setup Fallback Language
        let fallbackLanguage = $rootScope.appDefinition.app.languages.find(item => item.fallbackLanguage == true);
        if (fallbackLanguage) {
          $translate.fallbackLanguage(fallbackLanguage.key);
        } else {
          $translate.fallbackLanguage('default');
        }
        //  Check if user has a preferred language setup and language exists and is active
        let userLanguage = undefined;
        if ($rootScope.appContext.user.properties.language) {
          userLanguage = $rootScope.appDefinition.app.languages.find(item => item.key === $rootScope.appContext.user.properties.language && item.active);
          if (userLanguage) {
            $rootScope.appContext.user.language = userLanguage;
            $translate.use($rootScope.appContext.user.language.key);
            moment.locale($rootScope.appContext.user.language.key);
          }
        }
        //  If user language not found, find preferred Language
        if (userLanguage === undefined) {
          let preferredLanguage = $rootScope.appDefinition.app.languages.find(item => item.preferredLanguage == true);
          if (preferredLanguage) {
            //  TODO: Load Preferred Language from User Object if exists
            $rootScope.appContext.user.language = preferredLanguage;
            $translate.use(preferredLanguage.key);
            moment.locale(preferredLanguage.key);
          } else {
            $translate.use('default');
          }
        }
      });
    }


    // #endregion

    // #region Search 

    const searchContainer = document.querySelector('.search');
    const inputSearch = searchContainer.querySelector('.search__input');
    $scope.search = {
      searchOpen: false,
      openSearch: () => {
        $scope.search.searchOpen = true;
        inputSearch.focus();
      },
      closeSearch: () => {
        $scope.search.searchOpen = false;
        inputSearch.blur();
      },
    };
    document.addEventListener('keyup', function (ev) {
      // escape key.
      if (ev.keyCode == 27 && $scope.search.searchOpen) {
        $scope.search.closeSearch();
        $scope.$apply();
        $scope.searchTerms = "";
      }
      // escape key.
      if (ev.keyCode == 13 && $scope.search.searchOpen) {
        $scope.$broadcast('simpleSearch', $scope.searchTerms);
        $scope.search.closeSearch();
        $scope.$apply();
        $scope.searchTerms = "";
        // display central Panel / Hide Custom views
        $rootScope.appContext.user.appSession.openNodes = $rootScope.appContext.user.appSession.openNodes.map(function (item) {
          if (!item._ui) {
            item._ui = {};
          }
          item._ui.isActive = false;
          return item;
        })
        // activate search tab
        $rootScope.appContext.user.appSession.listActive = false;
        $rootScope.appContext.user.appSession.searchActive = true;
        $rootScope.appContext.user.appSession.dashActive = false;
        // release the nodetypeBar
        $('body').trigger('click')
      }
    });

    // #endregion

  })


  .controller('fileviewer', function ($scope, $rootScope) {
    $scope.fileViewerSize = 40;
    $scope.closePanel = function () {
      $("#fileViewer").hide('slow');
    }
    $scope.cadViewerOptions = {
      autoPlay: 1, // 0,1
      showViewCube: 1, // 0,1
      cameraType: 'perspective', // isometric, perspective
      displayMode: 'auto', // auto, wireframe, shaded, shadedWithBoundaries
      representation: 'auto', // auto, brep, finePoly, mediumPoly, coarsePoly
      bg: '#ffffff',
    };

    $scope.$watchCollection('cadViewerOptions', function () {
      $rootScope.$broadcast('cadViewerOptionsUpdate', $scope.cadViewerOptions);
    });

    $scope.resizePanel = (x) => {
      switch (x) {
        case 0:
          $scope.fileViewerSize = $scope.fileViewerSize - 10;
          break;
        case 1:
          $scope.fileViewerSize = $scope.fileViewerSize + 10;
          break
        case 2:
          $scope.fileViewerSize = 30;
          break
        case 3:
          $scope.fileViewerSize = 75;
          break
        default:
          $scope.fileViewerSize = 55;
      }
      if ($scope.fileViewerSize > 90) {
        $scope.fileViewerSize = 90;
      }
      if ($scope.fileViewerSize < 20) {
        $scope.fileViewerSize = 20;
      }
      $("#fileViewer").animate({ width: `${$scope.fileViewerSize}%` }, 200, function () {
        $("#fileViewerContent").width($('#fileViewer').width() - 22);
      })
    }
  })


  .filter('capitalize', function () {
    return function (input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
  })
