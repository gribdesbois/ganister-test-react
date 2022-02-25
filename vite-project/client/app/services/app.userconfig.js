/* global angular, localStorage */
angular.module('app.ganister.user.config', [])
  .service('userconf', function ($http, $rootScope, $location) {
    const userconf = this;
    const URLS = {
      users: '/api/v0/users/',
      gfilesync: 'http://localhost:8765/',
    };

    const getLocalProperty = (property) => {
      const userId = $rootScope.appContext.user._id;
      let items = localStorage.getItem(property);
      items ? items = JSON.parse(items) : items = false;
      if (items === false) {
        items = {};
        items[userId] = [];
      } else if (!items[userId]) {
        items[userId] = [];
      }
      return items;
    };

    userconf.saveRecentItems = (node) => {
      //  Set Recent Items in Local Storage if tab is opened
      const recentItems = getLocalProperty('recent_items');
      const userId = $rootScope.appContext.user._id;
      if (typeof (node) === 'object') {
        const item = recentItems[userId].findIndex(item => item._id === node._id);
        if (item === -1) {
          recentItems[userId].push({
            _id: node._id,
            _type: node._type,
            _labelRef: node.properties._labelRef,
            _version: node.properties._version,
          });
        } else {
          recentItems[userId].splice(item, 1);
          recentItems[userId].push({
            _id: node._id,
            _type: node._type,
            _labelRef: node.properties._labelRef,
            _version: node.properties._version,
          });
        }
        localStorage.setItem('recent_items', JSON.stringify(recentItems));
        $rootScope.$broadcast('recentItemsUpdated', recentItems[userId]);
      }
    };

    userconf.loadRecentItems = () => {
      const recentItems = getLocalProperty('recent_items');
      const userId = $rootScope.appContext.user._id;
      if (recentItems) {
        return recentItems[userId];
      }
      return [];
    };

    //  Remove Recent Item from Local Storage
    userconf.removeRecentItem = (nodeId) => {
      const recentItems = getLocalProperty('recent_items');
      const userId = $rootScope.appContext.user._id;
      recentItems[userId] = recentItems[userId].filter(item => item._id != nodeId);
      localStorage.setItem('recent_items', JSON.stringify({ ...recentItems }));
      $rootScope.$broadcast('recentItemsUpdated', recentItems[userId]);
    };

    userconf.removeRecentItems = () => {
      const recentItems = getLocalProperty('recent_items');
      const userId = $rootScope.appContext.user._id;
      recentItems[userId] = [];
      localStorage.setItem('recent_items', JSON.stringify(recentItems));
      $rootScope.$broadcast('recentItemsUpdated', recentItems[userId]);
    };

    userconf.saveTabs = (nodes) => {
      const storedTabs = getLocalProperty('ganister_tabs');
      const userId = $rootScope.appContext.user._id;
      // localstorageVersio
      const tabs = nodes.filter((elt) => {
        if (elt === 'list' || elt === 'dashboard') {
          return false;
        }
        return true;
      }).map((elt) => {
        if (elt._id){
          const tab = {};
          tab.id = elt._id;
          tab.type = elt._type;
          tab._version = elt.properties._version;
          if (elt._ui) tab.isActive = elt._ui.isActive;
          return tab;
        }
      });
      storedTabs[userId] = tabs;
      localStorage.setItem('ganister_tabs', JSON.stringify(storedTabs));
      return true;
    };

    userconf.loadTabs = () => {
      const tabs = getLocalProperty('ganister_tabs');
      const userId = $rootScope.appContext.user._id;
      if (tabs) {
        return tabs[userId];
      }
      return [];
    };
    userconf.login = (user) => {
      const email = user.name;
      const { password } = user;
      return $http.post(`${URLS.users}signin`, { email, password });
    };
    userconf.login2FAConfirm = (user) => {
      const email = user.name;
      const { password, onetimecode } = user;
      return $http.post(`${URLS.users}signin_2FA_2`, { email, password, onetimecode });
    };

    userconf.testLoggedState = () => $http.get(`${URLS.users}test`);

    userconf.logout = () => {
      return $http.post(`${URLS.users}signout`);
    };

    userconf.updateUser = (user) => {
      return $http.put(`/api/v0/nodes/user/${user._id}`, { properties: user });
    };

    userconf.refreshToken = () => {
      return $http.post(`${URLS.users}refreshToken`);
    };

    userconf.loginElectron = () => {
      return $http.post(`${URLS.gfilesync}login`, { token: localStorage.getItem('ganister_jwtToken'), baseURL: `${$location.protocol()}://${$location.host()}:${$location.port()}/api/v0` })
        .then((result) => {
          if (result.status === -1) {
            $rootScope.gfsLogged = false;
            return {
              error: true,
              gfsRunning: false,
              message: 'Make sure GFS is running...',
            };
          }
          const { data } = result;
          if (data && !data.error) {
            $rootScope.gfsLogged = true;
          } else {
            $rootScope.gfsLogged = false;
            return {
              error: true,
              gfsRunning: true,
              message: data.error.message,
            };
          }
        })
    }
  })
  .service('userlocal', function ($window, $rootScope) {
    const userlocal = this;
    userlocal.saveToken = (token, expiration) => {
      $window.localStorage.ganister_jwtToken = token;
      $window.localStorage.ganister_jwtToken__on = Date.now();
      $window.localStorage.ganister_jwtToken__expires = parseInt(expiration);
    };
    userlocal.removeToken = () => {
      $window.localStorage.removeItem('ganister_jwtToken');
      $window.localStorage.removeItem('ganister_jwtToken__on');
      $window.localStorage.removeItem('ganister_jwtToken__expires');
    };
    userlocal.getToken = () => {
      return $window.localStorage.ganister_jwtToken;
    };
    userlocal.getTokenRemainingLifetime = () => {
      if ($window.localStorage.ganister_jwtToken__on) {
        const remain =  $window.localStorage.ganister_jwtToken__expires - (Date.now() - parseInt($window.localStorage.ganister_jwtToken__on));
        return remain;
      } else {
        return 0;
      }
    };
  });
